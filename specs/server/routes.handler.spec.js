describe('Routes handler', function(){
	'use strict';

    var handler, req, res, 
		passportMock, groupMock, userMock, asyncMock,
		collaborationObjectMock, desktopMock, unreadMock,
		messageMock, logMock;

	var APP_TITLE = 'Dobly';

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
		desktopMock = buildMock('../models/desktop', 'findOrCreateByUserId', 'isModified');
		unreadMock = buildMock('../models/unread_marker', 'find');
		asyncMock = buildMock('async', 'parallel', 'each');
		collaborationObjectMock = buildMock('../models/collaboration_object', 'findAllowedCollaborationObjects');
		messageMock = buildMock('../models/message', 'readMessagesByPage', 'count');
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
			expect(req.flash).toHaveBeenCalledWith('error', 'Your session timed out.');
			expect(res.redirect).toHaveBeenCalledWith('/login');
		});
	});

	describe('#signUp', function(){
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
			req.body.name = 'user';
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
			expect(userData.name).toBe('user');
			expect(userData.email).toBe('user@email.com');
			expect(userData.groupId).toBe('id');
			expect(userData.password).toBe('pass');

			var createCallback = userMock.create.getCallback();

			createCallback(null);
			expect(res.redirect).toHaveBeenCalledWith('/login');
		});
	});

	describe('#renderDesktop', function(){
		var render, setup, dummyCallback;

		beforeEach(function(){
			dummyCallback = jasmine.createSpy('callback');
			handler.renderDesktop(req, res);
			setup = asyncMock.parallel.mostRecentCall.args[0];
			render = asyncMock.parallel.getCallback();

			req.user = { groupId: 'groupid', _id: 'my-id' };
		});

		describe('loads', function(){
			describe('collaborationObjects', function(){
				beforeEach(function(){
					setup.collaborationObjects(dummyCallback);
				});

				it('allowed conversation', function(){
					expect(collaborationObjectMock.findAllowedCollaborationObjects).toHaveBeenCalled();
					var args = collaborationObjectMock.findAllowedCollaborationObjects.mostRecentCall.args;

					expect(args[0]).toBe(req.user.groupId);
					expect(args[1]).toBe(req.user._id);
				});

				it('bubbles up error if there is an error finding collaborationObjects', function(){
					var callback = collaborationObjectMock.findAllowedCollaborationObjects.getCallback();
					callback('my-error');
					expect(dummyCallback).toHaveBeenCalledWith('my-error');
				});

				describe('messages', function(){
					var loadMessages, loadMessageCount, 
						collaborationObjects, collaborationObject;

					beforeEach(function(){
						collaborationObjects = [{dummy: 'object1'}, {dummy: 'object2'}];
						collaborationObject = { _id: 'object-id', type: 'C' };

						var callback = collaborationObjectMock.findAllowedCollaborationObjects.getCallback();
						callback(null, collaborationObjects);
						var funcs = asyncMock.parallel.mostRecentCall.args[0];
						loadMessages = funcs[0];
						loadMessageCount = funcs[1];
					});

					it('loads first message page', function(){
						loadMessages(dummyCallback);
						expect(asyncMock.each).toHaveBeenCalled();
						expect(asyncMock.each.mostRecentCall.args[0]).toBe(collaborationObjects);
						expect(asyncMock.each.mostRecentCall.args[2]).toBe(dummyCallback);

						var load = asyncMock.each.mostRecentCall.args[1];
						load(collaborationObject, dummyCallback);
						expect(messageMock.readMessagesByPage).toHaveBeenCalled();
						var readArgs = messageMock.readMessagesByPage.mostRecentCall.args;

						expect(readArgs[0]).toBe(collaborationObject._id);
						expect(readArgs[1]).toBe(0);

						var callback = messageMock.readMessagesByPage.getCallback();
						var messages = [{ dummyMsg: 'hello world'}];
						callback('my-error', messages);
						expect(collaborationObject.items).toBe(messages.reverse());
						expect(dummyCallback).toHaveBeenCalledWith('my-error');
					});

					it('loads message count', function(){
						loadMessageCount(dummyCallback);
						expect(asyncMock.each).toHaveBeenCalled();
						expect(asyncMock.each.mostRecentCall.args[0]).toBe(collaborationObjects);
						expect(asyncMock.each.mostRecentCall.args[2]).toBe(dummyCallback);

						var loadCount = asyncMock.each.mostRecentCall.args[1];
						loadCount(collaborationObject, dummyCallback);
						expect(messageMock.count).toHaveBeenCalled();

						var countArgs = messageMock.count.mostRecentCall.args;

						expect(countArgs[0].collaborationObjectId).toBe(collaborationObject._id);

						var callback = messageMock.count.getCallback();
						callback('my-error', 123);
						expect(collaborationObject.totalMessages).toBe(123);
						expect(dummyCallback).toHaveBeenCalledWith('my-error');
					});

					it('returns collaborationObjects after messages and message counts are loaded', function(){
						var callback = asyncMock.parallel.getCallback();
						callback('my-error', collaborationObjects);
						expect(dummyCallback).toHaveBeenCalledWith('my-error', collaborationObjects);
					});
				});
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
			var data, object1, object2, object3, user1, user2, user3;

			beforeEach(function(){
				data = {
					group: {},
					users: [],
					collaborationObjects: [],
					desktop: {
						conversations: [],
						isModified: jasmine.createSpy(),
					},
					markers: [],
				};

				object1 = new mongo.Types.ObjectId();
				object2 = new mongo.Types.ObjectId();
				object3 = new mongo.Types.ObjectId();

				user1 = { _id: new mongo.Types.ObjectId(), name: 'uno' };
				user2 = { _id: new mongo.Types.ObjectId(), name: 'dos' };
				user3 = { _id: new mongo.Types.ObjectId(), name: 'tres' };

				data.collaborationObjects.push({ _id: object1, createdById: user1._id });
				data.collaborationObjects.push({ _id: object2, createdById: user2._id });
				data.collaborationObjects.push({ _id: object3, createdById: user3._id });

				data.users.push(user1);
				data.users.push(user2);
				data.users.push(user3);
			});

			it('logs error if any error is provided', function(){
				render('some error', {});

				expect(logMock.error).toHaveBeenCalledWith('Error rendering desktop', 'some error');
			});

			it('logs error if there is an error updating the desktop collaborationObjects', function(){
				data.desktop.isModified.andReturn(true);
				data.desktop.save = jasmine.createSpy();
				render(null, data);

				expect(data.desktop.save).toHaveBeenCalled();

				var saveCallback = data.desktop.save.getCallback();
				saveCallback('save error');
				expect(logMock.error).toHaveBeenCalledWith('Error updating desktop when rendering', 'save error');
			});

			it('sets groups users', function(){
				render(null, data);
				expect(data.group.users).toBe(data.users);
			});

			describe('collaborationObjects with unread counters', function(){
				beforeEach(function(){
					data.markers.push({ collaborationObjectId: object2, count: 2 });
					data.markers.push({ collaborationObjectId: object3, count: 4 });
				});

				it('adds unread markers to all collaborationObjects', function(){
					render(null, data);
					
					expect(data.collaborationObjects[0].unread).toBe(0);
					expect(data.collaborationObjects[1].unread).toBe(2);
					expect(data.collaborationObjects[2].unread).toBe(4);
				});

				it('adds missing collaborationObjects to the desktop if they have unread messages', function(){
					data.desktop.conversations.push(object2);
					render(null, data);

					expect(data.desktop.conversations.indexOf(object3)).toBeGreaterThan(-1);
					expect(data.desktop.conversations.indexOf(object1)).toBe(-1);
				});
			});

			describe('collaborationObjects with created by names', function(){
				beforeEach(function(){
					data.collaborationObjects[0].createdById = user1._id;
					data.collaborationObjects[1].createdById = user2._id;
					data.collaborationObjects[2].createdById = user3._id;
				});

				it('adds created by names for each conversation', function(){
					render(null, data);

					expect(data.collaborationObjects[0].createdBy).toBe(user1.name);
					expect(data.collaborationObjects[1].createdBy).toBe(user2.name);
					expect(data.collaborationObjects[2].createdBy).toBe(user3.name);
				});
			});

			it('renders desktop', function(){
				data.markers.push({ collaborationObjectId: object3, count: 88 });

				render(null, data);

				expect(res.render).toHaveBeenCalled();

				var args = res.render.mostRecentCall.args;
				expect(args[0]).toBe('conversations');

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