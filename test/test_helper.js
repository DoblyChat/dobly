var chai = require('chai');
global.should = chai.should();
global.expect = chai.expect;

global.sinon = require('sinon');
global.mongo = require('mongoose');

global.mongo.connect('mongodb://localhost/proto-test');

global.checkRequiredFieldError = function(err, field){
	err.should.not.be.null;
	err.errors[field].type.should.eql('required');
}