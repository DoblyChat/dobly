describe('Socket', function(){
	describe('Configure', function(){
		var socketMock, ioMock, groupSockets,
			conversationIoMock, userIoMock,
			desktopIoMock, authorizeMock,
			sessionStoreMock, config;

		beforeEach(function(){
			ioMock = {
				configure: jasmine.createSpy('configure'),
				set: jasmine.createSpy('set'),
				enable: jasmine.createSpy('enable'),
				sockets: {
					on: jasmine.createSpy('sockets-on'),
				},
			};

			groupSockets = {
				broadcast: {
					emit: jasmine.createSpy('emit'),
				},
			};

			socketMock = (function(){
				var self = {};

				self.on = jasmine.createSpy('socket-on');
				
				self.handshake = {
					user: {
						groupId: 'gru-id',
					},
					session: {
						touch: jasmine.createSpy('touch'),
					},
				};

				self.in = jasmine.createSpy('in').andReturn(groupSockets);

				return self;
			})();

			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../sockets');

			conversationIoMock = buildMock('./conversation_io', 'sendMessage', 'createConversation', 'markAsRead', 'updateTopic', 'readMessages');
			userIoMock = buildMock('./user_io', 'userConnected', 'requestOnlineUsers', 'userDisconnected', 'checkForActiveSession');
			desktopIoMock = buildMock('./desktop_io', 'add', 'remove', 'updateStripOrder');
			authorizeMock = jasmine.createSpy();
			mockery.registerMock('./authorize_io', authorizeMock);
			sessionStoreMock = {};

			config = require('../../sockets').config
		});

		afterEach(function(){
			mockery.disable();
			mockery.deregisterAll();
		});

		it('configures sess settings', function(){
			config(ioMock, sessionStoreMock);
			expect(ioMock.configure).toHaveBeenCalled();
			expect(ioMock.configure.mostRecentCall.args[0]).toBe('production');

			var callback = ioMock.configure.getCallback();
			callback();

			expect(ioMock.set).toHaveBeenCalledWith('transports', ['xhr-polling']);
			expect(ioMock.set).toHaveBeenCalledWith('polling duration', 10);
			expect(ioMock.enable).toHaveBeenCalledWith('browser client minification');
			expect(ioMock.enable).toHaveBeenCalledWith('browser client etag');
			expect(ioMock.enable).toHaveBeenCalledWith('browser client gzip');
			expect(ioMock.set).toHaveBeenCalledWith('log level', 1);
		});

		it('binds authorization', function(){
			config(ioMock, sessionStoreMock);
			expect(ioMock.set.calls.length).toBe(1);
			expect(ioMock.set.mostRecentCall.args[0]).toBe('authorization');
			var callback = ioMock.set.getCallback();
			var accept = jasmine.createSpy('accept');
			var data = jasmine.createSpy('data');

			callback(data, accept);
			expect(authorizeMock).toHaveBeenCalledWith(data, accept, sessionStoreMock);
		});

		describe('on socket connection', function(){
			var socketsOnCallback;

			beforeEach(function(){
				config(ioMock, sessionStoreMock);
				expect(ioMock.sockets.on).toHaveBeenCalled();
				expect(ioMock.sockets.on.mostRecentCall.args[0]).toBe('connection');
				socketsOnCallback = ioMock.sockets.on.getCallback();
				socketsOnCallback(socketMock);
			});

			describe('custom functions', function(){
				it('defines a broadcastToGroup method', function(){
					expect(socketMock.broadcastToGroup).toBeDefined();
					var data = {};
					socketMock.broadcastToGroup('my-event', data);
					expect(groupSockets.broadcast.emit).toHaveBeenCalledWith('my-event', data);
					expect(socketMock.in).toHaveBeenCalledWith('gru-id');
				});

				it('defines a when user method', function(){
					expect(socketMock.whenUser).toBeDefined();
					var callback = jasmine.createSpy();
					socketMock.whenUser('event', callback);

					expect(socketMock.on).toHaveBeenCalled();
					expect(socketMock.on.mostRecentCall.args[0]).toBe('event');

					var onCallback = socketMock.on.getCallback();
					var data = {};
					var confirm = jasmine.createSpy('confirm');
					onCallback(data, confirm);
					expect(socketMock.handshake.session.touch).toHaveBeenCalled();
					expect(callback).toHaveBeenCalledWith(data, confirm);
				});
			});

			it('signals that user connected', function(){
				expect(userIoMock.userConnected).toHaveBeenCalledWith(socketMock);
			});

			describe('binds to events', function(){
				var data, confirm;

				beforeEach(function(){
					data = {};
					confirm = jasmine.createSpy('confirm');
				});

				it('request online users', function(){
					fire('request_online_users');
					expect(userIoMock.requestOnlineUsers).toHaveBeenCalledWith(socketMock, ioMock.sockets);
				});

				it('disconnect', function(){
					fire('disconnect');
					expect(userIoMock.userDisconnected).toHaveBeenCalledWith(socketMock);
				});

				it('ping', function(){
					fire('ping');
					expect(userIoMock.checkForActiveSession).toHaveBeenCalledWith(socketMock);
				});

				it('adds conversation to desktop', function(){
					fire('add_to_desktop');
					expectSessionTouchCalled();
					expect(desktopIoMock.add).toHaveBeenCalledWith(data, confirm);;
				});

				it('removes conversation from desktop', function(){
					fire('remove_from_desktop');
					expectSessionTouchCalled();
					expect(desktopIoMock.remove).toHaveBeenCalledWith(data, confirm);;
				});

				it('updates strip order', function(){
					fire('update_strip_order');
					expectSessionTouchCalled();
					expect(desktopIoMock.updateStripOrder).toHaveBeenCalledWith(data, confirm);;
				});

				it('updates strip order', function(){
					fire('read_next_messages');
					expectSessionTouchCalled();
					expect(conversationIoMock.readMessages).toHaveBeenCalledWith(data, confirm);;
				});

				it('sends message', function(){
					fire('send_message');
					expectSessionTouchCalled();
					expect(conversationIoMock.sendMessage).toHaveBeenCalledWith(socketMock, data, confirm);
				});

				it('creates a conversation', function(){
					fire('create_conversation');
					expectSessionTouchCalled();
					expect(conversationIoMock.createConversation).toHaveBeenCalledWith(socketMock, data);
				});

				it('marks conversation as read', function(){
					fire('mark_as_read');
					expectSessionTouchCalled();
					expect(conversationIoMock.markAsRead).toHaveBeenCalledWith(socketMock, data);
				});

				it('updates topic', function(){
					fire('update_topic');
					expectSessionTouchCalled();
					expect(conversationIoMock.updateTopic).toHaveBeenCalledWith(data);
				});

				function expectSessionTouchCalled(){
					expect(socketMock.handshake.session.touch).toHaveBeenCalled();
				}

				function fire(event){
					for(var i = 0; i < socketMock.on.calls.length; i++){
						if(socketMock.on.calls[i].args[0] === event){
							socketMock.on.calls[i].args[1](data, confirm);
							break;
						}
					}
				}
			});
		});
	});
});