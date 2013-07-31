module.exports = (function() {
    var self = {};

    self.error = function(message, err) {
        console.error('~~~ ' + message + ' ~~~', err);
        console.trace('~~~ ' + message + ' ~~~');
    };

    return self;
})();