'use strict';

var mongo = require('mongoose');

function contentMaxLength(value) {
    return value && value.length <= 2000;
}

var schema = new mongo.Schema({
    content: { type: String, required: true, validate: contentMaxLength },
    createdBy: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, required: true },
    conversationId: { type: mongo.Schema.Types.ObjectId, required: true },
});

schema.statics.readMessagesByPage = function(conversationId, page, callback){
    this.find({ conversationId: conversationId }, 
                    'content createdBy timestamp', 
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