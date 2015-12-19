angular.module("DebateCoaching", [])
 .service("common", function() {
	console.log("Current value of myTutor is " + myTutor);
	var myTutor = myTutor || undefined;
	var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	var times = ['7 am', '8 am', '7 pm', '8 pm'];

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
		}
	};
})

.controller("UserController", function($scope, $http, common){

	$http.get('/userInfo')
		.success(function(data, status, header, config) {
			if (status === 200){
				$scope.user = data;
				if ($scope.user && $scope.user.info) {
					console.log("User has info, detected on client side");
					$scope.user.info = common.str2NestedList($scope.user.info);
				}
				console.log("Received the following user data:\n");
				console.log($scope.user);
				$scope.format = common.format;
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

		$http.get('/tutors', function(data, status, header, config){
			if (status === 200) {
				console.log("Received tutors list of " + data);
				if (data.length > 0) {
					$scope.tutors = data;
				}
			}
		});

		$scope.update = function(object) {
			console.log("Information posted through form: " + JSON.stringify(object));
			// Convert number to string to facilitate parsing of JSON string into object in future
			console.log("Setting tutor to " + object["Preferred_Tutor"]);
			common.setTutor(object["Preferred_Tutor"]);
			if (object["Experience"] == 1) {
				object["Experience"] = object["Experience"] + " Year";
			}
			else {
				object["Experience"] = object["Experience"] + " Years";
			}
			while(object["Available_Days"].toString().indexOf(",") != -1 || object["Available_Times"].toString().indexOf(",") != -1) {
				object["Available_Days"] = object["Available_Days"].toString().replace(",", ";");
				object["Available_Times"] = object["Available_Times"].toString().replace(",", ";");
			}
			$http.post('/student/info', object)
			.success(function(data, headers, status, config) {
				console.log("Successfully passed information to server");
			});
		};
	});







