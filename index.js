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

var sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);

var OpenTok = require('opentok');
console.log("Type of OpenTok : " + typeof OpenTok);
var opentok = OpenTok(process.env.OPENTOK_API_KEY, process.env.OPENTOK_API_SECRET);


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
  res.render('index');
});

app.get('/about', function(req, res) {
  res.render('about');
}); 

app.get('/tutors', function(req, res) {
  res.render('tutors');
});

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
      if (obj != undefined && Object.keys(obj).length > 0 && obj['role'] != undefined) {
        //console.log("Object's role is " + obj['role']);
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
  console.log("Req.user is " + req.user);
  console.log("Is user inactive? " + req.inactive);
  if (!req.user || req.inactive) {
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
        client.hgetall(req.user.name, function(error, reply) {
          if (error) {
            console.log("Unable to retrieve coach's available times : " + error);
          }
          else {
            if (reply !== null && reply !== undefined) {
              console.log("Coach information : " + JSON.stringify(reply));
              res.json(reply);
            }
            else {
              res.json(req.user);
            }
          }
        });
      }
    }
    });
  }
});

app.get('/tutorsList', function(req, res) {
  res.set('application/json');
  client.lrange('tutors', 0, -1, function(err, rep) {
    if (err) {
      console.log("Unable to retrieve list of tutors : " + err);
      res.sendStatus(201);
    }
    else {
      console.log("Tutors list retrieved from REDIS : " + rep);
      res.json(rep);
    }
  });
});

app.post('/coach', function(req, res) {
  req.user.role = 'coach';
  req.user.since = new Date().toDateString();
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
});

app.get('/coach', function(req, res) {
  //console.log(req.user.role);
  //if (!req.user) {}
  if (req.user.role !== 'coach') {
    if (req.user.role === 'student') {
      res.redirect('/student');
    }
    else {
      client.hget(req.user.name, 'role', function(err, rep) {
        if (err) {
          console.log("Unable to look up name of user making request in REDIS : " + err);
        }
        else {
          if (rep === 'coach') {
            console.log("The user has previously registered as a coach. Allowing access to coach page.");
            res.render('coach');
          }
          else {
            console.log('Attempt for Unauthorized Access of Coach Page detected');
            client.hget(req.user.email, 'role', function(error, reply) {
              if (reply === 'student') {
                console.log("User is a student, redirecting him to student page");
                res.redirect('/student');
              }
              else {
                res.redirect('/'); // Unregistered user
              }
            });
          }
        }
      });
    }
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
});

app.post('/coach/info', function(req, res) {
  var info = JSON.stringify(req.body);
  console.log("Received the following info from new coach " + info);
  client.hmset(req.user.name, 'info', info, function(error, response) {
    if (error) {
      console.log("Unable to save user info");
    }
    else {
      console.log(response);
      //res.redirect('/coach');
      res.sendStatus(200);
    }
  });
});

app.get('/bookings', function(req, res) {
  if (!req.user) {
    res.redirect('/');
  }
  else {
    res.render('bookings'); // bookings.jade should use BookingsController to parse Coach Info from JSON String sent by server
  }
});

// Allow users to see each other's profile pages
app.get('/:name/profile', function(req, res) {
  if (!req.user) { // Not signed in, redirect to home page for sign in
    res.redirect('/');
  }
  else {
    client.hgetall(req.params.name, function(err, obj) {
      var coachInfo;
      if (err) {
        console.log("Unable to retrieve info for coach " + req.params.name);
        coachInfo = null;
      }
      else {
        coachInfo = obj;
        console.log("Coach profile will have following info : " + JSON.stringify(obj));
      }
      res.render('profile', {coach: coachInfo});
    });
  }
});

// Allow coaches (or all users?) to post to their profile page
app.post('/:name/profile', function(req, res) {
  if (!req.user || req.user.name !== req.params.name || req.user.role !== 'coach') {
    console.log("Unauthorized profile post request detected!");
    res.status(401).write('You are not authorized to post here. Please sign in if you are the coach.');
  }
  else {
    res.status(200).write("Coming Soon!");
  }
  res.end();
});



app.get('/coachInfo/:name', function(req, res) {
  res.set('application/json');
  var name = req.params.name;
  //console.log("Trying to retrieve info for coach " + name + " for student " + req.user.name);
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
  var name = req.params.name;
  var reqObj = req.body;
  console.log("Received appointment request for coach " + name + " from student " + reqObj.studentName);
  console.log("Request object is " + JSON.stringify(reqObj));
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
          console.log("Saved appointment into tutor's records. Now saving to student's records");
          client.hget(req.user.email, 'trainings', function(Error, List) {
            if (Error) {
              console.log("Unable to retrieve trainings list of " + req.user.name + " : " + Error);
            }
            else {
              var trainingList = [];
              //if (List === undefined || List === null) {
              //  trainingList = [];
              //}
              if (typeof(List) === "string") {
                trainingList.push(List);
              }
              else if (typeof(List) === "object" && List !== null && List !== undefined) {
                trainingList = List;
              }
              trainingList.push(JSON.stringify({'coach' : name, 'day' : reqObj['day'], 'time' : reqObj['time'], 'status' : 'Pending'}));
              client.hmset(req.user.email, 'trainings', trainingList, function(e, r) {
                if (e) {
                  console.log("Unable to reflect booking request in database for user " + req.user.name + " : " + e);
                }
                else {
                  console.log("Saved request successfully in database for user " + req.user.name);
                }
              });
              client.hget(name, 'email', function(e1, r1) {
                if (e1) {
                  console.log("Unable to retrieve email of coach : " + e1);
                }
                else {
                  if (notifyTutor(req.params.name, r1, reqObj)) {
                    console.log("Successfully e-mailed tutor");
                  }
                  else {
                    //console.log("Unable to e-mail tutor"); // Always prints this because of asynchronous callback, misleading 
                    console.log("Awaiting response from SendGrid");
                  }
                }
              });
            }
          });
        }
      });
    }
  });
});

