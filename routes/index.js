var Conversation = require('../models/conversation'),
    User = require('../models/user'),
    Desktop = require('../models/desktop'),
    UnreadMarker = require('../models/unread_marker'),
    passport = require('passport');

exports.config = function(app){
	app.get('/', home);

	app.post('/log-in', authenticate());

	app.get('/conversations/', renderDesktop);

	app.get('/conversations/old', renderOldDesktop);
}

function home(req, res){
  res.render('index', { title: 'Fluid Talk' });
}

function authenticate(){
	return passport.authenticate('local', { successRedirect: '/conversations/',
									 		failureRedirect: '/',
									 		failureFlash: true });
}

function desktop(req, res, route, layout){
	Conversation.find({}, function(err, conversations){
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
					
				res.render(route, { title: 'desktop',
		    	conversations: JSON.stringify(conversations),
		    	desktop: JSON.stringify(desktop), layout: layout });
			});
		});
	});
}

function renderDesktop(req, res) {
	desktop(req, res, 'conversations/active', '');
}

function renderOldDesktop(req, res) {
	desktop(req, res, 'conversations/index', 'layout');	
}