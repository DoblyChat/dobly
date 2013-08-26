define(['knockout', 'client/tasklist.model'], function(ko, createTaskList){
	'use strict';
	return function(){
		var self = {},
			loaded = false;

		self.load = function(){
			if(!loaded){
				app.socket.emit('request_task_lists');
			}
		};

		self.lists = ko.observableArray();
		self.openList = ko.observable();

		function openFirst(){
			var taskList = self.lists()[0];
			taskList.active(true);
			self.openList(taskList);
		}

		self.newTaskList = ko.observable();

		self.create = function(){
			var data = {
				name: self.newTaskList(),
				forEntireGroup: true,
				selectedMembers: []
			};

			app.socket.emit('create_task_list', data);
		};

		self.open = function(taskList){
			taskList.active(true);
			self.openList(taskList);
		};

		app.socket.on('task_lists', function(lists){
			var length = lists.length;
			for(var i = 0; i < length; i++){
				self.lists.push(createTaskList(lists[i]));
			}
			openFirst();
			loaded = true;
		});

		app.socket.on('task_list_created', function(newList){
			self.lists.push(createTaskList(newList));
			openFirst();
		});

		app.socket.on('task_created', function(newTask){
			ko.utils.arrayFirst(self.lists(), function(list){
				return newTask.taskListId === list.id;
			}).addTask(newTask);
		});

		return self;
	};
});