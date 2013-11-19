
exports.up = function(next){
    var Message = require('../lib/models/message'),
  		UnreadMarker = require('../lib/models/unread_marker')
        async = require('async'),
        CollaborationObject = require('../lib/models/collaboration_object'),
        User = require('../lib/models/user'),
        helper = require('./helper');

    helper.connect(function(){
        execute();
    });

    function execute() {
    	Message.find({}, function(err, messages) {
    		async.each(messages, changeConversationId, function(err) {
    			helper.logError(err);
    			UnreadMarker.find({}, function(err, unreadMarkers) {
    				async.each(unreadMarkers, changeConversationId, function(err) {
    					helper.logError(err);
    					helper.disconnect(next);
    				});
    			});
    		});

            function changeConversationId(item, callback) {
                item.collaborationObjectId = item._doc.conversationId;
                updateCreatedById(item, callback);
            }

            function updateCreatedById(item, callback) {
                if (item._doc.createdBy) {
                    CollaborationObject.findById(item.collaborationObjectId, function(err, collaborationObject) {
                        helper.logError(err);
                        if(collaborationObject){
                            User.findOne({ groupId: collaborationObject.groupId, firstName: item._doc.createdBy }, function(err, user) {
                                helper.logError(err);
                                item.createdById = user._id;
                                item.save(callback);
                            });
                        }
                    });
                } else {
                    callback();
                }
            }
    	});
    }
};

exports.down = function(next){
  next();
};
