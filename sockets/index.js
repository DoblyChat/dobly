var User = require('../models/user');

exports.config = function(io, sessionStore){
    
    io.configure('production', function () { 
      // needed for heroku
      io.set("transports", ["xhr-polling"]); 
      io.set("polling duration", 10);

      io.enable('browser client minification');
      io.enable('browser client etag');
      io.enable('browser client gzip');
      io.set('log level', 1);  
    });

    var conversationIo = require('./conversation_io'),
        UserIo = require('./user_io'),
        DesktopIo = new require('./desktop_io');

    var userIo = new UserIo();
    var desktopIo = new DesktopIo();

    io.set('authorization', function (data, accept) {
        authorize(data, accept, sessionStore);
    });

    io.sockets.on('connection', function (socket) {
      socket.emitToGroup = emitToGroup;
      socket.broadcastToGroup = broadcastToGroup;
      socket.whenUser = whenUser;

      conversationIo.config(socket);

      userIo.userConnected(socket);

      socket.on('request_online_users', function(){
        userIo.requestOnlineUsers(socket, io.sockets)
      });

      socket.on('disconnect', function(){
        userIo.userDisconnected(socket);
      });

      socket.on('ping', function(){
        userIo.checkForActiveSession(socket);
      });

      socket.whenUser('add_to_desktop', desktopIo.add);
      socket.whenUser('remove_from_desktop', desktopIo.remove);
      socket.whenUser('update_strip_order', desktopIo.updateStripOrder);
    });
};

function emitToGroup(event, data){
  this.in(this.handshake.user.groupId).emit(event, data);
}

function broadcastToGroup(event, data){
  this.in(this.handshake.user.groupId).broadcast.emit(event, data);
}

function whenUser(event, callback){
  this.on(event, function(data, confirm){
    this.handshake.session.touch();
    callback(data, confirm);
  });
}

function authorize(data, accept, sessionStore){
	if (data.headers.cookie) {
        var cookieParser = require('cookie');
        var cookie = cookieParser.parse(data.headers.cookie);
        var sessionID = unescape(cookie['express.sid']);

        sessionStore.load(sessionID, function (err, session) {
            if (err || !session) {
                console.warn('Session not found', err);
                accept("Can't find session", false);
            } else {
                User.findById(session.passport.user, function(err, user){
                  if(err || !user){
                    console.error('Error retrieving user', err);
                  }

                  data.session = session;
                  data.user = user._doc;
                  accept(null, true);
                });
            }
        });
    } else {
        accept('No cookie transmitted.', false);
    }
};