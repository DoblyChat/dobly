var mongo = require('mongoose'),
	databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';

function connect(){
	mongo.connect(databaseUri);
}

function logError(err){
	if(err){
		console.error(err);
	}
}

exports.connect = connect;
exports.logError = logError;