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

        it('can be completed', function(){
            var task = createTask({
                _id: 't-id',
                content: 'to be completed',
                isComplete: true,
                collaborationObjectId: 'c-id'
            });

            expect(task.complete()).toBe(true);
            expect(app.socket.emit).toHaveBeenCalledWith('complete_task', { 
                id: 't-id',
                collaborationObjectId: 'c-id'
            });
        });
    });
});

