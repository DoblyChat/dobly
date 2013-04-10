var Conversation = require('../models/conversation'),
	Message = require('../models/message');

describe('Conversation', function(){

	describe('#lastMessages', function(){
		var conversation;

		beforeEach(function(){
			conversation = new Conversation();
		});

		it('returns the last two messages', function(){
			conversation.messages.push(new Message({ content: 'First in', timestamp: new Date(2012, 12, 11) }));
			conversation.messages.push(new Message({ content: 'Second in', timestamp: new Date(2012, 12, 12) }));
			conversation.messages.push(new Message({ content: 'Last in', timestamp: new Date(2012, 12, 13) }));

			var lastMessages = conversation.lastMessages;
			expect(lastMessages.length).toBe(2);
			expect(lastMessages[0].content).toBe('Second in');
			expect(lastMessages[1].content).toBe('Last in');
		});

		it('returns only one message', function(){
			conversation.messages.push(new Message({ content: 'Last in' }));
			var lastMessages = conversation.lastMessages;
			expect(lastMessages.length).toBe(1);
			expect(lastMessages[0].content).toBe('Last in');
		});

		it('returns no messages', function(){
			var lastMessages = conversation.lastMessages;
			expect(lastMessages.length).toBe(0);
		});

		afterEach(function(){
			conversation.messages = [];
		});
	});

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
});