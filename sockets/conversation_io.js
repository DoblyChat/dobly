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
        function(err, data){
            if(err){
                console.error('Error sending message', err);
            }else{
                socket.broadcastToGroup('receive_message', data[0]);
                confirm();  
            }
        });

        function saveMessage(callback){
            var msg = new Message();
            msg.content = data.content;
            msg.createdBy = socket.handshake.user.username;
            msg.timestamp = data.timestamp;

            Conversation.addMessage(data.conversationId, msg, function(err){
                var dataToEmit = {
                    content: data.content, 
                    createdBy: socket.handshake.user.username, 
                    conversationId: data.conversationId,
                    timestamp: data.timestamp,
                };
                callback(err, dataToEmit);
            });
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
        UnreadMarker.remove({ conversationId: conversationId, userId: socket.handshake.user._id }, function(err){
            if(err){
                console.error('Error marking as read', err);
            }
        });
    };

    self.updateTopic = function(data){
        Conversation.update({ _id: data.conversationId }, { topic: data.newTopic }, function(err){
            if(err){
                console.error('Error updating topic', err);
            }
        });
    };

    return self;
})();

