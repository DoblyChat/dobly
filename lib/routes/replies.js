module.exports = (function() {
    var CollaborationObject = require('../models/collaboration_object'),
        User = require('../models/user'),
        async = require('async'),
        offlineNotification = require('../notifications/offline_notification'),
        log = require('../common/log'),
        Message = require('../models/message'),
        Item = require('../models/item'),
        self = {};

    var statusOk = 200;

    var _sockets;

    self.init = function(sockets) {
        _sockets = sockets;
    };

    self.get = function(req, res) {
        res.send(statusOk);
    };

    self.post = function(req, res) {
        var replies = JSON.parse(req.body.mandrill_events);
        async.each(
            replies, 
            function(reply, callback) {
                if (reply.event === 'inbound') {
                    process(reply, callback);
                } else {
                    callback();
                }
            }, 
            function(err) {
                res.send(statusOk);
            }
        );
    };

    function process(reply, processCallback) {
        async.parallel({
            user: function(callback) {
                User.findOne({ email: reply.msg.from_email }, callback);
            },
            collaborationObject: function(callback) {
                var collaborationObjectId = parseCollaborationObjectId(reply.msg.email);
                CollaborationObject.findById(collaborationObjectId, callback);
            }
        }, 
        function(err, models) {
            if (err) {
                handleErrors(err, processCallback);
            } else {
                validateAndSend(models.user, models.collaborationObject, reply, processCallback);
            }
        });
    }

    function validateAndSend(user, collaborationObject, reply, processCallback) {
        if (isValid(user, collaborationObject)) {
            sendMessage(user, collaborationObject, reply, processCallback);
        } else  {
            handleErrors({ message: "Reply is not valid according to rules in function isValid."}, processCallback);
        }
    }

    function sendMessage(user, collaborationObject, reply, processCallback) {
        function saveMessage(callback) {
            Message.create({
                content: reply.msg.text,
                createdById: user._id,
                timestamp: new Date(reply.ts*1000),
                collaborationObjectId: collaborationObject._id
            }, callback);
        }

        function notifyOnlineUsers(message) {
            _sockets.emitToCollaborationObjectMembers('receive_item', collaborationObject._id, message);
        }

        function notifyOfflineUsers(message) {
            offlineNotification.initWhenSenderIsOffline(user, collaborationObject.groupId, _sockets);
            offlineNotification.notify(message);
        }

        function senderConfirmation() { }

        Item.init(user._id, collaborationObject.groupId, collaborationObject._id);

        Item.send(
            saveMessage,
            notifyOnlineUsers,
            senderConfirmation,
            notifyOfflineUsers,
            function(err, item) {
                if (err) { 
                    handleErrors(err, processCallback);
                } else { 
                    processCallback();
                }
            });
    }

    function handleErrors(err, processCallback) {
        log.error(err, 'Error processing email reply.');
        processCallback();
    }

    function parseCollaborationObjectId(email) {
        var regex = /[^r-]([A-Za-z0-9])+(?=@)/i;
        return email.match(regex)[0];
    }

    function isValid(user, collaborationObject) {
        return user !== null &&
               collaborationObject !== null &&
               collaborationObject.type ==='C' && 
               user.isMemberOf(collaborationObject);
    }

    return self;
})();