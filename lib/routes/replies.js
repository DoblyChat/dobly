module.exports = (function() {
	var self = {};

	self.get = function(req, res) {
		res.send(200);
	}

	self.post = function(req, res) {
		res.send(200);		
	};

	return self;
})();