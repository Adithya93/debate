OPENTOK_API_KEY='45532322';
OPENTOK_API_SECRET='5bdfc52f6b05bd0b3f8b8a5489745a50eb292fd7';

var OpenTok = require('opentok');
console.log("Type of OpenTok : " + typeof OpenTok);
var opentok = OpenTok(OPENTOK_API_KEY, OPENTOK_API_SECRET);

if (opentok === undefined || opentok === null) {
	console.log("Unable to initialize OpenTok object! Check API Key & Secret.");
}

else {
	opentok.createSession(function(err, session) {
		if (err) {
			console.log("Error creating Open Tok Session from OpenTok object!");
		}
		else {
			console.log("Successfully created sesssion! ID is " + session.sessionId);
		}
	});
}