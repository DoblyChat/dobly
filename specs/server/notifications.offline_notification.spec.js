describe("Notifications", function() {
	describe("Offline Notification", function() {

		var mandrillWrapperMock, conversationMock, userMock, GroupMock;
		var offlineNotification;

		beforeEach(function() {
			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../notifications/offline_notification');

			mandrillWrapperMock = buildMock('./mandrill_wrapper');
			conversationMock = buildMock('../models/conversation');
			userMock = buildMock('../models/user');
			groupMock = buildMock('../models/group');

			offlineNotification = require('../../notifications/offline_notification');
		});

		afterEach(function(){
			mockery.disable();
			mockery.deregisterAll();
		});

		var Client = {
			init: function(userId) {
				this.handshake = {
					user: {
						_id: userId
					}
				};
			}
		};

		it("init", function() {
			var someUser = {
				email: 'some@user.com',
				groupId: '123'
			};
			var socketStub = {
				handshake: {
					user: someUser
				}
			};
			var socketsStub = {
				groupClients: function(groupId) {
					var clientA = Object.create(Client);
					clientA.init("A");
					var clientB = Object.create(Client);
					clientB.init("B");
					return [ clientA, clientB ];
				}
			};

			offlineNotification.init(socketStub, socketsStub);

			expect(offlineNotification.senderUser).toBe(someUser);
			expect(offlineNotification.onlineUsersIds.length).toBe(2);
			expect(offlineNotification.onlineUsersIds[0]).toEqual("A");
			expect(offlineNotification.onlineUsersIds[1]).toEqual("B");
		});

		
	});
});