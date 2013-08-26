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
		it('defaults members to entire group', function(){
		var list = new TaskList();
			expect(list.members.entireGroup).toBe(false);
		});
	});

	describe('#find allowed', function(){
		var groupId, otherGroupId, userId, otherUserId;

		beforeEach(function(done){
			groupId = new mongo.Types.ObjectId();
			otherGroupId = new mongo.Types.ObjectId();
			userId = new mongo.Types.ObjectId();
			otherUserId = new mongo.Types.ObjectId();

			var taskLists = [	
				{ 
					createdById: userId,
					groupId: groupId,
					name: 'my private',
					members: {
						entireGroup: false
					}
				},
				{
					createdById: userId,
					groupId: groupId,
					name: 'my public',
					members: {
						entireGroup: true
					}
				},
				{
					createdById: userId,
					groupId: groupId,
					name: 'my shared',
					members: {
						entireGroup: false,
						users: [ otherUserId ]					
					}
				},
				{
					createdById: otherUserId,
					groupId: groupId,
					name: 'somebody elses private',
					members: {
						entireGroup: false
					}
				},
				{
					createdById: otherUserId,
					groupId: groupId,
					name: 'somebody elses public',
					members: {
						entireGroup: true
					}
				},
				{
					createdById: otherUserId,
					groupId: groupId,
					name: 'shared with me',
					members: {
						entireGroup: false,
						users: [ userId ]
					}
				},
				{
					createdById: userId,
					groupId: otherGroupId,
					name: 'in another group',
					members: {
						entireGroup: true
					}
				}
			];

			TaskList.create(taskLists, done);
		});

		it('finds users task lists', function(done){
			TaskList.findAllowedTasks(groupId, userId, function(err, taskLists){
				expect(err).toBeNull();
				expect(taskLists.length).toBe(5);
				verifyExists(taskLists, 'my public');
				verifyExists(taskLists, 'my private');
				verifyExists(taskLists, 'my shared');
				verifyExists(taskLists, 'somebody elses public');
				verifyExists(taskLists, 'shared with me');

				done(err);
			});
		});

		it('find other users task lists', function(done){
			TaskList.findAllowedTasks(groupId, otherUserId, function(err, taskLists){
				expect(err).toBeNull();
				expect(taskLists.length).toBe(5);
				verifyExists(taskLists, 'my public');
				verifyExists(taskLists, 'my shared');
				verifyExists(taskLists, 'somebody elses public');
				verifyExists(taskLists, 'somebody elses private');
				verifyExists(taskLists, 'shared with me');

				done(err);
			});
		});

		it('find other groups task lists', function(done){
			TaskList.findAllowedTasks(otherGroupId, userId, function(err, taskLists){
				expect(err).toBeNull();
				expect(taskLists.length).toBe(1);
				verifyExists(taskLists, 'in another group');

				done(err);
			});
		});

		function verifyExists(taskLists, title){
			expect(taskLists.filter(function(taskList){
				return taskList.name === title;
			}).length).toBe(1);
		}

		afterEach(function(done){
			TaskList.remove({ $or: [ { groupId: groupId }, { groupId: otherGroupId } ] }, done);
		});	
	});
});