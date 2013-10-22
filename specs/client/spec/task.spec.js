define(['client/task', 'client/common'], function(createTask, common){
    'use strict';

    describe("task", function() {
        beforeEach(function(){
            spyOn(common, 'htmlEncode').andCallFake(function(string){
                return 'e-' + string;
            });

            app.socket = createMockSocket();
        });

        it("creates task", function() {
            var data = {
                content: "line 1\nline 2\nline 3",
                isComplete: true,
                _id: 'm-id'
            };

            var task = createTask(data);
            expect(task.content).toBe(common.formatUserInput("line 1\nline 2\nline 3"));
            expect(task.isComplete()).toBe(true);
            expect(task.id()).toBe('m-id');
        });

        describe('toggle task completion', function(){
            var event, checked;

            beforeEach(function(){
                event = {
                    target: {}
                }
            });

            it('completes a task', function(){
                var task = createTask({
                    _id: 't-id',
                    collaborationObjectId: 'c-id',
                    content: 'hello world'
                });

                event.target.checked = true;

                expect(task.toggleComplete(null, event)).toBe(true);
                expect(app.socket.emit).toHaveBeenCalledWith('toggle_complete_task', { 
                    id: 't-id',
                    collaborationObjectId: 'c-id',
                    isComplete: true
                });
            });

            it('marks a task as not complete', function(){
                var task = createTask({
                    _id: 't-id',
                    collaborationObjectId: 'c-id',
                    content: 'hello world'
                });

                event.target.checked = false;

                expect(task.toggleComplete(null, event)).toBe(true);
                expect(app.socket.emit).toHaveBeenCalledWith('toggle_complete_task', { 
                    id: 't-id',
                    collaborationObjectId: 'c-id',
                    isComplete: false
                });
            });
            
        });
    });
});

