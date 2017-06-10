angular.module('movieController', ['ngSanitize', 'ngAnimate'])
    // Configuration for the controller
    .config(function ($locationProvider) {
        $locationProvider.html5Mode(true);
    })
    // Function definition and entry point for the controller
    .controller('mainController', ['$scope', '$http', '$location', '$window', 'movies', function ($scope, $http, $location, $window, movies) {

        // Translate API endpoint names into user friendly ones
        // Also stores whether the endpoint has been filtered out or not
        $scope.apiDetails = {
            'cinemaworld': {
                friendlyName: "<i class='fa fa-fw fa-video-camera'></i> Cinema World",
                filtered: true
            },
            'filmworld': {
                friendlyName: "<i class='fa fa-fw fa-film'></i> Film World",
                filtered: true
            }
        };

        $scope.appName = "MovieJazz";

        // Keep a count of all loading sources, display if non-zero
        $scope.loading = 0;
        $scope.focused = false;
        $scope.filtered = false;

        // Keep track of the selected tab and booking source
        $scope.openTab = 'prices';
        $scope.selectedBooking = false;

        /**
         * Run all JS based polyfills, like position: sticky;
         */
        $scope.polyfill = function () {
            var stickyElements = document.getElementsByClassName('mj-affix');

            for (var i = 0; i < stickyElements.length; i++) {
                Stickyfill.add(stickyElements[i]);
            }
        };

        /**
         * Returns a list of all movies
         */
        $scope.getMovies = function () {
            $scope.loading++;
            movies.list().then(function (response) {
                $scope.movies = [];
                response.data.forEach(function (item) {
                    // data contains a single object with a single key - Movies
                    item.data.Movies.forEach(function (movie) {

                        // Find if the movie has already been added to the list from another API
                        var listedMovie = null;
                        $scope.movies.forEach(function (existingMovie) {
                            if (existingMovie.Title == movie.Title) {
                                listedMovie = existingMovie;
                            }
                        });

                        if (listedMovie) {
                            // If already listed, add the source to the existing object
                            listedMovie.fromSource.push(item.name);
                        } else {
                            // If this is the first instance, set the ID as generic, add the source and push to the movie list
                            movie.ID = movie.ID.slice(2);
                            movie.fromSource = [item.name];

                            // Images in response are broken (fw and cw get swapped in URL, poorly sized), lets grab new ones from IMDB
                            movies.getIMDB(movie.ID).success(function (data) {
                                movie.Poster = data.Poster;
                            });

                            $scope.movies.push(movie);
                        }
                    });
                });

                // Sort all movies alphabetically by Title
                $scope.movies.sort(function (a, b) {
                    var aTitle = a.Title.toLowerCase();
                    var bTitle = b.Title.toLowerCase();
                    if (aTitle < bTitle) {
                        return -1;
                    } else if (aTitle > bTitle) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                // Set the new visible movie set
                $scope.visibleMovies = $scope.movies;

                // Hide the loading spinner
                $scope.loading--;
            });
        };

        /**
         * Returns a list of movies filtered by a string, to enable quick searching
         * @param {string} filter The string to filter movies on
         */
        $scope.filterMovies = function (filter) {
            if (!filter) {
                // If the filter field is empty, return all the movies
                $scope.visibleMovies = $scope.movies;
                $scope.filtered = false;
                return;
            }

            $scope.filtered = true;

            filter = filter.toLowerCase(); // Lets make everything case insensitive

            // Create a new array of filtered movies
            var filteredMovies = [];

            $scope.movies.forEach(function (movie) {
                if (movie.Title.toLowerCase().includes(filter)) {
                    var atLeastOne = false;

                    // Hide movies that don't match the filtered set of sources
                    for (var i = 0; i < movie.fromSource.length; i++) {
                        var source = movie.fromSource[i];
                        if ($scope.apiDetails[source].filtered) {
                            atLeastOne = true;
                        }
                    }

                    if (atLeastOne) {
                        filteredMovies.push(movie);
                    }

                }
            });

            $scope.visibleMovies = filteredMovies;
        };

        /**
         * Open a detail view for a movie, with pricing and other detail information
         * @param {string} id The ID of the movie being fetched
         */
        $scope.openDetail = function (id) {
            $scope.focused = false;
            $scope.focusMovie = undefined;
            $scope.loading++;
            movies.get(id).then(function (response) {
                response.data.forEach(function (item) {
                    if (item.data !== null) { // Check that the API has a response for this ID
                        if ($scope.focusMovie === undefined) { // If this is the first item
                            $scope.focusMovie = item.data;

                            $scope.focusMovie.Price = [{
                                location: item.name,
                                price: item.data.Price
                            }];

                            // Chop off the first two letters of ID, so all match
                            $scope.focusMovie.ID = $scope.focusMovie.ID.slice(2);

                            var metascore = parseInt($scope.focusMovie.Metascore);
                            if (metascore > 60) {
                                $scope.focusMovie.MetaColor = 'score-outstanding';
                            } else if (metascore > 39) {
                                $scope.focusMovie.MetaColor = 'score-average';
                            } else {
                                $scope.focusMovie.MetaColor = 'score-unfavorable';
                            }

                        } else {
                            $scope.focusMovie.Price.push({
                                location: item.name,
                                price: item.data.Price
                            });
                        }
                    }
                });

                // Sort by lowest to highest price
                $scope.focusMovie.Price.sort(function (a, b) {
                    aNum = parseFloat(a.price);
                    bNum = parseFloat(b.price);
                    return aNum - bNum;
                });

                $scope.focused = true;

                $scope.loading--;
            });
        };

        /**
         * Capture all changes to URL, includes first page load
         * We handle application state changes this way so we can handle anything the browser throws at us
         * History changes work perfectly in this case, as if they are part of the application
         */
        $scope.$on('$locationChangeSuccess', function () {
            // Lets check if a movie has already been specified in the URL
            if ($location.path().includes("/movie")) {
                var path = $location.path();
                // Lets open detail view by grabbing just the ID at the end of the URL
                $scope.openDetail(path.substring(path.lastIndexOf('/') + 1));
            } else {
                $scope.focused = false;
                $scope.selectedBooking = false;
            }
        });

        /**
         * Set the current path the application is on, will fire $locationChangeSuccess
         * @param {string} newPath The new path to set to
         */
        $scope.setPath = function (newPath) {
            $location.path(newPath);
        };

        /**
         * Set the current path of the application and reload as new location
         * @param {string} newPath The path to navigate to
         */
        $scope.gotoPath = function (newPath) {
            $location.path(newPath);
            $window.location.href = newPath;
        };

        /**
         * Quick booking selection function, for HTML brevity
         * @param {string} location Which API endpoint has been selected for booking
         */
        $scope.selectBooking = function (location) {
            $scope.selectedBooking = location;
        };

        /**
         * Quick function for setting selected tab, will recalculate sticky height for polyfill
         * @param {[[Type]]} tab [[Description]]
         */
        $scope.setTab = function (tab) {
            $scope.openTab = tab;
            Stickyfill.rebuild();
        };

        // When we first load the page, lets get all the movies
        // All movies are always visible, regardless of application state
        $scope.getMovies();

        // Setup all polyfills on page
        $scope.polyfill();
    }]);