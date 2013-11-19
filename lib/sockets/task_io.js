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
                timestamp: Date.now()
            }, callback);
        }

        self.sendItem(socket, sockets, data, save, confirm);
    };

    self.remove = function(socket, data){
        Task.remove({ _id: data.id }, function(err){
            if(err){
                log.error(err, 'Error removing task.');
            }else{
                socket.broadcastToCollaborationObjectMembers('task_removed', data.collaborationObjectId, data);
            }
        });
    };

    self.toggleComplete = function(socket, data, confirm){
        var updateValues = {
            isComplete: data.isComplete
        };

        if(data.isComplete){
            updateValues.completedOn  = Date.now();
            updateValues.completedById = socket.handshake.user._id;
        }else{
            updateValues.completedOn = null;
            updateValues.completedById = null;
        }

        Task.update({ _id: data.id }, updateValues, function(err){
            if(err) {
                log.error(err, 'Error completing or incompleting a task.');
            }else{
                var confirmData = {
                    id: data.id,
                    completedOn: updateValues.completedOn,
                    completedById: updateValues.completedById,
                    collaborationObjectId: data.collaborationObjectId,
                    isComplete: data.isComplete
                };

                confirm(confirmData);
                socket.broadcastToCollaborationObjectMembers('task_complete_toggled', data.collaborationObjectId, confirmData);
            }
        });
    };

    self.updateContent = function(socket, data){
        Task.update({ _id: data.id }, { content: data.content }, function(err){
            if(err){
                log.error(err, 'Error updating task content.');
            }else{
                socket.broadcastToCollaborationObjectMembers('task_content_updated', data.collaborationObjectId, data);
            }
        });
    };

    return self; 
})();

