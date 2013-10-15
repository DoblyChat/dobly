'use strict';

module.exports = (function (){
    var Task = require('../models/task'),
        self = require('./base_collaboration_object_io');

    self.addTask = function(socket, sockets, data, confirm){
    	function save(callback){
            Task.create({
                createdById: socket.handshake.user._id,
                collaborationObjectId: data.collaborationObjectId,
                content: data.content,
                timestamp: data.timestamp
            }, callback);
        }

        self.sendItem(socket, sockets, data, save, confirm);
    };

    return self; 
})();

