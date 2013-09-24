module.exports = (function() {
	'use strict';

    var Validator = require('../common/validator');
	
    var self = {};

    self.isValid = function(value) {
        var validator = new Validator();
        validator.check(value, 'invalid email').isEmail();
        return !validator.hasErrors();
    };

    return self;
})();