app.post('/bookings/:name', function(req, res) {
  var name = req.params.name;
  var booking = req.body;
  var day = booking['Day'];
  var time = booking['Time'];
  client.hget(name, 'info', function(err, rep) {
    if (err) {
      console.log("Unable to retrieve info for tutor " + name + " : " + err);
    }
    else {
      if (rep === null || rep === undefined) {
        console.log("No information in database for tutor?");
        res.sendStatus(404);
      }
      else {
        var infoObj = JSON.parse(rep);
        console.log("Type of availability list : " + typeof (infoObj["dayTimes"]));
        var newAvails = infoObj["dayTimes"];
        newAvails[day] = newAvails[day].remove(time);
        infoObj["dayTimes"] = newAvails;
        var newInfoStr = JSON.stringify(infoObj);
        client.hmset(name, 'info', newInfoStr, function(error, reply) {
          if (error) {
            console.log("Unable to decrement booking: " + error);
          }
          else {
            console.log("Updated Bookings in Database? " + reply);
            res.sendStatus(200);
          }
        });
      }
    }
  });
});

app.post('/confirmations/:name', function(req, res) {
  var name = req.params.name;
  var booking = req.body;
  var status = booking['status'];
  if (status !== 'confirm' || status !== 'decline') {
    console.log("Unknown request from client, ignoring");
    res.sendStatus(401);
  }
  var success = false;
  console.log("About to call updateCoachBookings method");
  if (updateCoachBookings(name, booking, status)) {
    console.log("Successfully updated coach. About to update student");
    if (handleStudentBookings(name, booking, status)) { // Update status in coach's and user's appointment list
      console.log("Succesfully updated student confirmation");
      success = true;
    }
  }
  if (success) {
    res.sendStatus(200);
    if (notifyStudent(req.params.name, req.params.email, booking)) {
      console.log("Successfully e-mailed student");
    }
  }
  else {
    res.sendStatus(404);
  }
});

app.get('/login', function(req, res) {
  res.inactive = false;
  res.render('login');
});


app.get('/logout', function(req, res) {
  if (req.user === null || (req.user.role !== 'student' && req.user.role !== 'coach')) {
    console.log("Invalid logout attempt, please check client-side logic");
    //res.sendStatus(404);
  }
  //else {
    
    //req.user = null; // DOES NOT WORK
    req.inactive = true;
    console.log("Session deleted");
  //}
  //res.sendStatus(200);
  res.redirect('/');
});

app.get('/contact', function(req, res) {
  res.render('contact');
});

/*** KIV - Needs form upload
app.get('/profile', function(req, res) {
});
***/

app.get('/test', function(req, res) {
  res.render('test');
});

function str2Obj(str) {
      var obj = {};
      var fields = str.slice(1,-1).split(",");
      var pairs = fields.map(function(val, pos) {
        return val.split(":");
      });
      pairs.forEach(function(x) {
        obj[x[0].slice(1, -1)] = x[1].slice(1, -1); 
        });
      return obj;
      }

