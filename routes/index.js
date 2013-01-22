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
	Group.find({}, function(err, groups){
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
	Conversation.find({ groupId: req.user.groupId }, function(err, conversations){
		Desktop.findOrCreateByUserId(req.user._id, function(err, desktop){
			UnreadMarker.find({ userId: req.user._id }, function(err, markers){
				conversations.forEach(function(conversation){
					conversation._doc.unread = 0;
					
					markers.forEach(function(marker){
						if(marker.conversationId.equals(conversation._id)){
							conversation._doc.unread = marker.count;
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
	Group.find({}, function(err, groups){
		User.find({}, function(err, users) {
			for(var i = 0; i < users.length; i++){
				var group = findGroup(users[i].groupId);
				group.users = group.users || [];
				group.users.push(users[i]);
			}
			res.render('admin/groups', { groups: groups, title: 'groups' });
		});

		function findGroup(groupId){
			for(var i = 0; i < groups.length; i++){
				if(groups[i]._id.equals(groupId)){
					return groups[i];
				}
			}
		}
	});
}

function createGroup(req, res){
	Group.create({ name: req.body.name }, function(err){
		res.redirect('/admin/groups');
	});
}