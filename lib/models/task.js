'use strict';

var mongo = require('mongoose');

var schema = new mongo.Schema({
	complete: { type: Boolean, default: false },
	completedOn: { type: Date },
	createdById: { type: mongo.Schema.Types.ObjectId, required: true },
	taskListId: { type: mongo.Schema.Types.ObjectId, required: true },
	description: { type: String, required: true },
});

module.exports = mongo.model('Task', schema);

exports.schema = schema;