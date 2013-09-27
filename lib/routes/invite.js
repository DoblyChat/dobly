module.exports = (function() {
	var consts = require('../common/consts'),
		User = require('../models/user'),
		Validator = require('../common/validator'),
		invitation = require('../notifications/invitation'),
		log = require('../common/log')
		self = {};

	var _req, _res, validator;

	var emails = 'emails',
		invalidEmails = 'invalidEmails',
		inviteError = 'inviteError',
		invitationsSent = 'invitationsSent';

	self.get = function(req, res) {
		init(req, res);
		resetFields();
		renderInvite();
	}

	self.getWelcome = function(req, res) {
		init(req, res);	
		resetFields();	
		renderWelcome();
	}

	function init(req, res) {
		_req = req;
		_res = res;
		validator = new Validator();
	}

	function resetFields() {
		_res.local(emails, '');
		resetFlags();
	}

	function resetFlags() {
		_res.local(invalidEmails, false);
		_res.local(inviteError, false);
		_res.local(invitationsSent, false);
	}

	function renderInvite() {
		_res.render('forms/invite', { title: consts.title });
	}

	function renderWelcome() {
		User.findById(_req.user._id, 'firstName', { lean: true }, function(err, user) {
			if (err) {
				renderInvite();
			} else {
				_res.local('userFirstName', user.firstName);
				_res.render('forms/welcome', { title: consts.title });
			}
		});
	}	

	self.post = function(req, res) {
		init(req, res);
		setFields();
		validateAndInvite(renderInvite);
	}

	self.postWelcome = function(req, res) {
		init(req, res);
		setFields();
		validateAndInvite(renderWelcome);
	}

	function setFields() {
		_res.local(emails, _req.body[emails]);
		resetFlags();
	}

	function validateAndInvite(renderCallback) {
		
		var emailsArray = _req.body.emails.split(',');

		for (var i = emailsArray.length - 1; i >= 0; i--) {
			validator.check(emailsArray[i], 'invalid email').isEmail();
		};

		if (validator.hasErrors()) {
			_res.local(invalidEmails, true);
			renderCallback();
		} else {
			invitation.send(_req.user._id, emailsArray, function(err) {
				if (err) {
					log.error(err);
					_res.local(inviteError, true);
				} else {
					_res.local(emails, '');
					_res.local(invitationsSent, true);
				}
				renderCallback();
			});
		}
	}

	return self;
})();