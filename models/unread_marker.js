var mongo = require('mongoose');

var schema = new mongo.Schema({
   	conversationId: { type: mongo.Schema.Types.ObjectId, required: true },
   	userId: { type: mongo.Schema.Types.ObjectId, required: true },
   	count: { type: Number, required: true }
});

schema.statics.increaseCounter = function(userId, conversationId, callback){
	this.update({ userId: userId, conversationId: conversationId },
                { $inc: { count: 1 } }, 
                { upsert: true, multi: true }).exec(callback);
}

module.exports = mongo.model('UnreadMarker', schema);