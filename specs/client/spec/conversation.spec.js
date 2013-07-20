define(['knockout', 'client/conversation', 'client/common', 'client/message'], function(ko, createConversation, common, createMessage){
    describe("conversation", function() {

        var conversation, testData, group;

        beforeEach(function() {
            testData = testDataConversation();
            app.socket = createMockSocket();
            app.topicSearch = ko.observable('');
            group = {
                users: [ 
                    { id: '1', name: 'uno' },
                    { id: '2', name: 'dos' }
                ]
            };
        });

        afterEach(function(){
            app.topicSearch = null;
        });

        describe("creation", function() {

            it("load properties", function() {
                conversation = createConversation(testData, group);
                expect(conversation.id).toEqual('8');
                expect(conversation.topic()).toEqual("some topic");
                expect(conversation.createdBy()).toEqual("fernando");
                expect(conversation.unreadCounter()).toBe(1);
                expect(conversation.newMessage()).toEqual("");
                expect(conversation.isLeft()).toBe(false);
                expect(conversation.isRight()).toBe(false);
                expect(conversation.messages().length).toBe(2);
                expect(conversation.active()).toBe(false);
                expect(conversation.hasFocus()).toBe(false);
                expect(conversation.ui).toBeDefined();
                expect(conversation.timestamp).toBe(common.formatTimestamp(testData.timestamp));
                expect(conversation.forEntireGroup).toBe(true);
                expect(conversation.users).toEqual('');
            });

            it("loads users", function() {
                conversation = createConversation(testDataSomeOtherConversation(), group);

                expect(conversation.forEntireGroup).toBe(false);
                expect(conversation.users).toEqual('uno, dos');
            });

            it("undefined id", function() {
                testData._id = undefined;
                conversation = createConversation(testData, group);

                expect(conversation.id).toBe(0);
            });

            it("undefined unread", function() {
                testData.unread = undefined;
                conversation = createConversation(testData, group);

                expect(conversation.unreadCounter()).toBe(0);
            });

            it("pushes messages", function() {
                conversation = createConversation(testData, group);

                expect(conversation.messages().length).toBe(2);
                expect(conversation.messages()[0].content).toEqual("alpha");
                expect(conversation.messages()[1].content).toEqual("beta");
            });
        });

        describe("add message", function() {
            describe("when app in focus", function() {
                beforeEach(function() {
                    app.inFocus = true;
                    conversation = createConversation(testData, group);                
                    expect(conversation.unreadCounter()).toBe(1);                                
                    expect(conversation.messages().length).toBe(2);
                    spyOn(conversation.ui.scroll, 'adjust');
                });

                it("active and focused conversation", function() {
                    conversation.activateOnTheLeft();
                    conversation.hasFocus(true);
                    expect(conversation.unreadCounter()).toBe(0);                

                    var testMessage = createMessage(testDataMessageDelta(), false);
                    conversation.addMessage(testMessage);

                    expect(conversation.messages().length).toBe(3);
                    expect(conversation.ui.scroll.adjust).toHaveBeenCalled();
                    expect(app.socket.emit).toHaveBeenCalledWith('mark_as_read', '8');
                    expect(conversation.unreadCounter()).toBe(0);
                });

                it("active and unfocused conversation", function() {
                    conversation.activateOnTheLeft();
                    expect(conversation.hasFocus()).toBe(false);

                    var testMessage = createMessage(testDataMessageDelta(), true);
                    conversation.addMessage(testMessage);

                    expect(conversation.messages().length).toBe(3);
                    expect(conversation.ui.scroll.adjust).toHaveBeenCalled();
                    expect(app.socket.emit).toHaveBeenCalledWith('mark_as_read', '8');
                    expect(conversation.unreadCounter()).toBe(2);
                });

                it("inactive conversation", function() {
                    expect(conversation.active()).toBe(false);
                    expect(conversation.hasFocus()).toBe(false);

                    var testMessage = createMessage(testDataMessageDelta(), true);
                    conversation.addMessage(testMessage);

                    expect(conversation.messages().length).toBe(3);
                    expect(conversation.ui.scroll.adjust).not.toHaveBeenCalled();
                    expect(app.socket.emit).not.toHaveBeenCalled();
                    expect(conversation.unreadCounter()).toBe(2);
                });
            });

            describe("when app not in focus", function() {
                beforeEach(function() {
                    app.inFocus = false;
                    conversation = createConversation(testData, group);                
                    expect(conversation.unreadCounter()).toBe(1);                                
                    expect(conversation.messages().length).toBe(2);
                    spyOn(conversation.ui.scroll, 'adjust');
                });

                it("active conversation", function() {
                    conversation.activateOnTheLeft();

                    var testMessage = createMessage(testDataMessageDelta(), true);
                    conversation.addMessage(testMessage);

                    expect(conversation.messages().length).toBe(3);
                    expect(conversation.unreadCounter()).toBe(2);
                });

                it("inactive conversation", function() {
                    expect(conversation.active()).toBe(false);

                    var testMessage = createMessage(testDataMessageDelta(), true);
                    conversation.addMessage(testMessage);

                    expect(conversation.messages().length).toBe(3);
                    expect(conversation.unreadCounter()).toBe(2);
                });
            });
        });

        describe("send message", function() {
            beforeEach(function() {
                conversation = createConversation(testData, group);
                spyOn(conversation, 'markAsRead');
            });

            afterEach(function() {
                expect(conversation.markAsRead).toHaveBeenCalled();
            });

            it("sends message", function() {
                conversation.newMessage('abc');
                spyOn(common, 'enterKeyPressed').andReturn(true);
                var testEvent = { shiftKey: false };
                spyOn(conversation, 'addMessage');
                app.user = { name: 'jimmy' };

                var returnValue = conversation.sendMessage(null, testEvent);

                expect(conversation.addMessage).toHaveBeenCalled();   

                var message = conversation.addMessage.mostRecentCall.args[0];
                expect(message.content).toEqual('abc');
                expect(message.createdBy).toEqual('jimmy');
                expect(message.confirmedSent()).toBe(false);
                
                expect(app.socket.emit).toHaveBeenCalled();

                var operation = app.socket.emit.mostRecentCall.args[0];
                expect(operation).toEqual('send_message');

                var messageData = app.socket.emit.mostRecentCall.args[1];
                expect(messageData.content).toEqual('abc');
                expect(messageData.conversationId).toEqual('8');
                expect(messageData.timestamp.clearTime()).toEqual(Date.today());
                expect(messageData.createdBy).toEqual('jimmy');

                var confirmation = app.socket.emit.mostRecentCall.args[2];
                expect(message.confirmedSent()).toBe(false);
                expect(message.id()).toBeUndefined();
                confirmation({ _id: 'm-id' });
                expect(message.confirmedSent()).toBe(true);
                expect(message.id()).toBe('m-id');

                expect(conversation.newMessage()).toEqual('');
                expect(returnValue).toBe(false);
            });

            it("no new message", function() {
                conversation.newMessage('');
                spyOn(common, 'enterKeyPressed').andReturn(true);
                var testEvent = { shiftKey: false };

                var returnValue = conversation.sendMessage(null, testEvent);

                expect(returnValue).toBe(true);
            });

            it("enter key not pressed", function() {
                conversation.newMessage('abc');
                spyOn(common, 'enterKeyPressed').andReturn(false);
                var testEvent = { shiftKey: false };

                var returnValue = conversation.sendMessage(null, testEvent);

                expect(returnValue).toBe(true);
            });

            it("shift key pressed", function() {
                conversation.newMessage('abc');
                spyOn(common, 'enterKeyPressed').andReturn(true);
                var testEvent = { shiftKey: true };

                var returnValue = conversation.sendMessage(null, testEvent);

                expect(returnValue).toBe(true);
            });
        });

        describe("last messages", function() {
            it("3 messages", function() {
                testData.messages = [ testDataMessageAlpha(), testDataMessageBeta(), testDataMessageCharlie() ];
                conversation = createConversation(testData, group);

                expect(conversation.lastMessages().length).toBe(2);
                expect(conversation.lastMessages()[0].content).toBe("beta");
                expect(conversation.lastMessages()[1].content).toBe("charlie");
            });

            it("2 messages", function() {
                testData.messages = [ testDataMessageAlpha(), testDataMessageBeta() ];
                conversation = createConversation(testData, group);

                expect(conversation.lastMessages().length).toBe(2);
                expect(conversation.lastMessages()[0].content).toBe("alpha");
                expect(conversation.lastMessages()[1].content).toBe("beta");
            });

            it("1 messages", function() {
                testData.messages = [ testDataMessageAlpha() ];
                conversation = createConversation(testData, group);

                expect(conversation.lastMessages().length).toBe(1);
                expect(conversation.lastMessages()[0].content).toBe("alpha");
            });
        });

        describe("unread counter", function() {
            it("0 messages", function() {
                testData.unread = 0;
                conversation = createConversation(testData, group);
                expect(conversation.showUnreadCounter()).toBe(false);
            });

            it("1 message", function() {
                testData.unread = 1;
                conversation = createConversation(testData, group);
                expect(conversation.showUnreadCounter()).toBe(true);
            });

            it("2 messages", function() {
                testData.unread = 2;
                conversation = createConversation(testData, group);
                expect(conversation.showUnreadCounter()).toBe(true);
            });
        });

        describe("mark as read", function() {
            it("when unread counter is 1", function() {
                testData.unread = 1;
                conversation = createConversation(testData, group);
                expect(conversation.unreadCounter()).toBe(1);

                conversation.markAsRead();

                expect(conversation.unreadCounter()).toBe(0);
                expect(app.socket.emit).toHaveBeenCalledWith('mark_as_read', '8');
            });

            it("when unread counter is 0", function() {
                testData.unread = 0;
                conversation = createConversation(testData, group);
                expect(conversation.unreadCounter()).toBe(0);

                conversation.markAsRead();

                expect(conversation.unreadCounter()).toBe(0);            
                expect(app.socket.emit).not.toHaveBeenCalled();
            });
        });

        describe("has focus", function() {
            it("true", function() {
                conversation = createConversation(testData, group);
                spyOn(conversation, 'markAsRead');

                conversation.hasFocus(true);

                expect(conversation.markAsRead).toHaveBeenCalled();
            });

            it("false", function() {
                conversation = createConversation(testData, group);
                spyOn(conversation, 'markAsRead');

                conversation.hasFocus(false);

                expect(conversation.markAsRead).not.toHaveBeenCalled();
            });
        });

        describe("activate", function() {

            beforeEach(function() {
                conversation = createConversation(testData, group);
            });

            it("on the left", function() {
                conversation.activateOnTheLeft();

                expect(conversation.isLeft()).toBe(true);
                expect(conversation.isRight()).toBe(false);
                expect(conversation.active()).toBe(true);
                expect(conversation.ui.getSelector('xyz')).toEqual('.convo-left > xyz');
            });

            it("on the right", function() {
                conversation.activateOnTheRight();

                expect(conversation.isLeft()).toBe(false);
                expect(conversation.isRight()).toBe(true);
                expect(conversation.active()).toBe(true);
                expect(conversation.ui.getSelector('xyz')).toEqual('.convo-right > xyz');
            });

            it("deactivate", function() {
                spyOn(conversation.ui.scroll, "stop");
                conversation.activateOnTheRight();

                conversation.deactivate();

                expect(conversation.ui.scroll.stop).toHaveBeenCalled();
                expect(conversation.active()).toBe(false);
                expect(conversation.isRight()).toBe(false);
                expect(conversation.isLeft()).toBe(false);
            });
        });

        describe('infinite scrolling', function(){
            var conversation, event;

            beforeEach(function(){
                conversation = createConversation(testDataConversation(), group);            
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
                conversation = createConversation(testData, group);
                conversation.scrolled(null, event);
                expect(app.socket.emit).not.toHaveBeenCalled();
                expect(conversation.loadingMore()).toBe(false);

                conversation.messages.push({});
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

                    expect(conversation.messages().length).toBe(4);
                    expect(conversation.messages()[0].content).toBe('delta');
                    expect(conversation.messages()[1].content).toBe('charlie');
                    expect(conversation.messages()[2].content).toBe('alpha');
                    expect(conversation.messages()[3].content).toBe('beta');
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
                someTopic = createConversation(testDataConversation(), group);
                someOtherTopic = createConversation(testDataSomeOtherConversation(), group);
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
                createdBy: "fernando",
                groupId: "5",
                messages: [ testDataMessageAlpha(), testDataMessageBeta() ],
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
                createdBy: "fernando",
                groupId: "5",
                messages: [ ],
                timestamp: "2013-02-15T14:36:43.296Z",
                topic: "some other topic",
                unread: 0,
                totalMessages: 3,
                members: {
                    entireGroup: false,
                    users: [ '1', '2' ]
                }
            };
        }

        function testDataMessageAlpha() {
            return {
                content: "alpha", 
                conversationId: "8", 
                timestamp: Date.parse('2013.04.09 22:13:34'), 
                createdBy: "carlos"
            };
        }

        function testDataMessageBeta() {
            return {
                content: "beta", 
                conversationId: "8", 
                timestamp: Date.parse('2013.04.09 22:14:14'), 
                createdBy: "fernando"
            };
        }

        function testDataMessageCharlie() {
            return {
                content: "charlie", 
                conversationId: "8", 
                timestamp: Date.parse('2013.04.09 22:15:23'), 
                createdBy: "carlos"
            };
        }

        function testDataMessageDelta() {
            return {
                content: "delta", 
                conversationId: "8", 
                timestamp: Date.parse('2013.04.09 23:18:44'), 
                createdBy: "fernando"
            };
        }
    });
});