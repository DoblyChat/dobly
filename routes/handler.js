

module.exports = function RouteHandler(){
	
	var Conversation = require('../models/conversation'),
	    User = require('../models/user'),
	    Group = require('../models/group'),
	    Desktop = require('../models/desktop'),
	    UnreadMarker = require('../models/unread_marker'),
	    passport = require('passport'),
	    async = require('async'),
	    flashKey = 'error',
	    title = 'Dobly',
	    self = this;

	self.checkUserIsLoggedIn = function(req, res, next) {
		if(req.user) {
			next();
		} else {
			res.redirect('/login');
		}
	}

	self.home = function(req, res) {
		routeIfLoggedIn(req, res, function(){
			res.render('index', { title: title, layout: '' });
		});	
	}

	self.login = function(req, res){
		routeIfLoggedIn(req, res, function(){
			var flash = req.flash(flashKey);
			res.render('security/login', {  	
									title: title,
									info: flash, 
									showFlash: flash.length > 0 
								});	
		});
	}

	function routeIfLoggedIn(req, res, render){
		if(req.user) {
			res.redirect('/conversations');
		} else {
			render();
		}
	}

	self.authenticate = function(req, res) {
		return passport.authenticate('local', { successRedirect: '/conversations',
										 		failureRedirect: '/login',
										 		failureFlash: 'Username and password do not match.' })(req, res);
	}

	self.logOut = function(req, res) {
		req.logOut();
	  	res.redirect('/login');
	}

	self.timeOut = function(req, res) {
		req.flash(flashKey, 'Your session timed out.');
		res.redirect('/login');
	}

	self.signUp = function(req, res) {
		var flash = req.flash(flashKey);
		var showFlash = flash.length > 0;
		res.render('security/sign-up', { group: req.params.group, title: 'Sign up - ' + title, showFlash: showFlash, info: flash });
	}

	self.createUser = function(req, res) {
		if(req.body.password === req.body.password2) {
			Group.findOne({ name: req.body.group }, function(err, group) {
				User.create(
					{ username: req.body.username, groupId: group._id, password: req.body.password },
					function(err){
						if(err){
							redirectToSignUp('Username is already in use.');
						}else{
							res.redirect('/login');	
						}
					});
			});
		} else {
			redirectToSignUp('Password does not match.');
		}

		function redirectToSignUp(flash) {
			req.flash(flashKey, flash);
			res.redirect(req.header('Referrer'));
		}
	}

	self.renderDesktop = function(req, res) {
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
			if(err){
				console.error('Error rendering desktop', err);
			}else{
				results.group.users = results.users;

			    results.conversations.forEach(function(conversation){
					addUnread(conversation, results.markers, results.desktop);
				});

			    if(results.desktop.isModified('conversations')){
			    	results.desktop.save(function(err){
			    		if(err){
			    			console.error('Error updating desktop when rendering', err);
			    		}else{
			    			render();	
			    		}
			    	});
			    }else{
			    	render();
			    }

				function addUnread(conversation){
					conversation.unread = 0;
					
					results.markers.forEach(function(marker){
						if(marker.conversationId.equals(conversation._id)){
							conversation.unread = marker.count;

							if(results.desktop.conversations.indexOf(conversation._id) < 0){
								results.desktop.conversations.push(conversation._id);
							}

							return;
						}
					});
				}

			    function render() {
			    	res.render('conversations/active', 
					{ 
						title: title,
					    conversations: JSON.stringify(results.conversations),
					    desktop: JSON.stringify(results.desktop), 
						currentUser: JSON.stringify(req.user),
						group: JSON.stringify(results.group),
						layout: ''
					});	
			    }
			}			
		});
	}

	self.getGroups = function(req, res){
		async.parallel({
			groups: function(callback){
				Group.find({}, null, { lean: true }, callback);		
			},
			users: function(callback){
				User.find({}, null, { lean: true }, callback);	
			}
		},
		function(err, results){
			if(err){
				console.error('Error getting groups/users', err);
			}

			results.users.forEach(function(user){
				var group = findGroup(user.groupId);
				group.users = group.users || [];
				group.users.push(user);
			});

			res.render('admin/groups', { groups: results.groups, title: title, layout: '' });

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

	self.createGroup = function(req, res){
		Group.create({ name: req.body.name }, function(err){
			if(err){
				console.error('Error creating group', err);
			}
			res.redirect('/admin/groups');
		});
	}
};