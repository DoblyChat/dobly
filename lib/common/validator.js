module.exports = (function() {
	var Validator = require('validator').Validator;

	Validator.prototype.error = function(msg) {
		this._errors.push(msg);
		return this;
	};

	Validator.prototype.getErrors = function() {
		return this._errors;
	};

	Validator.prototype.hasErrors = function() {
		return this._errors.length > 0;
	};

	return Validator;
})();