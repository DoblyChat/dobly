var Conversation = require('../../models/conversation'),
	Message = require('../../models/message');

describe('Conversation', function(){
	describe('#required fields', function() {
		var conversationData;

		beforeEach(function () {
			conversationData = { 
					topic: 'my topic', 
					createdBy: 'Pepe',
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

		it('createdBy', function(done) {
			requiredFieldTest('createdBy', done);
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
					createdBy: 'Pepe',
					timestamp: Date.now(),
					groupId: new mongo.Types.ObjectId()
				};
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

	describe('#addMessage', function(){
		var conversation;

		beforeEach(function(done){
			Conversation.create({
				topic: 'add message test',
				groupId: new mongo.Types.ObjectId(),
				createdBy: 'test-user'
			}, function(err, newConversation){
				conversation = newConversation;
				done(err);
			});
		});

		it('adds one message', function(done){
			var msgId = new mongo.Types.ObjectId();

			Conversation.addMessage(conversation._id, msgId, function(err){
				Conversation.findById(conversation._id, function(err, savedConversation){
					expect(savedConversation.messages.length).toBe(1);

					var savedMessageId = savedConversation.messages[0];
					expect(savedMessageId).toEqual(msgId);

					done(err);
				});
			});
		});

		it('adds two messages', function(done){
			var firstId = new mongo.Types.ObjectId();
			var secondId = new mongo.Types.ObjectId();

			Conversation.addMessage(conversation._id, firstId, function(err){
				Conversation.addMessage(conversation._id, secondId, function(err){
					Conversation.findById(conversation._id, function(err, savedConversation){
						expect(savedConversation.messages.length).toBe(2);

						var firstSavedId = savedConversation.messages[0];
						expect(firstSavedId).toEqual(firstId);

						var secondMessageId = savedConversation.messages[1];
						expect(secondMessageId).toEqual(secondId);
						
						done(err);
					});
				});
			});
		});
		
		afterEach(function(done){
			conversation.remove(function(err){
				done(err);
			});
		});
	});
});