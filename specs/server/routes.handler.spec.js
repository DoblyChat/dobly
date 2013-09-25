describe('Routes handler', function(){
	'use strict';

    var handler, req, res, 
		passportMock, groupMock, userMock, asyncMock,
		logMock;

	beforeEach(function(){
		req = {};
		res = { 
			redirect: jasmine.createSpy(),
			render: jasmine.createSpy(),
		};

		mockery.enable({ useCleanCache: true });
		mockery.registerAllowable('../../lib/routes/handler');
		
		passportMock = (function(){
			var self = {};
			self.authenticator = jasmine.createSpy();
			self.authenticate = jasmine.createSpy().andReturn(self.authenticator);

			return self;
		})();

		groupMock = buildMock('../models/group', 'findOne', 'findById', 'find', 'create');
		userMock = buildMock('../models/user', 'create', 'find');
		asyncMock = buildMock('async', 'parallel', 'each');
		logMock = buildMock('../common/log', 'error');

		mockery.registerMock('passport', passportMock);

		handler = require('../../lib/routes/handler');
	});

	describe('#check user session', function(){
		var next;

		beforeEach(function(){
			next = jasmine.createSpy();
		});

		it('continues processing if user in session', function(){
			req.user = {};

			handler.checkUserIsLoggedIn(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(res.redirect).not.toHaveBeenCalled();
		});

		it('recirects to login route if no current session', function(){
			handler.checkUserIsLoggedIn(req, res, next);
			expect(next).not.toHaveBeenCalled();
			expect(res.redirect).toHaveBeenCalledWith('/login');
		});
	});

	describe('#home', function(){
		it('renders home page if not logged in', function(){
			handler.home(req, res);
			expect(res.render).toHaveBeenCalledWith('index', { title: APP_TITLE, layout: ''} );
		});

		it('redirects to conversations if already logged in', function(){
			req.user = {};
			handler.home(req, res);
			expect(res.redirect).toHaveBeenCalledWith('/conversations');
		});
	});

	describe('#login', function(){
		it('renders login page if not logged in', function(){
			req.flash = jasmine.createSpy().andReturn('');
			handler.logIn(req, res);

			expect(res.render).toHaveBeenCalledWith('forms/login', { 
				title: APP_TITLE, 
				info: '', 
				error: '',
				showFlashError: false,
				showFlashInfo: false 
			});
		});

		it('sets info flash if available', function(){
			req.flash = jasmine.createSpy().andCallFake(function(key){
				return key === 'info' ? 'flash' : '';
			});

			handler.logIn(req, res);

			expect(res.render).toHaveBeenCalledWith('forms/login', { 
				title: APP_TITLE, 
				info: 'flash',
				error: '',
				showFlashInfo: true,
				showFlashError: false 
			});
		});

		it('sets error flash if available', function(){
			req.flash = jasmine.createSpy().andCallFake(function(key){
				return key === 'error' ? 'flash' : '';
			});

			handler.logIn(req, res);

			expect(res.render).toHaveBeenCalledWith('forms/login', { 
				title: APP_TITLE, 
				info: '',
				error: 'flash',
				showFlashInfo: false,
				showFlashError: true 
			});
		});

		it('redirects to conversations if already logged in', function(){
			req.user = {};
			handler.logIn(req, res);

			expect(res.redirect).toHaveBeenCalledWith('/conversations');
		});
	});

	describe('#authenticate', function(){
		it('authenticates user', function(){
			handler.authenticate(req, res);
			expect(passportMock.authenticator).toHaveBeenCalledWith(req, res);
		});

		it('sets up authentication correctly', function(){
			handler.authenticate(req, res);
			expect(passportMock.authenticate).toHaveBeenCalledWith('local', {
				successRedirect: '/conversations',
				failureRedirect: '/login',
				failureFlash: 'Email and password do not match.'
			});
		});
	});

	describe('#logOut', function(){
		it('logs out and redirects to login page', function(){
			req.logOut = jasmine.createSpy();
			handler.logOut(req, res);
			expect(req.logOut).toHaveBeenCalled();
			expect(res.redirect).toHaveBeenCalledWith('/login');
		});
	});

	describe('#timeOut', function(){
		it('sets flash and redirects to login page', function(){
			req.flash = jasmine.createSpy();
			handler.timeOut(req, res);
			expect(req.flash).toHaveBeenCalledWith('info', 'Your session timed out.');
			expect(res.redirect).toHaveBeenCalledWith('/login');
		});
	});

	xdescribe('#signUp', function(){
		it('shows sign-up page with flash message', function(){
			req.flash = jasmine.createSpy().andReturn('flash message');
			req.params = { group: 'gru' };
			handler.signUp(req, res);
			var findCallback = groupMock.findOne.getCallback();
			findCallback(null, { rawName: 'Gru'});

			expect(req.flash).toHaveBeenCalledWith('error');
			expect(res.render).toHaveBeenCalledWith('security/sign-up', {
				group: 'Gru',
				title: 'Sign up - ' + APP_TITLE,
				showFlash: true,
				info: 'flash message'
			});
		});

		it('shows sign-up page with no flash message', function(){
			req.flash = jasmine.createSpy().andReturn('');
			req.params = { group: 'grup' };
			handler.signUp(req, res);
			var findCallback = groupMock.findOne.getCallback();
			findCallback(null, { rawName: 'Grup'});

			expect(req.flash).toHaveBeenCalledWith('error');
			expect(res.render).toHaveBeenCalledWith('security/sign-up', {
				group: 'Grup',
				title: 'Sign up - ' + APP_TITLE,
				showFlash: false,
				info: ''
			});
		});
	});

	describe('#createUser', function(){
		beforeEach(function(){
			req.flash = jasmine.createSpy();
			req.header = function(key){
				return 'read ' + key;
			};
			req.body = {};
			req.body.email = 'user@email.com';
			req.body.firstName = 'user';
			req.body.lastName = 'last';
			req.body.password = 'pass';
			req.body.password2 = 'pass';
			req.body.group = 'gru';
		});

		it('redirects to referrer with flash message if passwords dont match', function(){
			req.body.password2 = 'pass2';

			handler.createUser(req, res);
			expect(req.flash).toHaveBeenCalledWith('error', 'Password does not match.');
			expect(res.redirect).toHaveBeenCalledWith('read Referrer');
		});

		it('redirects to referrer with flash message if cant create user', function(){
			handler.createUser(req, res);
			var findCallback = groupMock.findOne.getCallback();
			findCallback(null, { _id: 'group'});

			var createCallback = userMock.create.getCallback();

			createCallback({});
			expect(logMock.error).toHaveBeenCalled();
			expect(req.flash).toHaveBeenCalledWith('error', 'Email is already in use.');
			expect(res.redirect).toHaveBeenCalledWith('read Referrer');
		});

		it('redirects to login page after user is created', function(){
			handler.createUser(req, res);

			expect(groupMock.findOne).toHaveBeenCalled();
			expect(groupMock.findOne.mostRecentCall.args[0].name).toBe('gru');

			var findCallback = groupMock.findOne.getCallback();
			findCallback(null, { _id: 'id' });

			expect(userMock.create).toHaveBeenCalled();

			var userData = userMock.create.mostRecentCall.args[0];
			expect(userData.firstName).toBe('user');
			expect(userData.lastName).toBe('last');
			expect(userData.email).toBe('user@email.com');
			expect(userData.groupId).toBe('id');
			expect(userData.password).toBe('pass');

			var createCallback = userMock.create.getCallback();

			createCallback(null);
			expect(res.redirect).toHaveBeenCalledWith('/login');
		});
	});

	describe('#getGroups', function(){
		
		var dummyCallback = function(){};
		var setup, render;

		beforeEach(function(){
			handler.getGroups(req, res);
			setup = asyncMock.parallel.mostRecentCall.args[0];
			render = asyncMock.parallel.mostRecentCall.args[1];
		});

		describe('setup', function(){
			it('gets all groups', function(){
				setup.groups(dummyCallback);
				expect(groupMock.find).toHaveBeenCalledWith({}, null, { lean: true, sort: { name: 1 } }, dummyCallback);
			});

			it('gets all users', function(){
				setup.users(dummyCallback);
				expect(userMock.find).toHaveBeenCalledWith({}, null, { lean: true, sort: { name: 1 } }, dummyCallback);
			});
		});

		describe('render', function(){
			var data;

				beforeEach(function(){
				data = {
					users: [],
					groups: [],
				};
			});

			it('logs errors', function(){
				render('my error', data);

				expect(logMock.error).toHaveBeenCalledWith('Error getting groups/users', 'my error');
			});

			it('associates all users into respective groups', function(){
				var group1 = { _id: new mongo.Types.ObjectId() };
				var group2 = { _id: new mongo.Types.ObjectId() };
				var group3 = { _id: new mongo.Types.ObjectId() };

				data.users.push({ name: 'user1', groupId: group1._id });
				data.users.push({ name: 'user2', groupId: group2._id });
				data.users.push({ name: 'user21', groupId: group2._id });
				data.users.push({ name: 'user22', groupId: group2._id });
				data.users.push({ name: 'user23', groupId: group2._id });
				data.users.push({ name: 'user3', groupId: group3._id });
				data.users.push({ name: 'user31', groupId: group3._id });

				data.groups.push(group1);
				data.groups.push(group2);
				data.groups.push(group3);

				render(null, data);

				expect(group1.users.length).toBe(1);
				expect(group1.users[0].name).toBe('user1');

				expect(group2.users.length).toBe(4);
				expect(group2.users[0].name).toBe('user2');
				expect(group2.users[1].name).toBe('user21');
				expect(group2.users[2].name).toBe('user22');
				expect(group2.users[3].name).toBe('user23');

				expect(group3.users.length).toBe(2);
				expect(group3.users[0].name).toBe('user3');
				expect(group3.users[1].name).toBe('user31');
			});

			it('renders groups', function(){
				render(null, data);
				expect(res.render).toHaveBeenCalledWith('admin/groups', { groups: data.groups, title: APP_TITLE, layout: ''});
			});
		});
	});

	describe('#createGroup', function(){
		beforeEach(function(){
			req.body = { name: 'my name' };
		});

		it('creates a group with provided name', function(){
			handler.createGroup(req, res);
			expect(groupMock.create).toHaveBeenCalled();

			var groupData = groupMock.create.mostRecentCall.args[0];
			expect(groupData.name).toBe('my name');
		});

		describe('callback', function(){
			var callback;

			beforeEach(function(){
				handler.createGroup(req, res);
				callback = groupMock.create.getCallback();
			});

			it('logs error if there are errors creating a group', function(){
				callback('my error');
				expect(logMock.error).toHaveBeenCalledWith('Error creating group', 'my error');
			});

			it('redirects to groups', function(){
				callback(null);
				expect(res.redirect).toHaveBeenCalledWith('admin/groups');
			});
		});
	});
});