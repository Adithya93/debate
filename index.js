var express = require('express');
var app = express();
var http = require('http');
var dotenv = require('dotenv');
dotenv.load();

var session = require('cookie-session');
var passport = require('passport');
var favicon = require('serve-favicon'); //serve favicon for site
var munge = require('munge'); //obfuscate email

var bodyParser = require('body-parser');
var moment = require('moment');

//console.log(process.env.NODE_ENV);

app.listen(process.env.PORT || 3000, function() {
  console.log("Here we go!");
});

app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
if (process.env.NODE_ENV == "dev"){
  app.use(session({
    name: 'devsession',
    keys: ['key1', 'key2']
  })
  );
}
else {
//	console.log("Not in development mode");
  app.use(session({
      secret: process.env.SESSION_SECRET
  }));
}
app.use(passport.initialize());
app.use(passport.session());
app.locals.moment = moment;
passport.serializeUser(function(user, done) {
    done(null, user);
    console.log("User is " + user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.ROOT_URL + "/auth/google/return"
}, function(token, tokenSecret, profile, done) {
    profile = profile._json;
    console.log(profile);
    done(null, profile);
}));

app.get('/', function(req, res) {

	res.set('text/html');
	//res.write("Booyakasha Bounty!");
	res.render('index');
	res.end();
});

app.post('/newUser', function(req, res) {
	res.set('text/plain');
	res.write('Alright, hang in there!');
	res.end();
	console.log('Someone tried to join!');
});


/***
app.get('/auth/google', function(req, res) {
	console.log("Trying to validate user through Google");
	passport.authenticate('google', {
  scope: 'openid email'
});
});
***/
app.get('/auth/google', passport.authenticate('google', {
    scope: 'openid email'
}));

/***
app.get('/auth/google/return', function(req, res) {
	passport.authenticate('google', {
  	successRedirect: '/',
  	failureRedirect: '/'
		});
	console.log("User has been retrieved as " + req.user);
}); 
***/
app.get('/auth/google/return', passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/'
}));




