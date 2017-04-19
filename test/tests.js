var assert = require('chai').assert;
var http   = require('http');

process.env.DBTYPE  = 'remoteUrl';
process.env.PORT    = 8080;
process.env.NODE_ENV = 'test';

var server = require('../server');

describe('Web Server', function () {
	describe('/ - Root', function () {
		it('should return STATUS 200', function (done) {
			http.get('http://localhost:8080', function (res) {
				res.on('data', function () {});
				res.on('end', function () {
					assert.equal(200, res.statusCode, `code returned: ${res.statusCode}`);
					done();
				});
			}).end();
		});
	})
});

describe('API Server', function () {
	this.timeout(5000);
	
	describe('/api/movies - List Movies', function () {
		var listData;
		
		before('http list', function (done) {
			http.get('http://localhost:8080/api/movies', function (res) {
				var data = [];
				
				res.on('data', function (chunk) {
					data.push(chunk);
				});
				
				res.on('end', function () {
					listData = JSON.parse(data.join(''));
					
					done();
				});
			});
		});
		
		it('should return a JSON object');
		
		it('JSON should contain Title');
		it('JSON should contain Year');
		it('JSON should contain Providers');
	});
	
	describe('/api/movies/movie_id - Get Movie', function () {
		var getData;
		
		before('http get', function (done) {
			http.get('http://localhost:8080/api/movie/2488496', function (res) {
				var data = [];
				
				res.on('data', function (chunk) {
					data.push(chunk);
				});
				
				res.on('end', function () {
					getData = JSON.parse(data.join(''));
					
					done();
				});
			});
		});
		
		it('should return a JSON object', function () {
			//assert.isObject(getData);
		});
		
		it('JSON should contain Title');
		it('JSON should contain Year');
		it('JSON should contain Providers');
		it('JSON should contain Movie details');
	});
});