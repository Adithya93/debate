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
							//$scope.slots = info['Available_Times'].split(";");
							var times = info['Available_Times'].split(";");
							var days = info['Available_Days'].split(";");
							$scope.slots = makeSlots(days, times);
							//console.log("Coach's available times retrieved on user side as " + JSON.stringify($scope.slots));
							console.log("Coach's available slots interpreted as " + JSON.stringify($scope.slots));
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


	$http.get('/sessions')
		.success(function(data, status, header, config) {
			console.log("Data received from sessions path : " + JSON.stringify(data));
			$scope.sessions = data;
			console.log("Soonest session is : " + data[0] + " and it is scheduled for " + data[0].day " and " data[0].time);
			//$scope.soonestDay = data[0].day;
			var today = new Date();
			$scope.soonest = data[0];
			$scope.enableSession = (today.getDay() === data[0]) && (Math.abs(data[0].time - today.getTime()) < 1000 * 60 * 5); 
			console.log("Is session enabled? " + $scope.enableSession)
	});


	$scope.makeReq = function(tutor, day, time) {
		return common.makeReq($http, $scope.user.name, $scope.user.email, tutor, day, time);
	};


	function makeSlots(days, times) {
		var slots = [];
		for (var day = 0; day < days.length; day ++) {
			for (var time = 0; time < times.length; time ++) {
				slots.push([days[day], times[time]]);
			}
		}
		return slots;
	}

	/*** REFACTORED INTO SERVICE TO ALLOW USAGE FROM TUTORS CONTROLLER (FOR FIRST-TIME USERS?)
	// Called if user is a student - Adds appointment to tutor's list with PENDING status & sends him email notification
	function makeReq(tutor, day, time) {
		var reqObj = {};
		reqObj.studentName = $scope.user.name;
		reqObj.studentEmail = $scope.user.email;
		reqObj.time = time;
		reqObj.day = day;
		reqObj.status = "Pending";
		$http.post('/appointments/' + tutor, reqObj)
		.success(function(data, headers, status, config) {
			console.log("Successfully posted request to server for appointment between " + reqObj.name + " and " + tutor + " at time of " + reqObj.time);
		//	return true;
		});
		//return false;
	}
	***/

	/*** DEPRECATED - FEATURE REMOVED
	// Called if user is a tutor - Changes appointment status to CONFIRMED or DECLINED & sends student email notification
	function confirmReq(studentName, studentEmail, day, time, status) {
		var info = {'studentName' : studentName, 'studentEmail' : studentEmail, 'day' : day, 'time' : time, 'status' : status};
		$http.post('/confirmations/' + $scope.user.name, info)
		.success(function(data, headers, status, config) {
			console.log("Successfully posted request to server for tutor " + $scope.user.name + " for " + status + " appointment at " + day + ", " + time
			 + " with student " + studentName);
		});
	}
	***/


	function getSessions() {

	}





	function getAppointments(tutor) {
		$http.get('/appointments/' + tutor)
		//$http.get('/coachInfo/' + tutor)
		.success(function(data, headers, status, config) {
			console.log("Retrieved the following information " + JSON.stringify(data));
			return data;
		});
	}

	function startLesson() {
		if (!($scope.enableSession)) {
			return;
		}
		$http.get('/lesson/' + $scope.soonest.sessionID + "/" + $scope.soonest.token + "/" + $scope.user.name + "/" + $scope.soonest.tutor)
			.success(function(data, status, header, config) {
				console.log("Made request to launch session successfully!");
			});
		}

});




