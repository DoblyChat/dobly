define(['client/allConversations'], function(createAllConversations){
    'use strict';

    describe("all conversations", function() {
        var all;
        var desktop;
        var navigation;

        beforeEach(function() {
            desktop = jasmine.createSpyObj('desktop', ['addAndActivate']);
            navigation = jasmine.createSpyObj('navigation', ['desktop']);
            all = createAllConversations(desktop, navigation, null);
        });

        it("create", function() {
            expect(all.sortedConversations).toBeDefined();
            expect(all.sortedConversations.length).toBe(0);
        });

        it("open", function() {
            var testConversation = {};
            
            all.open(testConversation);

            expect(navigation.desktop).toHaveBeenCalled();
            expect(desktop.addAndActivate).toHaveBeenCalledWith(testConversation);
        });

        it("toggle messages", function() {
            spyOn(all, "toggle");
            var testConversation = {
                items: function() {
                    return [ 'a message', 'another message' ];
                }
            };
            
            var testEvent = {};

            all.toggleMessages(testConversation, testEvent);

            expect(all.toggle).toHaveBeenCalledWith('.messages', testEvent);
        });

        it("toggle no messages", function() {
            spyOn(all, "toggle");
            var testConversation = {
                items: function() {
                    return [ ];
                }
            };

            var testEvent = {};

            all.toggleMessages(testConversation, testEvent);

            expect(all.toggle).toHaveBeenCalledWith('.no-messages', testEvent);
        });

        it("refresh", function() {
            var testConversationsObservable = function() {
                return [
                    {
                        unreadCounter : function() { return 3; },
                        topic: function() { return 'dEf'; },
                    },
                    {
                        unreadCounter : function() { return 3; },
                        topic: function() { return 'abC'; },
                    },
                    {
                        unreadCounter : function() { return 0; },
                        topic: function() { return 'zero'; },
                    },
                    {
                        unreadCounter : function() { return 1; },
                        topic: function() { return 'one'; },
                    },
                ];
            };

            all = createAllConversations(null, null, testConversationsObservable);

            all.refresh();

            expect(all.sortedConversations.length).toBe(4);
            expect(all.sortedConversations[0].topic()).toEqual('abC');
            expect(all.sortedConversations[1].topic()).toEqual('dEf');
            expect(all.sortedConversations[2].topic()).toEqual('one');
            expect(all.sortedConversations[3].topic()).toEqual('zero');
        });
    });
});