function findBooking(value, booking) {
  var storedObj = str2Obj(value);
  //return storedObj['studentName'] === booking['studentName'] && storedObj['day'] === booking['day'] && storedObj['time'] === booking['time'];
  return storedObj['day'] === booking['day'] && storedObj['time'] === booking['time'];
}

function updateCoachBookings(coachName, booking, status) {
  client.hget(coachName, 'appointments', function(err, rep) {
    if (err) {
      console.log("Error retrieving appointment list for confirmation : " + err);
    }
    else {
      var list = rep;
      var foundIndex = list.findIndex(function(val) {
        return findBooking(val, booking);
      });
      var found = list[foundIndex];
      if ('status' === 'confirm') {
        found['status'] = status;
        list[foundIndex] = found;
      }
      else {
        list.splice(foundIndex);
      }
      client.hmset(coachName, 'appointments', list, function(error, reply) {
        if (error) {
         console.log("Unable to save updated appointments list : " + err);
         return false;
        }
        else {
          console.log("Successfully updated list. Now updating student's database");
          return true;
        }
      });
    }
  });
}

function handleStudentBookings(coachName, booking, status) {
  client.hget(booking.studentEmail, 'trainings', function(Error, List) {
    if (Error) {
      console.log("Problem retrieving trainings list of user : " + Error);
      return false;
    }
    else {
      var trainingList;
      if (List === undefined || List === null) {
        trainingList = [];
        trainingList.push(JSON.stringify({'coach' : name, 'day' : booking['day'], 'time' : booking['time'], 'status' : status}));
      }
      else if (typeof(List) === 'string') {
        console.log("Checking return from REDIS for student's list of training sessions : " + List);
        trainingList = [];
        var bookingObj = str2Obj(List);
        bookingObj['status'] = status;
        trainingList.push(bookingObj);
      }
      else if (typeof(List) === 'object') {
        console.log("List returned from REDIS is of type object, may already be list");
        trainingList = List;
        var foundBookingIndex = trainingList.findIndex(function(val) {
          return findBooking(val, booking);
        });
        var foundBooking = trainingList[foundBookingIndex];
        foundBooking['status'] = status;
        trainingList[foundBookingIndex] = foundBooking;
        client.hmset(booking.studentEmail, 'trainings', trainingList, function(e, r) {
          if (e) {
            console.log("Unable to update status of student's appointment : " + e);
            return false;
          }
          else {
            console.log("Successfully updated student's appointment list");
            return true;
          }
        });
      }
    }
  });
}



function sendStudentSessionID(coachName, coachEmail, studentName, studentEmail, URL) {
  var email = new sendgrid.Email();
  email.from = 'DebateCoaching@noreply.com';
  email.to = studentEmail;

  console.log("Sending email to address " + email.to + " belonging to " + studentName);

  //var fields = booking.status === 'confirmed' ? 
  var fields = {'subject' : 'Debate Coaching - Confirmation of Appointment', 'header' : 'Congratulations ' + studentName, 'message' : 'Your appointment has been confirmed. Visit this link at the date specified below : ' + URL}; 
  email.subject = fields.subject;
  email.addFile({
    cid : 'site_logo',
    path: './public/site_logo.png'
  });
  // TO-DO : ADD DATE AND TIME OF SESSION TO EMAIL BY EXTRACTING THROUGH CLICK ON TUTOR.JADE
  var html = "<html><head><h1>" + fields.header + " " + coachName + " !</h1>"
  + "<link rel = 'stylesheet' href = './public/css/custom.css' type = 'text/css'></link>" + "<div#siteLogo><img src = 'cid:site_logo'></img></div></head>"
  + "<body><div>" + fields.message + "</div><div#info><p>Name of coach : " + coachName + " </p><p>Email : " + coachEmail + " </p>"
  //+ "<p>Day & Time : " + booking.day + ", " + booking.time + " </p>"
  + "</div></body></html>";
  email.setHtml(html);
  sendgrid.send(email, function(err, json) {
    if (err) {
      console.log("Unable to send email to " + coachName + " : " + err);
    }
    else {
      console.log(JSON.stringify(json));
      return true;
    }
  });
}



