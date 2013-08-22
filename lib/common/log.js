module.exports = (function() {
    var self = {};

    self.error = function(err, message) {
    	if (message) {
        	console.error('~~~ ' + message + ' ~~~', err);
        	console.trace('~~~ ' + message + ' ~~~');
        } else {
        	console.error('~~~', err);
        	console.trace('~~~');
        }
    };

    return self;
})();