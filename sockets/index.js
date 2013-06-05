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
      socket.broadcastToConversationMembers = broadcastToConversationMembers;
      socket.joinConversationRoom = joinConversationRoom;
      socket.leaveConversationRoom = leaveConversationRoom;
      socket.joinGroupRoom = joinGroupRoom;
      socket.leaveGroupRoom = leaveGroupRoom;
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

      socket.on('subscribe_to_conversations', function(conversations){
        userIo.subscribeToConversations(socket, conversations);
      });

      socket.on('unsubscribe_to_conversation', function(conversationId){
        userIo.unsubscribeToConversation(socket, conversationId);
      });

      socket.whenUser('add_to_desktop', desktopIo.addConversation);
      socket.whenUser('remove_from_desktop', desktopIo.removeConversation);
      socket.whenUser('update_strip_order', desktopIo.updateStripOrder);
      socket.whenUser('read_next_messages', conversationIo.readMessages);

      socket.whenUser('send_message', function(data, confirm) {
        conversationIo.sendMessage(socket, data, confirm);
      });

      socket.whenUser('create_conversation', function(data){
        conversationIo.createConversation(socket, io.sockets, data);
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
  this.in('g-' + this.handshake.user.groupId).broadcast.emit(event, data);
}

function broadcastToConversationMembers(event, conversationId, data){
  this.in('c-' + conversationId).broadcast.emit(event, data);
}

function joinConversationRoom(conversationId){
  this.join('c-' + conversationId);
}

function leaveConversationRoom(conversationId){
  this.leave('c-' + conversationId);
}

function joinGroupRoom(groupId){
  this.join('g-' + groupId);
}

function leaveGroupRoom(groupId){
  this.leave('g-' + groupId);
}

function whenUser(event, callback){
  var socket = this;

  socket.on(event, function(data, confirm){
    socket.handshake.session.touch();
    callback(data, confirm);
  });
}