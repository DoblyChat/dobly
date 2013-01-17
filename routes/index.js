var Conversation = require('../models/conversation'),
    User = require('../models/user'),
    Desktop = require('../models/desktop'),
    UnreadMarker = require('../models/unread_marker'),
    passport = require('passport');

exports.config = function(app){
	app.get('/', home);

	app.post('/log-in', authenticate());

	app.get('/conversations/', checkUserIsLoggedIn, renderDesktop);
}

function checkUserIsLoggedIn(req, res, next) {
	if(req.user) {
		next();
	} else {
		res.redirect('/');
	}
}

function home(req, res){
  res.render('index', { title: 'Fluid Talk' });
}

function authenticate(){
	return passport.authenticate('local', { successRedirect: '/conversations/',
									 		failureRedirect: '/' });
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
						title: 'desktop',
		    			conversations: JSON.stringify(conversations),
		    			desktop: JSON.stringify(desktop), 
		    			currentUser: JSON.stringify(req.user),
		    			layout: ''
		    		});
			});
		});
	});
}