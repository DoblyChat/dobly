describe('Routes handler', function(){
	var handler, req, res, 
		passportMock, groupMock, userMock, asyncMock,
		conversationMock, desktopMock, unreadMock;

	var APP_TITLE = 'Dobly';

	var Handler = require('../routes/handler');

	beforeEach(function(){
		req = {};
		res = { 
			redirect: jasmine.createSpy(),
			render: jasmine.createSpy(),
		};

		mockery.enable();

		passportMock = (function(){
			var self = {};
			self.authenticator = jasmine.createSpy();
			self.authenticate = jasmine.createSpy().andReturn(self.authenticator);

			return self;
		})();

		groupMock = buildMock('../models/group', 'findOne', 'findById', 'find', 'create');
		userMock = buildMock('../models/user', 'create', 'find');
		desktopMock = buildMock('../models/desktop', 'findOrCreateByUserId', 'isModified');
		unreadMock = buildMock('../models/unread_marker', 'find');
		asyncMock = buildMock('async', 'parallel');
		conversationMock = buildMock('../models/conversation', 'find');

		mockery.registerMock('passport', passportMock);

		handler = new Handler();
	});

	afterEach(function(){
		mockery.disable();
		mockery.deregisterMock('../models/group');
		mockery.deregisterMock('../models/user');
		mockery.deregisterMock('../models/desktop');
		mockery.deregisterMock('../models/unread_marker');
		mockery.deregisterMock('async');
		mockery.deregisterMock('../models/conversation');
		mockery.deregisterMock('passport');
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

			expect(res.render).toHaveBeenCalledWith('security/login', { title: APP_TITLE, info: '', showFlash: false });
		});

		it('sets flash if available', function(){
			req.flash = jasmine.createSpy().andReturn('flash');
			handler.logIn(req, res);

			expect(res.render).toHaveBeenCalledWith('security/login', { title: APP_TITLE, info: 'flash', showFlash: true });
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
				failureFlash: 'Username and password do not match.'
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
			expect(req.flash).toHaveBeenCalledWith('error', 'Your session timed out.');
			expect(res.redirect).toHaveBeenCalledWith('/login');
		});
	});

	describe('#signUp', function(){
		it('shows sign-up page with flash message', function(){
			req.flash = jasmine.createSpy().andReturn('flash message');
			req.params = { group: 'gru' };
			handler.signUp(req, res);

			expect(req.flash).toHaveBeenCalledWith('error');
			expect(res.render).toHaveBeenCalledWith('security/sign-up', {
				group: 'gru',
				title: 'Sign up - ' + APP_TITLE,
				showFlash: true,
				info: 'flash message'
			});
		});

		it('shows sign-up page with no flash message', function(){
			req.flash = jasmine.createSpy().andReturn('');
			req.params = { group: 'grup' };
			handler.signUp(req, res);

			expect(req.flash).toHaveBeenCalledWith('error');
			expect(res.render).toHaveBeenCalledWith('security/sign-up', {
				group: 'grup',
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
			req.body.username = 'user';
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
			expect(req.flash).toHaveBeenCalledWith('error', 'Username is already in use.');
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
			expect(userData.username).toBe('user');
			expect(userData.groupId).toBe('id');
			expect(userData.password).toBe('pass');

			var createCallback = userMock.create.getCallback();

			createCallback(null);
			expect(res.redirect).toHaveBeenCalledWith('/login');
		});
	});

	describe('#renderDesktop', function(){
		var dummyCallback = function(){};
		var render, setup;

		beforeEach(function(){
			handler.renderDesktop(req, res);
			setup = asyncMock.parallel.mostRecentCall.args[0];
			render = asyncMock.parallel.getCallback();

			req.user = { groupId: 'groupid', _id: 'my-id' };
		});

		describe('loads', function(){
			it('conversations per group', function(){
				setup.conversations(dummyCallback);
				expect(conversationMock.find).toHaveBeenCalled();

				var args = conversationMock.find.mostRecentCall.args;

				expect(args[0].groupId).toBe('groupid');
				expect(args[1]).toBeNull();
				expect(args[2].lean).toBe(true);
				expect(args[3]).toBe(dummyCallback);
			});

			it('users desktop data', function(){
				setup.desktop(dummyCallback);
				expect(desktopMock.findOrCreateByUserId).toHaveBeenCalledWith('my-id', dummyCallback);
			});

			it('users unread markers', function(){
				setup.markers(dummyCallback);
				expect(unreadMock.find).toHaveBeenCalled();

				var args = unreadMock.find.mostRecentCall.args;
				expect(args[0].userId).toBe('my-id');
				expect(args[1]).toBeNull();
				expect(args[2].lean).toBe(true);
				expect(args[3]).toBe(dummyCallback);
			});

			it('the group', function(){
				setup.group(dummyCallback);
				expect(groupMock.findById).toHaveBeenCalled();

				var args = groupMock.findById.mostRecentCall.args;
				expect(args[0]).toBe('groupid');
				expect(args[1]).toBe('name');
				expect(args[2].lean).toBe(true);
				expect(args[3]).toBe(dummyCallback);
			});
		});

		describe('render', function(){
			var data, convo1, convo2, convo3;

			beforeEach(function(){
				data = {
					group: {},
					users: [],
					conversations: [],
					desktop: {
						conversations: [],
						isModified: jasmine.createSpy(),
					},
					markers: [],
				};

				convo1 = new mongo.Types.ObjectId();
				convo2 = new mongo.Types.ObjectId();
				convo3 = new mongo.Types.ObjectId();

				data.conversations.push({ _id: convo1 });
				data.conversations.push({ _id: convo2 });
				data.conversations.push({ _id: convo3 });
			});

			it('logs error if any error is provided', function(){
				spyOn(console, 'error');
				render('some error', {});

				expect(console.error).toHaveBeenCalledWith('Error rendering desktop', 'some error');
			});

			it('logs error if there is an error updating the desktop conversations', function(){
				spyOn(console, 'error');

				data.desktop.isModified.andReturn(true);
				data.desktop.save = jasmine.createSpy();
				render(null, data);

				expect(data.desktop.save).toHaveBeenCalled();

				var saveCallback = data.desktop.save.getCallback();
				saveCallback('save error');
				expect(console.error).toHaveBeenCalledWith('Error updating desktop when rendering', 'save error');
			});

			it('sets groups users', function(){
				data.users.push({ name: 'user1'});
				data.users.push({ name: 'user2' });

				render(null, data);
				expect(data.group.users).toBe(data.users);
			});

			describe('conversations with unread counters', function(){
				beforeEach(function(){
					data.markers.push({ conversationId: convo2, count: 2 });
					data.markers.push({ conversationId: convo3, count: 4 });
				});

				it('adds unread markers to all conversations', function(){
					render(null, data);
					
					expect(data.conversations[0].unread).toBe(0);
					expect(data.conversations[1].unread).toBe(2);
					expect(data.conversations[2].unread).toBe(4);
				});

				it('adds missing conversations to the desktop if they have unread messages', function(){
					data.desktop.conversations.push(convo2);
					render(null, data);

					expect(data.desktop.conversations.indexOf(convo3)).toBeGreaterThan(-1);
					expect(data.desktop.conversations.indexOf(convo1)).toBe(-1);
				});
			});

			it('renders desktop', function(){
				data.users.push({ name: 'user1' });
				data.users.push({ name: 'user2' });
				data.markers.push({ conversationId: convo3, count: 88 });

				render(null, data);

				expect(res.render).toHaveBeenCalled();

				var args = res.render.mostRecentCall.args;
				expect(args[0]).toBe('conversations/active');

				var renderData = args[1];

				expect(renderData.title).toBe(APP_TITLE);
				expect(renderData.conversations).toBe(JSON.stringify(data.conversations));
				expect(renderData.desktop).toBe(JSON.stringify(data.desktop));
				expect(renderData.currentUser).toBe(JSON.stringify(req.user));
				expect(renderData.group).toBe(JSON.stringify(data.group));
				expect(renderData.layout).toBe('');
			});
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
				expect(groupMock.find).toHaveBeenCalledWith({}, null, { lean: true }, dummyCallback);
			});

			it('gets all users', function(){
				setup.users(dummyCallback);
				expect(userMock.find).toHaveBeenCalledWith({}, null, { lean: true }, dummyCallback);
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
				spyOn(console, 'error');
				render('my error', data);

				expect(console.error).toHaveBeenCalledWith('Error getting groups/users', 'my error');
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
				spyOn(console, 'error');
				callback('my error');
				expect(console.error).toHaveBeenCalledWith('Error creating group', 'my error');
			});

			it('redirects to groups', function(){
				callback(null);
				expect(res.redirect).toHaveBeenCalledWith('/admin/groups');
			});
		});
	});
});