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
		// Visible on GitHub, BUT is server side so in a production environment is not exposed
		token: 'sjd1HfkjU83ksdsm3802k'
	},
	{
		name: 'filmworld',
		host: 'webjetapitest.azurewebsites.net',
		listPath: '/api/filmworld/movies',
		getPath: '/api/filmworld/movie/',
		port: 80,
		token: 'sjd1HfkjU83ksdsm3802k'
	}
];

function updateCache(datasets) {
	
}

/**
 * Updates the cache for movies with list only data (no details)
 * @param {Array} datasets An array of all the movie data to update, in format
 *                         ["Movies": {"key": "data"}]
 */
function updateCacheList(datasets) {
	datasets.forEach(function (dataset) {
		// Check if this was read from the cache
		if (!dataset.cache) {
			// Remove the existing entries in the DB
			movie.remove({
				dbName: dataset.name
			}, function (err) {
				if (err) {
					console.log(`ERROR DATABASE: ${err}`);
				}
			});

			// Add in each new movie to the database
			dataset.data.Movies.forEach(function (item) {
				movie.create({
					dbName: dataset.name,
					Title: item.Title,
					Year: item.Year,
					ID: item.ID,
					Type: item.Type,
					Poster: item.Poster
				}, function (err) {});
			});
		}
	});
};

/**
 * Grabs a cached version of an API response
 * @param {message}  res          The http.IncomingMessage object used to respond to the client machine
 * @param {Array}    apiResponses All the collected API responses so far (whether from cache or not)
 * @param {object}   endPoint     The current API endpoint details
 */
function getCacheList(res, apiResponses, endPoint) {
	movie.find({
		dbName: endPoint.name
	}, function (err, movies) {
		if (err) {
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
		
		sendApiResponseList(res, apiResponses);
	});
};

function sendApiResponse(clientResponse, apiResponses) {
	// Check that we have all possible responses before sending a response to the client
	if (apiResponses.length == apiEndpoints.length) {
		updateCache(apiResponses);
		clientResponse.send(apiResponses);
	}
}

function sendApiResponseList(clientResponse, apiResponses) {
	if (apiResponses.length == apiEndpoints.length) {
		updateCacheList(apiResponses);
		clientResponse.send(apiResponses);
	}
};

module.exports = function (app) {

    /**
	 * Application routes
	 * JSON /api/movies     Get a list of all available movies from API, using cache if fails
	 * JSON /api/movie/{id} Get information for a specific movie from API, using cache if fails
	 * HTML /movie/{id}     Return a page showing a specific movies details (detail.html)
	 * HTML /               Return the default page of the application (index.html)
	 */
	
	
	// JSON API
	app.get('/api/movies', function (req, res) {
		// TODO: Continue the request whilst sending cache data to user in the case of extra long req times
		
		
		// We need to store all the responses outside the scope of the endpoint loop
		var apiResponses = [],
			timedOut = false;
		
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
							
							sendApiResponseList(res, apiResponses);
						} catch (e) {
							console.log(`ERROR JSON: ${e}`);
						}
					} else {
						// If we get a non-success response, lets grab a cached version
						getCacheList(res, apiResponses, endPoint);
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
				getCacheList(res, apiResponses, endPoint);
			});
			
			apiReq.end();
		});
	});
	
	app.get('/api/movie/:movie_id', function (req, res) {
		// Lets concatenate the api path with the ID
		var pathWithID = endPoint.getPath + req.params.movie_id;
		
		var apiResponses = []
		
		apiEndpoints.forEach(function (endPoint) {
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
							
							sendApiResponse(res, apiResponses);
						} catch (e) {
							console.log(`ERROR JSON: ${e}`);
						}
					} else {
						// If we get a non-success response, lets grab a cached version
						getCacheList(res, apiResponses, endPoint);
					}
				});
			});
		});
	});
	
	
    // Application
	app.get('/movie/:movie_id', function (req, res) {
		res.sendFile(__dirname + '/html/detail.html');
	});
	
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/html/index.html');
    });
};
