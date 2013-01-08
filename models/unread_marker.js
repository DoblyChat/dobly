var mongo = require('mongoose');

var schema = new mongo.Schema({
   	conversationId: mongo.Schema.Types.ObjectId,
   	userId: mongo.Schema.Types.ObjectId,
   	count: Number,
});

module.exports = mongo.model('UnreadMarker', schema);