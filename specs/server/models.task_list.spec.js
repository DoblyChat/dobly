describe('Task list', function() {
	'use strict';

	var TaskList = require('../../lib/models/task_list'),
		Task = require('../../lib/models/task');

	describe('#required fields', function() {
		var taskListData;

		function requiredFieldTest(field, done) {
			taskListData[field] = null;
			TaskList.create(taskListData, function(err) {
				checkRequiredFieldError(err, field);
				done();
			});
		}

		beforeEach(function(){
			taskListData = {
				private: true,
				createdById: new mongo.Types.ObjectId(),
				groupId: new mongo.Types.ObjectId(),
				name: 'test'
			};
		});

		it('createdById', function(done) {
			requiredFieldTest('createdById', done);
		});		

		it('groupId', function(done) {
			requiredFieldTest('groupId', done);
		});

		it('name', function(done) {
			requiredFieldTest('name', done);
		});
	});

	describe('#default values', function(){
		it('defaults private to false', function(){
			var list = new TaskList();
			expect(list.private).toBe(false);
		});
	});

	describe('#remove', function(){
		var taskList, createdById;

		beforeEach(function(done){
			var groupId = new mongo.Types.ObjectId();
			createdById = new mongo.Types.ObjectId();

			TaskList.create({ createdById: createdById, groupId: groupId, name: 'test'}, function(err, aTaskList){
				taskList = aTaskList;
				done();
			});
		});

		it('removes all tasks associated with task list', function(done){
			Task.create([
					{ description: 'task 1', createdById: createdById, taskListId: taskList._id },
					{ description: 'task 2', createdById: createdById, taskListId: taskList._id }
				], 
				function(err){
					taskList.remove(function(err){
						Task.count({ taskListId: taskList._id }, function(err, count){
							expect(count).toBe(0);
							done();
						});
					});
				});
		});

		afterEach(function(done){
			taskList.remove(done);
		});
	});
});