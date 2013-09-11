describe('Message', function() {
	'use strict';

	var Message = require('../../lib/models/message');
	var messageData;

	beforeEach(function() {
		messageData = { 
			content: 'hi there', 
			createdById: new mongo.Types.ObjectId(), 
			timestamp: Date.now(),
			collaborationObjectId: new mongo.Types.ObjectId()
		};
	});
	
	describe('#required fields', function() {
		function requiredFieldTest(field, done) {
			messageData[field] = null;
			Message.create(messageData, function(err) {
				checkRequiredFieldError(err, field);
				done();
			});
		}

		it('content', function(done) {
			requiredFieldTest('content', done);
		});		

		it('createdBy', function(done) {
			requiredFieldTest('createdById', done);
		});

		it('timestamp', function(done) {
			requiredFieldTest('timestamp', done);
		});

		it('collaborationObjectId', function(done){
			requiredFieldTest('collaborationObjectId', done);
		});
	});

	describe('#content max length', function() {
		afterEach(function(done){
			Message.remove({ collaborationObjectId: messageData.collaborationObjectId }, done);
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

	describe('#readMessagesByPage', function(){
		var collaborationObjectId;
		var createdByObjectId;

		beforeEach(function(){
			collaborationObjectId = new mongo.Types.ObjectId();
			createdByObjectId = new mongo.Types.ObjectId();
		});

		afterEach(function(done){
			Message.remove({ collaborationObjectId: collaborationObjectId }, done);
		});

		describe('paging', function(){
			beforeEach(function(done){
				var messagesData = [];

				for(var i = 0; i < 101; i++){
					messagesData.push({
						content: i,
						createdById: createdByObjectId,
						collaborationObjectId: collaborationObjectId,
					});
				}

				Message.create(messagesData, done);
			});

			it('reads the first page of messages', function(done){
				Message.readMessagesByPage(collaborationObjectId, 0, function(err, messages){
					expect(err).toBeNull();
					expect(messages.length).toBe(50);
					done(err);
				});
			});

			it('reads the second page of messages', function(done){
				Message.readMessagesByPage(collaborationObjectId, 1, function(err, messages){
					expect(err).toBeNull();
					expect(messages.length).toBe(50);
					done(err);
				});
			});

			it('reads the third page of messages', function(done){
				Message.readMessagesByPage(collaborationObjectId, 2, function(err, messages){
					expect(err).toBeNull();
					expect(messages.length).toBe(1);
					done(err);
				});
			});

			it('includes message id', function(done) {
				Message.readMessagesByPage(collaborationObjectId, 0, function(err, messages){
					expect(messages[0]._id).not.toBeUndefined();
					expect(messages[0]._id).not.toBeNull();
					done(err);
				});
			});
		});

		describe('sorting', function(){
			it('reads the messages in descending order by date', function(done){
				Message.create([
					{ content: 'some message', createdById: createdByObjectId, collaborationObjectId: collaborationObjectId, timestamp: new Date(2012, 10, 1) },
					{ content: 'some later message', createdById: createdByObjectId, collaborationObjectId: collaborationObjectId, timestamp: new Date(2012, 10, 2) },
					{ content: 'some earlier message', createdById: createdByObjectId, collaborationObjectId: collaborationObjectId, timestamp: new Date(2011, 10, 1) }
				], function(err){
					Message.readMessagesByPage(collaborationObjectId, 0, function(err, messages){
						expect(err).toBeNull();
						expect(messages[0].content).toBe('some later message');
						expect(messages[1].content).toBe('some message');
						expect(messages[2].content).toBe('some earlier message');
						
						done(err);
					});
				});
				
			});
		});
	});
});