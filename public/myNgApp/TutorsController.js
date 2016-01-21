angular.module("DebateCoaching")
.controller("TutorsController", function($scope, $http, common) {

	$scope.tutorInfo = [];
	$scope.days = common.getDays();
	$scope.tutorAvails;

	$http.get('/tutorsList')
		.success(function(data, status, header, config) { 
			if (status === 200) {
				//console.log(typeof data);
				//if (typeof data === "object") {
				//	console.log(data.length);
				//}
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

				//console.log("Tutor info has been saved as " + JSON.stringify($scope.tutorInfo));
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
		
		tutor['Avail'][dayNum] --; // Decrement the number of available slots by 1
		console.log("Times before removing " + time + " : " + JSON.stringify(tutor['Times']));
		tutor['Times'] = tutor['Times'].remove(time);
		console.log("Times after removing : " + JSON.stringify(tutor['Times']));
		//console.log("The thing that just got decremented is " + tutor['Avail'][dayNum]);
		return common.makeReq($http, name, email, tutor['Name'], $scope.days[dayNum][1], time);
	};


function getTutorDays(tutorInfo) {
	var tutorAvails = [];
	console.log("Tutor Info is " + JSON.stringify(tutorInfo));
	tutorInfo.forEach(function(tutor) {
		if (!tutor['Info']) { // If no information was retrieved for this tutor, set his availability to be 0 for all days
			console.log("Pushing list of 0s");
			//return [0, 0, 0, 0, 0, 0, 0];
			//tutorAvails.push({'Name' : tutor['Name'], 'Avail' : [0, 0, 0, 0, 0, 0, 0]});
			tutorAvails.push({'Name' : tutor['Name'], 'Avail' : [0, 0, 0, 0, 0, 0, 0], 'Times' : []});
			return;
		}
		var tutorAvail = [];
		var infoStr = tutor['Info'];
		var infoObj = common.str2Obj(tutor['Info']);
		console.log("Info Obj is " + JSON.stringify(infoObj));
		//var daysInfo = common.str2Obj(tutor['Info'])['Available_Days'];
		var daysInfo = infoObj['Available_Days'];
		var timeInfo = infoObj['Available_Times'].split(';');
		console.log(daysInfo);
		$scope.days.forEach(function(val, pos) {
			tutorAvail[pos] = daysInfo.match(val[1]) ? timeInfo.length : 0;
		});
		tutorAvails.push({'Name' : tutor['Name'], 'Avail' : tutorAvail, 'Times' : timeInfo});
		return;
	});
	console.log("Tutor Avails is " + JSON.stringify(tutorAvails));
	return tutorAvails;
}



function updateTutorDays() {

}



});