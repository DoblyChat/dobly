'use strict';

module.exports = (function(){
	var CollaborationObject = require('../models/collaboration_object'),
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
                        allSocketsInGroup[i].joinCollaborationObjectRoom(object._id);
                    }
                }else{
                    for(var j = 0; j < allSocketsInGroup.length; j++){
                        if(data.selectedMembers.indexOf(allSocketsInGroup[j].handshake.user._id.toString()) >= 0){
                            allSocketsInGroup[j].joinCollaborationObjectRoom(object._id);
                        }
                    }

                    socket.joinCollaborationObjectRoom(object._id);
                }

                object._doc.createdBy = socket.handshake.user.firstName;
                socket.emit('my_new_collaboration_object', object);
                socket.broadcastToCollaborationObjectMembers('new_collaboration_object', object._id, object);      
            }
        });
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

    return self; 
})();