module.exports = (function() {
	'use strict';
	
    var self = {};

    self.error = function(message, err) {
        console.error('~~~ ' + message + ' ~~~', err);
        console.trace('~~~ ' + message + ' ~~~');
    };

    return self;
})();