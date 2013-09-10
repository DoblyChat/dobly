'use strict';

exports.config = function(app) {
	
	var handler = require('./handler'),
		groupSignUp = require('./group_sign_up'),
		invite = require('./invite'),
		desktop = require('./desktop');

	app.get('/', handler.home);

	app.get('/login', handler.logIn);

	app.post('/login', handler.authenticate);

	app.get('/logout', handler.logOut);

	app.get('/timeout', handler.timeOut);

	app.get('/signup', groupSignUp.get);

	app.post('/signup', groupSignUp.post);

	app.get('/invite', handler.checkUserIsLoggedIn, invite.get);

	app.post('/invite', handler.checkUserIsLoggedIn, invite.post);

	app.get('/welcome', handler.checkUserIsLoggedIn, invite.getWelcome);

	app.get('/sign-up/:group', handler.signUpOld);

	app.post('/create-user', handler.createUser);

	app.get('/conversations', handler.checkUserIsLoggedIn, desktop.get);

	app.get('/admin/groups', handler.checkUserIsLoggedIn, handler.getGroups);

	app.post('/admin/create-group', handler.checkUserIsLoggedIn, handler.createGroup);
};