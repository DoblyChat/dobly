'use strict';

module.exports = (function (){
    var TaskList = require('../models/task_list'),
    	log = require('../common/log'),
        self = {};

    self.readTaskLists = function(socket){
        var user = socket.handshake.user;
        TaskList.findAllowedTasks(user.groupId, user._id, function(err, taskLists){
            if(err){
                log.error('Error reading task lists', err);
            }else{
                socket.emit('task_lists', taskLists);
            }
        });
    };

    self.createTaskList = function(socket, data){
    	var taskListData = {
    		createdById: socket.handshake.user._id,
    		groupId: socket.handshake.user.groupId,
    		name: data.name,
            members: {
                entireGroup: data.forEntireGroup,
                users: data.selectedMembers
            }
    	};

    	TaskList.create(taskListData, function(err, list){
    		if(err){
    			log.error('Error creating task list', err);
    		}else{
                socket.emit('task_list_created', list);
            }
    	});
    };

    self.addTask = function(socket, data){
    	var taskData = {
    		complete: false,
    		createdById: socket.handshake.user._id,
    		taskListId: data.taskListId,
    		description: data.description
    	};

        TaskList.findById(data.taskListId, function(err, taskList){
            if(err){
                log.error('Error finding a task list', err);
            }else{
                taskList.tasks.push(taskData);
                taskList.save(function(err, taskList){
                    if(err){
                        log.error('Error creating a task', err);
                    }else{
                        socket.emit('task_created', taskList.tasks[taskList.tasks.length -1]);
                    }
                });
            }
        });
    };

    return self; 
})();

