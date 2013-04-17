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
        userIo = require('./user_io'),
        desktopIo = require('./desktop_io'),
        authorize = require('./authorize_io');

    io.set('authorization', function (data, accept) {
        authorize(data, accept, sessionStore);
    });

    io.sockets.on('connection', function (socket) {
      socket.broadcastToGroup = broadcastToGroup;
      socket.whenUser = whenUser;

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

      socket.whenUser('send_message', function(data, confirm) {
        conversationIo.sendMessage(socket, data, confirm);
      });

      socket.whenUser('create_conversation', function(data){
        conversationIo.createConversation(socket, data);
      });

      socket.whenUser('mark_as_read', function(conversationId){
        conversationIo.markAsRead(socket, conversationId);
      });

      socket.whenUser('update_topic', function(data){
        conversationIo.updateTopic(data);
      });
    });
};

function broadcastToGroup(event, data){
  this.in(this.handshake.user.groupId).broadcast.emit(event, data);
}

function whenUser(event, callback){
  this.on(event, function(data, confirm){
    this.handshake.session.touch();
    callback(data, confirm);
  });
}