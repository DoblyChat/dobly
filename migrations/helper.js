var mongo = require('mongoose'),
	databaseUri = process.env.MONGOLAB_URI || 'mongodb://localhost/proto';

var connection;

function connect(callback){
	disconnect();
	mongo.connect(databaseUri);
	callback();
}

function disconnect(callback){
	mongo.disconnect(callback);

	for(var i = 0; i < mongo.connections.length; i++){
		mongo.connections[i].close();
	}
}

function logError(err){
	if(err){
		console.error(err);
	}
}

exports.connect = connect;
exports.disconnect = disconnect;
exports.logError = logError;