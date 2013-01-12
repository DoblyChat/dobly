var mongo = require('mongoose');

var schema = new mongo.Schema({
   	content: String,
   	username: String,
   	timestamp: { type: Date, default: Date.now }
});

module.exports = mongo.model('Message', schema);

exports.schema = schema;