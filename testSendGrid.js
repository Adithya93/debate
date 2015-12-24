var dotenv = require('dotenv');
dotenv.load();
var sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);

/***
var email = new sendgrid.Email();

//var params = {
email.to = ['ra102@duke.edu', 'booyakashabandit@gmail.com'];
//email.setTos(['ra102@duke.edu', 'booyakashabandit@gmail.com']);
//email.addSmtpapiTo('ra102@duke.edu');
//email.addSmtpapiTo('booyakashabandit@gmail.com');
email.from = 'DebateCoaching@noreply.com';
email.subject = 'Booyakasha Bounty';
email.text = 'Check it before you wreck it';
//email.html = '<h1>Big Up Yourself!</h1>';
//email.cc = 'raghu.singapore@gmail.com';
//};
email.addFile({
  cid: 'the_troll',           // should match cid value in html
  path: './public/troll.jpg'
});
email.setHtml('<h1>Big Up Yourself!</h1><div>This guy is a troll<img src = "cid:the_troll"></div>');

email.addFile({
	filename : 'Possible Site Logo',
	url : 'https://upload.wikimedia.org/wikipedia/en/thumb/6/61/Debate_Logo.svg/120px-Debate_Logo.svg.png'
});

sendgrid.send(email, function(err, json) {
	if (err) {
		console.log("Unable to send message : " + err);
	}
	else {
		console.log("Success : " + JSON.stringify(json));
	}
});
***/

var booking = {'studentName' : 'Fatman', 'studentEmail' : 'ra102@duke.edu', 'day' : 'Monday', 'time' : '12 pm', 'status' : 'declined'};
var coachName = 'Blemanche';
var coachEmail = 'rt87@duke.edu';

notifyStudent(coachName, coachEmail, booking);

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
  var html = "<html><head><h1>" + fields.header + " " + booking.studentName + " !</h1>"
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

/***
notifyTutor(coachName, coachEmail, booking);

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
//  + "<link rel = 'stylesheet' href = 'cid:style'></link>" + "<div#siteLogo><img src = 'cid:site_logo'></img></div></head>"
	+ "<link rel = 'stylesheet' href = './public/site_logo.png'></link>" + "<div#siteLogo><img src = 'cid:site_logo'></img></div></head>"
  + "<body><div>You have an appointment request!</div><div#info><p>Name of student : " + booking.studentName + " </p><p>Email : " + booking.studentEmail + " </p>"
  + "<p>Day & Time : " + booking.day + ", " + booking.time + " </p>"
  + "</div></body></html>";
  email.setHtml(html);
  sendgrid.send(email, function(err, json) {
    if (err) {
      console.log("Unable to send email to " + coachName + " : " + err);
    }
    else {
      console.log(JSON.stringify(json));
    }
  });
}
***/