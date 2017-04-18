# API Test Application

A Node app built with MongoDB, Express, Angular, and Node.js (MEAN stack). Based on the Todo app graciously provided by Chris Sevilleja.

Node provides an API to the web app, and accesses the provided API endpoints.

All requests are cached by the server, and in some cases the client, to ensure maximum availability.

To run the application, please ensure node.js is installed, and clone this repository, then run
`npm install`

Then, run the server with environment variables set (unless you have a MongoDB instance installed locally)
`DBTYPE=remoteUrl PORT=8080 node server.js`