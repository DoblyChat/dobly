'use strict';

module.exports = (function(){
    var self = require('./base_collaboration_object_io'),
        Message = require('../models/message');

    self.sendMessage = function(socket, sockets, data, confirm, callback){
        function saveMessage(callback){
            Message.create({
                content: data.content,
                createdById: socket.handshake.user._id,
                timestamp: Date.now(),
                collaborationObjectId: data.collaborationObjectId
            }, callback);
        }

        self.sendItem(socket, sockets, data, saveMessage, confirm, callback);
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