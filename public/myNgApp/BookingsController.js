// CURRENTLY UNABLE TO LINK, TRYING TO RESOLVE USE OF SERVICE WITHOUT OVERWRITING DATA
angular.module("DebateCoaching")
.controller("BookingsController", function($scope, $http, common) {

	//var myTutor = common.getTutor();
	$http.get('/userInfo')
		.success(function(data, status, header, config) {
			if (status === 200){
				$scope.user = data;
				if ($scope.user && $scope.user.info) {
					console.log("User has info, detected in BookingsController side");
					//$scope.user.info = str2Obj($scope.user.info);
					//$scope.user.infoList = common.str2NestedList($scope.user.info);
					$scope.user.info = common.str2Obj($scope.user.info);
	//				$scope.show = true; // Redundant, but temporary fix to deal with jade saying user is undefined (despite displaying user values???)
				}
	//			else {
	//				console.log("Setting show to false");
	//				$scope.show = false;
	//			}
				console.log("Received the following user data in BookingsController:\n");
				console.log($scope.user);
				$scope.format = common.format;

					//$scope.tutor = common.getTutor();
				$scope.tutor = $scope.user.info.Preferred_Tutor;
				console.log("Retrieved tutor in BookingsController as " + $scope.tutor);
				$scope.slots = [];
				$http.get('/coachInfo/' + $scope.tutor)
					.success(function(data2, status2, header2, config2) {
						if (status2 === 200) {
						$scope.tutorObj = data2;
						var info = common.str2Obj(data2);
						$scope.slots = info['Available_Times'].split(";");
						console.log("Coach's available times retrieved on user side as " + JSON.stringify($scope.slots));
						//$scope.slots = data;
						}
						else {
							console.log("Unable to retrieve coach slots");
						}
					});
		}
		
		else if (status == 201) {
			console.log("User information not yet available; waiting for user to sign-in with Google.");
		}

		else {
			console.log("Unable to retrieve user information from server");
			$scope.user = {'name' : 'Unknown'};
		}
	});

});




