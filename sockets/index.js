var desktopIo = require('./desktop_io')
  , conversationIo = require('./conversation_io')
  , User = require('../models/user');

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

    io.set('authorization', function (data, accept) {
        authorize(data, accept, sessionStore);
    });

    io.sockets.on('connection', function (socket) {
      socket.emitToGroup = emitToGroup;
      socket.broadcastToGroup = broadcastToGroup;
      socket.whenUser = whenUser;

      conversationIo.config(socket);
      desktopIo.config(socket);

      userConnected(socket);

      socket.on('request_online_users', function(){
        requestOnlineUsers(socket, io.sockets)
      });

      socket.on('disconnect', function(){
        userDisconnected(socket);
      });

      socket.on('ping', function(){
        checkForActiveSession(socket);
      });
    });
};

function emitToGroup(event, data){
  this.in(this.handshake.user.groupId).emit(event, data);
}

function broadcastToGroup(event, data){
  this.in(this.handshake.user.groupId).broadcast.emit(event, data);
}

function whenUser(event, callback){
  this.handshake.session.touch();
  this.on(event, callback);
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

function userConnected(socket){
  socket.join(socket.handshake.user.groupId);
  socket.broadcastToGroup('user_connected', socket.handshake.user._id);
}

function userDisconnected(socket){
  socket.leave(socket.handshake.user.groupId);
  socket.broadcastToGroup('user_disconnected', socket.handshake.user._id);
}

function requestOnlineUsers(currentSocket, sockets){
  var connectedUsers = [];
  var socketsArray = sockets.clients(currentSocket.groupId);
  for(var i = 0; i < socketsArray.length; i++){
      connectedUsers.push(socketsArray[i].handshake.user._id);
  }

  currentSocket.emit('receive_online_users', connectedUsers);
}

function checkForActiveSession(socket){
  if(socket.handshake.session.cookie._expires < Date.now()){
    socket.emit('timeout');
  }
}