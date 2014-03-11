define(['squire', 'client/common'], function(Squire, common){
    'use strict';

    describe("message", function() {
        var groupMock, createMessage;

        beforeEach(function(){
            spyOn(common, 'htmlEncode').andCallFake(function(string){
                return 'e-' + string;
            });

            groupMock = {
                getUserFullName: jasmine.createSpy().andReturn("Someone Else")
            };

            var done = false;

            runs(function(){
                var injector = new Squire();
                injector.mock('client/group', groupMock);
                injector.mock('client/common', common);

                injector.require(['client/message'], function(createMessageFunc){
                    createMessage = createMessageFunc;
                    done = true;
                });
            });

            waitsFor(function(){
                return done;
            });
        });

        it("creates message", function() {
            var data = {
                content: "line 1\nline 2\nline 3", 
                conversationId: "123", 
                createdById: "SO-u",
                _id: 'm-id'
            };

            var message = createMessage(data, true);
            expect(message.content).toBe(common.formatUserInput("line 1\nline 2\nline 3"));
            expect(message.rawContent).toBe('line 1\nline 2\nline 3');
            expect(message.timestamp()).toBeNull();
            expect(message.formattedTimestamp()).toBe('');
            expect(groupMock.getUserFullName).toHaveBeenCalledWith('SO-u');
            expect(message.createdBy).toBe('Someone Else');
            expect(message.confirmedSent()).toBe(true);
            expect(message.id()).toBe('m-id');
        });

        it("creates message with timestamp", function() {
            var data = {
                content: "line 1\nline 2\nline 3", 
                conversationId: "123", 
                createdById: "SO-u",
                _id: 'm-id',
                timestamp: Date.parse('2012.04.09 22:13:34'),
            };

            var message = createMessage(data, true);
            expect(message.content).toBe(common.formatUserInput("line 1\nline 2\nline 3"));
            expect(message.rawContent).toBe('line 1\nline 2\nline 3');
            expect(message.timestamp()).toBe(data.timestamp);
            expect(message.formattedTimestamp()).toBe('4/9/2012 10:13 PM');
            expect(groupMock.getUserFullName).toHaveBeenCalledWith('SO-u');
            expect(message.createdBy).toBe('Someone Else');
            expect(message.confirmedSent()).toBe(true);
            expect(message.id()).toBe('m-id');
        });

        it("computed formatted timestamp", function() {
            var data = {
                content: "hello", 
                conversationId: "123", 
                createdById: "X",
                _id: 'm-id'
            };

            var message = createMessage(data, true);

            message.timestamp(Date.parse('2012.04.09 22:13:34'));
            expect(message.formattedTimestamp()).toBe('4/9/2012 10:13 PM');
        });

        it('builds a notification message', function(){
            var data = {
                content: 'new notification',
                createdById: 'SO-u'
            };

            var message = createMessage(data, true);
            expect(message.getNotificationText()).toBe('Someone Else: e-new notification');
        });
    });
});

