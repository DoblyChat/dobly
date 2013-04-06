var Message = require('../models/message');

describe('Message', function() {
	describe('#required fields', function() {

		var messageData;

		beforeEach(function() {
			messageData = { content: 'hi there', createdBy: 'creator', timestamp: Date.now() }
		});

		function requiredFieldTest(field, done) {
			messageData[field] = null;
			Message.create(messageData, function(err) {
				checkRequiredFieldError(err, field);
				done();
			});
		};

		it('content', function(done) {
			requiredFieldTest('content', done);
		});		

		it('createdBy', function(done) {
			requiredFieldTest('createdBy', done);
		});

		it('timestamp', function(done) {
			requiredFieldTest('timestamp', done);
		});
	});

	describe('#content max length', function() {
		var messageData;

		beforeEach(function() {
			messageData = { content: 'hi there', createdBy: 'creator', timestamp: Date.now() }
		});

		it('saves with 1999', function(done) {
			messageData.content = stringOfLength(1999);
			Message.create(messageData, done);
		});

		it('saves with 2000', function(done) {
			messageData.content = stringOfLength(2000);
			Message.create(messageData, done);
		});

		it('does not save with 2001', function(done) {
			messageData.content = stringOfLength(2001);
			Message.create(messageData, function(err) {
				expect(err).not.toBe(null);
				done();
			});
		});
	});
});