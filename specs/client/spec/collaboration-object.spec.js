define(['knockout', 'client/collaboration-object', 'client/common'], function(ko, createCollaborationObject, common){
    'use strict';

    describe("collaboration object", function() {

        var collaborationObject, testData;

        beforeEach(function() {
            app.groupUsers['FT-u'] = 'Freddy Teddy';
            app.groupUsers['CA-u'] = 'Charlie App';            
            testData = testDataCollaborationObject();
            app.socket = createMockSocket();
            app.topicSearch = ko.observable('');
        });

        afterEach(function(){
            app.topicSearch = null;
        });

        describe("creation", function() {
            it("load properties", function() {
                collaborationObject = createCollaborationObject(testData, 'template');
                collaborationObject.init(function(itemData){
                    return { data: itemData };
                });
                expect(collaborationObject.id).toEqual('8');
                expect(collaborationObject.topic()).toEqual("some topic");
                expect(collaborationObject.createdBy).toEqual("Freddy Teddy");
                expect(collaborationObject.unreadCounter()).toBe(1);
                expect(collaborationObject.newItem()).toEqual("");
                expect(collaborationObject.isLeft()).toBe(false);
                expect(collaborationObject.isRight()).toBe(false);
                expect(collaborationObject.items().length).toBe(2);
                expect(collaborationObject.active()).toBe(false);
                expect(collaborationObject.hasFocus()).toBe(false);
                expect(collaborationObject.timestamp).toBe(common.formatTimestamp(testData.timestamp));
                expect(collaborationObject.forEntireGroup).toBe(true);
                expect(collaborationObject.users).toEqual('');
                expect(collaborationObject.template).toBe('template');
                expect(collaborationObject.type).toBe('V');
            });

            it("loads users", function() {
                collaborationObject = createCollaborationObject(testSomeOtherCollaborationObjectData());
                collaborationObject.init(function(){});

                expect(collaborationObject.forEntireGroup).toBe(false);
                expect(collaborationObject.users).toEqual('Freddy Teddy, Charlie App');
            });

            it("undefined id", function() {
                testData._id = undefined;
                collaborationObject = createCollaborationObject(testData);

                expect(collaborationObject.id).toBe(0);
            });

            it("undefined unread", function() {
                testData.unread = undefined;
                collaborationObject = createCollaborationObject(testData);

                expect(collaborationObject.unreadCounter()).toBe(0);
            });

            it("pushes items", function() {
                collaborationObject = createCollaborationObject(testData);
                collaborationObject.init(function(itemData){
                    return { data: itemData };
                });

                expect(collaborationObject.items().length).toBe(2);
                expect(collaborationObject.items()[0].data.content).toEqual("alpha");
                expect(collaborationObject.items()[1].data.content).toEqual("beta");
            });
        });

        describe("add item", function() {
            var testItem = { test: 'item' };

            describe("when app in focus", function() {
                beforeEach(function() {
                    app.inFocus = true;
                    collaborationObject = createCollaborationObject(testData);
                    collaborationObject.init(function(){});               
                    expect(collaborationObject.unreadCounter()).toBe(1);                                
                    expect(collaborationObject.items().length).toBe(2);
                    spyOn(collaborationObject.ui.scroll, 'adjust');
                });

                it("active and focused", function() {
                    collaborationObject.activateOnTheLeft();
                    collaborationObject.hasFocus(true);
                    expect(collaborationObject.unreadCounter()).toBe(0);                

                    collaborationObject.addItem(testItem);

                    expect(collaborationObject.items().length).toBe(3);
                    expect(collaborationObject.ui.scroll.adjust).toHaveBeenCalled();
                    expect(app.socket.emit).toHaveBeenCalledWith('mark_as_read', '8');
                    expect(collaborationObject.unreadCounter()).toBe(0);
                });

                it("active and unfocused", function() {
                    collaborationObject.activateOnTheLeft();
                    expect(collaborationObject.hasFocus()).toBe(false);

                    collaborationObject.addItem(testItem);

                    expect(collaborationObject.items().length).toBe(3);
                    expect(collaborationObject.ui.scroll.adjust).toHaveBeenCalled();
                    expect(app.socket.emit).toHaveBeenCalledWith('mark_as_read', '8');
                    expect(collaborationObject.unreadCounter()).toBe(2);
                });

                it("inactive", function() {
                    expect(collaborationObject.active()).toBe(false);
                    expect(collaborationObject.hasFocus()).toBe(false);

                    collaborationObject.addItem(testItem);

                    expect(collaborationObject.items().length).toBe(3);
                    expect(collaborationObject.ui.scroll.adjust).not.toHaveBeenCalled();
                    expect(app.socket.emit).not.toHaveBeenCalled();
                    expect(collaborationObject.unreadCounter()).toBe(2);
                });
            });

            describe("when app not in focus", function() {
                beforeEach(function() {
                    app.inFocus = false;
                    collaborationObject = createCollaborationObject(testData); 
                    collaborationObject.init(function(itemData){
                        return { data: itemData };
                    });               
                    expect(collaborationObject.unreadCounter()).toBe(1);                                
                    expect(collaborationObject.items().length).toBe(2);
                    spyOn(collaborationObject.ui.scroll, 'adjust');
                });

                it("active", function() {
                    collaborationObject.activateOnTheLeft();

                    collaborationObject.addItem(testItem);

                    expect(collaborationObject.items().length).toBe(3);
                    expect(collaborationObject.unreadCounter()).toBe(2);
                });

                it("inactive", function() {
                    expect(collaborationObject.active()).toBe(false);

                    collaborationObject.addItem(testItem);

                    expect(collaborationObject.items().length).toBe(3);
                    expect(collaborationObject.unreadCounter()).toBe(2);
                });
            });
        });

        describe("add new item", function() {
            var createObject, sendToServer, addNewItem;

            beforeEach(function() {
                collaborationObject = createCollaborationObject(testData);
                createObject = jasmine.createSpy().andCallFake(function(data){
                    return { data: data };
                });
                sendToServer = jasmine.createSpy();
                addNewItem = collaborationObject.addNewItem(createObject, sendToServer);
                spyOn(collaborationObject, 'markAsRead');
            });

            afterEach(function() {
                expect(collaborationObject.markAsRead).toHaveBeenCalled();
            });

            it("sends to server", function() {
                collaborationObject.newItem('abc');
                spyOn(common, 'enterKeyPressed').andReturn(true);
                var testEvent = { shiftKey: false };
                spyOn(collaborationObject, 'addItem');
                app.user = { _id: 'CA-u' };

                var returnValue = addNewItem(null, testEvent);

                expect(collaborationObject.addItem).toHaveBeenCalled();   
                var object = collaborationObject.addItem.mostRecentCall.args[0];
                verifyItemData(object.data);

                expect(sendToServer).toHaveBeenCalled();
                var itemData = sendToServer.mostRecentCall.args[0];
                verifyItemData(itemData);
                object = sendToServer.mostRecentCall.args[1];
                verifyItemData(object.data);

                expect(collaborationObject.newItem()).toEqual('');
                expect(returnValue).toBe(false);

                function verifyItemData(itemData){
                    expect(itemData.content).toEqual('abc');
                    expect(itemData.collaborationObjectId).toEqual('8');
                    expect(itemData.createdById).toEqual('CA-u');
                }
            });

            it("no new message", function() {
                collaborationObject.newItem('');
                spyOn(common, 'enterKeyPressed').andReturn(true);
                var testEvent = { shiftKey: false };

                var returnValue = addNewItem(null, testEvent);

                expect(returnValue).toBe(true);
            });

            it("enter key not pressed", function() {
                collaborationObject.newItem('abc');
                spyOn(common, 'enterKeyPressed').andReturn(false);
                var testEvent = { shiftKey: false };

                var returnValue = addNewItem(null, testEvent);

                expect(returnValue).toBe(true);
            });

            it("shift key pressed", function() {
                collaborationObject.newItem('abc');
                spyOn(common, 'enterKeyPressed').andReturn(true);
                var testEvent = { shiftKey: true };

                var returnValue = addNewItem(null, testEvent);

                expect(returnValue).toBe(true);
            });
        });

        describe("unread counter", function() {
            it("0 messages", function() {
                testData.unread = 0;
                collaborationObject = createCollaborationObject(testData);
                expect(collaborationObject.showUnreadCounter()).toBe(false);
            });

            it("1 message", function() {
                testData.unread = 1;
                collaborationObject = createCollaborationObject(testData);
                expect(collaborationObject.showUnreadCounter()).toBe(true);
            });

            it("2 messages", function() {
                testData.unread = 2;
                collaborationObject = createCollaborationObject(testData);
                expect(collaborationObject.showUnreadCounter()).toBe(true);
            });
        });

        describe("mark as read", function() {
            it("when unread counter is 1", function() {
                testData.unread = 1;
                collaborationObject = createCollaborationObject(testData);
                expect(collaborationObject.unreadCounter()).toBe(1);

                collaborationObject.markAsRead();

                expect(collaborationObject.unreadCounter()).toBe(0);
                expect(app.socket.emit).toHaveBeenCalledWith('mark_as_read', '8');
            });

            it("when unread counter is 0", function() {
                testData.unread = 0;
                collaborationObject = createCollaborationObject(testData);
                expect(collaborationObject.unreadCounter()).toBe(0);

                collaborationObject.markAsRead();

                expect(collaborationObject.unreadCounter()).toBe(0);            
                expect(app.socket.emit).not.toHaveBeenCalled();
            });
        });

        describe("has focus", function() {
            it("true", function() {
                collaborationObject = createCollaborationObject(testData);
                spyOn(collaborationObject, 'markAsRead');

                collaborationObject.hasFocus(true);

                expect(collaborationObject.markAsRead).toHaveBeenCalled();
            });

            it("false", function() {
                collaborationObject = createCollaborationObject(testData);
                spyOn(collaborationObject, 'markAsRead');

                collaborationObject.hasFocus(false);

                expect(collaborationObject.markAsRead).not.toHaveBeenCalled();
            });
        });

        describe("activate", function() {

            beforeEach(function() {
                collaborationObject = createCollaborationObject(testData);
            });

            it("on the left", function() {
                collaborationObject.activateOnTheLeft();

                expect(collaborationObject.isLeft()).toBe(true);
                expect(collaborationObject.isRight()).toBe(false);
                expect(collaborationObject.active()).toBe(true);
                expect(collaborationObject.ui.getSelector('xyz')).toEqual('.collaboration-object-left > xyz');
            });

            it("on the right", function() {
                collaborationObject.activateOnTheRight();

                expect(collaborationObject.isLeft()).toBe(false);
                expect(collaborationObject.isRight()).toBe(true);
                expect(collaborationObject.active()).toBe(true);
                expect(collaborationObject.ui.getSelector('xyz')).toEqual('.collaboration-object-right > xyz');
            });

            it("deactivate", function() {
                spyOn(collaborationObject.ui.scroll, "stop");
                collaborationObject.activateOnTheRight();

                collaborationObject.deactivate();

                expect(collaborationObject.ui.scroll.stop).toHaveBeenCalled();
                expect(collaborationObject.active()).toBe(false);
                expect(collaborationObject.isRight()).toBe(false);
                expect(collaborationObject.isLeft()).toBe(false);
            });
        });

        function testDataCollaborationObject() {
            return {
                _id: "8",
                createdById: "FT-u",
                groupId: "5",
                items: [ testItemAlpha(), testItemBeta() ],
                timestamp: "2013-02-15T14:36:43.296Z",
                topic: "some topic",
                unread: 1,
                members: {
                    entireGroup: true,
                    users: []
                },
                type: 'V'
            };
        }

        function testSomeOtherCollaborationObjectData() {
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

        function testItemAlpha() {
            return {
                content: "alpha", 
                collaborationObjectId: "8", 
                createdById: "CA-u"
            };
        }

        function testItemBeta() {
            return {
                content: "beta", 
                collaborationObjectId: "8", 
                createdById: "FT-u"
            };
        }
    });
});