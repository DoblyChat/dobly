'use strict';

module.exports = (function(){
	var offlineNotification = require('../notifications/offline_notification'),
        Item = require('../models/item'),
        self = {};

    self.sendItem = function(socket, sockets, data, saveItem, senderConfirmation, callback) {
        function notifyOnlineUsers(item) {
            socket.broadcastToCollaborationObjectMembers('receive_item', data.collaborationObjectId, item);
        }

        function notifyOfflineUsers(item) {
            offlineNotification.init(socket, sockets);
            offlineNotification.notify(item);
        }

        Item.init(socket.handshake.user._id, socket.handshake.user.groupId, data.collaborationObjectId);

        Item.send(
            saveItem, 
            notifyOnlineUsers,
            senderConfirmation,
            notifyOfflineUsers,   
            function(err, item) { 
                if (callback) {
                    callback(err, item);
                }
            });
    };

    return self;
})();