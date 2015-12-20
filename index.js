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

	//res.set('text/html');
	//res.write("Booyakasha Bounty!");
  res.render('index');
	//res.end();
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
        client.hgetall(req.user.name, function(error, reply) {
          if (error) {
            console.log("Unable to retrieve name key for user : " + error);
          }
          else {
            if (reply != undefined && Object.keys(reply).length > 0) {
              res.redirect('/' + reply['role']);
            }
            else {
              res.redirect('/newUser');
            }
          }
        });
      }
    }
  });
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
      console.log("Retrieved object to be " + JSON.stringify(obj));
      if (obj !== null && obj !== undefined) {
        res.json(obj);
      }
      else {
        console.log("No key stored in REDIS for this email, user might be coach. Trying to retrieve info from name");
        //res.sendStatus(203).json(req.user);
        client.hgetall(req.user.name, function(error, reply) {
          if (error) {
            console.log("Unable to retrieve coach's available times : " + error);
          }
          else {
            console.log("Coach information : " + JSON.stringify(reply));
            res.json(reply);
          }
        });
      }
    }
    });
  }
});

app.get('/tutors', function(req, res) {
  res.set('application/json');
  client.lrange('tutors', 0, -1, function(err, rep) {
    if (err) {
      console.log("Unable to retrieve list of tutors : " + err);
      res.sendStatus(201);
    }
    else {
      res.json(rep);
    }
  });
});

app.post('/coach', function(req, res) {
  req.user.role = 'coach';
  req.user.since = new Date().toDateString();
  //client.hmset(req.user.email, "name", req.user.name, "email", req.user.email, "role", req.user.role, "since", req.user.since, function(err, res) {
  client.hmset(req.user.name, "name", req.user.name, "email", req.user.email, "role", req.user.role, "since", req.user.since, function(err, response) {
    if (!err) {
     console.log("Saved user " + req.user.name + " to database as " + req.user.role);
     res.redirect('/coach');
     client.lpush('tutors', req.user.name, function(error, rep) {
      if (error) {
        console.log("Unable to save new tutor to list of tutors in database");
      }
      else {
        console.log("Total number of tutors in database now: " + rep);
      }
     }); 
    }
  });
  //res.redirect('/coach');
});

app.post('/student', function(req, res) {
  req.user.role = 'student';
  req.user.since = new Date().toDateString();
  client.hmset(req.user.email, "name", req.user.name, "email", req.user.email, "role", req.user.role, "since", req.user.since, function(err, response) {
    if (!err) {
     console.log("Saved user " + req.user.name + " to database as " + req.user.role);
     res.redirect('/student');
     client.lpush('students', req.user.name, function(error, rep) {
      if (error) {
        console.log("Unable to save new student to list of students in database");
      }
      else {
        console.log("Total number of students in database now: " + rep);
      }
     }); 
    }
  });
  //res.redirect('/student');
});

app.get('/coach', function(req, res) {
  if (req.user.role !== 'coach') {
    client.hget(req.user.name, 'role', function(err, rep) {
      if (err) {
        console.log("Unable to look up name of user making request in REDIS : " + err);
      }
      else {
        if (rep === 'coach') {
          console.log("The user has previously registered as a coach. Allowing access to coach page.");
          //res.sendStatus(200).end();
          res.render('coach');
        }
        else {
          console.log('Attempt for Unauthorized Access of Coach Page detected');
          res.redirect('/');
        }
      }
    });
  }
  else {
    res.render('coach');
  }
});

app.get('/student', function(req, res) {
  res.render('student');
});

app.post('/student/info', function(req, res) {
  var info = JSON.stringify(req.body);
  console.log("Received the following info from new student " + info);
  client.hmset(req.user.email, 'info', info, function(error, response) {
    if (error) {
      console.log("Unable to save user info");
    }
    else {
      console.log(response);
      res.redirect('/student');
    }
  });
//  res.redirect('/student');
});

app.post('/coach/info', function(req, res) {
  var info = JSON.stringify(req.body);
  console.log("Received the following info from new coach " + info);
  //client.hmset(req.user.email, 'info', info, function(error, response) {
  client.hmset(req.user.name, 'info', info, function(error, response) {
    if (error) {
      console.log("Unable to save user info");
    }
    else {
      console.log(response);
      res.redirect('/coach');
    }
  });
//  res.redirect('/coach');
});

app.get('/bookings', function(req, res) {
  if (!req.user) {
    res.redirect('/');
  }
  else {
    res.render('bookings'); // bookings.jade should use BookingsController to parse Coach Info from JSON String sent by server
  }
});

app.get('/coachInfo/:name', function(req, res) {
  res.set('application/json');
  var name = req.params.name;
  console.log("Trying to retrieve info for coach " + name + " for student " + req.user.name);
  //client.hget(name, 'info', function(error, reply) {
  client.hgetall(name, function(error, reply) {
    if (error) {
      console.log("Unable to retrieve coach's available times : " + error);
    }
    else {
      console.log("Coach information : " + JSON.stringify(reply));
      res.json(reply);
    }
  });
});

app.post('/appointments/:name', function(req, res) {
  //res.set('text/plain');
  var name = req.params.name;
  var reqObj = req.body;
  console.log("Received appointment request for coach " + name + " from student " + reqObj.user.name);
  client.hget(name, 'appointments', function(err, reply) {
    if (err) {
      console.log("Error retrieving coach's appointment list : " + err);
    }
    else {
      res.sendStatus(200);
      var newList;// = [];
      if (reply === undefined || reply === null) {
        newList = [];
      }
      else if (typeof(reply) === "string") {
        newList = [];
        console.log("Reply is truthy and it is " + reply);
        newList.push(reply);
      }
      else if (typeof(reply) === "object") {
        newList = reply;
      }
      newList.push(JSON.stringify(reqObj));
      client.hmset(name, 'appointments', newList, function(error, response) {
        if (error) {
          console.log("Unable to save new appointment into tutor's list of appointments: " + error);
        }
        else {
          console.log("Saved appointment into tutor's records");
        }
      });
    }
  });
});

/***
app.get('/appointments/:name', function(req, res) {
  res.set('application/json');
  var name = req.params.name;
  client.hget(name, appointments, function(err, reply) {
    if (err) {
      console.log("Error retrieving coach's appointment list : " + err);
    }
    else {
      console.log("Sending reply of " + JSON.stringify(reply) + " to client");
      res.json(reply);
    }
  });
});
***/
/*** KIV - Needs form upload
app.get('/profile', function(req, res) {


});
***/