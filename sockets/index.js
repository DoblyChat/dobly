var desktopIo = require('./desktop_io')
  , conversationIo = require('./conversation_io')
  , User = require('../models/user');

exports.config = function(io, sessionStore){
    io.configure(function () { 
      // needed for heroku
      io.set("transports", ["xhr-polling"]); 
      io.set("polling duration", 10);
    });

    // Socket connections
    io.set('authorization', function (data, accept) {
        authorize(data, accept, sessionStore);
    });

    io.sockets.on('connection', function (socket) {
      conversationIo.config(socket);
      desktopIo.config(socket);

      userConnected(socket);

      socket.on('request_online_users', function(){
        requestOnlineUsers(socket, io.sockets)
      });

      socket.on('disconnect', function(){
        userDisconnected(socket);
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

function userConnected(socket){
  socket.broadcast.emit('user_connected', socket.handshake.user._id);
}

function userDisconnected(socket){
  socket.broadcast.emit('user_disconnected', socket.handshake.user._id);
}

function requestOnlineUsers(currentSocket, sockets){
  var connectedUsers = [];
  var socketsArray = sockets.clients();
  for(var i = 0; i < socketsArray.length; i++){
    //if(socketsArray[i].id !== currentSocket.id){
      connectedUsers.push(socketsArray[i].handshake.user._id);
    //}
  }

  currentSocket.emit('receive_online_users', connectedUsers);
}