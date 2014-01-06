define(['client/archive'], function(createArchive){
    'use strict';

    describe("archive", function() {
        var archive, desktop, navigation, testCollaborationObjects = function() {
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

        beforeEach(function() {
            desktop = jasmine.createSpyObj('desktop', ['addAndActivate']);
            navigation = jasmine.createSpyObj('navigation', ['desktop']);
            archive = createArchive(desktop, navigation, null);
        });

        it("create", function() {
            expect(archive.collaborationObjects()).toBeDefined();
            expect(archive.collaborationObjects().length).toBe(0);
            expect(archive.topicSearch()).toBe('');
        });

        it("open", function() {
            var collaborationObject = {};
            
            archive.open(collaborationObject);

            expect(navigation.desktop).toHaveBeenCalled();
            expect(desktop.addAndActivate).toHaveBeenCalledWith(collaborationObject);
        });

        it("refresh", function() {
            archive = createArchive(null, null, testCollaborationObjects);

            archive.refresh();

            expect(archive.collaborationObjects().length).toBe(4);
            expect(archive.collaborationObjects()[0].topic()).toEqual('abC');
            expect(archive.collaborationObjects()[1].topic()).toEqual('dEf');
            expect(archive.collaborationObjects()[2].topic()).toEqual('one');
            expect(archive.collaborationObjects()[3].topic()).toEqual('zero');
        });

        describe('performs a topic search', function(){
            beforeEach(function(){
                archive = createArchive(null, null, testCollaborationObjects);
                archive.refresh();
            });

            it('filters topics by found keyword', function(){
                archive.topicSearch('zero');
                expect(archive.collaborationObjects().length).toBe(1);
                expect(archive.collaborationObjects()[0].topic()).toBe('zero');

                archive.topicSearch('e');
                expect(archive.collaborationObjects().length).toBe(3);
                expect(archive.collaborationObjects()[0].topic()).toBe('dEf');
                expect(archive.collaborationObjects()[1].topic()).toBe('one');
                expect(archive.collaborationObjects()[2].topic()).toBe('zero');
            });

            it('clears out list if no match is found', function(){
                archive.topicSearch('x');
                expect(archive.collaborationObjects().length).toBe(0);
            });

            it('reverts to full list when search criteria is cleared', function(){
                archive.topicSearch('one');
                expect(archive.collaborationObjects().length).toBe(1);

                archive.topicSearch('');
                expect(archive.collaborationObjects().length).toBe(4);
            });
        });
    });
});