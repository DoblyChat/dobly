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
});