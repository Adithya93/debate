angular.module('DebateCoaching')

	.controller("UserController", function($scope, $http){

		$http.get('/userInfo')
		.success(function(data, status, header, config)) {
			if (status === 200){

				$scope.user = data;
				console.log("Received the following user data:\n");
				console.log($scope.user);

				$scope.test = "booya";






		}

	else {
		console.log("Unable to retrieve user information from server");
		$scope.user = {'name' : 'Unknown'};
	}




	});