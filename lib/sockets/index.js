'use strict';

exports.config = function(io, sessionStore){
    
    function config(){
        io.enable('browser client minification');
        io.enable('browser client etag');
        io.enable('browser client gzip');
        io.set('log level', 1);  
    }

    io.configure('production', config);
    io.configure('staging', config);

    var conversationIo = require('./conversation_io'),
        collaborationObjectIo = require('./collaboration_object_io'),
        userIo = require('./user_io'),
        desktopIo = require('./desktop_io'),
        taskIo = require('./task_io'),
        authorize = require('./authorize_io');

    io.set('authorization', function (data, accept) {
        authorize(data, accept, sessionStore);
    });

    io.sockets.groupClients = groupClients;
    io.sockets.emitToCollaborationObjectMembers = emitToCollaborationObjectMembers;

    io.sockets.on('connection', function (socket) {
      socket.broadcastToGroup = broadcastToGroup;
      socket.broadcastToCollaborationObjectMembers = broadcastToCollaborationObjectMembers;
      socket.joinCollaborationObjectRoom = joinCollaborationObjectRoom;
      socket.leaveCollaborationObjectRoom = leaveCollaborationObjectRoom;
      socket.joinGroupRoom = joinGroupRoom;
      socket.leaveGroupRoom = leaveGroupRoom;
      socket.whenUser = whenUser;

      userIo.userConnected(socket);

      socket.on('request_online_users', function(){
        userIo.requestOnlineUsers(socket, io.sockets);
      });

      socket.on('disconnect', function(){
        userIo.userDisconnected(socket);
      });

      socket.on('ping', function(){
        if (userIo.isSessionActive(socket)) {
          socket.emit('pong');
        } else {
          socket.emit('timeout');
        }
      });

      socket.on('subscribe_to_collaboration_objects', function(conversations){
        userIo.subscribeToCollaborationObjects(socket, conversations);
      });

      socket.on('unsubscribe_to_collaboration_object', function(conversationId){
        userIo.unsubscribeToCollaborationObject(socket, conversationId);
      });

      socket.whenUser('add_to_desktop', function(data){ 
        desktopIo.addCollaborationObject(socket, data);
      });

      socket.whenUser('remove_from_desktop', function(data){
        desktopIo.removeCollaborationObject(socket, data);
      });
      
      socket.whenUser('update_strip_order', desktopIo.updateStripOrder);
      socket.whenUser('read_next_messages', conversationIo.readMessages);

      socket.whenUser('send_message', function(data, confirm) {
        conversationIo.sendMessage(socket, io.sockets, data, confirm);
      });

      socket.whenUser('add_task', function(data, confirm){
        taskIo.add(socket, io.sockets, data, confirm);
      });

      socket.whenUser('remove_task', function(data, confirm){
        taskIo.remove(socket, data);
      });

      socket.whenUser('toggle_complete_task', function(data, confirm){
        taskIo.toggleComplete(socket, data, confirm);
      });

      socket.whenUser('update_task_content', function(data){
        taskIo.updateContent(socket, data);
      });

      socket.whenUser('assign_task', function(data){
        taskIo.assign(socket, data);
      });

      socket.whenUser('create_collaboration_object', function(data){
        collaborationObjectIo.createCollaborationObject(socket, io.sockets, data);
      });

      socket.whenUser('mark_as_read', function(collaborationObjectId){
        collaborationObjectIo.markAsRead(socket, collaborationObjectId);
      });

      socket.whenUser('update_topic', function(data){
        collaborationObjectIo.updateTopic(data);
      });
    });
};

function broadcastToGroup(event, data){
  this.in('g-' + this.handshake.user.groupId).broadcast.emit(event, data);
}

function joinGroupRoom(groupId){
  this.join('g-' + groupId);
}

function leaveGroupRoom(groupId){
  this.leave('g-' + groupId);
}

function groupClients(groupId){
  return this.clients('g-' + groupId);
}

function emitToCollaborationObjectMembers(event, collaborationObjectId, data) {
  this.in('c' + collaborationObjectId).emit(event, data);
}

function broadcastToCollaborationObjectMembers(event, collaborationObjectId, data){
  this.in('c-' + collaborationObjectId).broadcast.emit(event, data);
}

function joinCollaborationObjectRoom(collaborationObjectId){
  this.join('c-' + collaborationObjectId);
}

function leaveCollaborationObjectRoom(collaborationObjectId){
  this.leave('c-' + collaborationObjectId);
}

function whenUser(event, callback){
  var socket = this;

  socket.on(event, function(data, confirm){
    socket.handshake.session.touch();
    callback(data, confirm);
  });
}