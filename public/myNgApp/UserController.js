var debateCoaching = angular.module('DebateCoaching', []);
	debateCoaching.controller("UserController", function($scope, $http){

		$http.get('/userInfo')
		.success(function(data, status, header, config) {
			if (status === 200){
				$scope.user = data;
				console.log("Received the following user data:\n");
				console.log($scope.user);
		}

		else if (status == 201) {
			console.log("User information not yet available; waiting for user to sign-in with Google.");
		}

		else {
			console.log("Unable to retrieve user information from server");
			$scope.user = {'name' : 'Unknown'};
		}
	});

		$scope.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
		$scope.times = ['7 am', '8 am', '7 pm', '8 pm'];
		$scope.tutors = ['Austin Lee', 'Ian Tay'];

		$scope.update = function(object) {
			console.log("Information posted through form: " + JSON.stringify(object));
			$http.post('/student/info', object)
			.success(function(data, headers, status, config) {
				console.log("Successfully passed information to server");
			});
		};

// HELPER FUNCTIONS

// CONVERT JSON STRING INTO FROM REDIS INTO JSON OBJECT


});