define(['client/collaboration-object', 'client/task'], function(createCollaborationObject, createTask){
	'use strict';

	return function(data){
		var self = createCollaborationObject(data, 'task-list-template');

		self.init(createTask);

		function sendTaskToServer(taskData, taskObj){
			app.socket.emit('add_task', taskData, function(task){
                taskObj.id(task._id);
            });
		}

		self.addTask = self.addNewItem(createTask, sendTaskToServer);

		return self;
	}
});