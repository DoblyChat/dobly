define(['client/collaboration-object', 'client/task'], function(createCollaborationObject, createTask){
	'use strict';

	return function(data){
		var self = createCollaborationObject(data, 'task-list-template');

		self.init(createTask);

		function createNewTask(data){
			var taskObj = createTask(data);
			taskObj.processing(true);

			return taskObj;
		}

		function sendTaskToServer(taskData, taskObj){
			app.socket.emit('add_task', taskData, function(task){
				taskObj.timestamp(task.timestamp);
                taskObj.id(task._id);
                taskObj.processing(false);
            });
		}

		self.addTask = self.addNewItem(createNewTask, sendTaskToServer);


		self.removeTask = function(task){
			if(confirm('Are you sure you would like to remove this task?')){
				self.items.remove(task);

				app.socket.emit('remove_task', {
					id: task.id(),
					collaborationObjectId: self.id
				});
			}
		};

		return self;
	}
});