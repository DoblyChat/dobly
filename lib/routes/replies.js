module.exports = (function() {
    var CollaborationObject = require('../models/collaboration_object'),
        User = require('../models/user'),
        async = require('async'),
        offlineNotification = require('../notifications/offline_notification'),
        log = require('../common/log'),
        Message = require('../models/message');
        self = {};

    var statusOk = 200,
        statusError = 500;

    var _sockets;

    self.init = function(sockets) {
        _sockets = sockets;
    };

    self.get = function(req, res) {
        res.send(statusOk);
    };

    self.post = function(req, res) {
        req.body.mandrill_events.forEach(function(reply) {
            if (reply.event === 'inbound') {
                process(reply);                
            }
        });
    };

    function process(reply) {
        async.parallel({
            user: function(callback) {
                User.findOne({ email: reply.msg.from_email }, callback);
            },
            collaborationObject: function(callback) {
                var collaborationObjectId = parseCollaborationObjectId(reply.msg.email);
                CollaborationObject.findById(collaborationObjectId, callback);
            }
        }, function(err, models) {
            if (err) {
                handleErrors(err);
            } else {
                validateAndSend(models.user, models.collaborationObject, reply);
            }
        });
    }

    function validateAndSend(user, collaborationObject, reply) {
        if (isValid(user, collaborationObject)) {
            sendMessage(user, collaborationObject, reply);
        } else  {
            handleErrors({ message: "Reply is not valid according to rules in function isValid."});
        }
    }

    function sendMessage(user, collaborationObject, reply) {
        function saveMessage(callback) {
            Message.create({
                content: reply.msg.text,
                createdById: user._id,
                timestamp: Date.now(),
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
                    res.send(statusError); 
                } else { 
                    res.send(statusOk); 
                }
            });
    }

    function handleErrors(err) {
        log.error(err, 'Error processing email reply.');
        res.send(statusError);
    }

    function parseCollaborationObjectId(email) {
        var regex = /[^r-]([A-Za-z0-9])+(?=@)/i;
        return email.match(regex)[0];
    }

    function isValid(user, collaborationObject) {
        return user !== null &&
               collaborationObject !== null &&
               collaborationObject.type ==='C' && 
               user.groupId === collaborationObject.groupId && 
               user.isMemberOf(collaborationObject);
    }

    return self;
})();