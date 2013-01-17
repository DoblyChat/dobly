var mongo = require('mongoose');

var schema = new mongo.Schema({
   	content: String,
   	createdBy: { type: String, required: true },
   	timestamp: { type: Date, default: Date.now, required: true }
});

module.exports = mongo.model('Message', schema);

exports.schema = schema;