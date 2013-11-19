define(['knockout', 'squire'], function(ko, Squire){
    'use strict';

    describe("conversation", function() {

        var conversation, testData, 
            createConversation, createCollaborationObjectMock,
            createMessageMock, common,
            createConversationSearchMock;

        beforeEach(function() {
            var squire = new Squire(),
                done = false;

            app.groupUsers['FT-u'] = 'Freddy Teddy';
            app.groupUsers['CA-u'] = 'Charlie App';            
            testData = testDataConversation();
            app.socket = createMockSocket();
            
            createCollaborationObjectMock = function(data, template){
                return {
                    ui: { 
                        u: 'i',
                        scroll: {
                            adjustToOffset: jasmine.createSpy()
                        }
                    },
                    init: jasmine.createSpy('init'),
                    addNewItem: jasmine.createSpy('add'),
                    topic: function() { return 'topic'; },
                    items: ko.observableArray(),
                    data: data,
                    template: template
                };
            };

            createMessageMock = jasmine.createSpy('create-message');
            createConversationSearchMock = jasmine.createSpy('create-search');

            runs(function(){
                var injector = new Squire();
                
                injector.mock('client/collaboration-object', function(){
                    return createCollaborationObjectMock;
                });
                
                injector.mock('client/message', function(){
                    return createMessageMock;
                });

                injector.mock('client/conversation.search', function(){
                    return createConversationSearchMock;
                });

                injector.require(['client/common', 'client/conversation'], function(aCommon, createConversationFunction){
                    common = aCommon;
                    createConversation = createConversationFunction;
                    done = true;
                });
            });

            waitsFor(function(){
                return done;
            });
        });

        afterEach(function(){
            createConversation = undefined;
            app.topicSearch = null;
        });

        describe("creation", function() {
            beforeEach(function(){
                conversation = createConversation(testData);
            });

            it("load properties", function() {
                expect(conversation.data).toBe(testData);
                expect(conversation.template).toBe('convo-template');
            });

            it('inits properties', function(){
                expect(conversation.init).toHaveBeenCalled();
                var callback = conversation.init.mostRecentCall.args[0];
                createMessageMock.andReturn({ message: 'my-message'} );
                var message = callback({ item: 'data' }, true);
                expect(createMessageMock).toHaveBeenCalledWith({ item: 'data' }, true);
                expect(message).toEqual({ message: 'my-message' });
            });

            it("undefined totalMessages", function() {
                conversation = createConversation(testData);
                expect(conversation.allMessagesLoaded()).toBe(false);

                testData.totalMessages = undefined;
                conversation = createConversation(testData);

                expect(conversation.allMessagesLoaded()).toBe(true);
            });

            it('creates a conversation search module', function(){
                createConversationSearchMock.andReturn({ search: 'module' });
                conversation = createConversation(testData);
                
                expect(createConversationSearchMock).toHaveBeenCalledWith(conversation);
                expect(conversation.search).toEqual({ search: 'module' });
            });
        });

        it("sends message", function() {
            conversation = createConversation(testData);
            expect(conversation.addNewItem).toHaveBeenCalled();

            var createItem = conversation.addNewItem.mostRecentCall.args[0];
            createMessageMock.andReturn({ _id: 'my-id' });
            var message = createItem(testDataMessageAlpha());
            expect(message._id).toBe('my-id');
            expect(createMessageMock).toHaveBeenCalledWith(testDataMessageAlpha(), false);

            var sendMessageToServer = conversation.addNewItem.mostRecentCall.args[1];
            var messageData = { message: 'data' };
            var messageObj = { 
                message: 'obj', 
                confirmedSent: jasmine.createSpy(),
                id: jasmine.createSpy(),
                timestamp: jasmine.createSpy()
            };

            sendMessageToServer(messageData, messageObj);
            expect(app.socket.emit).toHaveBeenCalled();
            var args = app.socket.emit.mostRecentCall.args;
            expect(args[0]).toBe('send_message');
            expect(args[1]).toBe(messageData);
            var callback = args[2];
            message._id = 'my-id';
            var now = new Date();
            message.timestamp = now;
            callback(message);
            expect(messageObj.confirmedSent).toHaveBeenCalledWith(true);
            expect(messageObj.id).toHaveBeenCalledWith('my-id');
            expect(messageObj.timestamp).toHaveBeenCalledWith(now);
        });

        describe("last messages", function() {
            beforeEach(function(){
                conversation = createConversation(testData);
            });

            it("3 messages", function() {
                conversation.items.push({ content: 'alpha' });
                conversation.items.push({ content: 'beta' });
                conversation.items.push({ content: 'charlie' });

                expect(conversation.lastMessages().length).toBe(2);
                expect(conversation.lastMessages()[0].content).toBe("beta");
                expect(conversation.lastMessages()[1].content).toBe("charlie");
            });

            it("2 messages", function() {
                conversation.items.push({ content: 'alpha' });
                conversation.items.push({ content: 'beta' });

                expect(conversation.lastMessages().length).toBe(2);
                expect(conversation.lastMessages()[0].content).toBe("alpha");
                expect(conversation.lastMessages()[1].content).toBe("beta");
            });

            it("1 messages", function() {
                conversation.items.push({ content: 'alpha' });

                expect(conversation.lastMessages().length).toBe(1);
                expect(conversation.lastMessages()[0].content).toBe("alpha");
            });
        });

        describe('infinite scrolling', function(){
            var conversation, event;

            beforeEach(function(){
                conversation = createConversation(testDataConversation());            
                event = {
                    target: {
                        scrollTop: 0,
                        scrollHeight: 150,
                    },
                };
            });

            it('does not initiate request if loading more', function(){
                conversation.loadingMore(true);
                conversation.scrolled(null, event);
                expect(app.socket.emit).not.toHaveBeenCalled();
            });

            it('does not initiate request if scroll not near the top', function(){
                event.target.scrollTop = 41;
                conversation.scrolled(null, event);
                expect(app.socket.emit).not.toHaveBeenCalled();
                expect(conversation.loadingMore()).toBe(false);
            });

            it('does not initiate request if all messages have been loaded', function(){
                var testData = testDataConversation();
                testData.totalMessages = 2;
                conversation = createConversation(testData);
                conversation.items.push({});
                conversation.items.push({});

                conversation.scrolled(null, event);
                expect(app.socket.emit).not.toHaveBeenCalled();
                expect(conversation.loadingMore()).toBe(false);

                conversation.items.push({});
                conversation.scrolled(null, event);
                expect(app.socket.emit).not.toHaveBeenCalled();
                expect(conversation.loadingMore()).toBe(false);
            });

            it('initiates a request and sets conversation as loading more', function(){
                conversation.scrolled(null, event);
                expect(app.socket.emit).toHaveBeenCalled();
                var args = app.socket.emit.mostRecentCall.args;
                expect(args[0]).toBe('read_next_messages');
                expect(args[1].page).toBe(1);
                expect(args[1].conversationId).toBe(conversation.id);
                expect(conversation.loadingMore()).toBe(true);
            });

            describe('read messages', function(){
                var readMessages;

                beforeEach(function(){
                    conversation.scrolled(null, event);
                    readMessages = app.socket.emit.mostRecentCall.args[2];
                    spyOn(conversation.ui, 'highlightTopMessages');
                });

                it('adds messages to the beginning of the messages list', function(){
                    conversation.items.push({ data: { content: 'alpha' } });
                    conversation.items.push({ data: { content: 'beta' } });

                    createMessageMock.andCallFake(function(data){
                        return { data: data };
                    });

                    var messages = [ 
                        { content: 'charlie' }, 
                        { content: 'delta' }
                    ];

                    readMessages(messages);

                    expect(conversation.items().length).toBe(4);
                    expect(conversation.items()[0].data.content).toBe('delta');
                    expect(conversation.items()[1].data.content).toBe('charlie');
                    expect(conversation.items()[2].data.content).toBe('alpha');
                    expect(conversation.items()[3].data.content).toBe('beta');
                });

                it('adjust the scrollbar to about location where user left of', function(){
                    event.target.scrollHeight = 500;
                    readMessages([]);
                    // new height (500) - old height (150) - 80 = 270
                    expect(conversation.ui.scroll.adjustToOffset).toHaveBeenCalledWith(270);
                });

                it('marks that loading is complete', function(){
                    conversation.loadingMore(true);
                    readMessages([]);
                    expect(conversation.loadingMore()).toBe(false);
                });

                it('increases next page by 1', function(){
                    conversation.scrolled(null, event);
                    expect(app.socket.emit.mostRecentCall.args[1].page).toBe(1);
                    
                    readMessages([]);

                    conversation.scrolled(null, event);
                    expect(app.socket.emit.mostRecentCall.args[1].page).toBe(2);

                    readMessages([]);

                    conversation.scrolled(null, event);
                    expect(app.socket.emit.mostRecentCall.args[1].page).toBe(3);
                });

                it('highlights received messages', function(){
                    var messages = [ testDataMessageCharlie(), testDataMessageDelta() ];
                    readMessages(messages);

                    expect(conversation.ui.highlightTopMessages).toHaveBeenCalledWith(2);
                });
            });
        });

        function testDataConversation() {
            return {
                _id: "8",
                createdById: "FT-u",
                groupId: "5",
                items: [ testDataMessageAlpha(), testDataMessageBeta() ],
                timestamp: "2013-02-15T14:36:43.296Z",
                topic: "some topic",
                unread: 1,
                totalMessages: 3,
                members: {
                    entireGroup: true,
                    users: []
                }
            };
        }

        function testDataSomeOtherConversation() {
            return {
                _id: "10",
                createdById: "FT-u",
                groupId: "5",
                items: [ ],
                timestamp: "2013-02-15T14:36:43.296Z",
                topic: "some other topic",
                unread: 0,
                totalMessages: 3,
                members: {
                    entireGroup: false,
                    users: [ 'FT-u', 'CA-u' ]
                }
            };
        }

        function testDataMessageAlpha() {
            return {
                content: "alpha", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 22:13:34'), 
                createdById: "CA-u"
            };
        }

        function testDataMessageBeta() {
            return {
                content: "beta", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 22:14:14'), 
                createdById: "FT-u"
            };
        }

        function testDataMessageCharlie() {
            return {
                content: "charlie", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 22:15:23'), 
                createdById: "CA-u"
            };
        }

        function testDataMessageDelta() {
            return {
                content: "delta", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 23:18:44'), 
                createdById: "FT-u"
            };
        }
    });
});