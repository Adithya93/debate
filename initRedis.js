var redis = require('redis');

var client = redis.createClient(process.env.REDIS_URL);
client.on('connect', function(err, res) {
	if (err) {
		console.log('Unable to connect: ' + err);
	}
	else {
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

var arr = [1,2,3];
client.hmset('booyakashabounty@gmail.com', 'list', arr, function(err, res) {
	if (err) {
		console.log("Unable to save list in hash : " + err);
	}
	else {
		console.log(res);
		client.hget('booyakashabounty@gmail.com', 'list', function(err, res) {
			if (err) {
				console.log("Error retrieving list");
			}
			else {
				console.log("List is " + res);
				console.log("Length of list is " + list.length);
			}
		})
	}
})