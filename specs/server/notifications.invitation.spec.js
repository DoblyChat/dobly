describe("Notifications", function() {
	'use strict';

	describe("Invitation", function() {
		var mandrillMock, userMock, groupMock, invitationModelMock;
		var invitation;
		var modulePath = '../../lib/notifications/invitation';

		beforeEach(function() {
			mockery.enable({
				useCleanCache: true,
			    warnOnReplace: false,
			    warnOnUnregistered: false
			});

			mandrillMock = buildMock('./mandrill_wrapper', 'send');
			userMock = buildMock('../models/user', 'findById');
			groupMock = buildMock('../models/group', 'findById');
			invitationModelMock = buildMock('../models/invitation', 'create');
		});

		it("sends an email", function(done) {
			var sendCallback = jasmine.createSpy();

			invitationModelMock.create = function(invitationModel, invitationModelCallback) {
				expect(invitationModel.email).toEqual('a@b.com');
				expect(invitationModel.groupId).toEqual('xyz');
				expect(invitationModel.invitedByUserId).toEqual('123');

				process.env.INVITATION_URL = 'http://www.dobly.com/invitation/';
				process.env.HOME_PAGE_URL = 'http://www.dobly.com';

				invitationModelCallback(null, { _id: 'ABC456FEG789' });

				expect(mandrillMock.send).toHaveBeenCalled();
				var args = mandrillMock.send.mostRecentCall.args;
				expect(args[0]).toEqual('Jacob Smith');
				expect(args[1]).toEqual('invitation@dobly.com');
				expect(args[2]).toEqual([ { email : 'a@b.com', name : '' } ]);
				expect(args[3]).toEqual('no-reply@dobly.com');
				expect(args[4]).toEqual('You have been invited to Dobly!');
				expect(args[6]).toEqual(['invitation']);
				var message = 
					newLine('Hi there!') + 
					newLine() + 
					newLine('Jacob Smith invited you to use Dobly. Use the link below to join:') +
					newLine() +
					newLine('http://www.dobly.com/invitation/ABC456FEG789') +
					newLine() +
					newLine('Dobly is a very simple tool to help you work better with your group. Learn more about Dobly at our website:') +
					newLine() +
					newLine('http://www.dobly.com') +
					newLine() + 
					newLine('Cheers,') +
					newLine() +
					newLine('The Dobly Team');
				expect(args[5]).toEqual(message);

				expect(sendCallback).toHaveBeenCalledWith(null);				

				done();
			};

			groupMock.findById = function(groupId, groupCallback) {
				groupCallback(null, { _id: 'xyz' });
			};

			userMock.findById = function(userId, userCallback) {
				userCallback(null, { 
					_id: '123',
					firstName: 'Jacob',
					lastName: 'Smith',
					groupId: 'xyz',
					getFullName: function() { return 'Jacob Smith'}
				});
			};			

			invitation = require(modulePath);

		  	invitation.send('123', ['a@b.com'], sendCallback);
		});

		function newLine(line) {
			if (line) {
				return line + '\r\n';
			} else {
				return '\r\n';
			}
		}

		it("sends two emails", function() {
		  	var asyncMock = buildMock('async','each');
		  	var sendCallback = jasmine.createSpy();

		  	invitation = require(modulePath);		  	

		  	invitation.send('123', ['a@b.com','c@d.com'], sendCallback);

		  	expect(asyncMock.each).toHaveBeenCalled();
		  	var emails = asyncMock.each.mostRecentCall.args[0];
		  	expect(emails[0]).toEqual('a@b.com');
		  	expect(emails[1]).toEqual('c@d.com');

		  	mockery.deregisterMock('async');
		});

		it("handles error", function() {
		  	var sendCallback = jasmine.createSpy();

			userMock.findById = function(userId, userCallback) {
				userCallback('some error', null);
				expect(sendCallback).toHaveBeenCalledWith('some error');
			};			

			invitation = require(modulePath);

		  	invitation.send('123', ['a@b.com'], sendCallback);
		});

		afterEach(function() {
			mockery.disable();
		});
	});
});