describe('Routes handler - integration', function(){
	var User = require('../../models/user'),
		Group = require('../../models/group'),
		Conversation = require('../../models/conversation'),
		Desktop = require('../../models/desktop'),
		Message = require('../../models/message'),
		UnreadMarker = require('../../models/unread_marker'),
		async = require('async');

	var handler, req, res, group;

	var TEST_USER_NAME = 'test user';

	beforeEach(function(done){
		handler = require('../../routes/handler');

		res = {
			redirect: jasmine.createSpy('redirect'),
			render: jasmine.createSpy('render')
		};

		req = {
			body: {

			},
		};

		Group.create({ name: 'test'}, function(err, testGroup){
			group = testGroup;
			done(err);
		});
	});

	afterEach(function(done){
		group.remove(done);
	});

	it('#creates user', function(done){
		req.body.password = req.body.password2 = 'pass';
		req.body.group = group.name;
		req.body.username = TEST_USER_NAME;

		res.redirect = function(){
			User.find({ name: TEST_USER_NAME, groupId: group._id }, function(err, user){
				expect(user).toBeDefined();
				done(err);
			});
		};

		handler.createUser(req, res);
	});

	describe('#render desktop', function(){
		var testUser, conversations;

		beforeEach(function(done){
			User.create({ username: TEST_USER_NAME, groupId: group._id, password: 'pass' }, function(err, user){
				testUser = user;

				async.parallel({
					user2: function(callback){
						User.create({ username: TEST_USER_NAME + '2', groupId: group._id, password: 'pass' }, callback);
					},
					desktop: function(callback){
						Desktop.create({ userId: user._id }, callback);
					},
					conversations: function(callback){
						var conversations = [];

						for(var i = 0; i < 3; i++ ){
							conversations.push({ topic: 'test ' + i, createdBy: 'test', groupId: group._id, timestamp: new Date() });
						}

						Conversation.create(conversations, function(err){
							var savedConversations = [ arguments[1], arguments[2], arguments[3] ];
							async.parallel([
								function(callback){
									UnreadMarker.create([ 
										{
											conversationId: savedConversations[0]._id,
											userId: user._id,
											count: 1
										},
										{
											conversationId: savedConversations[1]._id,
											userId: user._id,
											count: 23
										}
									], callback);
								},
								function(callback){
									var data = [];

									for(var i = 0; i< 51; i++ ){
										data.push({ content: 'test message 2.' + i, createdBy: TEST_USER_NAME, conversationId: savedConversations[1]._id, timestamp: new Date(2013, 1, 1, 1, i) })
									}

									data.push({ content: 'test message 1', createdBy: TEST_USER_NAME, conversationId: savedConversations[0]._id, timestamp: new Date(2013, 10, 31) });
									data.push({ content: 'test message 1.2', createdBy: TEST_USER_NAME, conversationId: savedConversations[0]._id, timestamp: new Date(2013, 11, 1) });

									data.push({ content: 'test message 3', createdBy: TEST_USER_NAME, conversationId: savedConversations[2]._id });

									Message.create(data, callback);
								},
							], function(err){
								callback(err, savedConversations);
							});
						});
					}
				}, function(err, results){
					conversations = results.conversations;
					done(err);
				});
			});
		});

		afterEach(function(done){
			async.parallel([
				function(callback){
					Conversation.remove({ groupId: group._id }, callback);
				},
				function(callback){
					Desktop.remove({ userId: testUser._id }, callback);
				},
				function(callback){
					async.each(conversations, removeMessages, callback);

					function removeMessages(conversation, callback){
						Message.remove({ conversationId: conversation._id }, callback);
					}
				},
				function(callback){
					UnreadMarker.remove({ userId: testUser._id }, callback);
				}
				
			], function(err){
				done(err);
			});
		});

		it('renders', function(done){
			req.user = testUser;

			res.render = function(url, result){
				expect(url).toBe('conversations/active');
				verifyConversations(JSON.parse(result.conversations));
				verifyDesktop(JSON.parse(result.desktop));
				verifyCurrentUser(JSON.parse(result.currentUser));
				verifyGroup(JSON.parse(result.group));

				done();
			};

			handler.renderDesktop(req, res);
		});

		function verifyConversations(conversations){
			expect(conversations.length).toBe(3);

			for(var i = 0; i < conversations.length; i++){
				var conversation = conversations[i];
				expect(conversation.groupId).toBe(group._id.toString());
				expect(conversation.createdBy).toBe('test');
				expect(conversation.topic).toContain('test');
			}

			expect(conversations[0].messages.length).toBe(2);

			// messages are provided in reverse order
			expect(conversations[0].messages[1].content).toBe('test message 1');
			expect(conversations[0].messages[0].content).toBe('test message 1.2');

			expect(conversations[1].messages.length).toBe(50);
			expect(conversations[1].messages[0].content).toBe('test message 2.1');
			expect(conversations[1].messages[49].content).toBe('test message 2.50');

			expect(conversations[2].messages.length).toBe(1);
			expect(conversations[2].messages[0].content).toBe('test message 3');

			expect(conversations[0].unread).toBe(1);
			expect(conversations[1].unread).toBe(23);
		}

		function verifyDesktop(desktop){
			expect(desktop.userId).toBe(testUser._id.toString());
			expect(desktop.conversations).toContain(conversations[0]._id.toString());
			expect(desktop.conversations).toContain(conversations[1]._id.toString());
			expect(desktop.conversations).not.toContain(conversations[2]._id.toString());
		}

		function verifyCurrentUser(currentUser){
			expect(currentUser._id).toBe(testUser._id.toString());
			expect(currentUser.username).toBe(testUser.username);
		}

		function verifyGroup(resultGroup){
			expect(resultGroup.name).toBe(group.name);
			expect(resultGroup.users.length).toBe(2);
			expect(resultGroup.users[0].username).toBe(TEST_USER_NAME);
			expect(resultGroup.users[1].username).toBe(TEST_USER_NAME + '2');
		}
	});

	describe('#get groups', function(){
		var anotherGroup;

		beforeEach(function(done){
			Group.create({ name: 'another group' }, function(err, aGroup){
				anotherGroup = aGroup;

				async.parallel([
					function(callback){
						User.create([
							{ username: TEST_USER_NAME + 'A', groupId: group._id, password: 'pass' },
							{ username: TEST_USER_NAME + 'C', groupId: group._id, password: 'pass' },
							{ username: TEST_USER_NAME + 'B', groupId: group._id, password: 'pass' }
						], callback);
					},
					function(callback){
						User.create([
							{ username: TEST_USER_NAME + 'Z', groupId: anotherGroup._id, password: 'pass' },
							{ username: TEST_USER_NAME + 'X', groupId: anotherGroup._id, password: 'pass' }
						], callback);
					}
				], done);
			});
		});

		afterEach(function(done){
			anotherGroup.remove(function(err){
				group.remove(done)
			});
		});

		it('renders all groups with all users', function(done){
			res.render = function(url, result){
				expect(url).toBe('admin/groups');
				expect(result.groups.length).toBe(2);

				var firstGroup = result.groups[0];
				expect(firstGroup.name).toBe('test');
				expect(firstGroup.users.length).toBe(3);

				expect(firstGroup.users[0].username).toBe(TEST_USER_NAME + 'a');
				expect(firstGroup.users[1].username).toBe(TEST_USER_NAME + 'b');
				expect(firstGroup.users[2].username).toBe(TEST_USER_NAME + 'c');

				var secondGroup = result.groups[1];
				expect(secondGroup.users.length).toBe(2);
				expect(secondGroup.name).toBe('another group');

				expect(secondGroup.users[0].username).toBe(TEST_USER_NAME + 'x');
				expect(secondGroup.users[1].username).toBe(TEST_USER_NAME + 'z');

				done();
			};

			handler.getGroups(req, res);
		});
	});

	describe('#creates group', function(){
		var groupName = 'create-group';

		afterEach(function(done){
			Group.findOneAndRemove({ name: groupName }, done);
		});

		it('creates', function(done){
			req.body.name = groupName;

			res.redirect = function(url){
				expect(url).toBe('admin/groups');

				Group.find({ name: groupName }, function(err, groups){
					expect(groups.length).toBe(1);
					expect(groups[0].name).toBe(groupName);
					done(err);
				});
			};

			handler.createGroup(req, res);
		})
	})
})