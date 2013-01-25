var UnreadMarker = require('../models/unread_marker');

describe('Unread Marker', function() {

	describe("#increaseCounter", function(){
		var userId, conversationId;

		beforeEach(function(){
			userId = new mongo.Types.ObjectId();
			conversationId = new mongo.Types.ObjectId();
		});

		it('creates a new counter with 1 if none exists', function(done){
			UnreadMarker.increaseCounter(userId, conversationId, function(err){
				UnreadMarker.findOne({ userId: userId, conversationId: conversationId }, function(err, marker){
					marker.count.should.eql(1);
					done();
				});
			});
		});

		it('increases an existing counter by 1', function(done){
			UnreadMarker.increaseCounter(userId, conversationId, function(err){
				UnreadMarker.increaseCounter(userId, conversationId, function(err){
					UnreadMarker.findOne({ userId: userId, conversationId: conversationId }, function(err, marker){
						marker.count.should.eql(2);
						done();
					});
				});
			});
		});

		afterEach(function(done){
			UnreadMarker.find({ userId: userId }).remove(function(){
				done();
			})
		})
	});

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