var mongo = require('mongoose'),
	async = require('async'),
	databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';

var connection;

function connect(callback, skipConnect){
	if(skipConnect) {
		mongo.connect(databaseUri);
	}
	console.log(callback)
	callback();
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