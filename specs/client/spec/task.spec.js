define(['client/task', 'client/common'], function(createTask, common){
    'use strict';

    describe("task", function() {
        beforeEach(function(){
            spyOn(common, 'htmlEncode').andCallFake(function(string){
                return 'e-' + string;
            });

            app.groupUsers['u-idx'] = 'Her';
            app.groupUsers['u-id'] = 'Me';  

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
                completedById: 'u-idx'
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
            expect(task.processing()).toBe(false);
            expect(task.isEditing()).toBe(false);
            expect(task.updatedContent()).toBe(data.content);
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
                    spyOn(task, 'updateCompleteValues')
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
                _id: 't-id',
                collaborationObjectId: 'c-id',
                content: 'hello world'
            });

            expect(task.showDetails()).toBe(false);

            task.toggleDetails();

            expect(task.showDetails()).toBe(true);

            task.toggleDetails();

            expect(task.showDetails()).toBe(false);
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
                    _id: 't-id'
                });
            });

            it('starts editing', function(){
                task.startEdit();
                expect(task.isEditing()).toBe(true);
            });

            it('cancels edit', function(){
                var content = 'new content';

                task.isEditing(true);
                task.updatedContent(content);

                task.cancelEdit();
                expect(task.isEditing()).toBe(false);
                expect(task.updatedContent()).toBe(INITIAL_CONTENT);
            });

            describe('submit', function(){
                it('submits new content', function(){
                    task.updatedContent('new content');
                    
                    task.updateTaskContent();

                    expect(app.socket.emit).toHaveBeenCalledWith('update_task_content', { id: 't-id', content: 'new content' });
                    expect(task.content()).toBe('f-new content');
                    expect(task.rawContent).toBe('new content');
                });

                it('does not submit if task content has not been updated', function(){
                    task.updateTaskContent();
                    
                    expect(app.socket.emit).not.toHaveBeenCalled();

                    expect(task.content()).toBe('f-' + INITIAL_CONTENT);
                    expect(task.rawContent).toBe(INITIAL_CONTENT);
                });

                describe('on key press', function(){
                    var event;

                    beforeEach(function(){
                        spyOn(task, 'updateTaskContent');
                        event = {
                            shiftKey: false
                        };
                        spyOn(common, 'enterKeyPressed');
                    });

                    it('does not submit if shift key pressed', function(){
                        common.enterKeyPressed.andReturn(true);
                        event.shiftKey = true;
                        var ret = task.updateTaskContentKeyPress(null, event);
                        expect(task.updateTaskContent).not.toHaveBeenCalled();
                        expect(ret).toBe(true);
                    });

                    it('does not submit if enter not pressed', function(){
                        task.updatedContent('new content');
                        common.enterKeyPressed.andReturn(false);
                        var ret = task.updateTaskContentKeyPress(null, event);
                        expect(task.updateTaskContent).not.toHaveBeenCalled();
                        expect(ret).toBe(true);
                    });

                    it('does attempt submit when enter pressed', function(){
                        common.enterKeyPressed.andReturn(true);

                        var ret = task.updateTaskContentKeyPress(null, event);
                        expect(task.updateTaskContent).toHaveBeenCalled();
                        expect(ret).toBe(false);
                    });
                });
            });
        });
    });
});

