angular.module("DebateCoaching", [])
 .service("common", function() {
	//console.log("Current value of myTutor is " + myTutor);
	Array.prototype.remove  = function(x) {right = this.splice(this.indexOf(x)); right.shift(); return this.concat(right)};
	var myTutor = myTutor || undefined;
	var days = [[0, 'Monday'], [1, 'Tuesday'], [2, 'Wednesday'], [3, 'Thursday'], [4, 'Friday'], [5, 'Saturday'], [6, 'Sunday']];
	//var times = [['7 am', '8 am', '9 am' '7 pm', '8 pm']];
	var times = [];
	for (var i = 7; i < 24; i ++) {
		//var slot = [];
		//slot[0] = i - 7;
		//slot[1] = i > 12 ? (i - 12) + " pm" : i + " am";
		//times[i - 7] = slot;
		times[i - 7] = i > 12 ? (i - 12) + " pm" : i + " am";   
	}
	times[12 - 7] = "12 pm";

	return {
// HELPER FUNCTIONS TO TRANSFER TUTOR INFO ACROSS CONTROLLERS
		getTutor : function(){
			console.log("getTutor has been called, returning tutor as " + myTutor);
			return myTutor;
		},

		setTutor : function(tutor) {
			myTutor = tutor;
			console.log("Tutor has been officially set to " + myTutor);
		},

		getDays : function() {
			return days;
		},

		getTimes : function() {
			return times;
		},
// CONVERT JSON STRING INTO FROM REDIS INTO JSON OBJECT
		str2Obj : function(str) {
			var obj = {};
			var fields = str.slice(1,-1).split(",");
			var pairs = fields.map(function(val, pos) {
				return val.split(":");
			});
			pairs.forEach(function(x) {
				console.log(x);
				obj[x[0].slice(1, -1)] = x[1].slice(1, -1); 
				});
			return obj;
			},

		str2NestedList : function(str) {
			var fields = str.slice(1,-1).split(",");
			var pairs = fields.map(function(val, pos) {
				return val.split(":");
			});
			var list = pairs.map(function(val, pos) {
				//obj[x[0].slice(1, -1)] = x[1].slice(1, -1); 
				return [val[0].slice(1, -1), val[1].slice(1, -1)];
				});
			return list;
			},

		format : function(str) {
			while (str.indexOf("_") != -1 || str.indexOf(";") != -1) {
				str = str.replace("_", " ").replace(';', ', ');
			}
			return str;
		},

		makeReq :	function($http, name, email, tutor, day, time) {
		var reqObj = {};
		reqObj.studentName = name;
		reqObj.studentEmail = email;
		reqObj.time = time;
		reqObj.day = day;
		reqObj.status = "Pending";
		$http.post('/appointments/' + tutor, reqObj)
		.success(function(data, headers, status, config) {
			console.log("Successfully posted request to server for appointment between " + reqObj.studentName + " and " + tutor + " at time of " + reqObj.time);
		//	return true;
		});
		//return false;
	}

	};
})

