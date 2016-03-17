var redis = require('redis');
var dotenv = require('dotenv');
dotenv.load();

var client = redis.createClient(process.env.REDIS_URL);
client.on('connect', function(err, res) {
	if (err) {
		console.log('Unable to connect: ' + err);
	}
	else {
		console.log("CONNECTED TO REDIS");
		console.log(res);
	}
});

client.del('raghu.singapore@gmail.com', function(err, res) {
	if (err) {
		console.log('Unable to delete: ' + err);
	}
	else {
		console.log(res);
	}
});

client.del('booyakashabandit@gmail.com', function(err, res) {
	if (err) {
		console.log('Unable to delete: ' + err);
	}
	else {
		console.log(res);
	}
});

client.del('Raghu Nathan', function(err, res) {
	if (err) {
		console.log('Unable to delete: ' + err);
	}
	else {
		console.log(res);
	}
});

client.del('', function(err, res) {
	if (err) {
		console.log('Unable to delete : ' + err);
	}
	else {
		console.log(res);
	}
})


austinInfo = JSON.stringify({"Available_Times" : "7 pm;10 pm", "Available_Days" : "Monday;Wednesday;Thursday", "Experience" : "10 Years"});
console.log("Saving Austin's info as " + austinInfo);
client.hmset('Austin Lee', "name", "Austin Lee", "email", "ra102@duke.edu", "role", "coach", "since", new Date().toDateString(), "info", austinInfo, function(err, res) {
	if (err) {
		console.log("Unable to seed database with coach Austin");
	}
	else {
		client.hget('Austin Lee', "info", function(error, rep) {
			if (error) {
				console.log("Unable to retrieve Austin's info : " + error);
			}
			console.log("Austin's info retrieved as : " + rep);
		});
	}
});


client.llen('tutors', function(err, res) {
	if (err) {
		console.log("Error retrieving length of tutors list : " + err);
	}
	else {
		console.log("Current length of tutors list is " + res);
		//if (parseInt(res)  === 0) {
		if (parseInt(res) < 2) {
		//	client.lpush('tutors', 'Austin Lee', function(error, rep) {
			client.lpush('tutors', 'Ian Tay Yi Yan', function(error, rep) {
				if (error) {
					console.log("Unable to add tutor to list : " + error);
				}
				else {
					console.log("Added tutor, length is now " + rep);
				}
			});
		}
		else if (parseInt(res) > 2) {
			client.rpop('tutors', function(error, rep) {
				if (error) {
					console.log("Unable to remove earliest remaining tutor : " + error);
				}
				else {
					console.log("Removed tutor " + rep + " from tutors list");
				}
			});
		}
	}
});

client.llen('students', function(err, res) {
	if (err) {
		console.log("Error retrieving length of students list : " + err);
	}
	else {
		console.log("Current length of students list is " + res);
		if (parseInt(res) > 0) {
			client.rpop('students', function(error, rep) {
				if (error) {
					console.log("Unable to remove earliest remaining student : " + error);
				}
				else {
					console.log("Removed student " + rep + " from students list");
				}
			});
		}
	}
});

