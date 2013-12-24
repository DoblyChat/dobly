describe("Notifications", function() {
    'use strict';

    describe("Offline Notification", function() {

        var mandrillWrapperMock, collaborationObjectMock, userMock, groupMock, logMock;
        var offlineNotification;
        var doug, bob, offlineUsers, collaborationObject, message, group, Client;

        beforeEach(function() {
            mockery.enable({ useCleanCache: true });
            mockery.registerAllowable('../../lib/notifications/offline_notification');

            mandrillWrapperMock = buildMock('./mandrill_wrapper','send');
            collaborationObjectMock = buildMock('../models/collaboration_object','findById');
            userMock = buildMock('../models/user','findExcept');
            groupMock = buildMock('../models/group','findById');
            logMock = buildMock('../common/log','error');

            process.env.OFFLINE_NOTIFICATION_EMAIL = 'test-notification@doblychat.com';
            process.env.REPLIES_EMAIL_DOMAIN = 'test-replies.doblychat.com';

            offlineNotification = require('../../lib/notifications/offline_notification');

            setupData();

            Client = {
                init: function(userId) {
                    this.handshake = {
                        user: {
                            _id: userId
                        }
                    };
                }
            };
        });

        var P = new mongo.Types.ObjectId();
        var R = new mongo.Types.ObjectId();
        var A = new mongo.Types.ObjectId();
        var B = new mongo.Types.ObjectId();
        var D = new mongo.Types.ObjectId();

        function setupData() {
            offlineNotification.onlineUsersIds = [P,R];
            offlineNotification.senderUser = {
                groupId: 'ABC',
                firstName: 'Mike',
                lastName: 'Myers'
            };

            doug = {
                _id: D,
                email: 'doug@abc.com',
                firstName: 'doug',
                lastName: 'teeks'
            };
            bob = {
                _id: B,
                email: 'bob@abc.com',
                firstName: 'bob',
                lastName: 'doe'
            };

            offlineUsers = [doug, bob];

            collaborationObject = {
                _id: '123',
                members: {
                    entireGroup: true
                },
                topic: 'What do you mean when you say stop?'
            };

            message = {
                collaborationObjectId: '123',
                content: 'stop: collaborate and listen'
            };

            group = {
                rawName: 'The Supers'
            };
        }

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

            var socketsStub = {
                groupClients: function(groupId) {
                    var clientA = Object.create(Client);
                    clientA.init(A);
                    var clientB = Object.create(Client);
                    clientB.init(B);
                    return [ clientA, clientB ];
                }
            };

            offlineNotification.init(socketStub, socketsStub);

            expect(offlineNotification.senderUser).toBe(someUser);
            expect(offlineNotification.onlineUsersIds.length).toBe(2);
            expect(offlineNotification.onlineUsersIds[0]).toEqual(A);
            expect(offlineNotification.onlineUsersIds[1]).toEqual(B);
        });

        it("init when sender is offline", function() {
            var senderId = new mongo.Types.ObjectId();

            var sender = {
                _id: senderId
            };

            var socketsStub = {
                groupClients: function(groupId) {
                    var clientA = Object.create(Client);
                    clientA.init(A);
                    var clientB = Object.create(Client);
                    clientB.init(B);
                    var clientD = Object.create(Client);
                    clientD.init(D);
                    return [ clientA, clientB, clientD ];
                }
            };

            offlineNotification.initWhenSenderIsOffline(sender, '678', socketsStub);

            expect(offlineNotification.senderUser).toBe(sender);
            expect(offlineNotification.onlineUsersIds.length).toBe(4);
            expect(offlineNotification.onlineUsersIds[0]).toEqual(A);
            expect(offlineNotification.onlineUsersIds[1]).toEqual(B);
            expect(offlineNotification.onlineUsersIds[2]).toEqual(D);
            expect(offlineNotification.onlineUsersIds[3]).toEqual(senderId);
        });

        it("notifies entire group", function() {
            offlineNotification.notify(message);

            collaborationObjectMock.findById.callback(null, collaborationObject);
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

            expect(args.fromName).toEqual('Mike Myers');
            expect(args.fromEmail).toEqual('test-notification@doblychat.com');
            expect(args.to.length).toBe(2);
            expect(args.to[0].email).toEqual('doug@abc.com');
            expect(args.to[0].name).toEqual('doug teeks');
            expect(args.to[1].email).toEqual('bob@abc.com');
            expect(args.to[1].name).toEqual('bob doe');
            expect(args.replyToEmail).toEqual('Dobly Conversation <r-123@test-replies.doblychat.com>');
            expect(args.subject).toEqual('[Dobly - The Supers] What do you mean when you say stop?');
            expect(args.text).toEqual('stop: collaborate and listen');
            expect(args.tags[0]).toEqual('offline-messages');
        });

        it("notifies collaboration object members", function() {
            collaborationObject.members.entireGroup = false;
            collaborationObject.members.users = [R, D];

            offlineNotification.notify(message);

            collaborationObjectMock.findById.callback(null, collaborationObject);
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

            expect(args.fromName).toEqual('Mike Myers');
            expect(args.fromEmail).toEqual('test-notification@doblychat.com');
            expect(args.to.length).toBe(1);
            expect(args.to[0].email).toEqual('doug@abc.com');
            expect(args.to[0].name).toEqual('doug teeks');
            expect(args.replyToEmail).toEqual('Dobly Conversation <r-123@test-replies.doblychat.com>');
            expect(args.subject).toEqual('[Dobly - The Supers] What do you mean when you say stop?');
            expect(args.text).toEqual('stop: collaborate and listen');
            expect(args.tags[0]).toEqual('offline-messages');
        });

        describe("errors", function() {
            var err = { message: 'some error'};

            afterEach(function() {
                expect(logMock.error).toHaveBeenCalledWith(err);
            });

            it("collaboration object query", function() {
                offlineNotification.notify(message);

                var result = collaborationObjectMock.findById.callback(err, null);
                expect(result).toBeUndefined();
            });

            it("user query", function() {
                offlineNotification.notify(message);

                collaborationObjectMock.findById.callback(null, collaborationObject);
                userMock.findExcept.callback(err);
            });

            it("group query", function() {
                offlineNotification.notify(message);

                collaborationObjectMock.findById.callback(null, collaborationObject);
                userMock.findExcept.callback(null, offlineUsers);
                groupMock.findById.callback(err);

                expect(mandrillWrapperMock.send).not.toHaveBeenCalled();
            });
        });
    });
});