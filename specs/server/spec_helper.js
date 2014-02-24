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
            mock[arguments[i]] = jasmine.createSpy(arguments[i]);
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

    beforeEach(function() {
        this.addMatchers({

            toBeEquivalentDates: function(expected) {
                var actual = this.actual;
                var notText = this.isNot ? " not" : "";

                this.message = function () {
                    return "Expected " + actual + notText + " to be equivalent to " + expected;
                };

                if(!actual.getDate){
                    actual = new Date(actual);
                }

                if(!expected.getDate){
                    expected = new Date(expected);
                }

                return actual.getDate() === expected.getDate() && 
                    actual.getMonth() === expected.getMonth() &&
                    actual.getFullYear() === expected.getFullYear();
            }
        });
    });

    global.waitUntilSpyCalled = function(spy, callback){
        var wait = setInterval(function(){
            if(spy.calls.length > 0){
                clearInterval(wait);
                callback(spy.mostRecentCall.args);
            }
        }, 500);
    };

    afterEach(function(){
        global.mockery.disable();
        global.mockery.deregisterAll();
        global.mockery.warnOnUnregistered(true);
    });
})(global);