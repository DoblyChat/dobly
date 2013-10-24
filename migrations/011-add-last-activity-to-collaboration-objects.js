
exports.up = function(next){

	var CollaborationObject = require('../lib/models/collaboration_object'),
		Message = require('../lib/models/message'),
		helper = require('./helper'),
		async = require('async');

	helper.connect(function() {
		execute();
	})

	function execute() {
		CollaborationObject.find({}, function(err, collaborationObjects) {
			helper.logError(err);

			async.each(collaborationObjects, update, function(err) {
				helper.logError(err);
				helper.disconnect(next);				
			})

			function update(collaborationObject, callback) {
				Message
					.find({ collaborationObjectId: collaborationObject._id })
					.limit(1)
					.sort('-timestamp')
					.select('timestamp')
					.exec(function(err, lastMessages) {
						helper.logError(err);
						if (lastMessages.length > 0 ) {
							collaborationObject.lastActivity = lastMessages[0].timestamp;
						} else {
							collaborationObject.lastActivity = collaborationObject.timestamp;
						}
						collaborationObject.save(callback);
					})
			}
		});
	}
};

exports.down = function(next){
  next();
};
