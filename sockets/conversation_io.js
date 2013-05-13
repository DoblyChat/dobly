module.exports = (function(){
    var Conversation = require('../models/conversation'),
        Message = require('../models/message'),
        User = require('../models/user'),
        UnreadMarker = require('../models/unread_marker'),
        async = require('async'),
        self = {};

    self.createConversation = function(socket, data) {
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
                        socket.emit('my_new_conversation', conversation);
                        socket.broadcastToGroup('new_conversation', conversation);    
                    }
                }
        );
    };

    self.sendMessage = function(socket, data, confirm){
        async.parallel([
            function(callback){
                saveMessage(callback);
            },
            function(callback){
                saveUnreadMarkers(callback);
            }
        ], 
        function(err){
            if(err){
                console.error('Error sending message', err);
            }else{
                var dataToEmit = {
                    content: data.content, 
                    createdBy: socket.handshake.user.username, 
                    conversationId: data.conversationId,
                    timestamp: data.timestamp,
                };

                socket.broadcastToGroup('receive_message', dataToEmit);
                confirm();  
            }
        });

        function saveMessage(callback){
            Message.create(
            {
                content: data.content,
                createdBy: socket.handshake.user.username,
                timestamp: data.timestamp,
                conversationId: data.conversationId
            }, callback);
        }

        function saveUnreadMarkers(callback){
            User.findExcept(socket.handshake.user._id, socket.handshake.user.groupId, function(err, users){
                async.each(users, save);

                function save(user, saveCallback){
                    UnreadMarker.increaseCounter(user._id, data.conversationId, saveCallback);
                }

                callback(err);
            });
        }
    };

    self.markAsRead = function(socket, conversationId){
        UnreadMarker.removeMarkers(socket.handshake.user._id, conversationId, function(err){
            if(err){
                console.error('Error marking as read', err);
            }
        });
    };

    self.updateTopic = function(data){
        Conversation.updateTopic(data.conversationId, data.newTopic, function(err){
            if(err){
                console.error('Error updating topic', err);
            }
        });
    };

    self.readMessages = function(data, confirm){
        Message.readMessagesByPage(data.conversationId, data.page, function(err, messages){
            if(err){
                console.error('Error loading more messages', err);
            }else{
                confirm(messages);                            
            }
        });
    };

    return self;
})();

