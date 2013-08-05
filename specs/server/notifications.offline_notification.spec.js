describe("Notifications", function() {
    describe("Offline Notification", function() {

        var mandrillWrapperMock, conversationMock, userMock, groupMock, logMock;
        var offlineNotification;
        var doug, bob, offlineUsers, conversation, message, group;

        beforeEach(function() {
            mockery.enable({ useCleanCache: true });
            mockery.registerAllowable('../../lib/notifications/offline_notification');

            mandrillWrapperMock = buildMock('./mandrill_wrapper','send');
            conversationMock = buildMock('../models/conversation','findById');
            userMock = buildMock('../models/user','findExcept');
            groupMock = buildMock('../models/group','findById');
            logMock = buildMock('../common/log','error');

            offlineNotification = require('../../lib/notifications/offline_notification');

            setupData();
        });

        function setupData() {
            offlineNotification.onlineUsersIds = ['P','R'];
            offlineNotification.senderUser = {
                groupId: 'ABC',
                name: 'Mike'
            };

            doug = {
                _id: 'D',
                email: 'doug@abc.com',
                name: 'doug'
            };
            bob = {
                _id: 'B',
                email: 'bob@abc.com',
                name: 'bob'
            };

            offlineUsers = [doug, bob];

            conversation = {
                members: {
                    entireGroup: true
                },
                topic: 'What do you mean when you say stop?'
            };

            message = {
                conversationId: '123',
                content: 'stop: collaborate and listen'
            };

            group = {
                rawName: 'The Supers'
            };
        }

        afterEach(function(){
            mockery.disable();
            mockery.deregisterAll();
        });

        it("init", function() {
            var someUser = {
                email: 'some@user.com',
                groupId: '123'
            };
            var socketStub = {
                handshake: {
                    user: someUser
                }
            };
            var Client = {
                init: function(userId) {
                    this.handshake = {
                        user: {
                            _id: userId
                        }
                    };
                }
            };

            var socketsStub = {
                groupClients: function(groupId) {
                    var clientA = Object.create(Client);
                    clientA.init("A");
                    var clientB = Object.create(Client);
                    clientB.init("B");
                    return [ clientA, clientB ];
                }
            };

            offlineNotification.init(socketStub, socketsStub);

            expect(offlineNotification.senderUser).toBe(someUser);
            expect(offlineNotification.onlineUsersIds.length).toBe(2);
            expect(offlineNotification.onlineUsersIds[0]).toEqual("A");
            expect(offlineNotification.onlineUsersIds[1]).toEqual("B");
        });

        it("notifies entire group", function() {
            offlineNotification.notify(message);

            conversationMock.findById.callback(null, conversation);
            userMock.findExcept.callback(null, offlineUsers);
            groupMock.findById.callback(null, group);

            expect(mandrillWrapperMock.send).toHaveBeenCalled();

            function getArg(index) {
                return mandrillWrapperMock.send.mostRecentCall.args[index];
            }

            var args = {
                fromName: getArg(0),
                fromEmail: getArg(1),
                to: getArg(2),
                replyToEmail: getArg(3),
                subject: getArg(4),
                text: getArg(5),
                tags: getArg(6)
            };

            expect(args.fromName).toEqual('Mike');
            expect(args.fromEmail).toEqual('notification@dobly.com');
            expect(args.to.length).toBe(2);
            expect(args.to[0].email).toEqual('doug@abc.com');
            expect(args.to[0].name).toEqual('doug');
            expect(args.to[1].email).toEqual('bob@abc.com');
            expect(args.to[1].name).toEqual('bob');
            expect(args.replyToEmail).toEqual('no-reply@dobly.com');
            expect(args.subject).toEqual('[Dobly - The Supers] What do you mean when you say stop?');
            expect(args.text).toEqual('stop: collaborate and listen');
            expect(args.tags[0]).toEqual('offline-messages');
        });

        it("notifies conversation members", function() {
            conversation.members.entireGroup = false;
            conversation.members.users = ['R','D'];

            offlineNotification.notify(message);

            conversationMock.findById.callback(null, conversation);
            userMock.findExcept.callback(null, offlineUsers);
            groupMock.findById.callback(null, group);

            expect(mandrillWrapperMock.send).toHaveBeenCalled();

            function getArg(index) {
                return mandrillWrapperMock.send.mostRecentCall.args[index];
            }

            var args = {
                fromName: getArg(0),
                fromEmail: getArg(1),
                to: getArg(2),
                replyToEmail: getArg(3),
                subject: getArg(4),
                text: getArg(5),
                tags: getArg(6)
            };

            expect(args.fromName).toEqual('Mike');
            expect(args.fromEmail).toEqual('notification@dobly.com');
            expect(args.to.length).toBe(1);
            expect(args.to[0].email).toEqual('doug@abc.com');
            expect(args.to[0].name).toEqual('doug');
            expect(args.replyToEmail).toEqual('no-reply@dobly.com');
            expect(args.subject).toEqual('[Dobly - The Supers] What do you mean when you say stop?');
            expect(args.text).toEqual('stop: collaborate and listen');
            expect(args.tags[0]).toEqual('offline-messages');
        });

        describe("errors", function() {
            var err = { message: 'some error'};

            afterEach(function() {
                expect(logMock.error).toHaveBeenCalledWith('', err);
            });

            it("conversation query", function() {
                offlineNotification.notify(message);

                var result = conversationMock.findById.callback(err, null);
                expect(result).toBeUndefined();
            });

            it("user query", function() {
                offlineNotification.notify(message);

                conversationMock.findById.callback(null, conversation);
                userMock.findExcept.callback(err, null);
            });

            it("group query", function() {
                offlineNotification.notify(message);

                conversationMock.findById.callback(null, conversation);
                userMock.findExcept.callback(null, offlineUsers);
                groupMock.findById.callback(err, null);

                expect(mandrillWrapperMock.send).not.toHaveBeenCalled();
            });
        });
    });
});