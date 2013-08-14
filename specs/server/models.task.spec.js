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
				taskListId: new mongo.Types.ObjectId(),
				description: 'test'
			};
		});

		it('createdById', function(done) {
			requiredFieldTest('createdById', done);
		});		

		it('taskListId', function(done) {
			requiredFieldTest('taskListId', done);
		});

		it('description', function(done) {
			requiredFieldTest('description', done);
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
});