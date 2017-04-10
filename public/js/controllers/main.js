angular.module('movieController', [])

	// inject the Todo service factory into our controller
	.controller('mainController', ['$scope','$http','movies', function($scope, $http, movies) {
		$scope.loading = true;
		
		/**
		 * Returns a list of all movies
		 */
		$scope.getMovies = function() {
			movies.list().success(function(data) {
				$scope.movies = []; // Hold the array outside the scope first, to prevent unnecessary updates
				data.forEach(function (item) {
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
							// If already listed, add the source to the movie
							listedMovie.fromSource.push(item.name);
							if (item.name == "cinemaworld") {
								// Images in response are broken (fw and cw get swapped in URL, poorly sized), lets grab new ones from IMDB
								// For now, we will take the cinemaworld API image, since it works
								// Since we do this with the poster, we will also use the cinemaworld ID for detail requests (minus prefix)
								listedMovie.Poster = movie.Poster;
							}
						} else {
							// If this is the first instance, set the ID as generic, add the source and push to the movie list
							movie.ID = movie.ID.slice(2);
							movie.fromSource = [item.name];
							$scope.movies.push(movie);
						}
					})
				});
				
				// Sort all movies alphabetically
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
				$scope.loading = false;
			});
		}

		/**
		 * Returns a list of movies filtered by a string, to enable quick searching
		 * @param {string} filter The string to filter movies on
		 */
		$scope.filterMovies = function(filter) {
			if (filter == "") {
				// If the filter field is empty, return all the movies
				$scope.visibleMovies = $scope.movies;
				return;
			}
			
			filter = filter.toLowerCase(); // Lets make everything case insensitive
			
			// Create a new array of filtered movies
			var filteredMovies = []
			
			$scope.movies.forEach(function (movie) {
				if (movie.Title.toLowerCase().includes(filter)) {
					filteredMovies.push(movie);
				}
			});
			
			$scope.visibleMovies = filteredMovies;
		};
		
		/**
		 * Open a detail view for a movie, with pricing and other detail information
		 * @param {string} id The ID of the movie being fetched
		 */
		$scope.openDetail = function(id) {
			console.log(id);
		};
		
		// When we first load the page, lets get all the movies
		$scope.getMovies();

	}]);