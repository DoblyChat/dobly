describe('Sockets', function(){
	describe('User', function(){
		var userIo, socketMock;

		beforeEach(function(){
			socketMock = {
				join: jasmine.createSpy(),
				leave: jasmine.createSpy(),
				broadcastToGroup: jasmine.createSpy(),
				emit: jasmine.createSpy(),
				handshake:{
					user: {
						groupId: 'my group',
						_id: 'my id',
					},
				},
			};

			userIo = require('../../sockets/user_io');
		});

		it('handles "user connected" event', function(){
			userIo.userConnected(socketMock);
			expect(socketMock.join).toHaveBeenCalledWith('my group');
			expect(socketMock.broadcastToGroup).toHaveBeenCalledWith('user_connected', 'my id');
		});

		it('handles "user disconnected" event', function(){
			userIo.userDisconnected(socketMock);
			expect(socketMock.leave).toHaveBeenCalledWith('my group');
			expect(socketMock.broadcastToGroup).toHaveBeenCalledWith('user_disconnected', 'my id');
		});

		it('handles a request for online users', function(){
			var sockets = {
				clients: jasmine.createSpy().andReturn([
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
			expect(sockets.clients).toHaveBeenCalledWith('my group');
			expect(socketMock.emit).toHaveBeenCalledWith('receive_online_users', [ 1, 2 ]);
		});

		describe('checks for active sessions', function(){
			var rightNow;

			beforeEach(function(){
				spyOn(console, 'info');
				rightNow = new Date();
			});

			it('does not timeout if expires time is the same as the current time', function(){
				socketMock.handshake.session = {
					cookie: {
						_expires: rightNow,
					}
				};
				
				spyOn(global, 'Date').andReturn(rightNow);
				userIo.checkForActiveSession(socketMock);
				expect(console.info).not.toHaveBeenCalled();
				expect(socketMock.emit).not.toHaveBeenCalled();
			});

			it('timea out when the expires time is less than the current time', function(){
				var beforeNow = new Date();
				beforeNow.setTime(rightNow.getTime() - 1);

				socketMock.handshake.session = {
					cookie: {
						_expires: beforeNow,
					}
				};

				spyOn(global, 'Date').andReturn(rightNow);
				userIo.checkForActiveSession(socketMock);
				expect(console.info).toHaveBeenCalled();
				expect(socketMock.emit).toHaveBeenCalledWith('timeout');
			});

			it('does not time out if expires time is more than current time', function(){
				var afterNow = new Date();
				afterNow.setTime(rightNow.getTime() + 1);

				socketMock.handshake.session = {
					cookie: {
						_expires: afterNow,
					}
				};

				spyOn(global, 'Date').andReturn(rightNow);
				userIo.checkForActiveSession(socketMock);
				expect(console.info).not.toHaveBeenCalled();
				expect(socketMock.emit).not.toHaveBeenCalledWith();
			});
		});
	});
});