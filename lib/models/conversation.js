'use strict';

var mongo = require('mongoose');

function topicMaxLength(value) {
	return typeof value !== 'undefined' && value !== null && value.length <= 500;
}

var schema = new mongo.Schema({
	topic: { type: String, required: true, validate: topicMaxLength },
	createdById: { type: mongo.Schema.Types.ObjectId, required: true },
	groupId: { type: mongo.Schema.Types.ObjectId, required: true },
	timestamp: { type: Date, default: Date.now, required: true },
	members: {
		entireGroup: { type: Boolean, default: false },
		users: { type: [ mongo.Schema.Types.ObjectId ], default: [] },
	}
});

schema.statics.updateTopic = function(conversationId, newTopic, callback){
	this.update({ _id: conversationId }, { topic: newTopic }, callback);
};

schema.statics.findAllowedConversations = function(groupId, userId, callback){
	this.find({ groupId: groupId, 
				$or: [ 
					{ 'members.entireGroup': true }, 
					{ 'members.users': { $in: [ userId ] } },
					{ createdById: userId } 
				] }, null, { lean: true }, callback);
};

module.exports = mongo.model('Conversation', schema);

