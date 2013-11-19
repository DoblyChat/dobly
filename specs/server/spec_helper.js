(function(global){
    'use strict';

    global.mongo = require('mongoose');
    global.mongo.connect('mongodb://localhost/proto-test');
    global.mockery = require('mockery');

    global.APP_TITLE = 'Dobly';

    global.checkRequiredFieldError = function(err, field){
        expect(err).not.toBe(null);
        expect(err.errors[field].type).toBe('required');
    };

    global.stringOfLength = function(length) {
        var string = '';
        for (var i = length - 1; i >= 0; i--) {
            string += 'a';
        }
        
        return string;
    };

    global.jasmine.Spy.prototype.getCallback = function(){
        return this.mostRecentCall.args[this.mostRecentCall.args.length - 1];
    };

    global.jasmine.Spy.prototype.callback = function(error, results) {
        var myCallback = this.getCallback();
        myCallback(error, results);
    };

    global.buildMock = function(path){
        var mock = {};

        for (var i = 1; i < arguments.length; i++){
            mock[arguments[i]] = jasmine.createSpy();
        }

        mockery.registerMock(path, mock);

        return mock;
    };

    global.enableMockery = function() {
        mockery.enable({
            useCleanCache: true,
            warnOnReplace: false,
            warnOnUnregistered: false
        });
    };

    global.aproximateDate = function(date) {
        return Math.ceil(date.valueOf() / 1000);
    };

    afterEach(function(){
        global.mockery.disable();
        global.mockery.deregisterAll();
        global.mockery.warnOnUnregistered(true);
    });
})(global);