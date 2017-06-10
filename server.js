/**
 * Environment variables
 * @param {int}    PORT   Define a non-standard port {default: 80}
 * @param {string} DBTYPE Choose the DB connection   {values: [localUrl, remoteUrl], default: localUrl}
 */

// set up ======================================================================
var express = require('express');
var app = express(); 						// create our app w/ express
var mongoose = require('mongoose'); 				// mongoose for mongodb
var port = process.env.PORT || 80; 				// set the port
var database = require('./config/database'); 			// load the database config
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var sassMiddleware = require('node-sass-middleware');

// Store whether we are in production or development
var devMode = app.get('env') === 'development';

// configuration ===============================================================
mongoose.connect(database[process.env.DBTYPE] || database.localUrl);		// Connect to the defined MongoDB instance, currently AWS

app.set('view engine', 'pug');      // Use Pug to generate pages
app.set('views', './app/views');    // Set Pug working directory

app.use(sassMiddleware({           // Compile SASS
    src: './app/sass',
    dest: './public/css',
    debug: devMode,
    outputStyle: 'compressed',
    prefix: '/css',
}));

app.use(express.static('./public'));		// set the static files location /public/img will be /img for users
if (devMode) {
    app.use(morgan('dev'));						// log every request to the console, unless running tests
}
app.use(bodyParser.urlencoded({'extended': 'true'}));	// parse application/x-www-form-urlencoded
app.use(bodyParser.json());					// parse application/json
app.use(bodyParser.json({type: 'application/vnd.api+json'}));	// parse application/vnd.api+json as json
app.use(methodOverride('X-HTTP-Method-Override'));	// override with the X-HTTP-Method-Override header in the request



// routes ======================================================================
require('./app/routes.js')(app);

// listen (start app with node server.js) ======================================
app.listen(port);
console.log("App listening on port " + port);
