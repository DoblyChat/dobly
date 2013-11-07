'use strict';

var mongo = require('mongoose'),
	CollaborationObject = require('./collaboration_object'),
	async = require('async'),
	User = require('./user');

var schema = new mongo.Schema({
	collaborationObjects: { type: [ mongo.Schema.Types.ObjectId ], default: [] },
	userId: { type: mongo.Schema.Types.ObjectId, required: true },
});

schema.statics.removeCollaborationObject = function(id, collaborationObjectId, callback){
	this.findByIdAndUpdate(id, { $pull: { collaborationObjects: collaborationObjectId }}, callback);
};

schema.statics.addCollaborationObject = function(id, collaborationObjectId, callback){
	this.findByIdAndUpdate(id, { $addToSet: { collaborationObjects: collaborationObjectId }}, callback);
};

schema.methods.moveCollaborationObject = function(currentIndex, newIndex, callback){
	var conversation = this.collaborationObjects[currentIndex];
    this.collaborationObjects.splice(currentIndex, 1);
    this.collaborationObjects.splice(newIndex, 0, conversation);

    this.save(callback);
};

schema.statics.findOrCreateByUserId = function(userId, callback){
	var model = this;
	this.findOne({ userId: userId }, function(err, desktop){
		if(desktop === null){
			desktop = new model();
			desktop.userId = userId;
			desktop.save(function(err, savedDesktop){
				callback(err, savedDesktop);
			});
		}
		else{
			callback(err, desktop);
		}
	});
};

schema.methods.addRecentCollaborationObjects = function(callback) {
	var desktop = this; 
	async.waterfall([
		function(callback) {
			User.findById(desktop.userId, callback);
		},
		function(user, callback) {
			CollaborationObject
				.find({ groupId: user.groupId })
				.limit(5)
				.sort('-lastActivity')
				.select('_id')
				.exec(callback);
		},
		function(recentCollaborationObjects, callback) {
			recentCollaborationObjects.forEach(function(obj) {
				desktop.collaborationObjects.push(obj._id);
			});
			desktop.save(callback);
		}
	], function(err, result) {
		if (err) {
			callback(err);
		} else {
			callback(null);
		}
	});
};

module.exports = mongo.model('Desktop', schema);