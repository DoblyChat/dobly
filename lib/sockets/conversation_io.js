'use strict';

module.exports = (function(){
    var self = require('./base_collaboration_object_io'),
        Message = require('../models/message');

    self.sendMessage = function(socket, offlineNotification, data, confirm){
        function saveMessage(callback){
            Message.create(
            {
                content: data.content,
                createdById: socket.handshake.user._id,
                timestamp: data.timestamp,
                collaborationObjectId: data.collaborationObjectId
            }, callback);
        }

        self.sendItem(socket, offlineNotification, data, saveMessage, confirm);
    };

    self.readMessages = function(data, confirm){
        Message.readMessagesByPage(data.collaborationObjectId, data.page, function(err, messages){
            if(err){
                console.error('Error loading more messages', err);
            }else{
                confirm(messages);                            
            }
        });
    };

    return self;
})();