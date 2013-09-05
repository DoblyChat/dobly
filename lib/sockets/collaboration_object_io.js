'use strict';

module.exports = (function(){
	var CollaborationObject = require('../models/collaboration_object'),
        User = require('../models/user'),
        UnreadMarker = require('../models/unread_marker'),
        async = require('async'),
        self = {};

    self.createCollaborationObject = function(socket, sockets, data) {
        var newObjectData = { 
            type: 'C',
            topic: data.topic, 
            createdById: socket.handshake.user._id, 
            groupId: socket.handshake.user.groupId,
            members: {
                entireGroup: data.forEntireGroup,
                users: data.selectedMembers
            }
        };

        CollaborationObject.create(newObjectData, function(err, object){
            if(err){
                console.error('Error creating collaboration object', err);
            }else{
                var allSocketsInGroup = sockets.groupClients(socket.handshake.user.groupId);

                if(data.forEntireGroup){
                    for(var i = 0; i < allSocketsInGroup.length; i++){
                        allSocketsInGroup[i].joinConversationRoom(object._id);
                    }
                }else{
                    for(var j = 0; j < allSocketsInGroup.length; j++){
                        if(data.selectedMembers.indexOf(allSocketsInGroup[j].handshake.user._id.toString()) >= 0){
                            allSocketsInGroup[j].joinConversationRoom(object._id);
                        }
                    }

                    socket.joinConversationRoom(object._id);
                }

                object._doc.createdBy = socket.handshake.user.name;
                socket.emit('my_new_conversation', conversation);
                socket.broadcastToConversationMembers('new_conversation', object._id, object);      
            }
        });
    };

    self.sendItem = function(socket, offlineNotification, data, save, confirm){
        async.parallel([
            save,
            function(callback){
                saveUnreadMarkers(callback);
            }
        ], 
        function(err, results){
            if(err){
                console.error('Error sending collaboration item', err);
            }else{
                var item = results[0];
                socket.broadcastToConversationMembers('receive_message', data.collaborationObjectId, item);
                confirm(item);
                offlineNotification.notify(item);
            }
        });

        function saveUnreadMarkers(callback){
            CollaborationObject.findById(data.collaborationObjectId, function(err, conversation){
                if(err){
                    console.error('Error reading collaboration object for saving unread', err);
                    callback(err);
                }else{
                    if(conversation.members.entireGroup){
                        User.findExcept([socket.handshake.user._id], socket.handshake.user.groupId, function(err, users){
                            async.each(
                                users, 
                                function (user, saveCallback){
                                    UnreadMarker.increaseCounter(user._id, data.collaborationObjectId, saveCallback);
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
                                UnreadMarker.increaseCounter(userId, data.collaborationObjectId, saveCallback);
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

	self.markAsRead = function(socket, collaborationObjectId){
        UnreadMarker.removeMarkers(socket.handshake.user._id, collaborationObjectId, function(err){
            if(err){
                console.error('Error marking as read', err);
            }
        });
    };

    self.updateTopic = function(data){
        CollaborationObject.updateTopic(data.collaborationObjectId, data.newTopic, function(err){
            if(err){
                console.error('Error updating topic', err);
            }
        });
    };    
})();