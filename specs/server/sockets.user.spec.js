describe('Sockets', function(){
	'use strict';

    describe('User', function(){
		var userIo, socketMock, testUserId, userMock;

		beforeEach(function(){
			testUserId = new mongo.Types.ObjectId();
			socketMock = {
				joinCollaborationObjectRoom: jasmine.createSpy(),
				joinGroupRoom: jasmine.createSpy(),
				leaveCollaborationObjectRoom: jasmine.createSpy(),
				broadcastToGroup: jasmine.createSpy(),
				emit: jasmine.createSpy(),
				handshake:{
					user: {
						groupId: 'my group',
						_id: testUserId,
					},
				},
			};

			enableMockery();
			userMock = buildMock('../models/user','findById');

			userIo = require('../../lib/sockets/user_io');
		});

		it('handles "user connected" event', function(){
			userIo.userConnected(socketMock);
			expect(socketMock.joinGroupRoom).toHaveBeenCalledWith('my group');
			expect(userMock.findById).toHaveBeenCalled();
			var args = userMock.findById.mostRecentCall.args;
			expect(args[0]).toEqual(testUserId);
			var callback = args[1];
			callback(null, { id: '123', firsName: 'New', lastName: 'User' });
			expect(socketMock.broadcastToGroup).toHaveBeenCalledWith('user_connected', { id: '123', firsName: 'New', lastName: 'User' });
		});

		it('handles "user disconnected" event', function(){
			userIo.userDisconnected(socketMock);
			expect(socketMock.broadcastToGroup).toHaveBeenCalledWith('user_disconnected', testUserId);
		});

		it('handles a request for online users', function(){
			var sockets = {
				groupClients: jasmine.createSpy().andReturn([
					{ 
						handshake:{
							user: {
								_id: 1,
							},
						},
					},
					{ 
						handshake:{
							user: {
								_id: 2,
							},
						},
					},
				]),
			};

			userIo.requestOnlineUsers(socketMock, sockets);
			expect(sockets.groupClients).toHaveBeenCalledWith('my group');
			expect(socketMock.emit).toHaveBeenCalledWith('receive_online_users', [ 1, 2 ]);
		});

		it('subscribes user to collaboration objectss', function(){
			var collaborationObjects = [ new mongo.Types.ObjectId(), new mongo.Types.ObjectId() ];
			userIo.subscribeToCollaborationObjects(socketMock, collaborationObjects);

			expect(socketMock.joinCollaborationObjectRoom).toHaveBeenCalledWith(collaborationObjects[0]);
			expect(socketMock.joinCollaborationObjectRoom).toHaveBeenCalledWith(collaborationObjects[1]);
		});

		it('unsubscribe user from collaboration objects notifications', function(){
			userIo.unsubscribeToCollaborationObject(socketMock, 'object-id');
			expect(socketMock.leaveCollaborationObjectRoom).toHaveBeenCalledWith('object-id');
		});

		describe('is active session', function(){
			var rightNow;

			beforeEach(function(){
				rightNow = new Date();
			});

			it('true if expires time is the same as the current time', function(){
				socketMock.handshake.session = {
					cookie: {
						_expires: rightNow,
					}
				};
				
				spyOn(global, 'Date').andReturn(rightNow);
				expect(userIo.isSessionActive(socketMock)).toBe(true);
			});

			it('false when the expires time is less than the current time', function(){
				var beforeNow = new Date();
				beforeNow.setTime(rightNow.getTime() - 1);

				socketMock.handshake.session = {
					cookie: {
						_expires: beforeNow,
					}
				};

				spyOn(global, 'Date').andReturn(rightNow);
				expect(userIo.isSessionActive(socketMock)).toBe(false);
			});

			it('true if expires time is more than current time', function(){
				var afterNow = new Date();
				afterNow.setTime(rightNow.getTime() + 1);

				socketMock.handshake.session = {
					cookie: {
						_expires: afterNow,
					}
				};

				spyOn(global, 'Date').andReturn(rightNow);
				expect(userIo.isSessionActive(socketMock)).toBe(true);
			});
		});
	});
});