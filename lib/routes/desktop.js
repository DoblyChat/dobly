module.exports = (function(){
	var CollaborationObject = require('../models/collaboration_object'),
        Message = require('../models/message'),
        User = require('../models/user'),
        Group = require('../models/group'),
        Desktop = require('../models/desktop'),
        UnreadMarker = require('../models/unread_marker'),
        async = require('async'),
        log = require('../common/log'),
        title = 'Dobly',
        self = {};

    self.get = function(req, res) {
        async.parallel({
            collaborationObjects: function(callback){
                CollaborationObject.findAllowedCollaborationObjects(req.user.groupId, req.user._id, function(err, collaborationObjects){
                    if(err){
                        callback(err);
                    }else{
                        async.parallel([
                            function(callback){
                                async.each(collaborationObjects, loadItems, callback);

                                function loadItems(collaborationObject, callback){
                                    if (collaborationObject.type === 'C') {
                                        Message.readMessagesByPage(collaborationObject._id, 0, function(err, messages){
                                            collaborationObject.items = messages.reverse();
                                            callback(err);
                                        });
                                    } else {
                                        // read tasks
                                    }
                                }
                            },
                            function(callback){
                                async.each(collaborationObjects, loadMessageCount, callback);

                                function loadMessageCount(collaborationObject, callback){
                                    if (collaborationObject.type === 'C') {
                                        Message.count({ collaborationObjectId: collaborationObject._id }, function(err, count){
                                            collaborationObject.totalMessages = count;
                                            callback(err);
                                        });
                                    }
                                }
                            }
                        ], function(err){
                            callback(err, collaborationObjects);
                        });
                    }
                });
            },
            desktop: function(callback){
                Desktop.findOrCreateByUserId(req.user._id, callback);
            },
            markers: function(callback){
                UnreadMarker.find({ userId: req.user._id }, null, { lean: true }, callback);
            },
            group: function(callback){
                Group.findById(req.user.groupId, 'name rawName', { lean: true }, callback);
            },
            users: function(callback){
                User.find({ groupId: req.user.groupId }, '_id firstName lastName', { lean: true }, callback);
            }
        },
        function(err, results) {
            function addUnread(collaborationObject){
                collaborationObject.unread = 0;
                
                results.markers.forEach(function(marker){
                    if(marker.collaborationObjectId.equals(collaborationObject._id)){
                        collaborationObject.unread = marker.count;

                        if(results.desktop.conversations.indexOf(collaborationObject._id) < 0){
                            results.desktop.conversations.push(collaborationObject._id);
                        }

                        return;
                    }
                });
            }

            function render() {
                res.render('conversations', 
                { 
                    title: title,
                    collaborationObjects: JSON.stringify(results.collaborationObjects),
                    desktop: JSON.stringify(results.desktop), 
                    currentUser: JSON.stringify(req.user),
                    group: JSON.stringify(results.group),
                    layout: ''
                }); 
            }
            
            if(err){
                log.error('Error rendering desktop', err);
            }else{
                results.group.users = results.users;

                results.collaborationObjects.forEach(function(collaborationObject){
                    addUnread(collaborationObject);
                });

                if(results.desktop.isModified('conversations')){
                    results.desktop.save(function(err){
                        if(err){
                            log.error('Error updating desktop when rendering', err);
                        }else{
                            render();   
                        }
                    });
                }else{
                    render();
                }
            }           
        });
    };

    return self;
})();