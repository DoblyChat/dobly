define(['squire'], function(Squire){
    'use strict';

    describe('events', function(){
        var builderMock, socketMock, notificationsMock, 
        dbMock, events, collaborationObject, unreadMock;

        beforeEach(function(){
            var done = false;

            builderMock = {
                item: jasmine.createSpy('build-item')
            };

            notificationsMock = {
                showDesktopNotification: jasmine.createSpy('show-desktop-notification')
            };

            socketMock = createMockSocket();

            dbMock = (function(){
                var _collaborationObjects = [];

                return {
                    addCollaborationObject: jasmine.createSpy('add-collab-obj'),
                    getCollaborationObjects: function(){
                        return _collaborationObjects;
                    }
                };
            })();

            unreadMock = {
                update: jasmine.createSpy('show-unread'),
                subscribeToMarkAsRead: jasmine.createSpy('unread-subscribe')
            };

            app.desktop = {
                add: jasmine.createSpy('add'),
                addAndActivate: jasmine.createSpy('add-and-activate'),
                ui: {
                    scroll: {
                        bottomTile: jasmine.createSpy('bottom-tile')
                    }
                }
            };

            setup();
            
            runs(function(){
                var injector = new Squire();

                injector.mock('client/builder', builderMock);
                injector.mock('client/socket', socketMock);
                injector.mock('client/collaboration-object.db', dbMock);
                injector.mock('client/notifications', notificationsMock);
                injector.mock('client/unread', unreadMock);

                injector.require(['client/events'], function(eventsObj){
                    events = eventsObj;
                    
                    done = true;
                });
            });

            waitsFor(function(){
                return done;
            });
        });
        
        function buildItem(baseId){
            var id = 'it-' + Math.random() + baseId;
            return {
                id: function(){
                    return id;
                }
            };
        }

        function buildCollaborationObjectMock(id){
            var obj = {
                id: id,
                addItem: jasmine.createSpy(id + '-add-item')
            };

            var _items = [ buildItem(id), buildItem(id) ];

            obj.items = function(){
                return _items;
            };

            return obj;
        }

        function setup(){
            dbMock.getCollaborationObjects().push(buildCollaborationObjectMock('a-id'));
            dbMock.getCollaborationObjects().push(buildCollaborationObjectMock('b-id'));

            collaborationObject = buildCollaborationObjectMock('c-id');
            dbMock.getCollaborationObjects().push(collaborationObject);
            collaborationObject.type = 'type';
        }

        describe('subscribe', function(){
            it('automatically subscribes to collaboration objects', function(){
                expect(socketMock.emit).toHaveBeenCalledWith('subscribe_to_collaboration_objects', [ 'a-id', 'b-id', 'c-id' ]);
            });

            it('subscribes again on reconnect', function(){
                dbMock.getCollaborationObjects().push(buildCollaborationObjectMock('d-id'));
                socketMock.mockEmit('reconnect');
                expect(socketMock.emit).toHaveBeenCalledWith('subscribe_to_collaboration_objects', [ 'a-id', 'b-id', 'c-id', 'd-id']);
            });

        });

        describe('receive_item', function(){
            it('adds item to the appropriate collaboration object', function(){
                var data = {
                    collaborationObjectId: 'c-id'
                };

                var item = { 
                    id: 'item-id',
                    getNotificationText: function(){
                        return 'my-new-item';
                    } 
                };

                builderMock.item.andReturn(item);

                socketMock.mockEmit('receive_item', data);

                expect(builderMock.item).toHaveBeenCalledWith('type', data);
                expect(collaborationObject.addItem).toHaveBeenCalledWith(item);
                expect(notificationsMock.showDesktopNotification).toHaveBeenCalledWith(collaborationObject, 'my-new-item');
                expect(app.desktop.add).toHaveBeenCalledWith(collaborationObject);
                expect(unreadMock.update).toHaveBeenCalled();
            });

            it('does nothing if item does not belong to any current collaboration object', function(){
                var data = { 
                    collaborationObjectId: '1-id'
                };

                socketMock.mockEmit('receive_item', data);
                expect(builderMock.item).not.toHaveBeenCalled();
            });
        });

        describe('task_complete_toggled', function(){
            var task;

            beforeEach(function(){
                task = buildItem('c-id');
                task.updateCompleteValues = jasmine.createSpy('update-complete-values');
                collaborationObject.items().push(task);
            });

            it('updates complete values', function(){
                var data = {
                    collaborationObjectId: 'c-id',
                    id: task.id()
                };

                socketMock.mockEmit('task_complete_toggled', data);

                expect(task.updateCompleteValues).toHaveBeenCalledWith(data);
            });

            it('does nothing if item not found', function(){
                var data = {
                    collaborationObjectId: 'c-id',
                    id: 'another-id'
                };

                expect(function(){
                    socketMock.mockEmit('task_complete_toggled', data);
                }).not.toThrow();
            });

            it('does nothing if collaboration object not found', function(){
                var data = {
                    collaborationObjectId: 'x-id',
                    id: task.id()
                };

                expect(function(){
                    socketMock.mockEmit('task_complete_toggled', data);
                }).not.toThrow();

                expect(task.updateCompleteValues).not.toHaveBeenCalled();
            });
        });

        describe('task_content_updated', function(){
            var task;

            beforeEach(function(){
                task = buildItem('c-id');
                task.setContent = jasmine.createSpy('set-content');
                collaborationObject.items().push(task);
            });

            it('updates content', function(){
                var data = {
                    collaborationObjectId: 'c-id',
                    id: task.id(),
                    content: 'hello-world'
                };

                socketMock.mockEmit('task_content_updated', data);

                expect(task.setContent).toHaveBeenCalledWith('hello-world');
            });

            it('does nothing if item not found', function(){
                var data = {
                    collaborationObjectId: 'c-id',
                    id: 'another-id'
                };

                expect(function(){
                    socketMock.mockEmit('task_content_updated', data);
                }).not.toThrow();
            });

            it('does nothing if collaboration object not found', function(){
                var data = {
                    collaborationObjectId: 'x-id',
                    id: task.id()
                };

                expect(function(){
                    socketMock.mockEmit('task_content_updated', data);
                }).not.toThrow();

                expect(task.setContent).not.toHaveBeenCalled();
            });
        });

        describe('task_removed', function(){
            var task;

            beforeEach(function(){
                task = buildItem('c-id');
                collaborationObject.items.remove = jasmine.createSpy('remove-item');
                collaborationObject.items().push(task);
            });

            it('removes task', function(){
                var data = {
                    collaborationObjectId: 'c-id',
                    id: task.id()
                };

                socketMock.mockEmit('task_removed', data);

                expect(collaborationObject.items.remove).toHaveBeenCalledWith(task);
            });

            it('does nothing if item not found', function(){
                var data = {
                    collaborationObjectId: 'c-id',
                    id: 'another-id'
                };

                expect(function(){
                    socketMock.mockEmit('task_removed', data);
                }).not.toThrow();

                expect(collaborationObject.items.remove).not.toHaveBeenCalled();
            });

            it('does nothing if collaboration object not found', function(){
                var data = {
                    collaborationObjectId: 'x-id',
                    id: task.id()
                };

                expect(function(){
                    socketMock.mockEmit('task_removed', data);
                }).not.toThrow();
            });
        });

        describe('task_assigned', function(){
            var task;

            beforeEach(function(){
                task = buildItem('c-id');
                task.setAssignedTo = jasmine.createSpy('set-assigned-to');
                collaborationObject.items().push(task);
            });

            it('assigns task', function(){
                var data = {
                    collaborationObjectId: 'c-id',
                    id: task.id(),
                    assignedToId: 'a-id'
                };

                socketMock.mockEmit('task_assigned', data);

                expect(task.setAssignedTo).toHaveBeenCalledWith('a-id');
            });

            it('does nothing if item not found', function(){
                var data = {
                    collaborationObjectId: 'c-id',
                    id: 'another-id'
                };

                expect(function(){
                    socketMock.mockEmit('task_assigned', data);
                }).not.toThrow();
            });

            it('does nothing if collaboration object not found', function(){
                var data = {
                    collaborationObjectId: 'x-id',
                    id: task.id()
                };

                expect(function(){
                    socketMock.mockEmit('task_assigned', data);
                }).not.toThrow();

                expect(task.setAssignedTo).not.toHaveBeenCalled();
            });
        });
    
        describe('new collaboration object', function(){
            var data, newObj;

            beforeEach(function(){
                data = { id: 'n-id' };
                newObj = buildCollaborationObjectMock('n-id');
                dbMock.addCollaborationObject.andReturn(newObj);
            });

            it('adds a new collaboration object from current user', function(){
                newObj.hasFocus = jasmine.createSpy('has-focus');
                socketMock.mockEmit('my_new_collaboration_object', data);

                expect(dbMock.addCollaborationObject).toHaveBeenCalledWith(data);
                expect(app.desktop.addAndActivate).toHaveBeenCalledWith(newObj);
                expect(app.desktop.ui.scroll.bottomTile).toHaveBeenCalled();
                expect(newObj.hasFocus).toHaveBeenCalledWith(true);
                expect(unreadMock.subscribeToMarkAsRead).toHaveBeenCalledWith(newObj);
            });

            it('adds a new collaboration object from a different user', function(){
                socketMock.mockEmit('new_collaboration_object', data);
                expect(dbMock.addCollaborationObject).toHaveBeenCalledWith(data);
                expect(app.desktop.add).toHaveBeenCalledWith(newObj);
                expect(unreadMock.subscribeToMarkAsRead).toHaveBeenCalledWith(newObj);
            });
        });
    });
});