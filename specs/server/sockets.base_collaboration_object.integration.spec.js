describe('Sockets', function(){
	'use strict';

    describe('Base Collaboration Object', function(){
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
				broadcastToCollaborationObjectMembers: jasmine.createSpy()
			};

			sockets = {};
			clients = 
			[
				{ 
					handshake: {
						user: {
							_id: 'usr-id'
						}
					}
				},
				{ 
					handshake: {
						user: {
							_id: 'usr-id-2'
						}
					}
				},
				{ 
					handshake: {
						user: {
							_id: 'usr-id-3'
						}
					}
				},
			];

			sockets.groupClients = jasmine.createSpy().andReturn(clients);

			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../lib/sockets/base_collaboration_object_io');

			collaborationObjectMock = buildMock('../models/collaboration_object', 'create', 'updateTopic', 'findById');
			asyncMock = buildMock('async', 'parallel', 'each');
			unreadMock = buildMock('../models/unread_marker', 'increaseCounter', 'removeMarkers');
			userMock = buildMock('../models/user', 'find', 'findExcept');

			collaborationObjectIo = require('../../lib/sockets/base_collaboration_object_io');
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
	});
});