function notifyStudent(coachName, coachEmail, booking) {
  var email = new sendgrid.Email();
  email.from = 'DebateCoaching@noreply.com';
  email.to = booking.studentEmail;
  var fields = booking.status === 'confirmed' ? 
  {'subject' : 'Debate Coaching - Confirmation of Appointment', 'header' : 'Congratulations', 'message' : 'Your appointment has been confirmed'} : 
  {'subject' : 'Debate Coaching - Appointment Declined', 'header' : 'Sorry', 'message' : 'Your appointment has been declined'}; 
  //email.subject = status === 'confirmed' ? 'Debate Coaching - Confirmation of Appointment' : 'Debate Coaching - Appointment Declined';
  email.subject = fields.subject;
  email.addFile({
    cid : 'site_logo',
    path: './public/site_logo.png'
  });
  var html = "<html><head><h1>" + fields.header + " " + coachName + " !</h1>"
  + "<link rel = 'stylesheet' href = './public/css/custom.css' type = 'text/css'></link>" + "<div#siteLogo><img src = 'cid:site_logo'></img></div></head>"
  + "<body><div>" + fields.message + "</div><div#info><p>Name of coach : " + coachName + " </p><p>Email : " + coachEmail + " </p>"
  + "<p>Day & Time : " + booking.day + ", " + booking.time + " </p>"
  + "</div></body></html>";
  email.setHtml(html);
  sendgrid.send(email, function(err, json) {
    if (err) {
      console.log("Unable to send email to " + coachName + " : " + err);
    }
    else {
      console.log(JSON.stringify(json));
      return true;
    }
  });
}



function notifyTutor(coachName, coachEmail, booking) {
  //var studentEmail = booking.studentEmail;
  //var studentName = booking.studentName;
  var email = new sendgrid.Email();
  email.from = 'DebateCoaching@noreply.com';
  email.to = coachEmail;
  email.subject = 'Debate Coaching - Appointment Request';
//  email.addFile({
//    cid : 'style',
//    path : './public/css/custom.css'
//  });
  email.addFile({
    cid : 'site_logo',
    path : './public/site_logo.png'
  });
  var html = "<html><head><h1>Congratulations " + coachName + " !</h1>"
//  + "<link rel = 'stylesheet' href = 'cid:style' type = 'text/css'></link>" + "<div#siteLogo><img src = 'cid:site_logo'></img></div></head>" // css injection doesn't work
  + "<link rel = 'stylesheet' href = './public/css/custom.css' type = 'text/css'></link>" + "<div#siteLogo><img src = 'cid:site_logo'></img></div></head>"
  + "<body><div>You have an appointment request!</div><div#info><p>Name of student : " + booking.studentName + " </p><p>Email : " + booking.studentEmail + " </p>"
  + "<p>Day & Time : " + booking.day + ", " + booking.time + " </p>"
  +  "</div></body></html>";
  email.setHtml(html);
  sendgrid.send(email, function(err, json) {
    if (err) {
      console.log("Unable to send email to " + coachName + " : " + err);
    }
    else {
      console.log(JSON.stringify(json));
      return true;
    }
  });
}


/***
function handleStudentRejection(coachName, booking) {
  client.hget(booking.studentEmail, 'trainings', function(Error, List) {
    if (Error) {
      console.log("Problem retrieving trainings list of user : " + Error);
      return false;
    }
    else {
      var trainingList;
      if (List === undefined || List === null) {
        trainingList = [];
        trainingList.push(JSON.stringify({'coach' : name, 'day' : booking['day'], 'time' : booking['time'], 'status' : 'Confirmed'}));
      }
      else if (typeof(List) === 'string') {
        console.log("Checking return from REDIS for student's list of training sessions : " + List);
        trainingList = [];
        var bookingObj = str2Obj(List);
        bookingObj['status'] = 'Confirmed';
        trainingList.push(bookingObj);
      }
      else if (typeof(List) === 'object') {
        console.log("List returned from REDIS is of type object, may already be list");
        trainingList = List;
        var foundBookingIndex = trainingList.findIndex(function(val) {
          return findBooking(val, booking);
        });
        var foundBooking = trainingList[foundBookingIndex];
        foundBooking['status'] = 'Confirmed';
        trainingList[foundBookingIndex] = foundBooking;
        client.hmset(booking.studentEmail, 'trainings', trainingList, function(e, r) {
          if (e) {
            console.log("Unable to update confirmed status of student's appointment : " + e);
            return false;
          }
          else {
            console.log("Successfully updated student's appointment list");
            return true;
          }
        });
      }
    }
  });
}
***/
//app.get('/lesson/:student/:coach', function(req, res) {
app.get('/lesson/:session_id/:token/:student/:coach', function(req, res) {
  var sID = req.params.session_id;
  var token = req.params.token;
  var student = req.params.student;
  var coach = req.params.coach;
  res.render('lessonDemo', {'apiKey' : process.env.OPENTOK_API_KEY, 'sessionId' : sID, 'token' : token, 'Tutor' : coach, 'Student' : student});
});


