define(['squire', 'knockout'], function(Squire, ko){
    'use strict';

    describe('Task list', function(){
        var createTaskList, createTaskMock,
            taskList, socketMock, groupMock;

        beforeEach(function(){
            var done = false;

            var createCollaborationObjectMock = function(data, template){
                return {
                    init: jasmine.createSpy('init'),
                    addNewItem: jasmine.createSpy('add'),
                    data: data,
                    template: template,
                    items: ko.observableArray([]),
                    id: 'list-id'
                };
            };

            createTaskMock = jasmine.createSpy('create-task');
            socketMock = createMockSocket();
            groupMock = {
                users: [ 'my', 'users']
            };

            runs(function(){
                var injector = new Squire();

                injector.mock('client/collaboration-object', function(){
                    return createCollaborationObjectMock;
                });

                injector.mock('client/task', function(){
                    return createTaskMock;
                });

                injector.mock('client/socket', socketMock);

                injector.mock('client/group', groupMock);

                injector.require(['client/task-list'], function(createTaskListFn){
                    createTaskList = createTaskListFn;
                    done = true;
                });
            });

            waitsFor(function(){
                return done;
            });

            runs(function(){
                taskList = createTaskList({
                    da: 'ta' 
                }, groupMock);
            });
        });

        describe('creation', function(){
            it('sets template', function(){
                expect(taskList.template).toBe('task-list-template');
            });

            it('initializes', function(){
                var itemData = {};
                expect(taskList.init).toHaveBeenCalled();
                taskList.init.mostRecentCall.args[0](itemData);
                expect(createTaskMock).toHaveBeenCalledWith(itemData);
            });

            it('sets users', function(){
                expect(taskList.users).toBe(groupMock.users);
            });

            it('sets icon class', function(){
                expect(taskList.iconClass).toBe('icon-task-list');
            });
        });

        describe('add task', function(){
            it('defines function based on template', function(){
                expect(taskList.addNewItem).toHaveBeenCalled();
            });

            it('defines a way to create the task', function(){
                var createFunc = taskList.addNewItem.mostRecentCall.args[0],
                    data = {},
                    taskObj = {
                        processing: jasmine.createSpy('processing')
                    };

                createTaskMock.andReturn(taskObj);
                createFunc(data);

                expect(createTaskMock).toHaveBeenCalledWith(data);
                expect(taskObj.processing).toHaveBeenCalledWith(true);
            });

            it('defines a way to send to server', function(){
                var sendToServer = taskList.addNewItem.mostRecentCall.args[1],
                    taskData = { task: 'data' },
                    taskObj = {
                        id: jasmine.createSpy('id'),
                        processing: jasmine.createSpy('processing'),
                        timestamp: jasmine.createSpy()
                    };

                sendToServer(taskData, taskObj);
                expect(socketMock.emit).toHaveBeenCalled();
                var args = socketMock.emit.mostRecentCall.args;
                expect(args[0]).toBe('add_task');
                expect(args[1]).toBe(taskData);

                var now = new Date();
                var callback = args[2];
                callback({ _id: 'task-id', timestamp: now });
                expect(taskObj.id).toHaveBeenCalledWith('task-id');
                expect(taskObj.processing).toHaveBeenCalledWith(false);
                expect(taskObj.timestamp).toHaveBeenCalledWith(now);
            });
        });

        describe('remove task', function(){
            var task;

            beforeEach(function(){
                spyOn(window, 'confirm');
                task = { name: 'my-task', id: function() { return 123; } };
            });

            it('asks user to confirm', function(){
                taskList.removeTask(task);
                expect(window.confirm).toHaveBeenCalledWith('Are you sure you would like to remove this task?');
            });

            it('removes task if user confirms action', function(){
                taskList.items.push(task);
                window.confirm.andReturn(true);

                taskList.removeTask(task);
                expect(taskList.items().length).toBe(0);
                expect(socketMock.emit).toHaveBeenCalledWith('remove_task', { id: 123, collaborationObjectId: 'list-id' });
            });

            it('does not remove task if not confirmed', function(){
                taskList.items.push(task);
                window.confirm.andReturn(false);

                taskList.removeTask(task);
                expect(taskList.items().length).toBe(1);
                expect(socketMock.emit).not.toHaveBeenCalled();
            });
        });
    });
});