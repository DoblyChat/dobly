var mongo = require('mongoose');

var schema = new mongo.Schema({
	name: { type: String, required: true }
});

module.exports = mongo.model('Group', schema);