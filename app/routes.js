var movie = require('./models/movie');

var http = require('http');

var apiTimeout = 3000; // 3 second response time allowed, if the API fails, we use the cache

// A generic table of endpoints, allows for trivial extension for APIs in the same format
var apiEndpoints = [
	{
		name: 'cinemaworld',
		host: 'webjetapitest.azurewebsites.net',
		listPath: '/api/cinemaworld/movies',
		getPath: '/api/cinemaworld/movie/',
		port: 80,
		prefix: 'cw',
		// Visible on GitHub, BUT is server side so in a production environment is not exposed
		token: 'sjd1HfkjU83ksdsm3802k'
	},
	{
		name: 'filmworld',
		host: 'webjetapitest.azurewebsites.net',
		listPath: '/api/filmworld/movies',
		getPath: '/api/filmworld/movie/',
		port: 80,
		prefix: 'fw',
		token: 'sjd1HfkjU83ksdsm3802k'
	}
];

/**
 * Updates the cache with details for a particular movie
 * @param {string} type     The type of request being made, supports 'list' and 'get'
 * @param {Array}  datasets An array of all API requests, either for a single movie + details or basic view of all
 *                          Format for list of all movies is the form {"Movies": [{"key": "data"}]}
 */
function updateCache(type, datasets) {
	datasets.forEach(function (dataset) {
		// Check if this was read from the cache
		if (!dataset.cache) {
			var updateCacheType = {
				// Updating a single movie with details
				'get': function () {
					movie.update({
						ID: dataset.data.ID
					}, {
						DetailCached: true,
						Detail: {
							Rated:		dataset.data.Rated,
							Released:	dataset.data.Released,
							Runtime:	dataset.data.Runtime,
							Genre:		dataset.data.Genre,
							Director:	dataset.data.Director,
							Writer:		dataset.data.Writer,
							Actors:		dataset.data.Actors,
							Plot:		dataset.data.Plot,
							Language:	dataset.data.Language,
							Country:	dataset.data.Country,
							Metascore:	dataset.data.Metascore,
							Rating:		dataset.data.Rating,
							Votes:		dataset.data.Votes,
							Price:		dataset.data.Price
						}
					}, function (err) {
						if (err) {
							console.log(`ERROR DATABASE: ${err}`);
						}
					});
				},
				
				// Updating the entire list, clears entries not present in request
				'list': function () {
					// TODO: Clear non-updated entries (prevent cruft)
			
					// Add in each new movie to the database
					dataset.data.Movies.forEach(function (item) {
						movie.update({
							ID: item.ID
						}, {
							dbName: dataset.name,
							Title: item.Title,
							Year: item.Year,
							ID: item.ID,
							Type: item.Type,
							Poster: item.Poster
						}, {
							// If item doesn't exist, lets add a new one
							upsert: true
						}, function (err) {
							if (err) {
								console.log(`ERROR DATABASE: ${err}`);
							}
						});
					});
				}
			};
			
			// Invoke the function object with the cache update type
			updateCacheType[type]();
		}
	});
}

/**
 * Grabs a cached version of an API request
 * If movieID is defined, return data for that, otherwise, return all data
 * @param {message}  clientResponse The http.IncomingMessage object used to respond to the client machine
 * @param {Array}    apiResponses   All the collected API responses so far (whether from cache or not)
 * @param {object}   endPoint       The current API endpoint details
 * @param {int}      movieID        The ID of the movie we need to fetch
 */
function getCache(clientResponse, apiResponses, endPoint, movieID) {
	if (movieID !== undefined) {
		movie.find({
			ID: movieID
		}, function (err, movie) {
			if (err) {
				console.log(`ERROR DATABASE: ${err}`);
				apiResponses.push({
					name: endPoint.name,
					cache: true,
					data: null
				});
			} else {
				apiResponses.push({
					name: endPoint.name,
					cache: true,
					data: movie
				});
			}

			sendApiResponse('get', clientResponse, apiResponses);
		});
	} else {
		movie.find({
			dbName: endPoint.name
		}, function (err, movies) {
			if (err) {
				console.log(`ERROR DATABASE: ${err}`);
				apiResponses.push({
					name: endPoint.name,
					cache: true,
					data: null
				});
			} else {
				apiResponses.push({
					name: endPoint.name,
					cache: true,
					// We wrap the data in a dictionary to match the API
					data: {
						"Movies": movies
					}
				});
			}

			sendApiResponse('list', clientResponse, apiResponses);
		});
	}
};

/**
 * Checks whether all endpoints have returned data (whether from cache or not),
 * then sends the response as a JSON object back to the web application
 * @param {string}   type           API response type, supports 'list' and 'get'
 * @param {message}  clientResponse The http.IncomingMessage object used to respond to the client machine
 * @param {Array}    apiResponses   All the collected API responses so far (whether from cache or not)
 */
