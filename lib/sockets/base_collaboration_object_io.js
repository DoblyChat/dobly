'use strict';

module.exports = (function(){
	var CollaborationObject = require('../models/collaboration_object'),
        User = require('../models/user'),
        UnreadMarker = require('../models/unread_marker'),
        async = require('async'),
        offlineNotification = require('../notifications/offline_notification'),
        self = {};

    self.sendItem = function(socket, sockets, data, save, confirm){
        async.parallel([
            save,
            saveUnreadMarkers
        ], 
        function(err, results){
            if(err){
                console.error('Error sending collaboration item', err);
            }else{
                var item = results[0];
                socket.broadcastToCollaborationObjectMembers('receive_message', data.collaborationObjectId, item);
                confirm(item);
                offlineNotification.init(socket, sockets);
                offlineNotification.notify(item);
            }
        });

        function saveUnreadMarkers(callback){
            CollaborationObject.findById(data.collaborationObjectId, function(err, collaborationObject){
                if(err){
                    console.error('Error reading collaboration object for saving unread', err);
                    callback(err);
                }else{
                    if(collaborationObject.members.entireGroup){
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
                            collaborationObject.members.users, 
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

    return self;
})();