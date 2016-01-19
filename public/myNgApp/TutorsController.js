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


function getTutorDays(tutorInfo) {
	var tutorAvails = [];
	console.log("Tutor Info is " + JSON.stringify(tutorInfo));
	tutorInfo.forEach(function(tutor) {
		if (!tutor['Info']) { // If no information was retrieved for this tutor, set his availability to be 0 for all days
			console.log("Pushing list of 0s");
			//return [0, 0, 0, 0, 0, 0, 0];
			tutorAvails.push({'Name' : tutor['Name'], 'Avail' : [0, 0, 0, 0, 0, 0, 0]});
			return;
		}
		var tutorAvail = [];
		var infoStr = tutor['Info'];
		var infoObj = common.str2Obj(tutor['Info']);
		console.log("Info Obj is " + JSON.stringify(infoObj));
		//var daysInfo = common.str2Obj(tutor['Info'])['Available_Days'];
		var daysInfo = infoObj['Available_Days'];
		console.log(daysInfo);
		$scope.days.forEach(function(val, pos) {
			tutorAvail[pos] = daysInfo.match(val[1]) ? 1 : 0;
		});
		tutorAvails.push({'Name' : tutor['Name'], 'Avail' : tutorAvail});
		return;
	});
	console.log("Tutor Avails is " + JSON.stringify(tutorAvails));
	return tutorAvails;
}




});