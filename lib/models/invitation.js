'use strict';

var mongo = require('mongoose');

var schema = new mongo.Schema({
	email: { type: String, required: true, lowercase: true },
	groupId: { type: mongo.Schema.Types.ObjectId, required: true },
	invitedByUserId: { type: mongo.Schema.Types.ObjectId, required: true }
});

module.exports = mongo.model('Invitation', schema);