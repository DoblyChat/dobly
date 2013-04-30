describe('Sockets', function(){
	describe('Conversation', function(){
		var conversationIo, socketMock, 
			conversationMock, asyncMock,
			unreadMock, userMock, messageMock;

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

			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../sockets/conversation_io');

			conversationMock = buildMock('../models/conversation', 'create', 'update');
			asyncMock = buildMock('async', 'parallel', 'each');
			unreadMock = buildMock('../models/unread_marker', 'increaseCounter', 'remove');
			userMock = buildMock('../models/user', 'find', 'findExcept');
			messageMock = buildMock('../models/message', 'create', 'find');

			conversationIo = require('../../sockets/conversation_io');
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
					expect(messageMock.create).toHaveBeenCalled();
					
					var messageData = messageMock.create.mostRecentCall.args[0];
					expect(messageData.content).toBe(data.content);
					expect(messageData.createdBy).toBe('usr');
					expect(messageData.timestamp).toBe(data.timestamp);
					expect(messageData.conversationId).toBe(data.conversationId);

					expect(messageMock.create.getCallback()).toBe(callback);
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
					broadcast(null);

					expect(socketMock.broadcastToGroup).toHaveBeenCalled();
					expect(socketMock.broadcastToGroup.mostRecentCall.args[0]).toBe('receive_message');

					var broadcastedData = socketMock.broadcastToGroup.mostRecentCall.args[1];
					expect(broadcastedData.content).toBe(data.content);
					expect(broadcastedData.createdBy).toBe('usr');
					expect(broadcastedData.conversationId).toBe('convo-id');
					expect(broadcastedData.timestamp).toBe(data.timestamp);
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

		describe('#readMessages', function(){
			it('reads paged messages', function(){
				var data = { conversationId: 'convo-id', page: 3 };
				var confirm = jasmine.createSpy('confirm');

				conversationIo.readMessages(data, confirm);
				expect(messageMock.find).toHaveBeenCalled();

				var args = messageMock.find.mostRecentCall.args;
				expect(args[0].conversationId).toBe(data.conversationId);
				expect(args[1]).toBe('content createdBy timestamp');
				expect(args[2].limit).toBe(50);
				expect(args[2].skip).toBe(150);
				expect(args[2].lean).toBe(true);
				expect(args[2].sort.timestamp).toBe(1);

				var callback = messageMock.find.getCallback();
				spyOn(console, 'error');

				var messages = [{ dummy: 'test' }];
				callback(null, messages);
				expect(confirm).toHaveBeenCalledWith(messages);
				expect(console.error).not.toHaveBeenCalled();
				callback('my error', null);
				expect(console.error).toHaveBeenCalledWith('Error loading more messages', 'my error');
			});
		})
	});
})