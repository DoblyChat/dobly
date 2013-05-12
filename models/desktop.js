var mongo = require('mongoose');

var schema = new mongo.Schema({
	conversations: { type: [ mongo.Schema.Types.ObjectId ], default: [] },
	userId: { type: mongo.Schema.Types.ObjectId, required: true },
});

schema.methods.removeConversation = function(conversationId, callback){
	this.update({ $pull: { conversations: conversationId }}, callback);
};

schema.methods.addConversation = function(conversationId, callback){
	this.update({ $addToSet: { conversations: conversationId }}, callback);
};

schema.methods.moveConversation = function(currentIndex, newIndex, callback){
	var conversation = this.conversations[currentIndex];
    this.conversations.splice(currentIndex, 1);
    this.conversations.splice(newIndex, 0, conversation);

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
}

module.exports = mongo.model('Desktop', schema);