describe('Sockets', function(){
	'use strict';

    describe('Tasks', function(){
		var taskIo, taskMock, logMock,
			collaborationObjectIo, confirm;

		beforeEach(function(){
			confirm = jasmine.createSpy();
			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../lib/sockets/task_io');

			collaborationObjectIo = buildMock('./base_collaboration_object_io', 'sendItem');
			taskMock = buildMock('../models/task', 'create', 'update');
			logMock = buildMock('../common/log', 'error');

			taskIo = require('../../lib/sockets/task_io');
		});

		it('saves task', function(){
			var socket = {
					handshake: {
						user: {
							firstName: 'usr'
						}
					}
				},
				sockets = { 'sock': 'ets' },
				data = { da: 'ta' };

			taskIo.add(socket, sockets, data, confirm);
			expect(collaborationObjectIo.sendItem).toHaveBeenCalled();
			var addArgs = collaborationObjectIo.sendItem.mostRecentCall.args;
			expect(addArgs[0]).toBe(socket);
			expect(addArgs[1]).toBe(sockets);
			expect(addArgs[2]).toBe(data);
			expect(addArgs[4]).toBe(confirm);

			var callback = jasmine.createSpy();
			addArgs[3](callback);

			expect(taskMock.create).toHaveBeenCalled();
			
			var taskData = taskMock.create.mostRecentCall.args[0];
			expect(taskData.description).toBe(data.description);
			expect(taskData.createdById).toBe(socket.handshake.user._id);
			expect(taskData.timestamp).toBe(data.timestamp);
			expect(taskData.collaborationObjectId).toBe(data.collaborationObjectId);

			expect(taskMock.create.getCallback()).toBe(callback);
		});		

		describe('toggle whether a task is complete or not', function(){
			var socketMock;

			beforeEach(function(){
				socketMock = { 
					broadcastToCollaborationObjectMembers: jasmine.createSpy()
				};
			});

			it('marks a task as complete', function(){
				var data = { id: 't-id', collaborationObjectId: 'c-id', isComplete: true };

				taskIo.toggleComplete(socketMock, data, confirm);

				expect(taskMock.update).toHaveBeenCalled();
				var args = taskMock.update.mostRecentCall.args;

				expect(args[0]).toEqual({ _id: 't-id' });
				expect(args[1].isComplete).toBe(true);
				
				var completedOn = new Date(args[1].completedOn),
					expected = new Date();

				expect(completedOn.getDate()).toBe(expected.getDate());
				expect(completedOn.getMonth()).toBe(expected.getMonth());
				expect(completedOn.getFullYear()).toBe(expected.getFullYear());

				args[2](null);
				expect(logMock.error).not.toHaveBeenCalled();
				expect(socketMock.broadcastToCollaborationObjectMembers).toHaveBeenCalledWith('task_complete_toggled', 'c-id', data);

				args[2]('my error');
				expect(logMock.error).toHaveBeenCalledWith('my error', 'Error completing or incompleting a task.');

				expect(confirm).toHaveBeenCalledWith(args[1].completedOn);
			});	

			it('marks a task as incomplete', function(){
				var data = { id: 't-id', collaborationObjectId: 'c-id', isComplete: false };

				taskIo.toggleComplete(socketMock, data, confirm);

				expect(taskMock.update).toHaveBeenCalled();
				var args = taskMock.update.mostRecentCall.args;

				expect(args[0]).toEqual({ _id: 't-id' });
				expect(args[1].isComplete).toBe(false);
				expect(args[1].completedOn).toBe(null);

				args[2](null);
				expect(confirm).toHaveBeenCalledWith(null);
			});	
		});	
	});
});