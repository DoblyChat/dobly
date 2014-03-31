define(['squire'], function(Squire){
    'use strict';

    describe("archive", function() {
        var archive, desktop, routing, common, db,
            testCollaborationObjects = function() {
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
            var done = false;

            desktop = jasmine.createSpyObj('desktop', ['addAndActivate']);
            routing = jasmine.createSpyObj('routing', ['routeTo', 'subscribe']);
            common = jasmine.createSpyObj('common', ['delayedFocus']);
            
            db = {
                getCollaborationObjects: testCollaborationObjects
            };

            runs(function(){
                var injector = new Squire();
                injector.mock('client/routing', routing);
                injector.mock('client/common', common);
                injector.mock('client/collaboration-object.db', db);

                injector.require(['client/archive'], function(createArchive){
                    archive = createArchive(desktop, testCollaborationObjects);
                    done = true;
                });
            });

            waitsFor(function(){
                return done;
            });
        });

        it("initial state", function() {
            expect(archive.collaborationObjects()).toBeDefined();
            expect(archive.collaborationObjects().length).toBe(0);
            expect(archive.topicSearch()).toBe('');
            expect(archive.showing()).toBe(false);
        });

        it('subscribes to routing', function(){
            expect(routing.subscribe).toHaveBeenCalled();
            var args = routing.subscribe.mostRecentCall.args;

            expect(args[0]).toBe('archive');
            expect(args[1]).toBe(archive.showing);

            spyOn(archive, 'refresh');
            args[2]();
            expect(archive.refresh).toHaveBeenCalled();
            expect(common.delayedFocus).toHaveBeenCalledWith('#archive .search input');
        });

        it("open", function() {
            var collaborationObject = {};
            archive.open(collaborationObject);
            expect(routing.routeTo).toHaveBeenCalledWith('conversations');
            expect(desktop.addAndActivate).toHaveBeenCalledWith(collaborationObject);
        });

        it("refresh", function() {
            archive.refresh();

            expect(archive.collaborationObjects().length).toBe(4);
            expect(archive.collaborationObjects()[0].topic()).toEqual('abC');
            expect(archive.collaborationObjects()[1].topic()).toEqual('dEf');
            expect(archive.collaborationObjects()[2].topic()).toEqual('one');
            expect(archive.collaborationObjects()[3].topic()).toEqual('zero');
        });

        describe('performs a topic search', function(){
            beforeEach(function(){
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