function sendApiResponse(type, clientResponse, apiResponses) {
	// Check that we have all possible responses before sending a response to the client
	if (apiResponses.length == apiEndpoints.length) {
		updateCache(type, apiResponses);
		clientResponse.send(apiResponses);
	}
}

module.exports = function (app) {

    /**
	 * Application routes
	 * JSON /api/movies     Get a list of all available movies from API, using cache if fails
	 * JSON /api/movie/{id} Get information for a specific movie from API, using cache if fails
	 * HTML /movie/{id}     Return a page showing a specific movies details (detail.html)
	 * HTML /               Return the default page of the application (index.html)
	 */
	
	// JSON API
	// Get list of movies
	app.get('/api/movies', function (req, res) {
		// TODO: Continue the request whilst sending cache data to user in the case of extra long req times
		
		
		// We need to store all the responses outside the scope of the endpoint loop
		var apiResponses = [];
		
		apiEndpoints.forEach(function (endPoint) {
			var apiReq = http.get({
				hostname: endPoint.host,
				path: endPoint.listPath,
				port: endPoint.port,
				timeout: apiTimeout, // Lets be impatient, as we have a cache and can't afford slow responses
				headers: {
					// We add the token as a header here to authenticate with the server
					'x-access-token': endPoint.token
				}
			}, function (apiRes) {
				var resData = [];
				
				apiRes.on('data', function (chunk) {
					// Collate all the response chunks
					resData.push(chunk);
				});

				apiRes.on('end', function () {
					console.log(`API ${endPoint.listPath} STATUS: ${apiRes.statusCode}`);
					
					if (apiRes.statusCode === 200) {
						try {
							// Join all the responses and parse as JSON
							var jsonData = JSON.parse(resData.join(''));
							
							// Encapsulate the API response with some of our own server information
							apiResponses.push({
								name: endPoint.name,
								cache: false,
								data: jsonData
							});
							
							sendApiResponse('list', res, apiResponses);
						} catch (e) {
							console.log(`ERROR JSON: ${e}`);
						}
					} else {
						// If we get a non-success response, lets grab a cached version
						getCache(res, apiResponses, endPoint);
					}
				});
			});
			
			apiReq.on('socket', function (socket) {
				socket.on('timeout', function () {
					apiReq.abort();
				});
			});
			
			apiReq.on('error', function(err) {
				console.log(`ERROR: API server ${endPoint.name} connection failed`);
				console.log(`ERROR: ${err}`)
				
				// If the socket closes (as is the case in a timeout), lets grab the cached version
				getCache(res, apiResponses, endPoint);
			});
			
			apiReq.end();
		});
	});
	
	// Get movie by ID
	app.get('/api/movie/:movie_id', function (req, res) {
		var apiResponses = []
		
		apiEndpoints.forEach(function (endPoint) {
			// Lets concatenate the api path with the ID
			var fullMovieID = endPoint.prefix + req.params.movie_id,
				pathWithID = endPoint.getPath + fullMovieID;
			var apiReq = http.get({
				hostname: endPoint.host,
				path: pathWithID,
				port: endPoint.port,
				timeout: apiTimeout,
				headers: {
					// We add the token as a header here to authenticate with the server
					'x-access-token': endPoint.token
				}
			}, function (apiRes) {
				var resData = [];
				
				apiRes.on('data', function (chunk) {
					resData.push(chunk);
				});
				
				apiRes.on('end', function () {
					console.log(`API ${pathWithID} STATUS: ${apiRes.statusCode}`);
					
					if (apiRes.statusCode === 200) {
						try {
							// Join all the responses and parse as JSON
							var jsonData = JSON.parse(resData.join(''));
							
							// Encapsulate the API response with some of our own server information
							apiResponses.push({
								name: endPoint.name,
								cache: false,
								data: jsonData
							});
							
							sendApiResponse('get', res, apiResponses);
						} catch (e) {
							console.log(`ERROR JSON: ${e}`);
						}
					} else {
						// If we get a non-success response, lets grab a cached version
						getCache(res, apiResponses, endPoint, fullMovieID);
					}
				});
			});
			
			apiReq.on('socket', function (socket) {
				socket.on('timeout', function () {
					apiReq.abort();
				});
			});
			
			apiReq.on('error', function(err) {
				console.log(`ERROR: API server ${endPoint.name} connection failed`);
				console.log(`ERROR: ${err}`)
				
				// If the socket closes (as is the case in a timeout), lets grab the cached version
				getCache(res, apiResponses, endPoint, fullMovieID);
			});
			
			apiReq.end();
		});
	});
	
	
    // Application
	app.get('/movie/:movie_id', function (req, res) {
		res.sendFile(__dirname + '/html/index.html');
	});
	
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/html/index.html');
    });
};
