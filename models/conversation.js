var mongo = require('mongoose'),
	message = require('./message');

function topicMaxLength(value) {
	return typeof value !== 'undefined' && value !== null && value.length <= 500;
}

var schema = new mongo.Schema({
	topic: { type: String, required: true, validate: topicMaxLength },
   	createdBy: { type: String, required: true },
   	groupId: { type: mongo.Schema.Types.ObjectId, required: true },
   	timestamp: { type: Date, default: Date.now, required: true },
	messages: [{ type: mongo.Schema.Types.ObjectId, ref: 'Message' }]
});

schema.statics.addMessage = function(conversationId, messageId, callback){
	this.update(
        { _id: conversationId }, 
        { $push: { messages: messageId } },
        function(err){
            callback(err);
        });
};

module.exports = mongo.model('Conversation', schema);

