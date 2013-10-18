describe('Task', function() {
	'use strict';

	var Task = require('../../lib/models/task');

	describe('#required fields', function() {
		var taskData;

		function requiredFieldTest(field, done) {
			taskData[field] = null;
			Task.create(taskData, function(err) {
				checkRequiredFieldError(err, field);
				done();
			});
		}

		beforeEach(function(){
			taskData = {
				createdById: new mongo.Types.ObjectId(),
				collaboratiobObjectId: new mongo.Types.ObjectId(),
				content: 'test'
			};
		});

		it('createdById', function(done) {
			requiredFieldTest('createdById', done);
		});		

		it('collaborationObjectId', function(done) {
			requiredFieldTest('collaborationObjectId', done);
		});

		it('content', function(done) {
			requiredFieldTest('content', done);
		});

		it('timestamp', function(done) {
			requiredFieldTest('timestamp', done);
		});
	});

	describe('#default values', function(){
		var task;

		beforeEach(function(){
			task = new Task();
		});

		it('defaults complete to false', function(){
			expect(task.complete).toBe(false);
		});

		it('defaults completedOn to nothing', function(){
			expect(task.completedOn).not.toBeDefined();
		});
	});

	describe('reads tasks', function(done){
		var collaborationObjectId, tasksData; 
		var today = new Date();
		var yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		beforeEach(function(done){
			collaborationObjectId = new mongo.Types.ObjectId();
			tasksData = [
				{ 
					createdById: new mongo.Types.ObjectId(),
					collaborationObjectId: collaborationObjectId,
					content: 'test-1',
					timestamp: today
				},
				{ 
					createdById: new mongo.Types.ObjectId(),
					collaborationObjectId: collaborationObjectId,
					content: 'test-2',
					timestamp: yesterday
				}
			];

			Task.create(tasksData, done);
		});

		afterEach(function(done){
			Task.remove({ collaborationObjectId: collaborationObjectId }, done);
		});

		it('reads', function(done){
			Task.readTasks(collaborationObjectId, function(err, tasks){
				expect(err).toBeNull();
				expect(tasks.length).toBe(2);

				var secondTask = tasks[0];
				expect(secondTask.createdById).toEqual(tasksData[1].createdById);
				expect(secondTask.collaborationObjectId).toEqual(collaborationObjectId);
				expect(secondTask.content).toBe(tasksData[1].content);
				expect(secondTask.timestamp).toEqual(tasksData[1].timestamp);
				expect(secondTask._id).not.toBeNull();

				var firstTask = tasks[1];
				expect(firstTask.createdById).toEqual(tasksData[0].createdById);
				expect(firstTask.collaborationObjectId).toEqual(collaborationObjectId);
				expect(firstTask.content).toBe(tasksData[0].content);
				expect(firstTask.timestamp).toEqual(tasksData[0].timestamp);
				expect(firstTask._id).not.toBeNull();	

				done(err);
			});
		});
	});
});