app.get('/bookDemo', function(req, res) {
  res.render('bookDemo', {'User' : req.user.name});
});


app.post('/bookLesson/:tutor', function(req, res) {
  var bookingInfo = req.body;
  var tutor = req.params.tutor;
  console.log("User " + req.user.name + " is booking an appointment");
  opentok.createSession({mediaMode:'routed', archiveMode:'always'}, function(err, session) {
    if (err){
      console.log(err);
    } 
    else {
      res.sendStatus(200);
      console.log("Session ID is " + session.sessionId);
      // Generate Tokens for coach and student
      var studentToken = session.generateToken({
        'role' :       'subscriber',
        'expireTime' : (new Date().getTime() / 1000)+(7 * 24 * 60 * 60), // in one week
        //'data' :       'name=Johnny'
      });

      var coachToken = session.generateToken({
        'role' :       'publisher',
        'expireTime' : (new Date().getTime() / 1000)+(7 * 24 * 60 * 60), // in one week
        //'data' :       'name=Johnny'
      });


      // Retrieve client's existing list of booking session ids and add this one to the back
      
      //var sessionObj = {'sessionID' : session.sessionId, 'activeDay' : }
      var studentSessionObj = {'sessionID' : session.sessionId, 'token' : studentToken, 'tutor' : tutor, 'lessonDay': bookingInfo.day, 'lessonTime': bookingInfo.time, 'bookedOn' : new Date()};
      var coachSessionObj = {'sessionID' : session.sessionId, 'token' : coachToken, 'student' : bookingInfo.studentName, 'lessonDay': bookingInfo.day, 'lessonTime': bookingInfo.time, 'bookedOn' : new Date()}; // TEMPORARY
      
      saveSession(req.user.email, studentSessionObj);
      //saveCoachSession(); TO BE ADDED SOON
    }  
  });
});


app.get('/sessions', function(req, res) {
  //var id;
  if (req.user.role === 'student') {
    //res.json(retrieveSessions(req.user.email));    
    //id = req.user.email;
    client.hget(req.user.email, 'sessions', function(err, sessions) {
    if (err) {
      console.log("Error retrieving student's sessions... Is this a registered email address? " + err);
    }
    else {
      console.log("Non-stringified sessions : " + sessions);
      //console.log("User's sessions : " + JSON.stringify(sessions));
      //res.json(sessions);
      res.json(JSON.parse(sessions));
      //return sessions;
    }
  });

  }
  else if (req.user.role === 'coach') {
    //res.json(retrieveSessions(req.user.name));
    //id = req.user.name;
    client.hget(req.user.name, 'sessions', function(err, sessions) {
    if (err) {
      console.log("Error retrieving student's sessions... Is this a registered coach name? " + err);
    }
    else {
      console.log("User's sessions : " + sessions);
      //return sessions;
      res.json(JSON.parse(sessions));
    }
  });

  }
  else {
    //var result = retrieveSessions(req.user.email) || retrieveSessions(req.user.name);
    //if (result) {
    //  res.json(result);
    //}
    client.hget(req.user.email, 'sessions', function(err, sessions) {
      if (err) {
        console.log("Error retrieving student's sessions... Is this a registered email address? " + err);
      }
      else {
        console.log(typeof sessions);
        //console.log(JSON.parse(sessions));
        console.log(sessions);
        console.log("Unknown whether user is student or coach. Value for email key : " + sessions);
        if (sessions === undefined || sessions === null) {
          client.hget(req.user.email, 'sessions', function(error, sessions2) {
            if (error) {
              console.log("Error retrieving student's sessions... Is this a registered email address? " + err);
            }
            else {
              console.log("Value for name key : " + sessions2);
              if (sessions2 === undefined || sessions2 === null) {
                console.log("No sessions found for this user at all!");
                res.sendStatus(404);
              }
              else {
               console.log("Choosing value for name key");
               res.json(JSON.parse(sessions2)); 
              }
            }
          });
        }
        else {
          res.json(JSON.parse(sessions));
        }
        //res.json(sessions);
        //return sessions;
      }
    }); 
  }
});


