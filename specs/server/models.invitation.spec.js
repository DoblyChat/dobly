describe("Invitation", function() {
	'use strict';

	var Invitation = require('../../lib/models/invitation');

	var invitation;

	beforeEach(function(done) {
		Invitation.create({ 
			email: 'z@x.com', 
			groupId: new mongo.Types.ObjectId, 
			invitedByUserId: new mongo.Types.ObjectId
		}, function(err, testInvitation) {
			invitation = testInvitation;
			expect(invitation._id).not.toBeNull();
			done(err);
		});
	});

	afterEach(function(done) {
		invitation.remove(done);
	});

	describe('#required fields', function() {
		
		function requiredFieldTest(field, done) {
			invitation[field] = null;
			Invitation.create(invitation, function(err) {
				checkRequiredFieldError(err, field);
				done();
			});
		}

		it('email', function(done) {
			requiredFieldTest('email', done);
		});

		it('groupId', function(done) {
			requiredFieldTest('groupId', done);
		});

		it('invitedByUserId', function(done){
			requiredFieldTest('invitedByUserId', done);
		});
	});

	describe("#email", function() {
		it("is lowercased", function(done) {
			var testEmail = 'ABCdef@CIA.com';
		  	Invitation.create({ 
		  		email: testEmail, 
		  		groupId: new mongo.Types.ObjectId, 
		  		invitedByUserId: new mongo.Types.ObjectId
		  	}, function(err, testInvitation) {
		  		expect(testInvitation.email).toEqual(testEmail.toLowerCase());
		  		done(err);
		  	});
		});

		it('must be formatted as an email', function(){
			invitation.email = 'not.an.email';

			Invitation.create(invitation, function(err, test){
				expect(err).not.toBeNull();
				expect(err.errors.email.type).toBe('Invalid email');
			});
		});
	});
});