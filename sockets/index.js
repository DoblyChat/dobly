var desktopIo = require('./desktop_io')
  , conversationIo = require('./conversation_io')
  , User = require('../models/user');

exports.config = function(io, sessionStore){
    // needed for heroku
    io.configure(function () { 
      io.set("transports", ["xhr-polling"]); 
      io.set("polling duration", 10); 
    });

    // Socket connections
    io.set('authorization', function (data, accept) {
        authorize(data, accept, sessionStore);
    });

    io.sockets.on('connection', function (socket) {

      conversationIo.config(socket);

      socket.on('add_to_desktop', function(data){
        desktopIo.add(data);
      });

      socket.on('remove_from_desktop', function(data){
        desktopIo.remove(data);
      });

      socket.on('update_strip_order', function(data){
        desktopIo.updateStripOrder(data);
      });
    });
};

function authorize(data, accept, sessionStore){
	if (data.headers.cookie) {
        var cookieParser = require('cookie');
        var cookie = cookieParser.parse(data.headers.cookie);
        var sessionID = unescape(cookie['express.sid']);

        sessionStore.load(sessionID, function (err, session) {
            if (err || !session) {
                return accept("Can't find session", false);
            } else {
                User.findById(session.passport.user, function(err, user){
                  data.user = user._doc;
                  return accept(null, true);
                });
            }
        });
    } else {
       return accept('No cookie transmitted.', false);
    }
};