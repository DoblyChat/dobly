var mongo = require('mongoose'),
	message = require('./message');

function topicMaxLength(value) {
	return typeof value !== 'undefined' && value.length <= 500;
}

var schema = new mongo.Schema({
	topic: { type: String, required: true, validate: topicMaxLength },
   	createdBy: { type: String, required: true },
   	groupId: { type: mongo.Schema.Types.ObjectId, required: true },
   	timestamp: { type: Date, default: Date.now, required: true },
	messages: [message.schema]
});

schema.virtual('lastMessages').get(function(){
	var sortedMessages = this.messages.sort(function(a,b){
		return b.timestamp < a.timestamp;
	});

	return sortedMessages.slice(-2);
});

module.exports = mongo.model('Conversation', schema);

