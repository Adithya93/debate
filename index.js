var express = require("express");
var app = express();
var http = require("http");


app.listen(process.env.PORT || 3000, function() {
  console.log("Here we go!");
});


app.get('/', function(req, res) {

	res.set('text/plain');
	res.write("Booyakasha Bounty!");
	res.end();
});