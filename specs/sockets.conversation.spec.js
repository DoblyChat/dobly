describe('Sockets', function(){
	describe('Conversation', function(){
		var conversationIo, socketMock, 
			conversationMock, asyncMock,
			unreadMock, userMock, _Message;

		beforeEach(function(){
			socketMock = {
				handshake: {
					user: {
						groupId: 'gru-id',
						username: 'usr',
						_id: 'usr-id',
					},
				},
				emit: jasmine.createSpy(),
				broadcastToGroup: jasmine.createSpy(),
			};

			// Preloading Message module to avoid mockery 
			// warnings when loading
			// it after 'require' is intercepted
			_Message = require('../models/message');

			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../sockets/conversation_io');

			conversationMock = buildMock('../models/conversation', 'create', 'addMessage', 'update');
			asyncMock = buildMock('async', 'parallel', 'each');
			unreadMock = buildMock('../models/unread_marker', 'increaseCounter', 'remove');
			userMock = buildMock('../models/user', 'find', 'findExcept');
			mockery.registerMock('../models/message', _Message);

			conversationIo = require('../sockets/conversation_io');
		});

		afterEach(function(){
			mockery.disable();
			mockery.deregisterAll();
		});

		describe('#createConversation', function(){
			beforeEach(function(){
				conversationIo.createConversation(socketMock, { topic: 'my new topic' });
				expect(conversationMock.create).toHaveBeenCalled();
			});

			it('logs error if there is an error creating the conversation', function(){
				var callback = conversationMock.create.getCallback();

				spyOn(console, 'error');
				callback('my error', null);
				expect(console.error).toHaveBeenCalledWith('Error creating conversation', 'my error');
			});

			it('creates a conversation with the correct data', function(){
				var data = conversationMock.create.mostRecentCall.args[0];

				expect(data.topic).toBe('my new topic');
				expect(data.createdBy).toBe('usr');
				expect(data.groupId).toBe('gru-id');
			});

			it('communicates to users about the new conversation if creation successfull', function(){
				var callback = conversationMock.create.getCallback();
				var conversation = {
					_id: new mongo.Types.ObjectId(),
					topic: 'hello world',
				};

				callback(null, conversation);
				expect(socketMock.emit).toHaveBeenCalledWith('my_new_conversation', conversation);
				expect(socketMock.broadcastToGroup).toHaveBeenCalledWith('new_conversation', conversation);
			});
		});

		describe('#sendMessage', function(){
			var confirm, data, callback;

			beforeEach(function(){
				confirm = jasmine.createSpy('confirm');
				callback = jasmine.createSpy('callback');
				data = { 
					content: 'my text',
					timestamp: new Date(),
					conversationId: 'convo-id'
				};

				conversationIo.sendMessage(socketMock, data, confirm);
			});

			describe('process', function(){
				var saveMessage, saveUnread;

				beforeEach(function(){
					var process = asyncMock.parallel.mostRecentCall.args[0];
					saveMessage = process[0];
					saveUnread = process[1];
				});

				it('saves message', function(){
					saveMessage(callback);
					expect(conversationMock.addMessage).toHaveBeenCalled();

					var args = conversationMock.addMessage.mostRecentCall.args;

					expect(args[0]).toBe('convo-id');

					var msg = args[1];
					expect(msg.content).toBe('my text');
					expect(msg.createdBy).toBe('usr');
					expect(msg.timestamp).toBe(data.timestamp);

					var addCallback = conversationMock.addMessage.getCallback();

					addCallback('error');

					expect(callback).toHaveBeenCalledWith('error', {
						content: 'my text',
						createdBy: 'usr',
						conversationId: 'convo-id',
						timestamp: data.timestamp
					});
				});

				describe('unread', function(){
					var findCallback;

					beforeEach(function(){
						saveUnread(callback);
						expect(userMock.findExcept).toHaveBeenCalled();
						findCallback = userMock.findExcept.getCallback();
					});

					it('saves for each user', function(){
						var args = userMock.findExcept.mostRecentCall.args;

						expect(args[0]).toBe('usr-id');
						expect(args[1]).toBe('gru-id');					

						var users = [ 
							{
								_id: 'first'
							},
							{
								_id: 'second'
							}
						];

						findCallback(null, users);

						expect(asyncMock.each).toHaveBeenCalled();
						expect(asyncMock.each.mostRecentCall.args[0]).toBe(users);

						var save = asyncMock.each.getCallback();
						var saveCallback = jasmine.createSpy('save callback');
						save(users[0], saveCallback);

						expect(unreadMock.increaseCounter).toHaveBeenCalledWith('first', 'convo-id', saveCallback);

						expect(callback).toHaveBeenCalledWith(null);
					});

					it('passes error along in callback', function(){
						var findCallback = userMock.findExcept.getCallback();
						findCallback('my error', []);

						expect(callback).toHaveBeenCalledWith('my error');
					});
				});
			});

			describe('broadcast', function(){
				var broadcast;

				beforeEach(function(){
					broadcast = asyncMock.parallel.mostRecentCall.args[1];
				});

				it('logs error if passed from async processing', function(){
					spyOn(console, 'error');
					broadcast('processing error', null);
					expect(console.error).toHaveBeenCalledWith('Error sending message', 'processing error');
				});

				it('broadcasts and confirms', function(){
					var newMessage = { content: 'new message ' };
					broadcast(null, [ newMessage ]);

					expect(socketMock.broadcastToGroup).toHaveBeenCalledWith('receive_message', newMessage);
					expect(confirm).toHaveBeenCalled();
				})
			});
		});

		describe('#markAsRead', function(){
			it('removes unread for a conversation and user combination', function(){
				conversationIo.markAsRead(socketMock, 'convo-id');

				expect(unreadMock.remove).toHaveBeenCalled()

				var data = unreadMock.remove.mostRecentCall.args[0]
				expect(data.conversationId).toBe('convo-id');
				expect(data.userId).toBe('usr-id');
			});

			it('logs an error if necessary', function(){
				conversationIo.markAsRead(socketMock, null);
				var removeCallback = unreadMock.remove.getCallback();
				spyOn(console, 'error');
				
				removeCallback(null);
				expect(console.error).not.toHaveBeenCalled();

				removeCallback('remove error');
				expect(console.error).toHaveBeenCalledWith('Error marking as read', 'remove error');
			});
		});

		describe('#updateTopic', function(){
			it('updates the topic for a conversation', function(){
				conversationIo.updateTopic({ conversationId: 'convo-id', newTopic: 'new topic'});
				expect(conversationMock.update).toHaveBeenCalled();

				expect(conversationMock.update.mostRecentCall.args[0]._id).toBe('convo-id');
				expect(conversationMock.update.mostRecentCall.args[1].topic).toBe('new topic');
			});

			it('logs error if neccesary', function(){
				conversationIo.updateTopic({});
				spyOn(console, 'error');

				var callback = conversationMock.update.getCallback();
				callback(null);
				expect(console.error).not.toHaveBeenCalled();

				callback('update error');
				expect(console.error).toHaveBeenCalledWith('Error updating topic', 'update error');
			})
		});
	});
})