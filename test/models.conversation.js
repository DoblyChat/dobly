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
			lastMessages.length.should.equal(2);
			lastMessages[0].content.should.equal('Second in');
			lastMessages[1].content.should.equal('Last in');
		});

		it('returns only one message', function(){
			conversation.messages.push(new Message({ content: 'Last in' }));
			var lastMessages = conversation.lastMessages;
			lastMessages.length.should.equal(1);
			lastMessages[0].content.should.equal('Last in');
		});

		it('returns no messages', function(){
			var lastMessages = conversation.lastMessages;
			lastMessages.length.should.equal(0);
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
	});
});