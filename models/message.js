var mongo = require('mongoose');

function contentMaxLength(value) {
	return typeof value !== 'undefined' && value != null && value.length <= 2000;
}

var schema = new mongo.Schema({
   	content: { type: String, required: true, validate: contentMaxLength },
   	createdBy: { type: String, required: true },
   	timestamp: { type: Date, default: Date.now, required: true },
   	conversationId: { type: mongo.Schema.Types.ObjectId, required: true },
});

module.exports = mongo.model('Message', schema);

exports.schema = schema;