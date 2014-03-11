'use strict';

module.exports = (function() {
    var CollaborationObject = require('./collaboration_object'),
        User = require('./user'),
        UnreadMarker = require('./unread_marker'),
        async = require('async'),
        log = require('../common/log'),
        self = {};

    var _userId, _groupId, _collaborationObjectId;

    self.init = function(userId, groupId, collaborationObjectId) {
        _userId = userId;
        _groupId = groupId;
        _collaborationObjectId = collaborationObjectId;
    };

    self.send = function(saveItem, notifyOnlineUsers, senderConfirmation, notifyOfflineUsers, callback) {
        saveItem(function(err, item) {
            if (err) {
                log.error(err, 'Error saving collaboration item.');
                callback(err);
            } else {
                notifyOnlineUsers(item);
                senderConfirmation(item);
                notifyOfflineUsers(item);
                self.saveUnreadMarkersAndLastActivity(item, callback);
            }
        });
    };

    self.saveUnreadMarkersAndLastActivity = function(item, callback) {
        async.parallel([
            saveUnreadMarkers,
            saveLastActivity
        ],
        function(err, result) {
            if (err) { log.error(err); }
            callback(err, item);
        });
    };

    function saveUnreadMarkers(callback){
        CollaborationObject.findById(_collaborationObjectId, function(err, collaborationObject) {
            if (err) {
                callback(err);
            } else {
                if (collaborationObject.members.entireGroup) {
                    saveUnreadMarkersToEntireGroup(callback);
                } else {
                    saveUnreadMarkersToMembers(collaborationObject, callback);
                }                
            }
        });
    }

    function saveUnreadMarkersToEntireGroup(callback) {
        User.findExcept([ _userId ], _groupId, function(err, users){
            async.each(
                users, 
                function(user, saveCallback){
                    UnreadMarker.increaseCounter(user._id, _collaborationObjectId, saveCallback);
                }, 
                callback
            );
        });
    }

    function saveUnreadMarkersToMembers(collaborationObject, callback) {
        async.each(
            collaborationObject.members.users, 
            function(userId, saveCallback) {
                UnreadMarker.increaseCounter(userId, _collaborationObjectId, saveCallback);
            },
            callback
        );
    }

    function saveLastActivity(callback) {
        CollaborationObject.updateLastActivity(_collaborationObjectId, callback);        
    }

    return self;
})();