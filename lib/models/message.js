'use strict';

var mongo = require('mongoose');

function contentMaxLength(value) {
    return value && value.length <= 2000;
}

var schema = new mongo.Schema({
    content: { type: String, required: true, validate: contentMaxLength },
    createdById: { type: mongo.Schema.Types.ObjectId, required: true },
    timestamp: { type: Date, default: Date.now, required: true },
    collaborationObjectId: { type: mongo.Schema.Types.ObjectId, required: true },
});

schema.statics.readMessagesByPage = function(collaborationObjectId, page, callback){
    this.find({ collaborationObjectId: collaborationObjectId }, 
                    'content createdById timestamp', 
                    { 
                        limit: 50, 
                        skip: page * 50,
                        lean: true,
                        sort: {
                            timestamp: -1
                        }
                    }, callback);
};

module.exports = mongo.model('Message', schema);

exports.schema = schema;