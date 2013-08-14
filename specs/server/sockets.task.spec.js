describe('Sockets', function(){
	'use strict';

	describe('Tasks', function(){
		var socketMock, logMock, taskListMock, taskMock, taskIo;

		beforeEach(function(){
			socketMock = {
				emit: jasmine.createSpy('emit'),
				handshake: {
					user: {
						_id: 'user-id',
						groupId: 'group-id'
					}	
				}
			};

			logMock = {
				error: jasmine.createSpy(),
			};

			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../lib/sockets/task_io');

			taskListMock = buildMock('../models/task_list', 'create');
			taskMock = buildMock('../models/task', 'create');
			logMock = buildMock('../common/log', 'error');
			taskIo = require('../../lib/sockets/task_io');
		});

		it('creates a list', function(){
			var data = {
				private: true,
				name: 'Hello world!'
			};

			taskIo.createTaskList(socketMock, data);
			expect(taskListMock.create).toHaveBeenCalled();

			var resultData = taskListMock.create.mostRecentCall.args[0];
			expect(resultData.private).toBe(true);
			expect(resultData.createdById).toBe(socketMock.handshake.user._id);
			expect(resultData.groupId).toBe(socketMock.handshake.user.groupId);
			expect(resultData.name).toBe(data.name);

			var callback = taskListMock.create.getCallback();
			
			// error handling
			callback('create error');
			expect(logMock.error).toHaveBeenCalledWith('Error creating task list', 'create error');

			// respond
			var list = [ 'task 1' ];
			callback(null, list);
			expect(socketMock.emit).toHaveBeenCalledWith('task_list_created', list);
		});

		it('adds a task', function(){
			var data = {
				taskListId: '123',
				description: 'my new task'
			};

			taskIo.addTask(socketMock, data);
			expect(taskMock.create).toHaveBeenCalled();

			var resultData = taskMock.create.mostRecentCall.args[0];
			expect(resultData.complete).toBe(false);
			expect(resultData.createdById).toBe(socketMock.handshake.user._id);
			expect(resultData.taskListId).toBe(data.taskListId);
			expect(resultData.description).toBe('my new task');
		});
	});
});