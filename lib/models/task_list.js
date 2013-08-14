'use strict';

var mongo = require('mongoose'),
	Task = require('./task');

var schema = new mongo.Schema({
	private: { type: Boolean, default: false },
	createdById: { type: mongo.Schema.Types.ObjectId, required: true },
	groupId: { type: mongo.Schema.Types.ObjectId, required: true },
	name: { type: String, required: true },
	tasks: [ Task.schema ]
});

schema.pre('remove', function(next){
	Task.remove({ taskListId: this._id }, function(err){
		if(!err) {
			next();
		}
	});
});

module.exports = mongo.model('TaskList', schema);