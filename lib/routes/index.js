exports.config = function(app) {
	
	var handler = require('./handler');

	app.get('/', handler.home);

	app.get('/login', handler.logIn);

	app.post('/login', handler.authenticate);

	app.get('/logout', handler.logOut);

	app.get('/timeout', handler.timeOut);

	app.get('/group/signup', handler.groupSignUp);

	app.post('/group/signup', handler.createGroup, handler.createUser);

	app.get('/sign-up/:group', handler.signUpOld);

	app.post('/create-user', handler.createUser);

	app.get('/conversations', handler.checkUserIsLoggedIn, handler.renderDesktop);

	app.get('/admin/groups', handler.checkUserIsLoggedIn, handler.getGroups);

	app.post('/admin/create-group', handler.checkUserIsLoggedIn, handler.createGroup);
};