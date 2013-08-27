define(['knockout', 'client/common', 'client/task.model'], function(ko, common, createTask){
	'use strict';

	return function(data){
		var self = {};

		self.id = data._id;
		self.creator = data.createdById;
		self.name = data.name;
		self.forEntireGroup = data.members.entireGroup;
		self.users = 'some, users';
		self.active = ko.observable(false);

		self.tasks = ko.observableArray(data.tasks.map(function(task){
			return createTask(task);
		}));

		self.newTask = ko.observable('');

		self.createTask = function(tasklist, event){
			if (self.newTask().length > 0 && common.enterKeyPressed(event)) {
                var data = {
					taskListId: self.id,
					description: self.newTask()
				};

				app.socket.emit('add_task', data);
				self.newTask('');
                return false;
            } else {
                return true;
            }
		};

		self.addTask = function(taskData){
			self.tasks.push(createTask(taskData));
		};

		return self;
	};
});