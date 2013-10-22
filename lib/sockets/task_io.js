'use strict';

module.exports = (function (){
    var Task = require('../models/task'),
        self = require('./base_collaboration_object_io'),
        log = require('../common/log');

    self.add = function(socket, sockets, data, confirm){
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

    self.complete = function(socket, data){
        Task.update({ _id: data.id }, { isComplete: true, completedOn: Date.now() }, function(err){
            if(err) {
                log.error(err, 'Error completing a task.');
            }

            socket.broadcastToCollaborationObjectMembers('task_completed', data);
        });
    };

    return self; 
})();

