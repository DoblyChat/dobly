module.exports = (function() {
	var log = require('../common/log'),
		consts = require('../common/consts'),
		User = require('../models/user'),
		self = {};

	var _req, _res;
	var welcome = 'welcome';

	self.get = function(req, res) {
		init(req, res);
		renderInvite();
	}

	self.getWelcome = function(req, res) {
		init(req, res);		
		User.findById(req.user._id, 'firstName', { lean: true }, function(err, user) {
			if (err) {
				renderInvite();
			} else {
				renderWelcome(user.firstName);
			}
		});
	}

	function init(req, res) {
		_req = req;
		_res = res;
	}

	function renderWelcome(userFirstName) {
		_res.local(welcome, true);
		_res.local('userFirstName', userFirstName);
		render();
	}	

	function renderInvite() {
		_res.local(welcome, false);
		render();
	}

	function render() {
		_res.render('security/invite', { title: consts.title });
	}

	self.post = function(req, res) {
		res.redirect('/conversations');
	}

	return self;
})();