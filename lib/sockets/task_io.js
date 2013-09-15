'use strict';

module.exports = (function (){
    var Task = require('../models/task'),
        self = require('./collaboration_object_io');

    self.addTask = function(socket, offlineNotification, data, confirm){
    	function save(callback){
            Task.create({
                createdById: socket.handshake.user._id,
                collaborationObjectId: data.collaborationObjectId,
                description: data.description,
                timestamp: data.timestamp
            }, callback);
        }

        self.sendItem(socket, offlineNotification, data, save, confirm);
    };

    return self; 
})();

