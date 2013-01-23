var Conversation = require('../models/conversation'),
    User = require('../models/user'),
    Group = require('../models/group'),
    Desktop = require('../models/desktop'),
    UnreadMarker = require('../models/unread_marker'),
    passport = require('passport');

exports.config = function(app){
	app.get('/', home);

	app.post('/log-in', authenticate());

	app.get('/sign-up', signUp);

	app.post('/create-user', createUser);

	app.get('/conversations/', checkUserIsLoggedIn, renderDesktop);

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

function home(req, res){
  res.render('index', { title: 'Welcome to Fluid Talk! '});
}

function authenticate(){
	return passport.authenticate('local', { successRedirect: '/conversations/',
									 		failureRedirect: '/' });
}

function signUp(req, res){
	Group.find({}, { lean: true }, function(err, groups){
		res.render('sign-up', { groups: groups, title: 'Sign up - Fluid Talk' });
	});
}

function createUser(req, res){
	User.create(
		{ username: req.body.username, groupId: req.body.group, password: req.body.password },
		function(err){
			res.redirect('/');
		});
}

function renderDesktop(req, res) {
	Conversation.find({ groupId: req.user.groupId }, null, { lean: true }, function(err, conversations){
		Desktop.findOrCreateByUserId(req.user._id, function(err, desktop){
			UnreadMarker.find({ userId: req.user._id }, null, { lean: true }, function(err, markers){
				conversations.forEach(function(conversation){
					conversation.unread = 0;
					
					markers.forEach(function(marker){
						if(marker.conversationId.equals(conversation._id)){
							conversation.unread = marker.count;
						}
					});
				});
					
				res.render('conversations/active', 
					{ 
						title: 'Fluid Talk',
		    			conversations: JSON.stringify(conversations),
		    			desktop: JSON.stringify(desktop), 
		    			currentUser: JSON.stringify(req.user),
		    			layout: ''
		    		});
			});
		});
	});
}

function getGroups(req, res){
	Group.find({}).lean().exec(function(err, groups){
		User.find({}).lean().exec(function(err, users) {
			users.forEach(function(user){
				var group = findGroup(user.groupId);
				group.users = group.users || [];
				group.users.push(user);
			});

			res.render('admin/groups', { groups: groups, title: 'groups' });
		});

		function findGroup(groupId){
			var foundGroup;
			groups.forEach(function(group){
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