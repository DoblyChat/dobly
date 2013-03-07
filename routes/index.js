var Conversation = require('../models/conversation'),
    User = require('../models/user'),
    Group = require('../models/group'),
    Desktop = require('../models/desktop'),
    UnreadMarker = require('../models/unread_marker'),
    passport = require('passport'),
    async = require('async');

var flashKey = 'error';

exports.config = function(app) {
	app.get('/', home);

	app.post('/login', authenticate());

	app.get('/logout', logOut);

	app.get('/timeout', timeOut);

	app.get('/sign-up/:group', signUp);

	app.post('/create-user', createUser);

	app.get('/conversations', checkUserIsLoggedIn, renderDesktop);

	app.get('/admin/groups', checkUserIsLoggedIn, getGroups);

	app.post('/admin/create-group', checkUserIsLoggedIn, createGroup);
}

function checkUserIsLoggedIn(req, res, next) {
	if(req.user) {
		next();
	} else {
		res.redirect('/');
	}
}

function home(req, res) {
	if(req.user) {
		res.redirect('/conversations');
	} else {
		var flash = req.flash(flashKey);
		res.render('index', {  	
								title: 'Fluidtalk',
								info: flash, 
								showFlash: flash.length > 0 
							});	
	}
}

function authenticate() {
	return passport.authenticate('local', { successRedirect: '/conversations',
									 		failureRedirect: '/',
									 		failureFlash: 'Username and password do not match.' });
}

function logOut(req, res) {
	req.logOut();
  	res.redirect('/');
}

function timeOut(req, res) {
	req.flash(flashKey, 'Your session timed out.');
	res.redirect('/');
}

function signUp(req, res) {
	var flash = req.flash(flashKey);
	var showFlash = flash.length > 0;
	res.render('sign-up', { group: req.params.group, title: 'Sign up - Fluid Talk', showFlash: showFlash, info: flash });
}

function createUser(req, res) {
	if(req.body.password === req.body.password2) {
		Group.findOne({ name: req.body.group }, function(err, group) {
			User.create(
				{ username: req.body.username, groupId: group._id, password: req.body.password },
				function(err){
					if(err){
						redirectToSignUp('Username is already in use');
					}else{
						res.redirect('/');	
					}
				});
		});
	} else {
		redirectToSignUp('Password does not match');
	}

	function redirectToSignUp(flash) {
		req.flash(flashKey, flash);
		res.redirect(req.header('Referrer'));
	}
}

function renderDesktop(req, res) {
	async.parallel({
	    conversations: function(callback){
	    	Conversation.find({ groupId: req.user.groupId }, null, { lean: true }, callback);
	    },
	    desktop: function(callback){
	        Desktop.findOrCreateByUserId(req.user._id, callback);
	    },
	    markers: function(callback){
	    	UnreadMarker.find({ userId: req.user._id }, null, { lean: true }, callback);
	    },
	    group: function(callback){
	    	Group.findById(req.user.groupId, 'name', { lean: true }, callback)
	    },
	    users: function(callback){
	    	User.find({ groupId: req.user.groupId}, '_id username', { lean: true }, callback);
	    }
	},
	function(err, results) {
	    results.conversations.forEach(function(conversation){
			addUnread(conversation, results.markers, results.desktop);
		});

	    if(results.desktop.isModified('conversations')){
	    	results.desktop.save();
	    }

	    results.group.users = results.users;

		res.render('conversations/active', 
		{ 
			title: 'FluidTalk',
		    conversations: JSON.stringify(results.conversations),
		    desktop: JSON.stringify(results.desktop), 
			currentUser: JSON.stringify(req.user),
			group: JSON.stringify(results.group),
			layout: ''
		});
	});

	function addUnread(conversation, markers, desktop){
		conversation.unread = 0;
		
		markers.forEach(function(marker){
			if(marker.conversationId.equals(conversation._id)){
				conversation.unread = marker.count;

				if(desktop.conversations.indexOf(conversation._id) < 0){
					desktop.conversations.push(conversation._id);
				}

				return;
			}
		});
	}
}

function getGroups(req, res){
	async.parallel({
		groups: function(callback){
			Group.find({}).lean().exec(callback);		
		},
		users: function(callback){
			User.find({}).lean().exec(callback);	
		}

	},
	function(err, results){
		results.users.forEach(function(user){
			var group = findGroup(user.groupId);
			group.users = group.users || [];
			group.users.push(user);
		});

		res.render('admin/groups', { groups: results.groups, title: 'groups' });

		function findGroup(groupId){
			var foundGroup;
			results.groups.forEach(function(group){
				if(group._id.equals(groupId)){
					foundGroup = group;
				}
			});

			return foundGroup;
		}
	});
}

function createGroup(req, res){
	Group.create({ name: req.body.name }, function(err){
		res.redirect('/admin/groups');
	});
}