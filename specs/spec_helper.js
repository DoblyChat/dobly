global.mongo = require('mongoose');
global.mongo.connect('mongodb://localhost/proto-test');

global.checkRequiredFieldError = function(err, field){
	expect(err).not.toBe(null);
	expect(err.errors[field].type).toBe('required');
}

global.stringOfLength = function(length) {
	var string = '';
	for (var i = length - 1; i >= 0; i--) {
		string += 'a';
	};
	return string;
}