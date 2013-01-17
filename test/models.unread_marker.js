var UnreadMarker = require('../models/unread_marker');

describe('Unread Marker', function() {

	describe('#required fields', function() {
		var unreadData;

		beforeEach(function() {
			unreadData = { 
				conversationId: new mongo.Types.ObjectId(), 
				userId: new mongo.Types.ObjectId(),
				count: 123
			};
		});

		function requiredFieldTest(field, done) {
			unreadData[field] = null;
			UnreadMarker.create(unreadData, function(err) {
				checkRequiredFieldError(err, field);
				done();
			});
		};

		it('conversationId', function(done) {
			requiredFieldTest('conversationId', done);
		});

		it('userId', function(done) {
			requiredFieldTest('userId', done);
		});

		it('count', function(done) {
			requiredFieldTest('count', done);
		});
	});
});