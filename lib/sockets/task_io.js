'use strict';

module.exports = (function (){
    var TaskList = require('../models/task_list'),
        Task = require('../models/task'),
    	log = require('../common/log'),
        self = {};

    self.createTaskList = function(socket, data){
    	var taskListData = {
    		private: data.private,
    		createdById: socket.handshake.user._id,
    		groupId: socket.handshake.user.groupId,
    		name: data.name
    	};

    	TaskList.create(taskListData, function(err, list){
    		if(err){
    			log.error('Error creating task list', err);
    		}

    		socket.emit('task_list_created', list);
    	});
    };

    self.addTask = function(socket, data){
    	var taskData = {
    		complete: false,
    		createdById: socket.handshake.user._id,
    		taskListId: data.taskListId,
    		description: data.description
    	};
        console.log('here')
    	Task.create(taskData, function(err, task){
    		if(err){
    			log.error('Error creating task', err);
    		}

    		socket.emit('task_created', task);
    	});
    };

    return self; 
})();

