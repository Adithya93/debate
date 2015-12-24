var redis = require('redis');
var client = redis.createClient(process.env.REDIS_URL);

client.on('connect', function(err, res) {
	if (err) {
		console.log("Unable to connect to REDIS: " + err);
	}
	else {
		console.log(res);
	}
});

// Test saving of list as value for string key in hash
var arr = [1,2,3];
client.hmset('booyakashabounty@gmail.com', 'list', arr, function(err, res) {
	if (err) {
		console.log("Unable to save list in hash : " + err);
	}
	else {
		console.log(res);
		client.hget('booyakashabounty@gmail.com', 'list', function(error, response) {
			if (error) {
				console.log("Error retrieving list");
			}
			else {
				console.log("List is " + response);
				console.log("Length of list is " + response.length);
			}
		})
	}
});


// Test saving of object as value for string key in hash
var obj = {'tutor': 'Austin', 'experience' : '1 year'};
client.hmset('booyakashabounty@gmail.com', 'object', JSON.stringify(obj), function(err, res) {
	if (err) {
		console.log("Unable to save object in hash : " + err);
	}
	else {
		console.log(res);
		client.hget('booyakashabounty@gmail.com', 'object', function(error, response) {
			if (error) {
				console.log("Error retrieving list");
			}
			else {
				console.log("Object is " + response);
			}
		});
	}
});

client.hgetall('raghu.singapore@gmail.com', function(err, res) {
	if (err) {
		console.log("Unable to retrieve value of test key : " + err);
	}

	else {
		console.log(res);
	}
});

// Check list of tutors
client.lrange('tutors', 0, -1, function(err, res){
	if (err) {
		console.log("Error trying to retrieve all tutors from REDIS : " + err);
	}
	else {
		console.log("Tutor's list is " + JSON.stringify(res));
		client.llen('tutors', function(error, rep) {
			if(error) {
				console.log("Unable to retrieve length of tutor list : " + error);
			}
			else {
				console.log("Length of tutor list is " + rep);
			}
		})
	}
});

// Check list of students
client.lrange('students', 0, -1, function(err, res){
	if (err) {
		console.log("Error trying to retrieve all students from REDIS : " + err);
	}
	else {
		console.log("Student's list is " + JSON.stringify(res));
	}
});