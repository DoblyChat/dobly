var mongo = require('mongoose');

var schema = new mongo.Schema({
   	conversationId: { type: mongo.Schema.Types.ObjectId, required: true },
   	userId: { type: mongo.Schema.Types.ObjectId, required: true },
   	count: { type: Number, required: true }
});

module.exports = mongo.model('UnreadMarker', schema);