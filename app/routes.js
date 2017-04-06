var Todo = require('./models/todo');
var movie = require('./models/movie');

var http = require('http');

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

function getTodos(res) {
    Todo.find(function (err, todos) {

        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err) {
            res.send(err);
        }

        res.json(todos); // return all todos in JSON format
    });
};

function updateCacheList(datasets) {
	datasets.forEach(function (dataset) {
		if (!dataset.cache) {
			// Remove the existing entries in the DB
			movie.remove({
				dbName: dataset.name
			}, function (err) {});

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
				data: {
					"Movies": movies
				}
			});
		}
		
		sendApiResponseList(res, apiResponses);
	});
};

function sendApiResponseList(clientResponse, apiResponses) {
	if (apiResponses.length == apiEndpoints.length) {
		updateCacheList(apiResponses);

		clientResponse.send(apiResponses);
	}
};

module.exports = function (app) {

    // api ---------------------------------------------------------------------
	// get all movies (will hit cache if server fails)
	app.get('/api/movies', function (req, res) {
		// We need to store all the responses outside the scope of the endpoint loop
		var apiResponses = []
		
		apiEndpoints.forEach(function (endPoint) {
			var apiReq = http.get({
				hostname: endPoint.host,
				path: endPoint.listPath,
				port: endPoint.port,
				timeout: 5000,
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
					console.log(`API ${endPoint.name} STATUS: ${apiRes.statusCode}`);
					
					if (apiRes.statusCode === 200) {
						try {
							// Join all the responses and parse as JSON
							var jsonData = JSON.parse(resData.join(''));
							
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
				// Lets be impatient, as we have a cache and can't afford slow responses
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
	
	// get movie with ID
	app.get('/api/movies/:movie_id', function (req, res) {
		// Lets concatenate the api path with the ID
		var pathWithID = endPoint.getPath + req.params.movie_id;
		
		var apiResponses = []
		
		apiEndpoints.forEach(function (endPoint) {
			var apiReq = http.get({
				hostname: endPoint.host,
				path: pathWithID,
				port: endPoint.port,
				timeout: 5000,
				headers: {
					// We add the token as a header here to authenticate with the server
					'x-access-token': endPoint.token
				}
			}, function (apiRes) {
				
			});
		}
	});
	
	
	
    // get all todos
    app.get('/api/todos', function (req, res) {
        // use mongoose to get all todos in the database
        getTodos(res);
    });

    // create todo and send back all todos after creation
    app.post('/api/todos', function (req, res) {

        // create a todo, information comes from AJAX request from Angular
        Todo.create({
            text: req.body.text,
            done: false
        }, function (err, todo) {
            if (err)
                res.send(err);

            // get and return all the todos after you create another
            getTodos(res);
        });

    });

    // delete a todo
    app.delete('/api/todos/:todo_id', function (req, res) {
        Todo.remove({
            _id: req.params.todo_id
        }, function (err, todo) {
            if (err)
                res.send(err);

            getTodos(res);
        });
    });

    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendFile(__dirname + '/public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};
