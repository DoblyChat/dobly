describe('Conversation', function(){
	var Conversation = require('../../models/conversation'),
		Message = require('../../models/message');

	describe('#required fields', function() {
		var conversationData;

		beforeEach(function () {
			conversationData = { 
					topic: 'my topic', 
					createdById: new mongo.Types.ObjectId(),
					timestamp: Date.now(),
					groupId: new mongo.Types.ObjectId()
				};
		});

		function requiredFieldTest(field, done) {
			conversationData[field] = undefined;
			Conversation.create(conversationData, function(err) {
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
	});

	describe('#topic max length', function() {
		var conversationData;

		beforeEach(function () {
			conversationData = { 
					createdById: new mongo.Types.ObjectId(),
					timestamp: Date.now(),
					groupId: new mongo.Types.ObjectId()
				};
		});

		afterEach(function(done){
			Conversation.remove({ groupId: conversationData.groupId }, done);
		});

		it('saves with 499', function(done) {
			conversationData.topic = stringOfLength(499);
			Conversation.create(conversationData, done);
		});

		it('saves with 500', function(done) {
			conversationData.topic = stringOfLength(500);
			Conversation.create(conversationData, done);
		});

		it('does not save with 501', function(done) {
			conversationData.topic = stringOfLength(501);
			Conversation.create(conversationData, function(err) {
				expect(err).not.toBe(null);
				done();
			});
		});
	});

	describe('#updateTopic', function(){
		var conversationId;

		beforeEach(function(done){
			Conversation.create({
				topic: 'original topic',
				createdById: new mongo.Types.ObjectId(),
				groupId: new mongo.Types.ObjectId()
			}, function(err, conversation){
				conversationId = conversation._id;
				done(err);
			});
		});

		afterEach(function(done){
			Conversation.findByIdAndRemove(conversationId, done);
		});

		it('updates topic', function(done){
			Conversation.updateTopic(conversationId, 'new topic', function(err){
				Conversation.findById(conversationId, function(err, conversation){
					expect(conversation.topic).toBe('new topic');
					done(err);
				});
			});
		});
	});

	describe('#find allowed conversations', function(){
		var userId, groupId,
			otherUserId, otherGroupId;

		beforeEach(function(done){
			groupId = new mongo.Types.ObjectId();
			userId = new mongo.Types.ObjectId();
			otherGroupId = new mongo.Types.ObjectId();
			otherUserId = new mongo.Types.ObjectId();

			var conversations = [
				{ topic: 'group and creator', createdById: userId, members: { entireGroup: true, users: [] }, groupId: groupId },
				{ topic: 'other group', createdById: otherUserId, members: { entireGroup: true, users: []}, groupId: otherGroupId },
				{ topic: 'same group but no', createdById: otherUserId, members: { entireGroup: false, users: [ otherUserId ] }, groupId: groupId },
				{ topic: 'same group but yes', createdById: otherUserId, members: { entireGroup: false, users: [ userId ] }, groupId: groupId },
				{ topic: 'same group, yes, not creator', createdById: otherUserId, members: { entireGroup: true }, groupId: groupId },
				{ topic: 'creator', createdById: userId, members: { entireGroup: false, users: [] }, groupId: groupId }
			];

			Conversation.create(conversations, done);
		});

		afterEach(function(done){
			Conversation.remove({ $or: [ { groupId: groupId }, { groupId: otherGroupId } ] }, done);
		});

		it('sees only allowed conversations', function(done){
			Conversation.findAllowedConversations(groupId, userId, function(err, conversations){
				expect(conversations.length).toBe(4);
				contains(conversations, 'group and creator');
				contains(conversations, 'same group but yes');
				contains(conversations, 'same group, yes, not creator');
				contains(conversations, 'creator');
				done();
			});
		});

		function contains(conversations, topic){
			var found = false;

			conversations.forEach(function(conversation){
				if(conversation.topic === topic){
					found = true;
				}
			});

			expect(found).toBe(true);
		}
	});
});