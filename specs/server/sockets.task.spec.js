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

			taskListMock = buildMock('../models/task_list', 'create', 'findAllowedTasks', 'findById');
			logMock = buildMock('../common/log', 'error');
			taskIo = require('../../lib/sockets/task_io');
		});
		
		it('reads task lists', function(){
			taskIo.readTaskLists(socketMock);

			expect(taskListMock.findAllowedTasks).toHaveBeenCalled();
			
			var args = taskListMock.findAllowedTasks.mostRecentCall.args;
			expect(args[0]).toBe(socketMock.handshake.user.groupId);
			expect(args[1]).toBe(socketMock.handshake.user._id);

			// Error handling
			args[2]('find error');
			expect(logMock.error).toHaveBeenCalledWith('Error reading task lists', 'find error');
			expect(socketMock.emit).not.toHaveBeenCalled();

			// respond
			var tasks = [ 1, 2 ];
			args[2](null, tasks);
			expect(socketMock.emit).toHaveBeenCalledWith('task_lists', tasks);
		});

		it('creates a list', function(){
			var data = {
				forEntireGroup: true,
				selectedMembers: [ 'selected', 'members' ],
				name: 'Hello world!'
			};

			taskIo.createTaskList(socketMock, data);
			expect(taskListMock.create).toHaveBeenCalled();

			var resultData = taskListMock.create.mostRecentCall.args[0];
			expect(resultData.createdById).toBe(socketMock.handshake.user._id);
			expect(resultData.groupId).toBe(socketMock.handshake.user.groupId);
			expect(resultData.name).toBe(data.name);
			expect(resultData.members.entireGroup).toBe(true);
			expect(resultData.members.users).toBe(data.selectedMembers);

			var callback = taskListMock.create.getCallback();
			
			// error handling
			callback('create error');
			expect(logMock.error).toHaveBeenCalledWith('Error creating task list', 'create error');
			expect(socketMock.emit).not.toHaveBeenCalled();

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
			expect(taskListMock.findById).toHaveBeenCalled();

			expect(taskListMock.findById.mostRecentCall.args[0]).toBe(data.taskListId);

			var callback = taskListMock.findById.getCallback();

			// error handling
			callback('find error');
			expect(logMock.error).toHaveBeenCalledWith('Error finding a task list', 'find error');

			// proceed to save
			var list = {
				tasks: [],
				save: jasmine.createSpy()
			};

			var expectedTaskList = {
				complete: false,
				createdById: socketMock.handshake.user._id,
				taskListId: data.taskListId,
				description: data.description
			};
			
			callback(null, list);
			expect(list.tasks).toContain(expectedTaskList);

			expect(list.save).toHaveBeenCalled();

			callback = list.save.getCallback();

			// error handling
			callback('save error');
			expect(logMock.error).toHaveBeenCalledWith('Error creating a task', 'save error');
			expect(socketMock.emit).not.toHaveBeenCalled();

			// respond
			callback(null, list);
			expect(socketMock.emit).toHaveBeenCalledWith('task_created', expectedTaskList);
		});
	});
});