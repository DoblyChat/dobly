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
                    for(var i = 0; i < allSocketsInGroup.length; i++){
                        if(data.selectedMembers.indexOf(allSocketsInGroup[i].handshake.user._id.toString()) >= 0){
                            allSocketsInGroup[i].joinConversationRoom(conversation._id);
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

    self.sendMessage = function(socket, data, confirm){
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
                socket.broadcastToConversationMembers('receive_message', data.conversationId, results[0]);
                confirm(results[0]);  
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
                        User.findExcept(socket.handshake.user._id, socket.handshake.user.groupId, function(err, users){
                            async.each(users, save, function(err){
                                callback(err);
                            });

                            function save(user, saveCallback){
                                UnreadMarker.increaseCounter(user._id, data.conversationId, saveCallback);
                            }
                        });
                    }else{
                        async.each(conversation.members.users, save, function(err){
                            callback(err);
                        });

                        function save(userId, saveCallback){
                            UnreadMarker.increaseCounter(userId, data.conversationId, saveCallback);
                        }
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

