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

    socket.on('update_topic', function(data){
        updateTopic(data);
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
                if(err){
                    console.error('Error creating conversation', err);
                }else{
                    var dataToEmit = { 
                        _id: conversation.id, 
                        topic: conversation.topic, 
                        createdBy: conversation.createdBy 
                    };

                    socket.emitToGroup('my_new_conversation', dataToEmit);
                    socket.broadcastToGroup('new_conversation', dataToEmit);    
                }
            }
    );
}

function sendMessage(socket, data){
    async.parallel([
        function(callback){
            saveMessage(callback);
        },
        function(callback){
            saveUnreadMarkers(callback);
        }
    ], 
    function(err, dataToEmit){
        if(err){
            console.error('Error sending message', err);
        }else{
            socket.broadcastToGroup('receive_message', dataToEmit);    
        }
    });

    function saveMessage(callback){
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
                callback(err, dataToEmit);
            });
        });
    }

    function saveUnreadMarkers(callback){
        User.find({ _id: { $ne: socket.handshake.user._id }, groupId: socket.handshake.user.groupId }, function(err, users){
            async.each(users, save);

            function save(user, callback){
                UnreadMarker.increaseCounter(user._id, data.conversationId, callback);
            }

            callback(err);
        });
    }
};


function markAsRead(socket, conversationId){
    UnreadMarker.remove({ conversationId: conversationId, userId: socket.handshake.user._id }, function(err){
        if(err){
            console.error('Error marking as read', err);
        }
    });
}

function updateTopic(data){
    Conversation.update({ _id: data.conversationId }, { topic: data.newTopic }, function(err){
        if(err){
            console.error('Error updating topic', err);
        }
    });
}