function saveSession(id, session) {
  console.log("The session object that is going to be saved is " + JSON.stringify(session));
  client.hget(id, 'sessions', function(error, list) {
  if (error) {
    console.log("Unable to retrieve any info for this user email... Is user registered? " + error);
  }
  else {
    console.log("User's current list of sessions is " + JSON.stringify(list));
    
    if (typeof list === "object" && list != null && list.length > 0) {
      console.log("First element of list : " + list[0]);
    }
    
    console.log("Done printing user's list of sessions");
    var newList;
    if (typeof list === undefined || list === null) {
      newList = [];
    }
    else if (typeof list === "object" && list.length === 0) {
      console.log("List is object");
      newList = list;
    }
    else if (typeof list === "string") {
      console.log("List is string");
      //newList = JSON.parse(list);
      if (list.substring(0, 1) !== '[') {
        newList = [JSON.parse(list)];
      }
      else {
        newList = JSON.parse(list);
      }
      //var contents = JSON.parse(list);
      console.log("Type of new list : " + typeof newList);
      console.log("Contents of new list : " + JSON.stringify(newList));
      //newList = [];
    }

    newList.push(JSON.stringify(session));
    console.log("The state of new list is " + JSON.stringify(newList));
    client.hmset(id, 'sessions', JSON.stringify(newList), function(err2, reply) {
      if (err2) {
        console.log("Unable to save booking session " + err2);
      }
      else {
        console.log("Successfully saved booking session " + reply);
      }
    });
  }
  });
}


/***
function saveCoachSession(coachName, session) {
  client.hget(coachName, 'sessions', function(error, list) {
  if (error) {
    console.log("Unable to retrieve any info for this user email... Is user registered? " + error);
  }
  else {
    console.log("User's current list of sessions is " + list);
    var newList;
    if (typeof list === undefined || list === null) {
      newList = [];
    }
    else if (typeof list === "object" && list.length === 0) {
      newList = list;
    }
    else if (typeof list === "string") {
      //newList = JSON.stringify(list);
      newList = JSON.parse(list);
    }

    newList.push(session);
    client.hmset(coachName, 'sessions', newList, function(err2, reply) {
      if (err2) {
        console.log("Unable to save booking session " + err2);
      }
      else {
        console.log("Successfully saved booking session " + reply);
      }
    });
  }
  });
}
***/

/***
function retrieveSessions(id) {
  client.hget(id, 'sessions', function(err, sessions) {
    if (err) {
      console.log("Error retrieving student's sessions... Is this a registered email address? " + err);
    }
    else {
      console.log("User's sessions : " + JSON.stringify(sessions));
      return sessions;
    }
  });
  //return null;
}
***/

app.get('/demo', function(req, res) {
  if (!req.user || (!req.user.email && !req.user.name)) {
    console.log("User is missing credentials! " + JSON.stringify(req.user));
    res.redirect('/login');
  }
  else {
    var demoSessionId = '1_MX40NTUzMjMyMn5-MTQ1ODE1NjE0OTAwMn53alJmNVVKK3VHYTd5SzI5aGx3MzhyS3l-UH4';


    //var demoSession = opentok.initSession(process.env.OPENTOK_API_KEY, demoSessionId); 
    var pubToken = opentok.generateToken(demoSessionId, {
          'role' :       'publisher',
          'expireTime' : (new Date().getTime() / 1000)+(7 * 24 * 60 * 60), // in one week
          //'data' :       'name=Johnny'
        });    
    //res.render('OpenTOKDemo', {'apiKey' : process.env.OPENTOK_API_KEY, 'sessionId' : demoSessionId});
    sendStudentSessionID("Austin Lee", "yu.chuan.lee@duke.edu", req.user.name, req.user.email, process.env.ROOT_URL + "/demo/" + demoSessionId + "/" + pubToken);
    //res.render('OpenTOKDemo', {'token': "'" + pubToken + "'"});
    res.render('OpenTOKDemo', {'apiKey' : "'" + process.env.OPENTOK_API_KEY + "'", 'sessionId' : "'" + demoSessionId + "'", 'token': "'" + pubToken + "'"});
  }
});

app.get('/demo/:sessionID/:token', function(req, res) {

  var sessionID = req.params.sessionID;
  var token = req.params.token;
  //sendStudentSessionID("Austin Lee", "yu.chuan.lee@duke.edu", req.user.name, req.user.email, process.enev.ROOT_URL + "/demo/" + sessionID + "/" + pubToken);
  res.render('OpenTOKDemo', {'token': "'" + token + "'"});
  
});







Array.prototype.remove  = function(x) {right = this.splice(this.indexOf(x)); right.shift(); return this.concat(right)};

