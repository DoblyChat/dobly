module.exports = (function() {
	var log = require('../common/log'),
		consts = require('../common/consts'),
		User = require('../models/user'),
		Group = require('../models/group'),
		Validator = require('../common/validator'),
		notification_wrapper = require('../notifications/mandrill_wrapper'),
		self = {};

	var _req, _res, validator;
	var welcome = 'welcome';
	var emails = 'emails';
	var invalidEmails = 'invalidEmails';

	self.get = function(req, res) {
		init(req, res);
		resetFields();
		renderInvite();
	}

	function resetFields() {
		_res.local(emails, '');
		_res.local(invalidEmails, false);
	}

	self.getWelcome = function(req, res) {
		init(req, res);	
		resetFields();	
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
		validator = new Validator();
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
		_res.render('forms/invite', { title: consts.title });
	}

	self.post = function(req, res) {
		init(req, res);
		setFields();
		validateAndInvite();
	}

	function setFields() {
		_res.local(emails, _req.body[emails]);
	}

	function validateAndInvite() {
		var emailsArray = _req.body.emails.split(',');
		for (var i = emailsArray.length - 1; i >= 0; i--) {
			validator.check(emailsArray[i], 'invalid email').isEmail();
		};

		if (validator.hasErrors()) {
			_res.local(invalidEmails, true);
			renderInvite();
		} else {
			sendInvitation(emailsArray);
		}
	}

	function sendInvitation(emailsArray) {
		User.findById(_req.user._id, 'firstName lastName groupId', { lean: true }, function(err, user) {
			if (err) { 
				handleError(err);
			} else {
				Group.findById(user.groupId, 'rawName', function(err, group) {
					if (err) {
						handleError(err);	
					} else {
						sendEmail(emailsArray, user, group);	
					}					
				});
				
			}
		});		
	}

	function sendEmail(emailsArray, user, group) {
		var fromName = user.firstName + ' ' + user.lastName,
			fromEmail = "invitation@dobly.com",
			replyToEmail = "no-reply@dobly.com", 
			subject = "You have been invited to Dobly!", 
			text = getInvitationMessage(user, group), 
			tags = [ "invitation" ];

		var to = emailsArray.map(function(email) {
			return { 
				"email": email,
				"name": ''
			};
		});
		notification_wrapper.send(fromName, fromEmail, to, replyToEmail, subject, text, tags);
		renderInvite();
	}

	function getInvitationMessage(user, group) {
		return 'Hi, ' + user.firstName + ' has invited you to join the group ' + group.rawName + ' in Dobly. Click here to access: http://www.dobly-staging.com/clicked';
	}

	function handleError(err) {
		log.error(err);
	}

	return self;
})();