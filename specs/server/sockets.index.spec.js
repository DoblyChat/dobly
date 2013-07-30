describe('Socket', function(){
	describe('Configure', function(){
		var socketMock, ioMock, groupSockets,
			conversationIoMock, userIoMock,
			desktopIoMock, authorizeMock,
			sessionStoreMock, config, notificationMock;

		beforeEach(function(){
			ioMock = {
				configure: jasmine.createSpy('configure'),
				set: jasmine.createSpy('set'),
				enable: jasmine.createSpy('enable'),
				sockets: {
					on: jasmine.createSpy('sockets-on'),
					clients: jasmine.createSpy('sockets-clients')
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

				self.join = jasmine.createSpy('join');
				self.leave = jasmine.createSpy('leave');

				self.in = jasmine.createSpy('in').andReturn(groupSockets);

				return self;
			})();

			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../lib/sockets');
			mockery.registerAllowable('../../lib/notifications');

			conversationIoMock = buildMock('./conversation_io', 'sendMessage', 'createConversation', 'markAsRead', 'updateTopic', 'readMessages');
			userIoMock = buildMock('./user_io', 'userConnected', 'requestOnlineUsers', 'userDisconnected', 'checkForActiveSession', 'subscribeToConversations', 'unsubscribeToConversation');
			desktopIoMock = buildMock('./desktop_io', 'addConversation', 'removeConversation', 'updateStripOrder');
			authorizeMock = jasmine.createSpy();
			mockery.registerMock('./authorize_io', authorizeMock);
			sessionStoreMock = {};
			notificationMock = buildMock('../notifications/offline_notification', 'init', 'notify');

			config = require('../../lib/sockets').config;
		});

		afterEach(function(){
			mockery.disable();
			mockery.deregisterAll();
		});

		it('configures production settings', function(){
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

		it('defines group clients custom function', function(){
			config(ioMock, sessionStoreMock);
			expect(ioMock.sockets.groupClients).toBeDefined();
			var clients = [];
			ioMock.sockets.clients.andReturn(clients);
			var result = ioMock.sockets.groupClients('my-g-group');
			expect(ioMock.sockets.clients).toHaveBeenCalledWith('g-my-g-group');
			expect(result).toEqual(clients);
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
					expect(socketMock.in).toHaveBeenCalledWith('g-gru-id');
				});

				it('defines a broadcastToConversationMembers method', function(){
					expect(socketMock.broadcastToConversationMembers).toBeDefined();
					var data = {};
					socketMock.broadcastToConversationMembers('my-event', 'convo-id', data);
					expect(groupSockets.broadcast.emit).toHaveBeenCalledWith('my-event', data);
					expect(socketMock.in).toHaveBeenCalledWith('c-convo-id');
				});

				it('defines a whenUser method', function(){
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

				it('defines a joinConversationRoom method', function(){
					expect(socketMock.joinConversationRoom).toBeDefined();
					socketMock.joinConversationRoom('convo-id');
					expect(socketMock.join).toHaveBeenCalledWith('c-convo-id');
				});

				it('defines a leaveConversationRoom method', function(){
					expect(socketMock.leaveConversationRoom).toBeDefined();
					socketMock.leaveConversationRoom('convo-id');
					expect(socketMock.leave).toHaveBeenCalledWith('c-convo-id');
				});

				it('defines a joinGroupRoom method', function(){
					expect(socketMock.joinGroupRoom).toBeDefined();
					socketMock.joinGroupRoom('group-id');
					expect(socketMock.join).toHaveBeenCalledWith('g-group-id');
				});

				it('defines a leaveGroupRoom method', function(){
					expect(socketMock.leaveGroupRoom).toBeDefined();
					socketMock.leaveGroupRoom('group-id');
					expect(socketMock.leave).toHaveBeenCalledWith('g-group-id');
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

				it('subscribe to conversations', function(){
					fire('subscribe_to_conversations');
					expect(userIoMock.subscribeToConversations).toHaveBeenCalledWith(socketMock, data);
				});

				it('unsubscribe to conversation', function(){
					fire('unsubscribe_to_conversation');
					expect(userIoMock.unsubscribeToConversation).toHaveBeenCalledWith(socketMock, data);
				});

				it('adds conversation to desktop', function(){
					fire('add_to_desktop');
					expectSessionTouchCalled();
					expect(desktopIoMock.addConversation).toHaveBeenCalledWith(socketMock, data);
				});

				it('removes conversation from desktop', function(){
					fire('remove_from_desktop');
					expectSessionTouchCalled();
					expect(desktopIoMock.removeConversation).toHaveBeenCalledWith(socketMock, data);
				});

				it('updates strip order', function(){
					fire('update_strip_order');
					expectSessionTouchCalled();
					expect(desktopIoMock.updateStripOrder).toHaveBeenCalledWith(data, confirm);
				});

				it('read next messages', function(){
					fire('read_next_messages');
					expectSessionTouchCalled();
					expect(conversationIoMock.readMessages).toHaveBeenCalledWith(data, confirm);
				});

				it('sends message', function(){
					fire('send_message');
					expectSessionTouchCalled();
					expect(conversationIoMock.sendMessage).toHaveBeenCalledWith(socketMock, notificationMock, data, confirm);
				});

				it('creates a conversation', function(){
					fire('create_conversation');
					expectSessionTouchCalled();
					expect(conversationIoMock.createConversation).toHaveBeenCalledWith(socketMock, ioMock.sockets, data);
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