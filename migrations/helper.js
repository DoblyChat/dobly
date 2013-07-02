var mongo = require('mongoose'),
	databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';

function connect(){
	mongo.connect(databaseUri);
}

function disconnect(){
	mongo.disconnect();
}

function logError(err){
	if(err){
		console.error(err);
	}
}

exports.connect = connect;
exports.disconnect = disconnect;
exports.logError = logError;