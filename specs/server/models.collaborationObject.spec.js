describe('CollaborationObject', function(){
	'use strict';

	var CollaborationObject = require('../../lib/models/collaboration_object');

	describe('#required fields', function() {
		var collaborationObjectData;

		beforeEach(function () {
			collaborationObjectData = { 
					topic: 'my topic', 
					createdById: new mongo.Types.ObjectId(),
					timestamp: Date.now(),
					groupId: new mongo.Types.ObjectId(),
					type: 'C'
				};
		});

		function requiredFieldTest(field, done) {
			collaborationObjectData[field] = undefined;
			CollaborationObject.create(collaborationObjectData, function(err) {
				checkRequiredFieldError(err, field);
				done();
			});
		}

		it('topic', function(done) {
			requiredFieldTest('topic', done);
		});

		it('createdById', function(done) {
			requiredFieldTest('createdById', done);
		});

		it('timestamp', function(done) {
			requiredFieldTest('timestamp', done);
		});

		it('groupId', function(done) {
			requiredFieldTest('groupId', done);
		});

		it('type', function(done){
			requiredFieldTest('type', done);
		});
	});

	describe('#topic max length', function() {
		var collaborationObjectData;

		beforeEach(function () {
			collaborationObjectData = { 
					createdById: new mongo.Types.ObjectId(),
					timestamp: Date.now(),
					groupId: new mongo.Types.ObjectId(),
					type: 'C'
				};
		});

		afterEach(function(done){
			CollaborationObject.remove({ groupId: collaborationObjectData.groupId }, done);
		});

		it('saves with 499', function(done) {
			collaborationObjectData.topic = stringOfLength(499);
			CollaborationObject.create(collaborationObjectData, done);
		});

		it('saves with 500', function(done) {
			collaborationObjectData.topic = stringOfLength(500);
			CollaborationObject.create(collaborationObjectData, done);
		});

		it('does not save with 501', function(done) {
			collaborationObjectData.topic = stringOfLength(501);
			CollaborationObject.create(collaborationObjectData, function(err) {
				expect(err).not.toBe(null);
				done();
			});
		});
	});

	describe('#updateTopic', function(){
		var collaborationObjectId;

		beforeEach(function(done){
			CollaborationObject.create({
				topic: 'original topic',
				createdById: new mongo.Types.ObjectId(),
				groupId: new mongo.Types.ObjectId(),
				type: 'T'
			}, function(err, collaborationObject){
				collaborationObjectId = collaborationObject._id;
				done(err);
			});
		});

		afterEach(function(done){
			CollaborationObject.findByIdAndRemove(collaborationObjectId, done);
		});

		it('updates topic', function(done){
			CollaborationObject.updateTopic(collaborationObjectId, 'new topic', function(err){
				CollaborationObject.findById(collaborationObjectId, function(err, collaborationObject){
					expect(collaborationObject.topic).toBe('new topic');
					done(err);
				});
			});
		});
	});

	describe('#find allowed collaboration objects', function(){
		var userId, groupId,
			otherUserId, otherGroupId;

		beforeEach(function(done){
			groupId = new mongo.Types.ObjectId();
			userId = new mongo.Types.ObjectId();
			otherGroupId = new mongo.Types.ObjectId();
			otherUserId = new mongo.Types.ObjectId();

			var collaborationObjects = [
				{ topic: 'group and creator', createdById: userId, members: { entireGroup: true, users: [] }, groupId: groupId, type: 'C' },
				{ topic: 'other group', createdById: otherUserId, members: { entireGroup: true, users: []}, groupId: otherGroupId, type: 'C' },
				{ topic: 'same group but no', createdById: otherUserId, members: { entireGroup: false, users: [ otherUserId ] }, groupId: groupId, type: 'C' },
				{ topic: 'same group but yes', createdById: otherUserId, members: { entireGroup: false, users: [ userId ] }, groupId: groupId, type: 'C' },
				{ topic: 'same group, yes, not creator', createdById: otherUserId, members: { entireGroup: true }, groupId: groupId, type: 'C' },
				{ topic: 'creator', createdById: userId, members: { entireGroup: false, users: [] }, groupId: groupId, type: 'C' }
			];

			CollaborationObject.create(collaborationObjects, done);
		});

		afterEach(function(done){
			CollaborationObject.remove({ $or: [ { groupId: groupId }, { groupId: otherGroupId } ] }, done);
		});

		it('sees only allowed collaborationObjects', function(done){
			CollaborationObject.findAllowedCollaborationObjects(groupId, userId, function(err, collaborationObjects){
				expect(collaborationObjects.length).toBe(4);
				contains(collaborationObjects, 'group and creator');
				contains(collaborationObjects, 'same group but yes');
				contains(collaborationObjects, 'same group, yes, not creator');
				contains(collaborationObjects, 'creator');
				done();
			});
		});

		function contains(collaborationObjects, topic){
			var found = false;

			collaborationObjects.forEach(function(collaborationObject){
				if(collaborationObject.topic === topic){
					found = true;
				}
			});

			expect(found).toBe(true);
		}
	});
});