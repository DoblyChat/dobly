define(['knockout', 'client/conversation.search', 'client/common'], function(ko, createConversationSearch, common){
    'use strict';

    describe("conversation search", function() {

        var conversation;
        var search;

        function createConversation(items){
            return {
                items: ko.observableArray(items),
                allMessagesLoaded: jasmine.createSpy(),
                ui: {
                    scroll: {}
                },
                page: jasmine.createSpy(),
                loadingMore: ko.observable(false)
            };
        }

        beforeEach(function() {
            conversation = createConversation([ testDataMessageAlpha(), testDataMessageBeta(), testDataMessageCharlie(), testDataMessageDelta() ]);
            search = createConversationSearch(conversation);
        });

        it("creation", function() {
            expect(search.matches.length).toBe(0);
            expect(search.query()).toEqual('');
            expect(search.exhausted()).toBe(false);
            expect(search.searching()).toBe(false);
        });

        it("done", function() {
            spyOn(search, "reset");
            conversation.ui.hideSearch = jasmine.createSpy();

            search.done();

            expect(search.query()).toEqual('');
            expect(search.reset).toHaveBeenCalled();
            expect(conversation.ui.hideSearch).toHaveBeenCalled();
        });

        it("show", function() {
            conversation.ui.showSearch = jasmine.createSpy();

            search.show();

            expect(conversation.ui.showSearch).toHaveBeenCalled();
        });

        describe("next", function() {

            beforeEach(function() {
                conversation.ui.resizeBodyFromHeaderChange = jasmine.createSpy();
            });

            it("does not search when empty", function() {           
                search.query('');
                search.next();

                expect(search.exhausted()).toBe(false);
                expect(search.matches.length).toBe(0);
            });

            it("resets", function() {
                conversation.allMessagesLoaded.andReturn(true);
                search.query('some');
                var match = jasmine.createSpyObj('match', ['removeClass', 'removeHighlight']);
                search.matches.push(match);
                search.foundMessage.id = 'z';
                search.foundMessage.offset = 10;
                spyOn(search, "reset").andCallThrough();

                search.next();

                expect(search.matches.length).toBe(0);
                expect(match.removeClass).toHaveBeenCalled();
                expect(match.removeHighlight).toHaveBeenCalled();
                expect(search.foundMessage.id).toEqual('');
                expect(search.foundMessage.offset).toBe(-1);
                expect(conversation.ui.resizeBodyFromHeaderChange).toHaveBeenCalled();
                expect(search.reset).toHaveBeenCalled();
            });

            it("does not reset", function() {
                conversation.allMessagesLoaded.andReturn(true);
                spyOn(search, "scrollToMatchAndHighlight");

                search.query('beta');
                search.next();

                spyOn(search, "reset");
                search.next();

                expect(search.reset).not.toHaveBeenCalled();
            });

            it("finds next", function() {
                spyOn(search, "scrollToMatchAndHighlight");

                search.query('beta');
                search.next();

                expect(search.scrollToMatchAndHighlight).toHaveBeenCalled();
                expect(conversation.ui.resizeBodyFromHeaderChange).toHaveBeenCalled();
                expect(search.searching()).toBe(false);
                expect(search.foundMessage.id).toEqual('b');
                expect(search.foundMessage.offset).toBe(3);
            });

            it("does not find next", function() {
                search.query('zeta');
                search.next();

                expect(search.matches.length).toBe(0);
                expect(search.foundMessage.id).toEqual('');
                expect(search.foundMessage.offset).toBe(-1);
            });

            it("pages if next not found", function() {
                spyOn(search, "page");
                conversation.allMessagesLoaded = jasmine.createSpy().andReturn(false);

                search.query('zeta');
                search.next();

                expect(search.page).toHaveBeenCalled();
            });

            it("does not page", function() {
                spyOn(search, "page");
                conversation.allMessagesLoaded = jasmine.createSpy().andReturn(true);

                search.query('zeta');
                search.next();

                expect(search.page).not.toHaveBeenCalled();
            });

            it("pages", function() {
                spyOn(search, "next");
                conversation.ui.scroll.adjust = jasmine.createSpy();

                app.socket = createMockSocket();

                search.page();

                expect(conversation.page).toHaveBeenCalled();
                expect(conversation.loadingMore()).toBe(true);

                var callback = conversation.page.mostRecentCall.args[0];
                callback();

                expect(conversation.loadingMore()).toBe(false);
                expect(conversation.ui.scroll.adjust).toHaveBeenCalled();
                expect(search.next).toHaveBeenCalled();
            });

            it("next on enter false", function() {
                spyOn(common, 'enterKeyPressed').andReturn(false);
                spyOn(search, "next");

                var returnValue = search.nextOnEnter(null, {});

                expect(search.next).not.toHaveBeenCalled();
                expect(returnValue).toBe(true);
            });

            it("next on enter true", function() {
                spyOn(common, 'enterKeyPressed').andReturn(true);
                spyOn(search, "next");

                var returnValue = search.nextOnEnter(null, {});

                expect(search.next).toHaveBeenCalled();
                expect(returnValue).toBe(false);
            });
        });

        describe("previous", function() {
            beforeEach(function() {
                conversation = createConversation([ testDataMessageAlpha(), testDataMessageAlpha2(), testDataMessageCharlie(), testDataMessageDelta() ]);
                search = createConversationSearch(conversation);
                conversation.ui.resizeBodyFromHeaderChange = jasmine.createSpy();
                spyOn(search, "scrollToMatchAndHighlight");
            });

            it("does not search when empty", function() {           
                search.query('');
                search.prev();

                expect(search.exhausted()).toBe(false);
                expect(search.matches.length).toBe(0);
            });

            it("resets", function() {
                search.query('some');
                spyOn(search, "reset");

                search.prev();
                expect(search.reset).toHaveBeenCalled();
            });

            it("does not reset", function() {
                search.query('beta');
                search.prev();

                spyOn(search, "reset");
                search.prev();

                expect(search.reset).not.toHaveBeenCalled();
            });

            it("finds previous", function() {           
                search.query('alpha');

                search.next();
                expect(search.foundMessage.id).toEqual('a2');

                search.next();
                expect(search.foundMessage.id).toEqual('a');

                search.prev();
                expect(search.foundMessage.id).toEqual('a2');
            });

            it("does not find previous", function() {           
                search.query('alpha');

                search.next();
                expect(search.foundMessage.id).toEqual('a2');

                search.prev();
                expect(search.foundMessage.id).toEqual('a2');
            });
        });

        function testDataMessageAlpha() {
            return {
                id: ko.observable('a'),
                rawContent: "alpha", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 22:13:34'), 
                createdById: "CA-u"
            };
        }

        function testDataMessageAlpha2() {
            return {
                id: ko.observable('a2'),
                rawContent: "alpha", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 22:13:34'), 
                createdById: "CA-u"
            };
        }

        function testDataMessageBeta() {
            return {
                id: ko.observable('b'),
                rawContent: "beta", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 22:14:14'), 
                createdById: "FT-u"
            };
        }

        function testDataMessageCharlie() {
            return {
                id: ko.observable('c'),
                rawContent: "charlie", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 22:15:23'), 
                createdById: "CA-u"
            };
        }

        function testDataMessageDelta() {
            return {
                id: ko.observable('d'),
                rawContent: "delta", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 23:18:44'), 
                createdById: "FT-u"
            };
        }

        function testDataMessageEcho() {
            return {
                id: ko.observable('e'),
                rawContent: "echo", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 22:15:23'), 
                createdBy: "CA-u"
            };
        }

        function testDataMessageFoxtrot() {
            return {
                id: ko.observable('f'),
                rawContent: "foxtrot", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 23:18:44'), 
                createdBy: "FT-u"
            };
        }
    });
});