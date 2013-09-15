describe('Sockets', function(){
	'use strict';

    describe('Tasks', function(){
		var taskIo, taskMock,
			collaborationObjectIo;

		beforeEach(function(){
			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../lib/sockets/task_io');

			collaborationObjectIo = buildMock('./collaboration_object_io', 'sendItem');
			taskMock = buildMock('../models/task', 'create');

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
				offlineNotifications = { offline: 'notifications' },
				data = { da: 'ta' },
				confirm = jasmine.createSpy();

			taskIo.addTask(socket, offlineNotifications, data, confirm);
			expect(collaborationObjectIo.sendItem).toHaveBeenCalled();
			var addArgs = collaborationObjectIo.sendItem.mostRecentCall.args;
			expect(addArgs[0]).toBe(socket);
			expect(addArgs[1]).toBe(offlineNotifications);
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
	});
});