module.exports = function authorize(data, accept, sessionStore){
	var User = require('../models/user');

  if (data.headers.cookie) {
        var cookieParser = require('cookie');
        var cookie = cookieParser.parse(data.headers.cookie);
        var sessionID = unescape(cookie['express.sid']);

        sessionStore.load(sessionID, function (err, session) {
            if (err || !session) {
                console.warn('Session not found', err);
                accept('Session not found', false);
            } else {
                User.findById(session.passport.user, function(err, user){
                  if(err || !user){
                    console.error('User not found', err);
                    accept('User not found', false);
                  }else{
                    data.session = session;
                    data.user = user._doc;
                    accept(null, true);  
                  }
                });
            }
        });
    } else {
        accept('No cookie transmitted.', false);
    }
};