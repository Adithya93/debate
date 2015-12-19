// CURRENTLY SHIPPED TO UserController.js due to linking issues
angular.module("DebateCoaching", [])
 .service("common", function() {
	console.log("Current value of myTutor is " + myTutor);
	var myTutor = myTutor || undefined;
	var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	var times = ['7 am', '8 am', '7 pm', '8 pm'];

	return {
// HELPER FUNCTIONS TO TRANSFER TUTOR INFO ACROSS CONTROLLERS
		getTutor : function(){
			return myTutor;
		},

		setTutor : function(tutor) {
			myTutor = tutor;
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
			return str.replace("_", " ");
		}
	};
});
