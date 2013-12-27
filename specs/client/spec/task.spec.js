define(['client/task', 'client/common'], function(createTask, common){
    'use strict';

    describe("task", function() {
        beforeEach(function(){
            spyOn(common, 'htmlEncode').andCallFake(function(string){
                return 'e-' + string;
            });

            app.groupUsers['u-idx'] = 'Her';
            app.groupUsers['u-id'] = 'Me';
            app.groupUsers['a-id'] = 'Him';

            app.socket = createMockSocket();
        });

        it("creates task", function() {
            var data = {
                content: "line 1\nline 2\nline 3",
                isComplete: true,
                _id: 'm-id',
                timestamp: Date.parse('2012.04.09 22:13:34'), 
                completedOn: Date.parse('2012.05.09 22:13:34'), 
                createdById: 'u-id',
                completedById: 'u-idx',
                assignedToId: 'a-id'
            };

            var task = createTask(data);
            expect(task.content()).toBe(common.formatUserInput("line 1\nline 2\nline 3"));
            expect(task.rawContent).toBe(data.content);
            expect(task.isComplete()).toBe(true);
            expect(task.id()).toBe('m-id');
            expect(task.createdBy).toBe('Me');
            expect(task.completedBy()).toBe('Her');
            expect(task.completedOn()).toBeDefined();
            expect(task.completedOn()).toBe(common.formatTimestamp(data.completedOn));
            expect(task.timestamp()).toBeDefined();
            expect(task.timestamp()).toBe(data.timestamp);
            expect(task.formattedTimestamp()).toBe('4/9/2012 10:13 PM');
            expect(task.showDetails()).toBe(false);
            expect(task.showMenu()).toBe(false);
            expect(task.processing()).toBe(false);
            expect(task.isEditing()).toBe(false);
            expect(task.isAssigning()).toBe(false);
            expect(task.updatedContent()).toBe(data.content);
            expect(task.assignedTo()).toBe('Him');
            expect(task.assignedToId).toBe('a-id');
            expect(task.updatedAssignedToId()).toBe('a-id');
        });

        it("creates task without timestamp", function() {
            var data = {
                content: "line 1",
                isComplete: false,
                _id: 'm-id',
                createdById: 'u-id',
            };

            var task = createTask(data);
            expect(task.content()).toBe(common.formatUserInput("line 1"));
            expect(task.rawContent).toBe(data.content);
            expect(task.isComplete()).toBe(false);
            expect(task.id()).toBe('m-id');
            expect(task.createdBy).toBe('Me');
            expect(task.timestamp()).toBeNull();
            expect(task.formattedTimestamp()).toBe('');
        });

        it("computed formatted timestamp", function() {
            var data = {
                content: "line 1",
                isComplete: false,
                _id: 'm-id',
                createdById: 'u-id',
            };

            var task = createTask(data);

            task.timestamp(Date.parse('2012.10.09 22:13:34'));
            expect(task.formattedTimestamp()).toBe('10/9/2012 10:13 PM');
        });

        it('builds notification text', function(){
            var data = {
                content: 'new notification',
                createdById: 'u-id'
            };

            var task = createTask(data);
            expect(task.getNotificationText()).toBe('Me has added a new task: e-new notification');
        });

        describe('complete', function(){
            it('#updateCompleteValues', function(){
                var task = createTask({
                    _id: 't-id',
                    collaborationObjectId: 'c-id',
                    content: 'hello world',
                    timestamp: Date.parse('2013.05.09 22:13:34'),
                    isComplete: false
                });

                expect(task.isComplete()).toBe(false);
                expect(task.completedBy()).toBe(null);
                expect(task.completedOn()).toBe(null);

                var data = { 
                    isComplete: true,
                    completedById: 'u-id',
                    completedOn: Date.parse('2013.04.09 22:13:34')
                };

                task.updateCompleteValues(data);

                expect(task.isComplete()).toBe(true);
                expect(task.completedBy()).toBe('Me');
                expect(task.completedOn()).toBe(common.formatTimestamp(data.completedOn));
            });

            describe('#toggleComplete', function(){
                var checked;

                beforeEach(function(){
                    spyOn(common, 'formatTimestamp');                
                });

                it('completes a task', function(){
                    var task = createTask({
                        _id: 't-id',
                        collaborationObjectId: 'c-id',
                        content: 'hello world',
                        isComplete: false
                    });

                    expect(task.processing()).toBe(false);

                    expect(task.toggleComplete()).toBe(true);

                    var args = app.socket.emit.mostRecentCall.args;
                    expect(args[0]).toBe('toggle_complete_task');
                    expect(args[1]).toEqual({ 
                        id: 't-id',
                        collaborationObjectId: 'c-id',
                        isComplete: true
                    });
                    expect(task.processing()).toBe(true);

                    var data = {};
                    spyOn(task, 'updateCompleteValues');
                    args[2](data);
                    expect(task.updateCompleteValues).toHaveBeenCalledWith(data);
                    expect(task.processing()).toBe(false);
                });

                it('marks a task as not complete', function(){
                    var task = createTask({
                        _id: 't-id',
                        collaborationObjectId: 'c-id',
                        content: 'hello world',
                        isComplete: true
                    });

                    expect(task.toggleComplete(null, event)).toBe(true);
                    var args = app.socket.emit.mostRecentCall.args;
                    expect(args[0]).toBe('toggle_complete_task');
                    expect(args[1]).toEqual({ 
                        id: 't-id',
                        collaborationObjectId: 'c-id',
                        isComplete: false
                    });
                }); 
            });
        });  

        it('toggles show details', function(){
            spyOn(common, 'formatTimestamp');
            
            var task = createTask({
                content: 'hello world'
            });

            expect(task.showDetails()).toBe(false);

            task.toggleDetails();

            expect(task.showDetails()).toBe(true);

            task.toggleDetails();

            expect(task.showDetails()).toBe(false);
        });

        describe('menu', function(){
            var task;

            beforeEach(function(){
                spyOn(common, 'formatTimestamp');
            
                task = createTask({
                    content: 'hello world'
                });
            });
            
            it('shows menu', function(){
                expect(task.showMenu()).toBe(false);
                expect(task.menuHasFocus()).toBe(false);

                task.showPopupMenu();

                expect(task.showMenu()).toBe(true);
                expect(task.menuHasFocus()).toBe(true);
            });

            it('hides menu when focus is lost', function(){
                task.showMenu(true);
                task.menuHasFocus(true);

                task.menuHasFocus(false);

                expect(task.showMenu()).toBe(false);
            });
        });

        it('is updating', function(){
            var task = createTask({
                content: 'hello world'
            });

            task.isEditing(false);
            task.isAssigning(false);
            expect(task.isUpdating()).toBe(false);

            task.isEditing(true);
            expect(task.isUpdating()).toBe(true);

            task.isEditing(false);
            task.isAssigning(true);
            expect(task.isUpdating()).toBe(true);

            task.isEditing(true);
            expect(task.isUpdating()).toBe(true);
        });

        describe('updates on key press', function(){
            var event, task;

            beforeEach(function(){
                task = createTask({
                    content: 'updating on key press'
                });

                spyOn(task, 'update');
                event = {
                    shiftKey: false
                };
                spyOn(common, 'enterKeyPressed');
            });

            it('does not update if shift key pressed', function(){
                common.enterKeyPressed.andReturn(true);
                event.shiftKey = true;
                var ret = task.updateKeyPress(null, event);
                expect(task.update).not.toHaveBeenCalled();
                expect(ret).toBe(true);
            });

            it('does not update if enter not pressed', function(){
                task.updatedContent('new content');
                common.enterKeyPressed.andReturn(false);
                var ret = task.updateKeyPress(null, event);
                expect(task.update).not.toHaveBeenCalled();
                expect(ret).toBe(true);
            });

            it('does attempt update when enter pressed', function(){
                common.enterKeyPressed.andReturn(true);

                var ret = task.updateKeyPress(null, event);
                expect(task.update).toHaveBeenCalled();
                expect(ret).toBe(false);
            });
        });

        describe('edit', function(){
            var task, 
                INITIAL_CONTENT = 'initial content';

            beforeEach(function(){
                spyOn(common, 'formatTimestamp');
                spyOn(common, 'formatUserInput').andCallFake(function(input){
                    return 'f-' + input;
                });

                task = createTask({ 
                    content: INITIAL_CONTENT,
                    _id: 't-id',
                    collaborationObjectId: 'c-id'
                });
            });

            it('starts editing', function(){
                task.startEdit();
                expect(task.isEditing()).toBe(true);
                expect(task.showMenu()).toBe(false);
            });

            it('cancels edit', function(){
                var content = 'new content';

                task.isEditing(true);
                task.updatedContent(content);

                task.cancel();
                expect(task.isEditing()).toBe(false);
                expect(task.updatedContent()).toBe(INITIAL_CONTENT);
            });

            describe('update content', function(){
                beforeEach(function(){
                    task.isEditing(true);
                });

                it('updates new content', function(){
                    task.updatedContent('new content');
                    
                    task.update();

                    expect(app.socket.emit).toHaveBeenCalledWith('update_task_content', { 
                        id: 't-id', 
                        content: 'new content',
                        collaborationObjectId: 'c-id'
                    });

                    expect(task.content()).toBe('f-new content');
                    expect(task.rawContent).toBe('new content');
                });

                it('does not update if task content has not been updated', function(){
                    task.update();
                    
                    expect(app.socket.emit).not.toHaveBeenCalled();

                    expect(task.content()).toBe('f-' + INITIAL_CONTENT);
                    expect(task.rawContent).toBe(INITIAL_CONTENT);
                });
            });
        });

        describe('assign', function(){
            var task;

            beforeEach(function(){
                spyOn(common, 'formatTimestamp');
                spyOn(common, 'formatUserInput').andCallFake(function(input){
                    return 'f-' + input;
                });

                task = createTask({ 
                    _id: 't-id',
                    collaborationObjectId: 'c-id',
                    assignedToId: 'a-id'
                });
            });

            it('starts assigning', function(){
                expect(task.isAssigning()).toBe(false);
                task.startAssign();
                expect(task.isAssigning()).toBe(true);
                expect(task.showMenu()).toBe(false);
            });

            it('cancels assigning', function(){
                task.updatedAssignedToId('new id');
                task.isAssigning(true);

                task.cancel();

                expect(task.updatedAssignedToId()).toBe('a-id');
                expect(task.isAssigning()).toBe(false);
            });

            describe('updates assignment', function(){
                beforeEach(function(){
                    app.groupUsers['new'] = 'Newington';
                    task.isAssigning(true);
                });

                it('assigns new user to task', function(){
                    task.updatedAssignedToId('new');
                    
                    task.update();

                    expect(app.socket.emit).toHaveBeenCalledWith('assign_task', { 
                        id: 't-id', 
                        assignedToId: 'new',
                        collaborationObjectId: 'c-id'
                    });

                    expect(task.assignedTo()).toBe('Newington');
                    expect(task.assignedToId).toBe('new');
                });

                it('does not assign if new user has not been selected', function(){
                    task.update();
                    
                    expect(app.socket.emit).not.toHaveBeenCalled();

                    expect(task.assignedTo()).toBe('Him');
                    expect(task.assignedToId).toBe('a-id');
                });
            });
        });
    });
});

