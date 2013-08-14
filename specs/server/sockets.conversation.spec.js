describe('Sockets', function(){
	'use strict';

    describe('Conversation', function(){
		var conversationIo, socketMock, 
			conversationMock, asyncMock,
			unreadMock, userMock, messageMock,
			sockets, clients;

		beforeEach(function(){
			socketMock = {
				handshake: {
					user: {
						groupId: 'gru-id',
						name: 'usr',
						_id: 'usr-id',
					},
				},
				emit: jasmine.createSpy(),
				broadcastToGroup: jasmine.createSpy(),
				broadcastToConversationMembers: jasmine.createSpy(),
				joinConversationRoom: jasmine.createSpy()
			};

			sockets = {};
			clients = 
			[
				{ 
					handshake: {
						user: {
							_id: 'usr-id'
						}
					},
					joinConversationRoom: jasmine.createSpy('join-1')
				},
				{ 
					handshake: {
						user: {
							_id: 'usr-id-2'
						}
					},
					joinConversationRoom: jasmine.createSpy('join-2')
				},
				{ 
					handshake: {
						user: {
							_id: 'usr-id-3'
						}
					},
					joinConversationRoom: jasmine.createSpy('join-3')
				},
			];

			sockets.groupClients = jasmine.createSpy().andReturn(clients);

			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../lib/sockets/conversation_io');

			conversationMock = buildMock('../models/conversation', 'create', 'updateTopic', 'findById');
			asyncMock = buildMock('async', 'parallel', 'each');
			unreadMock = buildMock('../models/unread_marker', 'increaseCounter', 'removeMarkers');
			userMock = buildMock('../models/user', 'find', 'findExcept');
			messageMock = buildMock('../models/message', 'create', 'readMessagesByPage');

			conversationIo = require('../../lib/sockets/conversation_io');
		});

		describe('#createConversation', function(){
			var data;

			beforeEach(function(){
				data = { 
					topic: 'my new topic',
					forEntireGroup: true,
					selectedMembers: [ 'pepe', 'juan' ]
				};

				conversationIo.createConversation(socketMock, sockets, data);
				expect(conversationMock.create).toHaveBeenCalled();
			});

			it('creates a conversation with the correct data', function(){
				var createData = conversationMock.create.mostRecentCall.args[0];

				expect(createData.topic).toBe('my new topic');
				expect(createData.createdById).toBe(socketMock.handshake.user._id);
				expect(createData.groupId).toBe(socketMock.handshake.user.groupId);
				expect(createData.members.entireGroup).toBe(true);
				expect(createData.members.users).toEqual([ 'pepe', 'juan' ]);
			});

			describe('callback', function(){
				var callback, conversation;

				beforeEach(function(){
					callback = conversationMock.create.getCallback();
					conversation = {
						_id: new mongo.Types.ObjectId(),
						topic: 'hello world',
						_doc: {},
					};
				});

				it('logs error if there is an error creating the conversation', function(){
					spyOn(console, 'error');
					callback('my error', null);
					expect(console.error).toHaveBeenCalledWith('Error creating conversation', 'my error');
				});

				it('communicates to the user that created conversation when creation successfull', function(){
					callback(null, conversation);
					expect(socketMock.emit).toHaveBeenCalled();

					var args = socketMock.emit.mostRecentCall.args;
					expect(args[0]).toBe('my_new_conversation');

					expect(args[1]._id).toEqual(conversation._id);
					expect(args[1].topic).toBe(conversation.topic);
					expect(args[1]._doc.createdBy).toBe(socketMock.handshake.user.name);
				});

				it('communicates to other users that created conversation when creation successfull', function(){
					callback(null, conversation);
					expect(socketMock.broadcastToConversationMembers).toHaveBeenCalled();

					var args = socketMock.broadcastToConversationMembers.mostRecentCall.args;
					expect(args[0]).toBe('new_conversation');
					expect(args[1]).toEqual(conversation._id);
					expect(args[2]._id).toEqual(conversation._id);
					expect(args[2].topic).toBe(conversation.topic);
					expect(args[2]._doc.createdBy).toBe(socketMock.handshake.user.name);
				});

				it('joins all sockets in group if conversation for the entire group', function(){
					data.forEntireGroup = true;
					callback(null, conversation);
					expect(sockets.groupClients).toHaveBeenCalledWith(socketMock.handshake.user.groupId);
					expect(clients[0].joinConversationRoom).toHaveBeenCalledWith(conversation._id);
					expect(clients[1].joinConversationRoom).toHaveBeenCalledWith(conversation._id);
					expect(clients[2].joinConversationRoom).toHaveBeenCalledWith(conversation._id);
				});

				it('joins only users specified and current user if not for entire group', function(){
					data.forEntireGroup = false;
					data.selectedMembers = [ 'usr-id', 'usr-id-3' ];
					callback(null, conversation);

					expect(clients[0].joinConversationRoom).toHaveBeenCalledWith(conversation._id);
					expect(clients[1].joinConversationRoom).not.toHaveBeenCalledWith(conversation._id);
					expect(clients[2].joinConversationRoom).toHaveBeenCalledWith(conversation._id);

					expect(socketMock.joinConversationRoom).toHaveBeenCalledWith(conversation._id);
				});
			});
		});

		describe('#sendMessage', function(){
			var confirm, data, callback, offlineNotification;

			beforeEach(function(){
				confirm = jasmine.createSpy('confirm');
				callback = jasmine.createSpy('callback');
				data = { 
					content: 'my text',
					timestamp: new Date(),
					conversationId: 'convo-id'
				};
				offlineNotification = jasmine.createSpyObj('offlineNotification', ['notify']);

				conversationIo.sendMessage(socketMock, offlineNotification, data, confirm);
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
					var convoCallback;

					beforeEach(function(){
						saveUnread(callback);
						convoCallback = conversationMock.findById.getCallback();
					});

					it('finds conversation by id', function(){
						expect(conversationMock.findById).toHaveBeenCalled();
						var args = conversationMock.findById.mostRecentCall.args;

						expect(args[0]).toBe(data.conversationId);
					});

					it('logs an error if there is an error reading the conversation', function(){
						spyOn(console, 'error');
						convoCallback('reading convo error', null);
						expect(console.error).toHaveBeenCalledWith('Error reading conversation for saving unread', 'reading convo error');
						expect(callback).toHaveBeenCalledWith('reading convo error');
					});

					describe('users', function(){
						var conversation;

						describe('for entire group', function(){
							var findCallback;

							beforeEach(function(){
								conversation = {
									members: {
										entireGroup: true,
										users: [ ]
									}
								};

								convoCallback(null, conversation);
								expect(userMock.findExcept).toHaveBeenCalled();
								findCallback = userMock.findExcept.getCallback();
							});

							it('saves for each user in group', function(){
								var args = userMock.findExcept.mostRecentCall.args;

								expect(args[0][0]).toBe('usr-id');
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

								var save = asyncMock.each.mostRecentCall.args[1];
								var saveCallback = jasmine.createSpy('save callback');
								save(users[0], saveCallback);

								expect(unreadMock.increaseCounter).toHaveBeenCalledWith('first', 'convo-id', saveCallback);

								var eachCallback = asyncMock.each.getCallback();
								eachCallback('each error');
								expect(callback).toHaveBeenCalledWith('each error');
							});
						});

						describe('for select users', function(){
							beforeEach(function(){
								conversation = {
									members: {
										entireGroup: false,
										users: [ 'usr-1', 'usr-2' ]
									}
								};

								convoCallback(null, conversation);
								expect(asyncMock.each).toHaveBeenCalled();
							});

							it('saves unread for only selected users', function(){
								expect(asyncMock.each.mostRecentCall.args[0]).toBe(conversation.members.users);

								var save = asyncMock.each.mostRecentCall.args[1];
								var saveCallback = jasmine.createSpy();

								save('userid', saveCallback);

								expect(unreadMock.increaseCounter).toHaveBeenCalledWith('userid', 'convo-id', saveCallback);

								var eachCallback = asyncMock.each.getCallback();
								eachCallback('each error');
								expect(callback).toHaveBeenCalledWith('each error');
							});
						});
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
					var message = {};
					broadcast(null, [ message ]);

					expect(socketMock.broadcastToConversationMembers).toHaveBeenCalled();
					var args = socketMock.broadcastToConversationMembers.mostRecentCall.args;

					expect(args[0]).toBe('receive_message');
					expect(args[1]).toBe('convo-id');
					expect(args[2]).toBe(message);

					expect(confirm).toHaveBeenCalledWith(message);
				});
			});
		});

		describe('#markAsRead', function(){
			it('removes unread for a conversation and user combination', function(){
				conversationIo.markAsRead(socketMock, 'convo-id');

				expect(unreadMock.removeMarkers).toHaveBeenCalled();

				var args = unreadMock.removeMarkers.mostRecentCall.args;
				expect(args[1]).toBe('convo-id');
				expect(args[0]).toBe('usr-id');
			});

			it('logs an error if necessary', function(){
				conversationIo.markAsRead(socketMock, null);
				var removeCallback = unreadMock.removeMarkers.getCallback();
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
				expect(conversationMock.updateTopic).toHaveBeenCalled();

				expect(conversationMock.updateTopic.mostRecentCall.args[0]).toBe('convo-id');
				expect(conversationMock.updateTopic.mostRecentCall.args[1]).toBe('new topic');
			});

			it('logs error if neccesary', function(){
				conversationIo.updateTopic({});
				spyOn(console, 'error');

				var callback = conversationMock.updateTopic.getCallback();
				callback(null);
				expect(console.error).not.toHaveBeenCalled();

				callback('update error');
				expect(console.error).toHaveBeenCalledWith('Error updating topic', 'update error');
			});
		});

		describe('#readMessages', function(){
			it('reads paged messages', function(){
				var data = { conversationId: 'convo-id', page: 3 };
				var confirm = jasmine.createSpy('confirm');

				conversationIo.readMessages(data, confirm);
				expect(messageMock.readMessagesByPage).toHaveBeenCalled();

				var args = messageMock.readMessagesByPage.mostRecentCall.args;
				expect(args[0]).toBe(data.conversationId);
				expect(args[1]).toBe(data.page);

				var callback = messageMock.readMessagesByPage.getCallback();
				spyOn(console, 'error');

				var messages = [{ dummy: 'test' }];
				callback(null, messages);
				expect(confirm).toHaveBeenCalledWith(messages);
				expect(console.error).not.toHaveBeenCalled();
				callback('my error', null);
				expect(console.error).toHaveBeenCalledWith('Error loading more messages', 'my error');
			});
		});
	});
});