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
				//console.log("Object is " + JSON.stringify(response));
				console.log("Object is " + response);
				//console.log("Number of keys in nested object: " + Object.keys(response).length);
				//console.log("Value of tutor key in nested object: " + response['tutor']);
			}
		});
	}
});