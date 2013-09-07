'use strict';

exports.config = function(io, sessionStore){
    
    function config(){
        // needed for heroku
        io.set("transports", ["xhr-polling"]); 
        io.set("polling duration", 10);

        io.enable('browser client minification');
        io.enable('browser client etag');
        io.enable('browser client gzip');
        io.set('log level', 1);  
    }

    io.configure('production', config);
    io.configure('staging', config);

    var conversationIo = require('./conversation_io'),
        userIo = require('./user_io'),
        desktopIo = require('./desktop_io'),
        taskIo = require('./task_io'),
        authorize = require('./authorize_io'),
        offlineNotification = require('../notifications/offline_notification');

    io.set('authorization', function (data, accept) {
        authorize(data, accept, sessionStore);
    });

    io.sockets.groupClients = groupClients;

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
        userIo.checkForActiveSession(socket);
      });

      socket.on('subscribe_to_conversations', function(conversations){
        userIo.subscribeToConversations(socket, conversations);
      });

      socket.on('unsubscribe_to_conversation', function(conversationId){
        userIo.unsubscribeToConversation(socket, conversationId);
      });

      socket.whenUser('add_to_desktop', function(data){ 
        desktopIo.addConversation(socket, data);
      });

      socket.whenUser('remove_from_desktop', function(data){
        desktopIo.removeConversation(socket, data);
      });
      
      socket.whenUser('update_strip_order', desktopIo.updateStripOrder);
      socket.whenUser('read_next_messages', conversationIo.readMessages);

      socket.whenUser('send_message', function(data, confirm) {
        offlineNotification.init(socket, io.sockets);
        conversationIo.sendMessage(socket, offlineNotification, data, confirm);
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

      socket.whenUser('request_task_lists', function(){
        taskIo.readTaskLists(socket);
      });

      socket.whenUser('create_task_list', function(data){
        taskIo.createTaskList(socket, data);
      });

      socket.whenUser('add_task', function(data){
        taskIo.addTask(socket, data);
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

function broadcastToCollaborationObjectMembers(event, conversationId, data){
  this.in('c-' + conversationId).broadcast.emit(event, data);
}

function joinCollaborationObjectRoom(conversationId){
  this.join('c-' + conversationId);
}

function leaveCollaborationObjectRoom(conversationId){
  this.leave('c-' + conversationId);
}

function whenUser(event, callback){
  var socket = this;

  socket.on(event, function(data, confirm){
    socket.handshake.session.touch();
    callback(data, confirm);
  });
}