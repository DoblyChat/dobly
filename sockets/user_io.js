module.exports = (function (){
  var self = {};

  self.userConnected = function(socket){
    socket.joinGroupRoom(socket.handshake.user.groupId);
    socket.broadcastToGroup('user_connected', socket.handshake.user._id);
  }

  self.userDisconnected = function(socket){
    socket.leaveGroupRoom(socket.handshake.user.groupId);
    socket.broadcastToGroup('user_disconnected', socket.handshake.user._id);
  }

  self.requestOnlineUsers = function(currentSocket, sockets){
    var connectedUsers = [];
    var socketsArray = sockets.groupClients(currentSocket.handshake.user.groupId);
    for(var i = 0; i < socketsArray.length; i++){
        connectedUsers.push(socketsArray[i].handshake.user._id);
    }

    currentSocket.emit('receive_online_users', connectedUsers);
  };

  self.subscribeToConversations = function(socket, conversations){
    for(var i = 0; i < conversations.length; i++){
      socket.joinConversationRoom(conversations[i]);
    }
  };

  self.unsubscribeToConversation = function(socket, conversationId){
    socket.leaveConversationRoom(conversationId);
  };

  self.checkForActiveSession = function(socket){
    if(socket.handshake.session.cookie._expires < new Date()){
      console.info('Session expired for %s where cookie expired at %s at %s', socket.handshake.user.username, socket.handshake.session.cookie._expires, new Date());
      socket.emit('timeout');
    }
  };

  return self;
})();