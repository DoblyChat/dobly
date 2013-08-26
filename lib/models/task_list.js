'use strict';

var mongo = require('mongoose'),
	Task = require('./task');

var schema = new mongo.Schema({
	createdById: { type: mongo.Schema.Types.ObjectId, required: true },
	groupId: { type: mongo.Schema.Types.ObjectId, required: true },
	name: { type: String, required: true },
	tasks: [ Task.schema ],
	members: {
		entireGroup: { type: Boolean, default: false },
		users: { type: [ mongo.Schema.Types.ObjectId ], default: [] },
	}
});

schema.statics.findAllowedTasks = function(groupId, userId, callback){
	this.find({ groupId: groupId, 
				$or: [
					{ createdById: userId }, 
					{ 'members.entireGroup': true }, 
					{ 'members.users': { $in: [ userId ] } }
				] }, null, { lean: true }, callback);
};

module.exports = mongo.model('TaskList', schema);