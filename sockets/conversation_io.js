var Conversation = require('../models/conversation'),
    Message = require('../models/message'),
    User = require('../models/user'),
    UnreadMarker = require('../models/unread_marker'),
    async = require('async');

exports.config = function(socket){
    socket.on('send_message', function(data) {
        sendMessage(socket, data);
    });

    socket.on('create_conversation', function(data){
        createConversation(socket, data);
    });

    socket.on('mark_as_read', function(conversationId){
        markAsRead(socket, conversationId);
    });
}

function createConversation(socket, data) {
    Conversation.create(
            { 
                topic: data.topic, 
                createdBy: socket.handshake.user.username, 
                groupId: socket.handshake.user.groupId 
            }, 
            function(err, conversation){
                var dataToEmit = { 
                    _id: conversation.id, 
                    topic: conversation.topic, 
                    createdBy: conversation.createdBy 
                };

                socket.emitToGroup('my_new_conversation', dataToEmit);
                socket.broadcastToGroup('new_conversation', dataToEmit);
            }
    );
}

function sendMessage(socket, data){
    async.parallel([
        function(callback){
            Conversation.findById(data.conversationId, function(err, conversation){
                var msg = new Message();
                msg.content = data.content;
                msg.createdBy = socket.handshake.user.username;
                msg.timestamp = data.timestamp;
                conversation.messages.push(msg);
                conversation.save(function(err){
                    var dataToEmit = {
                        content: data.content, 
                        createdBy: socket.handshake.user.username, 
                        conversationId: data.conversationId,
                        timestamp: data.timestamp,
                    };

                    socket.broadcastToGroup('receive_message', dataToEmit);
                    callback(err);
                });
            });
        },
        function(callback){
            saveUnreadMarkers(socket.handshake.user._id, socket.handshake.user.groupId, data.conversationId, callback);
        }
    ]);
};

function saveUnreadMarkers(currentUserId, currentGroupId, conversationId, callback){
    User.find({ _id: { $ne: currentUserId }, groupId: currentGroupId }, function(err, users){
        async.forEach(users, save);

        function save(user, callback){
            UnreadMarker.increaseCounter(user._id, conversationId, callback);
        }

        callback(err);
    });
}

function markAsRead(socket, conversationId){
    UnreadMarker.remove({ conversationId: conversationId, userId: socket.handshake.user._id }).exec();
}