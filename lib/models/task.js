'use strict';

var mongo = require('mongoose');

var schema = new mongo.Schema({
	complete: { type: Boolean, default: false },
	completedOn: { type: Date },
	createdById: { type: mongo.Schema.Types.ObjectId, required: true },
	collaborationObjectId: { type: mongo.Schema.Types.ObjectId, required: true },
	content: { type: String, required: true },
	timestamp: { type: Date, default: Date.now, required: true },
});

schema.statics.readTasks = function(collaborationObjectId, callback){
	this.find({ collaborationObjectId: collaborationObjectId }, null, { 
		lean: true, sort: { timestamp: 1 }
	}, callback);
};

module.exports = mongo.model('Task', schema);

exports.schema = schema;