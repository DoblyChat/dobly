describe('Sockets', function(){
	'use strict';

    describe('Tasks', function(){
		var taskIo, taskMock, logMock,
			collaborationObjectIo, confirm,
			socketMock;

		beforeEach(function(){
			confirm = jasmine.createSpy();
			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../lib/sockets/task_io');

			collaborationObjectIo = buildMock('./base_collaboration_object_io', 'sendItem');
			taskMock = buildMock('../models/task', 'create', 'update', 'remove');
			logMock = buildMock('../common/log', 'error');

			taskIo = require('../../lib/sockets/task_io');

			socketMock = { 
				broadcastToCollaborationObjectMembers: jasmine.createSpy(),
				handshake: {
					user: {
						_id: 'u-id',
						firstName: 'usr'
					}
				}
			};
		});

		it('adds task', function(){
			var sockets = { 'sock': 'ets' },
				data = { da: 'ta' };

			taskIo.add(socketMock, sockets, data, confirm);
			expect(collaborationObjectIo.sendItem).toHaveBeenCalled();
			var addArgs = collaborationObjectIo.sendItem.mostRecentCall.args;
			expect(addArgs[0]).toBe(socketMock);
			expect(addArgs[1]).toBe(sockets);
			expect(addArgs[2]).toBe(data);
			expect(addArgs[4]).toBe(confirm);

			var callback = jasmine.createSpy();
			addArgs[3](callback);

			expect(taskMock.create).toHaveBeenCalled();
			
			var taskData = taskMock.create.mostRecentCall.args[0];
			expect(taskData.description).toBe(data.description);
			expect(taskData.createdById).toBe(socketMock.handshake.user._id);
			expect(taskData.timestamp).toBe(Date.now());
			expect(taskData.collaborationObjectId).toBe(data.collaborationObjectId);

			expect(taskMock.create.getCallback()).toBe(callback);
		});

		it('removes a task', function(){
			var data = {
				id: 't-id',
				collaborationObjectId: 'c-id'
			};

			taskIo.remove(socketMock, data);

			expect(taskMock.remove).toHaveBeenCalled();
			expect(taskMock.remove.mostRecentCall.args[0]).toEqual({ _id: 't-id' });
			var callback = taskMock.remove.getCallback();

			callback('my error');
			expect(logMock.error).toHaveBeenCalledWith('my error', 'Error removing task.');
			expect(socketMock.broadcastToCollaborationObjectMembers).not.toHaveBeenCalled();

			logMock.error.reset();

			callback(null);
			expect(logMock.error).not.toHaveBeenCalled();
			expect(socketMock.broadcastToCollaborationObjectMembers).toHaveBeenCalledWith('task_removed', 'c-id', data);
		});

		describe('toggle whether a task is complete or not', function(){
			it('marks a task as complete', function(){
				var data = { id: 't-id', collaborationObjectId: 'c-id', isComplete: true };

				taskIo.toggleComplete(socketMock, data, confirm);

				expect(taskMock.update).toHaveBeenCalled();
				var args = taskMock.update.mostRecentCall.args;

				expect(args[0]).toEqual({ _id: 't-id' });
				expect(args[1].isComplete).toBe(true);
				expect(args[1].completedById).toBe('u-id');
				
				var completedOn = new Date(args[1].completedOn),
					expected = new Date();

				expect(completedOn.getDate()).toBe(expected.getDate());
				expect(completedOn.getMonth()).toBe(expected.getMonth());
				expect(completedOn.getFullYear()).toBe(expected.getFullYear());

				var expectedData = {
					id: 't-id',
					completedOn: args[1].completedOn,
					completedById: 'u-id',
					collaborationObjectId: 'c-id',
					isComplete: true
				};

				args[2](null);
				expect(logMock.error).not.toHaveBeenCalled();
				expect(socketMock.broadcastToCollaborationObjectMembers).toHaveBeenCalledWith('task_complete_toggled', 'c-id', expectedData);

				args[2]('my error');
				expect(logMock.error).toHaveBeenCalledWith('my error', 'Error completing or incompleting a task.');

				expect(confirm).toHaveBeenCalledWith(expectedData);
			});	

			it('marks a task as incomplete', function(){
				var data = { id: 't-id', collaborationObjectId: 'c-id', isComplete: false };

				taskIo.toggleComplete(socketMock, data, confirm);

				expect(taskMock.update).toHaveBeenCalled();
				var args = taskMock.update.mostRecentCall.args;

				expect(args[0]).toEqual({ _id: 't-id' });
				expect(args[1].isComplete).toBe(false);
				expect(args[1].completedOn).toBe(null);
				expect(args[1].completedById).toBe(null);

				var expectedData = {
					id: 't-id',
					completedOn: null,
					completedById: null,
					collaborationObjectId: 'c-id',
					isComplete: false
				};

				args[2](null);
				expect(socketMock.broadcastToCollaborationObjectMembers).toHaveBeenCalledWith('task_complete_toggled', 'c-id', expectedData);
				expect(confirm).toHaveBeenCalledWith(expectedData);
			});	
		});	

		it('updates a tasks content', function(){
			var data = {
				id: 't-id',
				collaborationObjectId: 'c-id',
				content: 'new content'
			};

			taskIo.updateContent(socketMock, data);

			expect(taskMock.update).toHaveBeenCalled();
			var args = taskMock.update.mostRecentCall.args;

			expect(args[0]).toEqual({ _id: 't-id' });
			expect(args[1]).toEqual({ content: 'new content' });
			var callback = args[2];

			callback('err');
			expect(logMock.error).toHaveBeenCalledWith('err', 'Error updating task content.');
			expect(socketMock.broadcastToCollaborationObjectMembers).not.toHaveBeenCalled();

			logMock.error.reset();

			callback(null);
			expect(logMock.error).not.toHaveBeenCalled();
			expect(socketMock.broadcastToCollaborationObjectMembers).toHaveBeenCalledWith('task_content_updated', 'c-id', data);
		});
	});
});