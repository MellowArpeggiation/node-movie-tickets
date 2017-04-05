var Todo = require('./models/todo');
var movie = require('./models/movie');

var http = require('http');

// Visible on GitHub, BUT is server side so in a production environment is not exposed
var apiToken = 'sjd1HfkjU83ksdsm3802k';

function getTodos(res) {
    Todo.find(function (err, todos) {

        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err) {
            res.send(err);
        }

        res.json(todos); // return all todos in JSON format
    });
};

module.exports = function (app) {

    // api ---------------------------------------------------------------------
	// get all movies (will hit cache if server fails)
	app.get('/api/movies', function (req, res) {
		http.request({
			method: 'GET',
			hostname: 'http://webjetapitest.azurewebsites.net',
			path: '/api/cinemaworld/movies',
			headers: {
				'x-access-token': apiToken
			}
		});
		
		
	});
	
	// get movie with ID
	app.get('/api/movies/:movie_id', function (req, res) {
		// Lets concatenate the api path with the ID
		var pathWithID = '/api/cinemaworld/movies' + req.params.movie_id;
		
		http.request({
			method: 'GET',
			hostname: 'http://webjetapitest.azurewebsites.net',
			path: pathWithID,
			headers: {
				'x-access-token': apiToken
			}
		});
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
