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

    self.toggleComplete = function(socket, data, confirm){
        var completedOn = data.isComplete ? Date.now() : null;

        console.log('in', data);

        Task.update({ _id: data.id }, { isComplete: data.isComplete, completedOn: completedOn }, function(err){
            if(err) {
                log.error(err, 'Error completing or incompleting a task.');
            }

            console.log('up')
            confirm(completedOn);
            socket.broadcastToCollaborationObjectMembers('task_complete_toggled', data.collaborationObjectId, data);
        });
    };

    return self; 
})();