.controller("UserController", function($scope, $http, common){

	$http.get('/userInfo')
		.success(function(data, status, header, config) {
			if (status === 200) {
				$scope.user = data;

				console.log("Received the following user data:\n");
				console.log($scope.user);
				console.log("User's role is " + $scope.user.role);
				//delete $scope.user['dayTimes'];

				if ($scope.user && $scope.user.info) {
					console.log("User has info, detected on client side");
					console.log("Info is of type " + typeof($scope.user.info));
					$scope.user.info = $scope.user.info.substring(0, $scope.user.info.indexOf(',"dayTimes')) + "}";
					//console.log("Deleted? " + delete $scope.user.info['dayTimes']);
					console.log("Info is now " + $scope.user.info);
					$scope.user.info = common.str2NestedList($scope.user.info);
				}
				$scope.format = common.format;

				console.log("User's trainings are " + JSON.stringify($scope.user.trainings));

				console.log("User's trainings are of data type " + typeof($scope.user.trainings));

				//if (typeof($scoper.user.trainings) === '') {
				//if ($scope.user.trainings.substring(0, 1) === "{") {
					if ($scope.user.trainings && $scope.user.trainings.split("{").length < 3) { // Only single training session, thus convert it into an object and put it into a list
					var trainList = [];
					$scope.user.trainings = common.str2Obj($scope.user.trainings);
					trainList.push($scope.user.trainings);
					$scope.user.trainings = trainList;
					console.log("User's Trainings are now a single-element list: ");
					console.log($scope.user.trainings);
				}

				else if (typeof $scope.user.trainings === 'string') {
					$scope.user.trainings = str2ObjList($scope.user.trainings);
				}


				else if (typeof($scope.user.trainings) === 'object') { // List of training session strings, each has to be converted into object
					console.log("List of training sessions detected");
					$scope.user.trainings = $scope.user.trainings.map(function(val, pos) {
						return common.str2Obj(val);
					});
				}
		}

		else if (status == 201) {
			console.log("User information not yet available; waiting for user to sign-in with Google.");
		}

		else {
			console.log("Unable to retrieve user information from server");
			$scope.user = {'name' : 'Unknown'};
		}
	});

		$scope.days = common.getDays();
		$scope.times = common.getTimes();
		$scope.tutors = ['Austin Lee', 'Ian Tay'];
		//$scope.hisDays = [];
		//$scope.hisTimes = [];
		$scope.hisDays = [];
		$scope.hasDays = 
		$scope.notEmpty = notEmpty;

		for (var day = 0; day < $scope.days.length; day ++) {
			$scope.hisDays.push($scope.times.map(function(val, pos){return 0;}));
		}

		console.log("User's days have been set to " + JSON.stringify($scope.hisDays));

		$http.get('/tutorsList', function(data, status, header, config){
			if (status === 200) {
				console.log("Received tutors list of " + data);
				if (data.length > 0) {
					$scope.tutors = data;
				}
			}
		});

		function notEmpty(list) {
			for (var index = 0; index < list.length; index ++) {
				if (list[index] > 0) {
					return true;
				}
			}
			return false;
		}

		function parseForm(object) {
			console.log("Information posted through form: " + JSON.stringify(object) + "\n" + JSON.stringify($scope.hisDays));// + "\n" + JSON.stringify($scope.hisTimes));
			// Convert numbers to string to facilitate parsing of JSON string into object in future
			if (object["Experience"] == 1) {
				object["Experience"] = object["Experience"] + " Year";
			}
			else {
				object["Experience"] = object["Experience"] + " Years";
			}

			if (!isNaN(object["Maximum_Students"])) {
				object["Maximum_Students"] += "";
			}
			
			console.log("Received available days in controller as " + $scope.hisDays);
			//console.log("Received available times in controller as " + $scope.hisTimes);

			var hisDays = [];
			var dayTimes = [];

			for (var day = 0; day < $scope.hisDays.length; day ++) {
				if (notEmpty($scope.hisDays[day])) {
					hisDays.push($scope.days[day][1]);
					var dayInfo = [];
					$scope.hisDays[day].forEach(function(val, pos) {
						if (val) {
							dayInfo.push($scope.times[pos]);
						} 
					})
					dayTimes.push(dayInfo);
				}
				else {
					dayTimes.push([]);
				}
			}
			console.log("User's available days have been set to " + hisDays);
			//console.log("User's available times have been set to " + hisTimes);
			object["Available_Days"] = hisDays;
			while(object["Available_Days"].toString().indexOf(",") != -1) {// || object["Available_Times"].toString().indexOf(",") != -1) {
				object["Available_Days"] = object["Available_Days"].toString().replace(",", ";");
				//object["Available_Times"] = object["Available_Times"].toString().replace(",", ";");
			}


			//object['dayTimes'] = $scope.hisDays;
			object['dayTimes'] = dayTimes;
			return object;
		}

		$scope.updateStudent = function(object) {
			console.log("Setting tutor to " + object["Preferred_Tutor"]);
			common.setTutor(object["Preferred_Tutor"]);
			var newObj = parseForm(object);
			$http.post('/student/info', newObj)
			.success(function(data, headers, status, config) {
				console.log("Successfully passed new student information to server");
			});
		};

		$scope.updateCoach = function(coach){
			var newObj = parseForm(coach);
			$http.post('/coach/info', newObj)
			.success(function(data, headers, status, config) {
				console.log("Successfully passed new coach information to server");
			}); 
		};

		var str2ObjList = function(str) {
			var objList = str.split("{").slice(1).map(function(val, pos) {return "{" + val;});
			objList = objList.map(function(val, pos) {return (pos === objList.length - 1) ? val : val.substring(0, val.length - 1);}); // Eliminate extra '"' 
			return objList.map(function(val, pos) {return common.str2Obj(val);});
		};

	});







