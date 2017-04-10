angular.module('movieController', [])

	// inject the Todo service factory into our controller
	.controller('mainController', ['$scope','$http','movies', function($scope, $http, movies) {
		$scope.formData = {};
		$scope.loading = true;
		
		// When we first load the page, lets get all the movies
		movies.list().success(function(data) {
			$scope.movies = data[0];
			$scope.loading = false;
			// Images in response are broken (fw and cw get swapped in URL), lets grab new ones from IMDB
			
		});

		/**
		 * Returns a list of movies filtered by a string, to enable quick searching
		 * @param {string} filter The string to filter movies on
		 */
		$scope.filterMovies = function() {
			
		};

	}]);