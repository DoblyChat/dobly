describe('Sockets', function(){
	'use strict';

    describe('Collaboration Object', function(){
		var collaborationObjectIo, socketMock, 
			collaborationObjectMock, asyncMock,
			unreadMock, userMock,
			sockets, clients;

		beforeEach(function(){
			socketMock = {
				handshake: {
					user: {
						groupId: 'gru-id',
						firstName: 'usr',
						_id: 'usr-id',
					},
				},
				emit: jasmine.createSpy(),
				broadcastToGroup: jasmine.createSpy(),
				broadcastToCollaborationObjectMembers: jasmine.createSpy(),
				joinCollaborationObjectRoom: jasmine.createSpy()
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
					joinCollaborationObjectRoom: jasmine.createSpy('join-1')
				},
				{ 
					handshake: {
						user: {
							_id: 'usr-id-2'
						}
					},
					joinCollaborationObjectRoom: jasmine.createSpy('join-2')
				},
				{ 
					handshake: {
						user: {
							_id: 'usr-id-3'
						}
					},
					joinCollaborationObjectRoom: jasmine.createSpy('join-3')
				},
			];

			sockets.groupClients = jasmine.createSpy().andReturn(clients);

			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../lib/sockets/collaboration_object_io');

			collaborationObjectMock = buildMock('../models/collaboration_object', 'create', 'updateTopic', 'findById');
			asyncMock = buildMock('async', 'parallel', 'each');
			unreadMock = buildMock('../models/unread_marker', 'increaseCounter', 'removeMarkers');
			userMock = buildMock('../models/user', 'find', 'findExcept');

			collaborationObjectIo = require('../../lib/sockets/collaboration_object_io');
		});

		describe('#createCollaborationObject', function(){
			var data;

			beforeEach(function(){
				data = { 
					topic: 'my new topic',
					forEntireGroup: true,
					selectedMembers: [ 'pepe', 'juan' ]
				};

				collaborationObjectIo.createCollaborationObject(socketMock, sockets, data);
				expect(collaborationObjectMock.create).toHaveBeenCalled();
			});

			it('creates a collaboration object with the correct data', function(){
				var createData = collaborationObjectMock.create.mostRecentCall.args[0];

				expect(createData.topic).toBe('my new topic');
				expect(createData.createdById).toBe(socketMock.handshake.user._id);
				expect(createData.groupId).toBe(socketMock.handshake.user.groupId);
				expect(createData.members.entireGroup).toBe(true);
				expect(createData.members.users).toEqual([ 'pepe', 'juan' ]);
			});

			describe('callback', function(){
				var callback, collaborationObject;

				beforeEach(function(){
					callback = collaborationObjectMock.create.getCallback();
					collaborationObject = {
						_id: new mongo.Types.ObjectId(),
						topic: 'hello world',
						_doc: {},
					};
				});

				it('logs error if there is an error creating the collaboration object', function(){
					spyOn(console, 'error');
					callback('my error', null);
					expect(console.error).toHaveBeenCalledWith('Error creating collaboration object', 'my error');
				});

				it('communicates to the user that created collaboration object when creation successfull', function(){
					callback(null, collaborationObject);
					expect(socketMock.emit).toHaveBeenCalled();

					var args = socketMock.emit.mostRecentCall.args;
					expect(args[0]).toBe('my_new_conversation');

					expect(args[1]._id).toEqual(collaborationObject._id);
					expect(args[1].topic).toBe(collaborationObject.topic);
					expect(args[1]._doc.createdBy).toBe(socketMock.handshake.user.firstName);
				});

				it('communicates to other users that created collaboration object when creation successfull', function(){
					callback(null, collaborationObject);
					expect(socketMock.broadcastToCollaborationObjectMembers).toHaveBeenCalled();

					var args = socketMock.broadcastToCollaborationObjectMembers.mostRecentCall.args;
					expect(args[0]).toBe('new_conversation');
					expect(args[1]).toEqual(collaborationObject._id);
					expect(args[2]._id).toEqual(collaborationObject._id);
					expect(args[2].topic).toBe(collaborationObject.topic);
					expect(args[2]._doc.createdBy).toBe(socketMock.handshake.user.firstName);
				});

				it('joins all sockets in group if collaboration object for the entire group', function(){
					data.forEntireGroup = true;
					callback(null, collaborationObject);
					expect(sockets.groupClients).toHaveBeenCalledWith(socketMock.handshake.user.groupId);
					expect(clients[0].joinCollaborationObjectRoom).toHaveBeenCalledWith(collaborationObject._id);
					expect(clients[1].joinCollaborationObjectRoom).toHaveBeenCalledWith(collaborationObject._id);
					expect(clients[2].joinCollaborationObjectRoom).toHaveBeenCalledWith(collaborationObject._id);
				});

				it('joins only users specified and current user if not for entire group', function(){
					data.forEntireGroup = false;
					data.selectedMembers = [ 'usr-id', 'usr-id-3' ];
					callback(null, collaborationObject);

					expect(clients[0].joinCollaborationObjectRoom).toHaveBeenCalledWith(collaborationObject._id);
					expect(clients[1].joinCollaborationObjectRoom).not.toHaveBeenCalledWith(collaborationObject._id);
					expect(clients[2].joinCollaborationObjectRoom).toHaveBeenCalledWith(collaborationObject._id);

					expect(socketMock.joinCollaborationObjectRoom).toHaveBeenCalledWith(collaborationObject._id);
				});
			});
		});

		describe('#sendItem', function(){
			var confirm, data, 
				callback, offlineNotification,
				save;

			beforeEach(function(){
				confirm = jasmine.createSpy('confirm');
				callback = jasmine.createSpy('callback');
				save = jasmine.createSpy('save');

				data = { 
					content: 'my text',
					timestamp: new Date(),
					collaborationObjectId: 'convo-id'
				};
				offlineNotification = jasmine.createSpyObj('offlineNotification', ['notify']);

				collaborationObjectIo.sendItem(socketMock, offlineNotification, data, save, confirm);
			});

			describe('process', function(){
				var saveItem, saveUnread;

				beforeEach(function(){
					var process = asyncMock.parallel.mostRecentCall.args[0];
					saveItem = process[0];
					saveUnread = process[1];
				});

				it('saves item', function(){
					expect(saveItem).toBe(save);
				});

				describe('unread', function(){
					var convoCallback;

					beforeEach(function(){
						saveUnread(callback);
						convoCallback = collaborationObjectMock.findById.getCallback();
					});

					it('finds collaboration object by id', function(){
						expect(collaborationObjectMock.findById).toHaveBeenCalled();
						var args = collaborationObjectMock.findById.mostRecentCall.args;

						expect(args[0]).toBe(data.collaborationObjectId);
					});

					it('logs an error if there is an error reading the collaboration object', function(){
						spyOn(console, 'error');
						convoCallback('reading convo error', null);
						expect(console.error).toHaveBeenCalledWith('Error reading collaboration object for saving unread', 'reading convo error');
						expect(callback).toHaveBeenCalledWith('reading convo error');
					});

					describe('users', function(){
						var collaborationObject;

						describe('for entire group', function(){
							var findCallback;

							beforeEach(function(){
								collaborationObject = {
									members: {
										entireGroup: true,
										users: [ ]
									}
								};

								convoCallback(null, collaborationObject);
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
								collaborationObject = {
									members: {
										entireGroup: false,
										users: [ 'usr-1', 'usr-2' ]
									}
								};

								convoCallback(null, collaborationObject);
								expect(asyncMock.each).toHaveBeenCalled();
							});

							it('saves unread for only selected users', function(){
								expect(asyncMock.each.mostRecentCall.args[0]).toBe(collaborationObject.members.users);

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
					expect(console.error).toHaveBeenCalledWith('Error sending collaboration item', 'processing error');
				});

				it('broadcasts and confirms', function(){
					var item = {};
					broadcast(null, [ item ]);

					expect(socketMock.broadcastToCollaborationObjectMembers).toHaveBeenCalled();
					var args = socketMock.broadcastToCollaborationObjectMembers.mostRecentCall.args;

					expect(args[0]).toBe('receive_message');
					expect(args[1]).toBe('convo-id');
					expect(args[2]).toBe(item);

					expect(confirm).toHaveBeenCalledWith(item);
				});
			});
		});

		describe('#markAsRead', function(){
			it('removes unread for a collaboration object and user combination', function(){
				collaborationObjectIo.markAsRead(socketMock, 'convo-id');

				expect(unreadMock.removeMarkers).toHaveBeenCalled();

				var args = unreadMock.removeMarkers.mostRecentCall.args;
				expect(args[1]).toBe('convo-id');
				expect(args[0]).toBe('usr-id');
			});

			it('logs an error if necessary', function(){
				collaborationObjectIo.markAsRead(socketMock, null);
				var removeCallback = unreadMock.removeMarkers.getCallback();
				spyOn(console, 'error');
				
				removeCallback(null);
				expect(console.error).not.toHaveBeenCalled();

				removeCallback('remove error');
				expect(console.error).toHaveBeenCalledWith('Error marking as read', 'remove error');
			});
		});

		describe('#updateTopic', function(){
			it('updates the topic for a collaboration object', function(){
				collaborationObjectIo.updateTopic({ collaborationObjectId: 'convo-id', newTopic: 'new topic'});
				expect(collaborationObjectMock.updateTopic).toHaveBeenCalled();

				expect(collaborationObjectMock.updateTopic.mostRecentCall.args[0]).toBe('convo-id');
				expect(collaborationObjectMock.updateTopic.mostRecentCall.args[1]).toBe('new topic');
			});

			it('logs error if neccesary', function(){
				collaborationObjectIo.updateTopic({});
				spyOn(console, 'error');

				var callback = collaborationObjectMock.updateTopic.getCallback();
				callback(null);
				expect(console.error).not.toHaveBeenCalled();

				callback('update error');
				expect(console.error).toHaveBeenCalledWith('Error updating topic', 'update error');
			});
		});
	});
});