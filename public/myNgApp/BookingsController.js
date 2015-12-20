// CURRENTLY UNABLE TO LINK, TRYING TO RESOLVE USE OF SERVICE WITHOUT OVERWRITING DATA
angular.module("DebateCoaching")
.controller("BookingsController", function($scope, $http, common) {

	$http.get('/userInfo')
		.success(function(data, status, header, config) {
			if (status === 200) {
				$scope.user = data;
				if ($scope.user && $scope.user.info) {
					console.log("User has info, detected in BookingsController side");
					$scope.user.info = common.str2Obj($scope.user.info);
				}
				console.log("Received the following user data in BookingsController:\n");
				console.log($scope.user);
				$scope.format = common.format;

				$scope.tutor = $scope.user.info.Preferred_Tutor;
				console.log("Retrieved tutor in BookingsController as " + $scope.tutor);
				$scope.slots = [];
				
				if ($scope.user.role === 'student') {
					$http.get('/coachInfo/' + $scope.tutor)
					.success(function(data2, status2, header2, config2) {
						if (status2 === 200) {
							$scope.tutorObj = data2;
							var info = common.str2Obj(data2.info);
							$scope.slots = info['Available_Times'].split(";");
							console.log("Coach's available times retrieved on user side as " + JSON.stringify($scope.slots));
						}
						else {
							console.log("Unable to retrieve coach slots");
						}
					});
				}
			}
		
			else if (status == 201) {
				console.log("User information not yet available; waiting for user to sign-in with Google.");
			}

		/***
		else if (status === 203) {
			//console.log("Unable to retrieve user information from server");
			//$scope.user = {'name' : 'Unknown'};
			console.log("Client deduced to be a coach, making request for coach info");
			$http.get('/coachInfo/' + $scope.tutor)
			.success(function(data2, status2, header2, config2) {
				$scope.user = data2;
			});
		}
		***/
	});

	$scope.makeReq = makeReq;

	function makeReq(tutor, time){
		var reqObj = {};
		reqObj.user = $scope.user;
		reqObj.time = time;
		reqObj.status = "Pending";
		$http.post('/appointments/' + tutor, reqObj)
		.success(function(data, headers, status, config) {
			console.log("Successfully posted request to server for appointment between " + reqObj.user.name + " and " + tutor + " at time of " + reqObj.time);
		//	return true;
		});
		//return false;
	}

	function getAppointments(tutor) {
		$http.get('/appointments/' + tutor)
		//$http.get('/coachInfo/' + tutor)
		.success(function(data, headers, status, config) {
			console.log("Retrieved the following information " + JSON.stringify(data));
			return data;
		});
	}

});




