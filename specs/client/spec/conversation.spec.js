define(['knockout', 'client/conversation', 'client/common', 'client/message'], function(ko, createConversation, common, createMessage){
    'use strict';

    describe("conversation", function() {

        var conversation, testData;

        beforeEach(function() {
            app.groupUsers['FT'] = 'Freddy Teddy';
            app.groupUsers['CA'] = 'Charlie App';            
            testData = testDataConversation();
            app.socket = createMockSocket();
            app.topicSearch = ko.observable('');
        });

        afterEach(function(){
            app.topicSearch = null;
        });

        describe("creation", function() {
            it("load properties", function() {
                conversation = createConversation(testData);
                expect(conversation.template).toBe('convo-template');
            });

            it("undefined totalMessages", function() {
                conversation = createConversation(testData);
                expect(conversation.allMessagesLoaded()).toBe(false);

                testData.totalMessages = undefined;
                conversation = createConversation(testData);

                expect(conversation.allMessagesLoaded()).toBe(true);
            });
        });

        it("sends message", function() {
            conversation = createConversation(testData);
            spyOn(conversation, 'markAsRead');
            conversation.newItem('abc');
            spyOn(common, 'enterKeyPressed').andReturn(true);
            var testEvent = { shiftKey: false };
            spyOn(conversation, 'addItem');
            app.user = { _id: 'CA' };

            var returnValue = conversation.sendMessage(null, testEvent);

            expect(conversation.markAsRead).toHaveBeenCalled();
            expect(conversation.addItem).toHaveBeenCalled();   

            var message = conversation.addItem.mostRecentCall.args[0];
            expect(message.content).toEqual('abc');
            expect(message.createdBy).toEqual('Charlie App');
            expect(message.confirmedSent()).toBe(false);
            
            expect(app.socket.emit).toHaveBeenCalled();

            var operation = app.socket.emit.mostRecentCall.args[0];
            expect(operation).toEqual('send_message');

            var messageData = app.socket.emit.mostRecentCall.args[1];
            expect(messageData.content).toEqual('abc');
            expect(messageData.collaborationObjectId).toEqual('8');
            expect(messageData.timestamp.clearTime()).toEqual(Date.today());
            expect(messageData.createdById).toEqual('CA');

            var confirmation = app.socket.emit.mostRecentCall.args[2];
            expect(message.confirmedSent()).toBe(false);
            expect(message.id()).toBeUndefined();
            confirmation({ _id: 'm-id' });
            expect(message.confirmedSent()).toBe(true);
            expect(message.id()).toBe('m-id');

            expect(conversation.newItem()).toEqual('');
            expect(returnValue).toBe(false);
        });

        describe("last messages", function() {
            it("3 messages", function() {
                testData.items = [ testDataMessageAlpha(), testDataMessageBeta(), testDataMessageCharlie() ];
                conversation = createConversation(testData);

                expect(conversation.lastMessages().length).toBe(2);
                expect(conversation.lastMessages()[0].content).toBe("beta");
                expect(conversation.lastMessages()[1].content).toBe("charlie");
            });

            it("2 messages", function() {
                testData.items = [ testDataMessageAlpha(), testDataMessageBeta() ];
                conversation = createConversation(testData);

                expect(conversation.lastMessages().length).toBe(2);
                expect(conversation.lastMessages()[0].content).toBe("alpha");
                expect(conversation.lastMessages()[1].content).toBe("beta");
            });

            it("1 messages", function() {
                testData.items = [ testDataMessageAlpha() ];
                conversation = createConversation(testData);

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
                    spyOn(conversation.ui.scroll, 'adjustToOffset');
                    spyOn(conversation.ui, 'highlightTopMessages');
                });

                it('adds messages to the beginning of the messages list', function(){
                    var messages = [ testDataMessageCharlie(), testDataMessageDelta() ];
                    readMessages(messages);

                    expect(conversation.items().length).toBe(4);
                    expect(conversation.items()[0].content).toBe('delta');
                    expect(conversation.items()[1].content).toBe('charlie');
                    expect(conversation.items()[2].content).toBe('alpha');
                    expect(conversation.items()[3].content).toBe('beta');
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

        describe("topic search", function() {

            var someTopic, someOtherTopic;

            beforeEach(function() {
                someTopic = createConversation(testDataConversation());
                someOtherTopic = createConversation(testDataSomeOtherConversation());
            });

            it("blank", function() {
                app.topicSearch('');
                expect(someTopic.search.topicMatched()).toBe(true);
                expect(someOtherTopic.search.topicMatched()).toBe(true);
            });

            it("some", function() {
                app.topicSearch('some');
                expect(someTopic.search.topicMatched()).toBe(true);
                expect(someOtherTopic.search.topicMatched()).toBe(true); 
            });

            it("some topic", function() {
                app.topicSearch('some topic');
                expect(app.topicSearch()).toEqual('some topic');
                expect(someTopic.search.topicMatched()).toBe(true);
                expect(someOtherTopic.search.topicMatched()).toBe(false); 
            });

            it("some other", function() {
                app.topicSearch('some other');
                expect(someTopic.search.topicMatched()).toBe(false);
                expect(someOtherTopic.search.topicMatched()).toBe(true); 
            });

            it("no matches", function() {
                app.topicSearch('xyz');
                expect(someTopic.search.topicMatched()).toBe(false);
                expect(someOtherTopic.search.topicMatched()).toBe(false); 
            });        
        });

        function testDataConversation() {
            return {
                _id: "8",
                createdById: "FT",
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
                createdById: "FT",
                groupId: "5",
                items: [ ],
                timestamp: "2013-02-15T14:36:43.296Z",
                topic: "some other topic",
                unread: 0,
                totalMessages: 3,
                members: {
                    entireGroup: false,
                    users: [ 'FT', 'CA' ]
                }
            };
        }

        function testDataMessageAlpha() {
            return {
                content: "alpha", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 22:13:34'), 
                createdById: "CA"
            };
        }

        function testDataMessageBeta() {
            return {
                content: "beta", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 22:14:14'), 
                createdById: "FT"
            };
        }

        function testDataMessageCharlie() {
            return {
                content: "charlie", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 22:15:23'), 
                createdById: "CA"
            };
        }

        function testDataMessageDelta() {
            return {
                content: "delta", 
                collaborationObjectId: "8", 
                timestamp: Date.parse('2013.04.09 23:18:44'), 
                createdById: "FT"
            };
        }
    });
});