angular.module('movieService', []).factory('movies', ['$http', function ($http) {
	return {
		list : function() {
			return $http.get('/api/movies');
		},
		get : function(id) {
			return $http.get('/api/movie/' + id);
		},
		getIMDB : function(id) {
			return $http.get('http://www.omdbapi.com/?i=tt' + id);
		}
	}
}]);