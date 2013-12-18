describe("Replies routes integration", function() {
    'use strict';

    var testGroupId, testCollaborationObjectId, testEmail, testUserId;

    beforeEach(function(done) {
        testGroupId = new mongo.Types.ObjectId();
        testEmail = "mark@ryder.com";
        setupTestData(done);
    });

    afterEach(function(done) {
        deleteTestData(done);
    });

    function setupTestData(done) {
        var CollaborationObject = require('../../lib/models/collaboration_object');
        var User = require('../../lib/models/user');

        CollaborationObject.create({
            type: 'C',
            topic: 'Replies Test',
            groupId: testGroupId,
            createdById: new mongo.Types.ObjectId(),
            members: {
                entireGroup: true
            }
        }, function(err, collaborationObject){
            if (err) { console.log(err); }

            testCollaborationObjectId = collaborationObject._id;

            User.remove({ email: testEmail }, function(err, obj) {
                User.create({ 
                    firstName: "Mark",
                    lastName: "Cuban",
                    email: testEmail,
                    groupId: testGroupId,
                    password: 'pass'
                }, function(err, user){
                    if (err) { console.log(err); }
                    testUserId = user._id;
                    done(err);
                });
            });
        });
    }

    function deleteTestData(done) {
        var CollaborationObject = require('../../lib/models/collaboration_object');
        var User = require('../../lib/models/user');

        CollaborationObject.findByIdAndRemove(testCollaborationObjectId, function(){
            User.remove({ email: testEmail }, done);
        });
    }

    it("sends valid reply as message", function(done) {
        mockery.enable({
            useCleanCache: false,
            warnOnReplace: true,
            warnOnUnregistered: false
        });

        process.env.OFFLINE_NOTIFICATION_EMAIL = 'test-notification@doblychat.com';

        var saveMessageCallback, notifyOnlineUsersCallback, senderConfirmationCallback, notifyOfflineUsersCallback;

        var ItemMock = {
            init: jasmine.createSpy(),
            send: function(saveMessage, notifyOnlineUsers, senderConfirmation, notifyOfflineUsers, callback) {
                saveMessageCallback = saveMessage;
                notifyOnlineUsersCallback = notifyOnlineUsers;
                senderConfirmationCallback = senderConfirmation;
                notifyOfflineUsersCallback = notifyOfflineUsers;
                callback(null);
            }
        };

        mockery.registerMock('../models/item', ItemMock);
        var MessageMock = buildMock('../models/message', 'create');
        var socketsSpy = {
            emitToCollaborationObjectMembers: jasmine.createSpy()
        };
        var offlineNotificationsMock = buildMock('../notifications/offline_notification', 'initWhenSenderIsOffline', 'notify');

        var replies = require('../../lib/routes/replies');

        var jsonMandrillEvents = JSON.stringify(getValidReply(testCollaborationObjectId, testEmail));

        var req = {
            body: {
                mandrill_events: jsonMandrillEvents
            }
        };

        var res = { };

        res.send = function(statusCode) {
            expect(statusCode).toEqual(200);

            expect(ItemMock.init).toHaveBeenCalledWith(testUserId, testGroupId, testCollaborationObjectId);

            var someCallback = 'some callback';
            saveMessageCallback(someCallback);
            expect(MessageMock.create).toHaveBeenCalled();
            expect(MessageMock.create.mostRecentCall.args[1]).toBe(someCallback);
            var message = MessageMock.create.mostRecentCall.args[0];
            expect(message.content).toEqual('some valid message in a reply.');
            expect(message.createdById).toEqual(testUserId);
            expect(message.timestamp).toEqual(new Date(138723943*1000));
            expect(message.collaborationObjectId).toEqual(testCollaborationObjectId);

            var someMessage = 'some message';
            notifyOnlineUsersCallback(someMessage);
            expect(socketsSpy.emitToCollaborationObjectMembers).toHaveBeenCalledWith('receive_item', testCollaborationObjectId, someMessage);

            notifyOfflineUsersCallback(someMessage);
            expect(offlineNotificationsMock.initWhenSenderIsOffline).toHaveBeenCalled();
            var args = offlineNotificationsMock.initWhenSenderIsOffline.mostRecentCall.args;
            var user = args[0];
            expect(user.getFullName()).toEqual('Mark Cuban');
            expect(args[1]).toEqual(testGroupId);
            expect(args[2]).toEqual(socketsSpy);

            senderConfirmationCallback();

            done();
        };

        replies.init(socketsSpy);
        replies.post(req, res);
    });

    xit("does not send invalid reply", function(done) {
        mockery.enable({
            useCleanCache: false,
            warnOnReplace: true,
            warnOnUnregistered: false
        });

        var ItemMock = buildMock('../models/item', 'init', 'send');
        var logMock = buildMock('../common/log','error');
        var replies = require('../../lib/routes/replies');

        var jsonMandrillEvents = JSON.stringify(getInvalidReply());

        var req = {
            body: {
                mandrill_events: jsonMandrillEvents
            }
        };

        var res = { };

        res.send = function(statusCode) {
            expect(statusCode).toEqual(200);

            expect(ItemMock.init).not.toHaveBeenCalled();
            expect(ItemMock.send).not.toHaveBeenCalled();

            expect(logMock.error).toHaveBeenCalled();
            var args = logMock.error.mostRecentCall.args;
            expect(args[0].message).toEqual('Reply is not valid according to rules in function isValid.');
            expect(args[1]).toEqual('Error processing email reply.');

            done();
        };

        replies.post(req, res);
    });

    function getInvalidReply() {
        return [{ 
            "ts": 138723265, 
            "event": "inbound", 
            "msg": 
            {
                "text": "some message in a reply.",
                "from_email": "joe@ryder.com",
                "email": "r-525423ab14dd5eae10000006@replies.doblychat.com",
                "subject": "RE: some topic"
            } 
        }];
    }

    function getValidReply(collaborationObjectId, testEmail) {
        return [{ 
            "ts": 138723943, 
            "event": "inbound", 
            "msg": 
            {
                "text": getReplyText(),
                "from_email": testEmail,
                "email": "r-" + collaborationObjectId + "@replies.doblychat.com",
                "subject": "RE: abc topic"
            } 
        }];
    }

    function getReplyText() {
        return  "some valid message in a reply." + 
                "\r\n" + 
                "\r\n" +
                "Today John <test-notification@doblychat.com> said:" +
                "\r\n" +
                "> hello there" +
                "\r\n";
    }
});