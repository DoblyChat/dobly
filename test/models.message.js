var Message = require('../models/message');

describe('Message', function() {
	describe('#required fields', function() {

		var messageData;

		beforeEach(function() {
			messageData = { createdBy: 'creator', timestamp: Date.now() }
		});

		function requiredFieldTest(field, done) {
			messageData[field] = null;
			Message.create(messageData, function(err) {
				checkRequiredFieldError(err, field);
				done();
			});
		};

		it('createdBy', function(done) {
			requiredFieldTest('createdBy', done);
		});

		it('timestamp', function(done) {
			requiredFieldTest('timestamp', done);
		});
	});
});