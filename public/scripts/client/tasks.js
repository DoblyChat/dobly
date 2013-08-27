define(['knockout', 'client/common', 'client/taskList.model'], function(ko, common, createTaskList){
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
		self.showTasks = ko.observable(true);
		self.showCreateTask = ko.observable(false);

		function openFirst(){
			var taskList = self.lists()[0];
			taskList.active(true);
			self.openList(taskList);
		}

		self.open = function(taskList){
			if(self.openList()) self.openList().active(false);
			taskList.active(true);
			self.openList(taskList);
		};

		self.toggle = function(){
			self.showTasks(!self.showTasks());
			self.showCreateTask(!self.showCreateTask());
		};

		self.newTaskList = (function(tasks){
			var newList = {};

			newList.name = ko.observable();
			newList.options = [];
			newList.selectedOptions = ko.observableArray([]);

			newList.create = function(){
				var data = {
					name: newList.name(),
					forEntireGroup: true,
					selectedMembers: []
				};

				app.socket.emit('create_task_list', data);
				newList.name('');
			};

			newList.createOnEnter = function(){
				if (newList.name().length > 0 && common.enterKeyPressed(event)) {
	                newList.create();
	                return false;
	            } else {
	                return true;
	            }
			};

			newList.cancel = function(){
				newList.name('');
				tasks.toggle();
			};

			return newList;

		})(self);

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