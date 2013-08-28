describe('Unread Marker', function() {
	'use strict';

	var UnreadMarker = require('../../lib/models/unread_marker');

	describe("#increaseCounter", function(){
		var userId, collaborationObjectId;

		beforeEach(function(){
			userId = new mongo.Types.ObjectId();
			collaborationObjectId = new mongo.Types.ObjectId();
		});

		it('creates a new counter with 1 if none exists', function(done){
			UnreadMarker.increaseCounter(userId, collaborationObjectId, function(err){
				UnreadMarker.findOne({ userId: userId, collaborationObjectId: collaborationObjectId }, function(err, marker){
					expect(marker.count).toBe(1);
					done();
				});
			});
		});

		it('increases an existing counter by 1', function(done){
			UnreadMarker.increaseCounter(userId, collaborationObjectId, function(err){
				UnreadMarker.increaseCounter(userId, collaborationObjectId, function(err){
					UnreadMarker.findOne({ userId: userId, collaborationObjectId: collaborationObjectId }, function(err, marker){
						expect(marker.count).toBe(2);
						done();
					});
				});
			});
		});

		afterEach(function(done){
			UnreadMarker.find({ userId: userId }).remove(function(){
				done();
			});
		});
	});

	describe('#required fields', function() {
		var unreadData;

		beforeEach(function() {
			unreadData = { 
				collaborationObjectId: new mongo.Types.ObjectId(), 
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
		}

		it('collaborationObjectId', function(done) {
			requiredFieldTest('collaborationObjectId', done);
		});

		it('userId', function(done) {
			requiredFieldTest('userId', done);
		});

		it('count', function(done) {
			requiredFieldTest('count', done);
		});
	});

	describe('#remove markers', function(){
		var userId, conversationOne, conversationTwo;

		beforeEach(function(done){
			userId = new mongo.Types.ObjectId();
			conversationOne = new mongo.Types.ObjectId();
			conversationTwo = new mongo.Types.ObjectId();

			UnreadMarker.create([
				{ userId: userId, collaborationObjectId: conversationOne, count: 2 },
				{ userId: userId, collaborationObjectId: conversationTwo, count: 5 }
			], done);
		});

		afterEach(function(done){
			UnreadMarker.remove({ userId: userId }, done);
		});

		it('removes marker for user and conversation', function(done){
			UnreadMarker.removeMarkers(userId, conversationOne, function(err){
				UnreadMarker.find({ userId: userId }, function(err, markers){
					expect(markers.length).toBe(1);
					expect(markers[0].collaborationObjectId.toString()).toBe(conversationTwo.toString());
					done(err);
				});
			});
		});
	});
});