var mongo = require('mongoose');

var userSchema = new mongo.Schema({
	username: String,
	password: String
});

module.exports = mongo.model('User', userSchema);