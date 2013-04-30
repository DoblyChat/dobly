global.mongo = require('mongoose');
global.mongo.connect('mongodb://localhost/proto-test');
global.mockery = require('mockery');

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

global.jasmine.Spy.prototype.getCallback = function(){
	return this.mostRecentCall.args[this.mostRecentCall.args.length - 1];
}

global.buildMock = function(path){
	var mock = {};

	for (var i = 1; i < arguments.length; i++){
        mock[arguments[i]] = jasmine.createSpy();
    }

    global.mockery.registerMock(path, mock);

    return mock;
}