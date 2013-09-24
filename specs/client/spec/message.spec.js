define(['client/message', 'client/common'], function(createMessage, common){
    'use strict';

    describe("message", function() {
        beforeEach(function(){
            spyOn(common, 'htmlEncode').andCallFake(function(string){
                return 'e-' + string;
            });
            app.groupUsers["SO"] = "Someone Else";
        });

        it("creates message", function() {
            var data = {
                content: "line 1\nline 2\nline 3", 
                conversationId: "123", 
                timestamp: Date.parse('2013.04.09 22:13:34'), 
                createdById: "SO",
                _id: 'm-id'
            };

            var message = createMessage(data, true);
            expect(message.content).toBe(common.formatUserInput("line 1\nline 2\nline 3"));
            expect(message.rawContent).toBe('line 1\nline 2\nline 3');
            expect(message.timestamp).toBe(common.formatTimestamp(data.timestamp));
            expect(message.createdBy).toBe('Someone Else');
            expect(message.simpleTimestamp).toBe(common.formatTimestamp(data.timestamp));
            expect(message.confirmedSent()).toBe(true);
            expect(message.id()).toBe('m-id');
        });
    });
});

