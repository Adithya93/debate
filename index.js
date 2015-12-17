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
var redis = require('redis');


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


var client = redis.createClient(process.env.REDIS_URL);
client.set('framework', 'AngularJS');
client.on('connect', function() {
    console.log('Connected to Redis');
});


app.get('/', function(req, res) {

	res.set('text/html');
	//res.write("Booyakasha Bounty!");
  res.render('index');
	res.end();
});

/***
app.post('/oldUser', function(req, res) {
	//res.set('text/plain');
	//res.write('Alright, hang in there!');
	//res.end();
	//console.log('Someone tried to join!');

});
***/

app.get('/newUser', function(req, res) {
  res.render('newUser');
	console.log('Redirected to new user page!');
});

app.get('/auth/google', passport.authenticate('google', {
    scope: 'openid email'
}));

app.get('/auth/google/return', passport.authenticate('google', {
    successRedirect: '/verify',
    failureRedirect: '/'
}));

app.get('/verify', function(req, res) {
  client.hgetall(req.user.email, function(err, obj) {
    if (err) {
      console.log("Something went wrong while using REDIS to verify user status: " + err);
    }
    else {
      if (obj != undefined && Object.keys(obj).length > 0) {
        res.redirect('/' + obj['role']);
      }
      else {
        res.redirect('/newUser');
      }
    }
  })


});


// Get Requests to this path are made by UserController
app.get('/userInfo', function(req, res) {
  console.log("Received request from client side for user info\n");
  // If request is made by client-side before Google Sign-In has occurred, tell it to wait
  if (!req.user) {
    res.sendStatus(201).end();
  }
  else{
    client.hgetall(req.user.email, function(err, obj) {
    if (err) {
      console.log('Error retrieving user info from Redis: ' + err);
      res.json(req.user);
    }
    else {
      res.json(obj);
    }
  });
  }
});

app.post('/coach', function(req, res) {
  req.user.role = 'coach';
  req.user.since = new Date().toDateString();
  client.hmset(req.user.email, "name", req.user.name, "email", req.user.email, "role", req.user.role, "since", req.user.since, function(err, res) {
    if (!err) {
     console.log("Saved user " + req.user.name + " to database as " + req.user.role); 
    }
  });
  res.redirect('/coach');
});

app.post('/student', function(req, res) {
  req.user.role = 'student';
  req.user.since = new Date().toDateString();
  client.hmset(req.user.email, "name", req.user.name, "email", req.user.email, "role", req.user.role, "since", req.user.since, function(err, res) {
    if (!err) {
     console.log("Saved user " + req.user.name + " to database as " + req.user.role); 
    }
  });
  res.redirect('/student');
});

app.get('/coach', function(req, res) {
  res.render('coach');
});

app.get('/student', function(req, res) {
  res.render('student');
});

/***
app.get('/coach/new', function(req, res) {
  res.render('coach/new');
});

app.get('/student/new', function(req, res) {
  res.render('student/new');
});
***/
app.post('/student/info', function(req, res) {
  var info = JSON.stringify(req.body);
  console.log("Received the following info from new student " + info);
  client.hmset(req.user.email, 'info', info, function(error, response) {
    if (error) {
      console.log("Unable to save user info");
    }
    else {
      console.log(response);
    }
  });
});

app.post('/coach/info', function(req, res) {
  console.log("Received the following info from new coach " + JSON.stringify(req.body));
});
