var mongo = require('mongoose'),
	async = require('async'),
	databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';

function connect(callback){
	mongo.connect(databaseUri, callback);
}

function disconnect(callback){
	mongo.disconnect(callback);
}

function logError(err){
	if(err){
		console.error(err);
	}
}

exports.connect = connect;
exports.disconnect = disconnect;
exports.logError = logError;