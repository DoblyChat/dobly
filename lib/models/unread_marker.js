'use strict';

var mongo = require('mongoose');

var schema = new mongo.Schema({
    collaborationObjectId: { type: mongo.Schema.Types.ObjectId, required: true },
    userId: { type: mongo.Schema.Types.ObjectId, required: true },
    count: { type: Number, required: true }
});

schema.statics.increaseCounter = function(userId, collaborationObjectId, callback){
    this.update({ userId: userId, collaborationObjectId: collaborationObjectId },
                { $inc: { count: 1 } }, 
                { upsert: true }).exec(callback);
};

schema.statics.removeMarkers = function(userId, collaborationObjectId, callback){
    this.remove({ collaborationObjectId: collaborationObjectId, userId: userId }, callback);
};

module.exports = mongo.model('UnreadMarker', schema);