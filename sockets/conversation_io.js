module.exports = (function(){
    var Conversation = require('../models/conversation'),
        Message = require('../models/message'),
        User = require('../models/user'),
        UnreadMarker = require('../models/unread_marker'),
        async = require('async'),
        self = {};

    self.createConversation = function(socket, sockets, data) {
        var newConvoData = { 
            topic: data.topic, 
            createdById: socket.handshake.user._id, 
            groupId: socket.handshake.user.groupId,
            members: {
                entireGroup: data.forEntireGroup,
                users: data.selectedMembers
            }
        };

        Conversation.create(newConvoData, function(err, conversation){
            if(err){
                console.error('Error creating conversation', err);
            }else{
                var allSocketsInGroup = sockets.groupClients(socket.handshake.user.groupId);

                if(data.forEntireGroup){
                    for(var i = 0; i < allSocketsInGroup.length; i++){
                        allSocketsInGroup[i].joinConversationRoom(conversation._id);
                    }
                }else{
                    for(var j = 0; j < allSocketsInGroup.length; j++){
                        if(data.selectedMembers.indexOf(allSocketsInGroup[j].handshake.user._id.toString()) >= 0){
                            allSocketsInGroup[j].joinConversationRoom(conversation._id);
                        }
                    }

                    socket.joinConversationRoom(conversation._id);
                }

                conversation._doc.createdBy = socket.handshake.user.name;
                socket.emit('my_new_conversation', conversation);
                socket.broadcastToConversationMembers('new_conversation', conversation._id, conversation);      
            }
        });
    };

    self.sendMessage = function(socket, offlineNotification, data, confirm){
        async.parallel([
            function(callback){
                saveMessage(callback);
            },
            function(callback){
                saveUnreadMarkers(callback);
            }
        ], 
        function(err, results){
            if(err){
                console.error('Error sending message', err);
            }else{
                var message = results[0];
                socket.broadcastToConversationMembers('receive_message', data.conversationId, message);
                confirm(message);
                offlineNotification.notify(message);
            }
        });

        function saveMessage(callback){
            Message.create(
            {
                content: data.content,
                createdBy: socket.handshake.user.name,
                timestamp: data.timestamp,
                conversationId: data.conversationId
            }, callback);
        }

        function saveUnreadMarkers(callback){
            Conversation.findById(data.conversationId, function(err, conversation){
                if(err){
                    console.error('Error reading conversation for saving unread', err);
                    callback(err);
                }else{
                    if(conversation.members.entireGroup){
                        User.findExcept([socket.handshake.user._id], socket.handshake.user.groupId, function(err, users){
                            async.each(
                                users, 
                                function (user, saveCallback){
                                    UnreadMarker.increaseCounter(user._id, data.conversationId, saveCallback);
                                }, 
                                function(err){
                                    callback(err);
                                }
                            );
                        });
                    }else{
                        async.each(
                            conversation.members.users, 
                            function (userId, saveCallback){
                                UnreadMarker.increaseCounter(userId, data.conversationId, saveCallback);
                            },
                            function(err){
                                callback(err);
                            }
                        );  
                    }
                }
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

