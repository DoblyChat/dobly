'use strict';

exports.config = function(app) {
	
	var handler = require('./handler'),
		groupSignUp = require('./group_sign_up'),
		invite = require('./invite'),
		desktop = require('./desktop'),
		userSignUp = require('./user_sign_up');

	app.get('/', handler.home);

	app.get('/login', handler.logIn);

	app.post('/login', handler.authenticate);

	app.get('/logout', handler.logOut);

	app.get('/timeout', handler.timeOut);

	app.get('/signup', handler.checkUserIsLoggedOut, groupSignUp.get);

	app.post('/signup', handler.checkUserIsLoggedOut, groupSignUp.post);

	app.get('/invite', handler.checkUserIsLoggedIn, invite.get);

	app.post('/invite', handler.checkUserIsLoggedIn, invite.post);

	app.get('/welcome', handler.checkUserIsLoggedIn, invite.getWelcome);

	app.post('/welcome', handler.checkUserIsLoggedIn, invite.postWelcome);

	app.get('/invitation/:id', handler.checkUserIsLoggedOut, userSignUp.get);

	app.post('/invitation/:id', handler.checkUserIsLoggedOut, userSignUp.post);

	app.get('/conversations', handler.checkUserIsLoggedIn, desktop.get);
};