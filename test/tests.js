/* jshint esversion: 6 */

var chai = require('chai'),
    http = require('http');

var assert = chai.assert,
    should = chai.should(),
    expect = chai.expect;

//process.env.DBTYPE = 'remoteUrl';
process.env.PORT = 8080;
process.env.NODE_ENV = 'production'; // Run on proper server build

var server = require('../server');

describe('Web Server', function () {
    describe('/ - Root', function () {
        it('should return STATUS 200', function (done) {
            http.get('http://localhost:8080', function (res) {
                res.on('data', function () {});
                res.on('end', function () {
                    expect(res.statusCode).to.equal(200, `expected 200, instead received ${res.statusCode}`);

                    done();
                });
            });
        });
    });
});

describe('API Server', function () {
    this.timeout(5000); // If the server takes longer than 5 seconds, we failed

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

        it('should return an array of JSON objects', function () {
            expect(listData).to.be.a('array');
            listData.forEach(function (data) {
                expect(data).to.be.a('object');
            });
        });

        it('JSON should contain Titles', function () {
            listData.forEach(function (data) {
                data.data.Movies.forEach(function (movie) {
                    expect(movie.Title).to.be.a('string');
                });
            });
        });
        it('JSON should contain Years', function () {
            listData.forEach(function (data) {
                data.data.Movies.forEach(function (movie) {
                    expect(movie.Year).to.be.a('string');
                });
            });
        });
        it('JSON should contain Providers', function () {
            listData.forEach(function (data) {
                expect(data.name).to.be.a('string');
            });
        });
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

        it('should return an array of JSON objects', function () {
            expect(getData).to.be.a('array');
            getData.forEach(function (data) {
                expect(data).to.be.a('object');
            });
        });

        it('JSON should contain Title', function () {
            getData.forEach(function (data) {
                // Some providers don't have the movie we check
                if (data.data !== null) {
                    expect(data.data.Title).to.be.a('string');
                }
            });
        });
        it('JSON should contain Year', function () {
            getData.forEach(function (data) {
                if (data.data !== null) {
                    expect(data.data.Year).to.be.a('string');
                }
            });
        });
        it('JSON should contain Providers', function () {
            getData.forEach(function (data) {
                expect(data.name).to.be.a('string');
            });
        });
        it('JSON should contain Movie details', function () {
            getData.forEach(function (data) {
                if (data.data !== null) {
                    // If we get this data, we're good
                    expect(data.data.Rated).to.be.a('string');
                    expect(data.data.Runtime).to.be.a('string');
                    expect(data.data.Genre).to.be.a('string');
                    expect(data.data.Price).to.be.a('string');
                    expect(data.data.Plot).to.be.a('string');
                    expect(data.data.Director).to.be.a('string');
                }
            });
        });
    });
});