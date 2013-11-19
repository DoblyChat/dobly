define(['client/archive'], function(createArchive){
    'use strict';

    describe("archive", function() {
        var archive;
        var desktop;
        var navigation;

        beforeEach(function() {
            desktop = jasmine.createSpyObj('desktop', ['addAndActivate']);
            navigation = jasmine.createSpyObj('navigation', ['desktop']);
            archive = createArchive(desktop, navigation, null);
        });

        it("create", function() {
            expect(archive.sortedCollaborationObjects).toBeDefined();
            expect(archive.sortedCollaborationObjects.length).toBe(0);
        });

        it("open", function() {
            var testConversation = {};
            
            archive.open(testConversation);

            expect(navigation.desktop).toHaveBeenCalled();
            expect(desktop.addAndActivate).toHaveBeenCalledWith(testConversation);
        });

        it("refresh", function() {
            var testCollaborationObjects = function() {
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

            archive = createArchive(null, null, testCollaborationObjects);

            archive.refresh();

            expect(archive.sortedCollaborationObjects.length).toBe(4);
            expect(archive.sortedCollaborationObjects[0].topic()).toEqual('abC');
            expect(archive.sortedCollaborationObjects[1].topic()).toEqual('dEf');
            expect(archive.sortedCollaborationObjects[2].topic()).toEqual('one');
            expect(archive.sortedCollaborationObjects[3].topic()).toEqual('zero');
        });
    });
});