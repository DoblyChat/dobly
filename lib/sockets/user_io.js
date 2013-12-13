'use strict';

module.exports = (function (){
  var User = require('../models/user'),
      log = require('../common/log'),
      self = {};

  self.userConnected = function(socket){
    socket.joinGroupRoom(socket.handshake.user.groupId);
    User.findById(socket.handshake.user._id, function(err, user) {
      if (err) {
        return log.error(err);
      }else{
        socket.broadcastToGroup('user_connected', user);
      }
    });
  };

  self.userDisconnected = function(socket){
    socket.leaveGroupRoom(socket.handshake.user.groupId);
    socket.broadcastToGroup('user_disconnected', socket.handshake.user._id);
  };

  self.requestOnlineUsers = function(currentSocket, sockets){
    var connectedUsers = [];
    var socketsArray = sockets.groupClients(currentSocket.handshake.user.groupId);
    for(var i = 0; i < socketsArray.length; i++){
        connectedUsers.push(socketsArray[i].handshake.user._id);
    }

    currentSocket.emit('receive_online_users', connectedUsers);
  };

  self.subscribeToCollaborationObjects = function(socket, collaborationObjects){
    for(var i = 0; i < collaborationObjects.length; i++){
      socket.joinCollaborationObjectRoom(collaborationObjects[i]);
    }
  };

  self.unsubscribeToCollaborationObject = function(socket, collaborationObjectId){
    socket.leaveCollaborationObjectRoom(collaborationObjectId);
  };

  self.isSessionActive = function(socket){
    return socket.handshake.session.cookie._expires >= new Date();
  };

  return self;
})();