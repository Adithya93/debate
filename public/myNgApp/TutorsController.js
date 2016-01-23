angular.module("DebateCoaching")
.controller("TutorsController", function($scope, $http, common) {

	$scope.tutorInfo = [];
	$scope.days = common.getDays();
	$scope.tutorAvails;

	$http.get('/tutorsList')
		.success(function(data, status, header, config) { 
			if (status === 200) {
				console.log("Response from /tutorsList : " + data);
				$scope.tutorNames = data;

				var total = $scope.tutorNames.length;


				$scope.tutorNames.forEach(function(name, index) {
					$http.get('/coachInfo/' + name).
						success(function(data, status, header, config) {
							$scope.tutorInfo.push({'Name' : name, 'Info' : data ? data['info'] : null});
							console.log("Done with " + name);
							if (index === total - 1) {
								$scope.tutorAvails = getTutorDays($scope.tutorInfo);
								console.log("Updated tutor Avails!");
								console.log(JSON.stringify($scope.tutorAvails));
							}

						});
				});
			}
			else {
				console.log("Unable to request from /tutorsList");
			}
	});

		$http.get('/userInfo')
		.success(function(data, status, header, config) {
			if (status === 200) {
				$scope.user = data;
				console.log("Received user's name to be " + $scope.user.name + " and email to be " + $scope.user.email);
			}
			
			else if (status == 201) {
				console.log("User information not yet available; waiting for user to sign-in with Google.");
			}

			else {
				console.log("Unable to retrieve user information from server");
				$scope.user = {'name' : 'Unknown'};
			}
		});


	$scope.makeReq = function(name, email, tutor, dayNum, time) {
		console.log("Number of times for day " + $scope.days[dayNum][1] + " before booking : " + tutor['Avail'][dayNum].length);
		tutor['Avail'][dayNum] = tutor['Avail'][dayNum].remove(time);
		console.log("Number of times for day " + $scope.days[dayNum][1] + " after booking : " + tutor['Avail'][dayNum].length);
		common.makeReq($http, name, email, tutor['Name'], $scope.days[dayNum][1], time);
		return updateTutorDays(tutor['Name'], dayNum, time);
	};


function getTutorDays(tutorInfo) {
	var tutorAvails = [];
	console.log("Tutor Info is " + JSON.stringify(tutorInfo));
	tutorInfo.forEach(function(tutor) {
		if (!tutor['Info']) { // If no information was retrieved for this tutor, set his availability to be 0 for all days
			console.log("Pushing list of 0s");
			tutorAvails.push({'Name' : tutor['Name'], 'Avail' : [[], [], [], [], [], [], []]});
			return;
		}
		var tutorAvail = [];
		var infoStr = tutor['Info'];
		var availInfo = recoverNestedList(infoStr.substring(infoStr.indexOf("[["), infoStr.indexOf("]]") + 2));
		console.log("Avail Info is " + JSON.stringify(availInfo));
		tutorAvails.push({'Name' : tutor['Name'], 'Avail' : availInfo});

	});
	console.log("Tutor Avails is " + JSON.stringify(tutorAvails));
	return tutorAvails;
}



// Update the databse with the booked times
function updateTutorDays(tutor, day, time) {
	var obj = {'Day' : day, 'Time' : time};
	$http.post('/bookings/' + tutor, obj)
		.success(function(data, headers, status, config) {
			console.log("Booking Update post status : " + status);
			if (status === 200) {
				console.log("Successfully updated bookings in database.");
				return true;
			}
			return false;
		});
}


// Convert string representation of nested list from REDIS to actual nested list
function recoverNestedList(str) {
	var lists = str.split("[").slice(2);
	var allLists = lists.map(function(val, pos) {
		var innerList = val.split(","); 
		if(pos !== lists.length - 1) {
			innerList.pop()
		}; 
		var last = innerList[innerList.length - 1]; 
		last = last.substring(0,last.length - 1); 
		innerList[innerList.length - 1] = last; 
		innerList = innerList.map(function(value, position) {
			return value.substring(1, value.length - 1)
		}); 
		return innerList;
	}); 
	var lastList = allLists[allLists.length - 1]; 
	var last = lastList[lastList.length - 1]; 
	last = last.substring(0,last.length - 1); 
	allLists[allLists.length - 1][lastList.length - 1] = last; 
	return allLists;
}
});