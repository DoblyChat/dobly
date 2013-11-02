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
                timestamp: Date.parse('2013.04.09 22:13:34'), 
                completedOn: Date.parse('2013.05.09 22:13:34'), 
                createdById: 'u-id',
                completedById: 'u-idx'
            };

            var task = createTask(data);
            expect(task.content).toBe(common.formatUserInput("line 1\nline 2\nline 3"));
            expect(task.isComplete()).toBe(true);
            expect(task.id()).toBe('m-id');
            expect(task.createdBy).toBe('Me');
            expect(task.completedBy()).toBe('Her');
            expect(task.completedOn()).toBeDefined();
            expect(task.completedOn()).toBe(common.formatTimestamp(data.completedOn));
            expect(task.timestamp).toBeDefined();
            expect(task.timestamp).toBe(common.formatTimestamp(data.timestamp));
            expect(task.showDetails()).toBe(false);
        });

        describe('toggle task completion', function(){
            var event, checked;

            beforeEach(function(){
                event = {
                    target: {}
                }

                spyOn(common, 'formatTimestamp');
            });

            it('completes a task', function(){
                var task = createTask({
                    _id: 't-id',
                    collaborationObjectId: 'c-id',
                    content: 'hello world'
                });

                event.target.checked = true;

                expect(task.toggleComplete(null, event)).toBe(true);
                var args = app.socket.emit.mostRecentCall.args;
                expect(args[0]).toBe('toggle_complete_task');
                expect(args[1]).toEqual({ 
                    id: 't-id',
                    collaborationObjectId: 'c-id',
                    isComplete: true
                });

                var data = {};
                spyOn(task, 'updateCompleteValues')
                args[2](data);
                expect(task.updateCompleteValues).toHaveBeenCalledWith(data);
            });

            it('marks a task as not complete', function(){
                var task = createTask({
                    _id: 't-id',
                    collaborationObjectId: 'c-id',
                    content: 'hello world'
                });

                event.target.checked = false;

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

        it('updates complete values', function(){
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
    });
});

