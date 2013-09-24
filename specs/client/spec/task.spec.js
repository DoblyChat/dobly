define(['client/task', 'client/common'], function(createTask, common){
    'use strict';

    describe("task", function() {
        beforeEach(function(){
            spyOn(common, 'htmlEncode').andCallFake(function(string){
                return 'e-' + string;
            });
        });

        it("creates task", function() {
            var data = {
                description: "line 1\nline 2\nline 3",
                complete: true,
                _id: 'm-id'
            };

            var task = createTask(data);
            expect(task.description).toBe(common.formatUserInput("line 1\nline 2\nline 3"));
            expect(task.complete).toBe(true);
            expect(task.id()).toBe('m-id');
        });
    });
});

