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
					type: 'type',
					topic: 'my new topic',
					forEntireGroup: true,
					selectedMembers: [ 'pepe', 'juan' ]
				};

				collaborationObjectIo.createCollaborationObject(socketMock, sockets, data);
				expect(collaborationObjectMock.create).toHaveBeenCalled();
			});

			it('creates a collaboration object with the correct data', function(){
				var createData = collaborationObjectMock.create.mostRecentCall.args[0];

				expect(createData.type).toBe('type');
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
					expect(args[0]).toBe('my_new_collaboration_object');

					expect(args[1]._id).toEqual(collaborationObject._id);
					expect(args[1].topic).toBe(collaborationObject.topic);
					expect(args[1]._doc.createdBy).toBe(socketMock.handshake.user.firstName);
				});

				it('communicates to other users that created collaboration object when creation successfull', function(){
					callback(null, collaborationObject);
					expect(socketMock.broadcastToCollaborationObjectMembers).toHaveBeenCalled();

					var args = socketMock.broadcastToCollaborationObjectMembers.mostRecentCall.args;
					expect(args[0]).toBe('new_collaboration_object');
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