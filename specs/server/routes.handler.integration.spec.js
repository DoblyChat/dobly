describe('Routes handler - integration', function(){
	'use strict';

    var User = require('../../lib/models/user'),
		Group = require('../../lib/models/group'),
		CollaborationObject = require('../../lib/models/collaboration_object'),
		Desktop = require('../../lib/models/desktop'),
		Message = require('../../lib/models/message'),
		UnreadMarker = require('../../lib/models/unread_marker'),
		async = require('async');

	var handler, req, res, group;

	var TEST_NAME = 'test user',
		TEST_EMAIL = 'routes.int@test.com';

	beforeEach(function(done){
		handler = require('../../lib/routes/handler');

		res = {
			redirect: jasmine.createSpy('redirect'),
			render: jasmine.createSpy('render')
		};

		req = {
			body: {

			},
		};

		Group.create({ name: 'test', rawName: 'Test'}, function(err, testGroup){
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
		req.body.name = TEST_NAME;
		req.body.email = TEST_EMAIL;

		res.redirect = function(){
			User.findOne({ email: TEST_EMAIL }, function(err, user){
				expect(user).toBeDefined();
				expect(user.name).toBe(TEST_NAME);
				expect(user.groupId).toEqual(group._id);
				done(err);
			});
		};

		handler.createUser(req, res);
	});

	describe('#render desktop', function(){
		var testUser, collaborationObjects;

		beforeEach(function(done){
			User.create({ email: TEST_EMAIL, name: TEST_NAME, groupId: group._id, password: 'pass' }, function(err, user){
				testUser = user;

				async.parallel({
					user2: function(callback){
						User.create({ email: 'routes.int.2@test.com', name: TEST_NAME + '2', groupId: group._id, password: 'pass' }, callback);
					},
					desktop: function(callback){
						Desktop.create({ userId: user._id }, callback);
					},
					collaborationObjects: function(callback){
						var collaborationObjects = [];

						for(var i = 0; i < 3; i++ ){
							collaborationObjects.push({ topic: 'test ' + i, createdById: user._id, groupId: group._id, timestamp: new Date(), members: { entireGroup: true }, type: 'C' });
						}

						CollaborationObject.create(collaborationObjects, function(err){
							var savedCollaborationObjects = [ arguments[1], arguments[2], arguments[3] ];
							async.parallel([
								function(callback){
									UnreadMarker.create([ 
										{
											collaborationObjectId: savedCollaborationObjects[0]._id,
											userId: user._id,
											count: 1
										},
										{
											collaborationObjectId: savedCollaborationObjects[1]._id,
											userId: user._id,
											count: 23
										}
									], callback);
								},
								function(callback){
									var data = [];

									for(var i = 0; i< 51; i++ ){
										data.push({ content: 'test message 2.' + i, createdBy: TEST_NAME, collaborationObjectId: savedCollaborationObjects[1]._id, timestamp: new Date(2013, 1, 1, 1, i) });
									}

									data.push({ content: 'test message 1', createdBy: TEST_NAME, collaborationObjectId: savedCollaborationObjects[0]._id, timestamp: new Date(2013, 9, 17) });
									data.push({ content: 'test message 1.2', createdBy: TEST_NAME, collaborationObjectId: savedCollaborationObjects[0]._id, timestamp: new Date(2013, 9, 16) });

									data.push({ content: 'test message 3', createdBy: TEST_NAME, collaborationObjectId: savedCollaborationObjects[2]._id });

									Message.create(data, callback);
								},
							], function(err){
								callback(err, savedCollaborationObjects);
							});
						});
					}
				}, function(err, results){
					collaborationObjects = results.collaborationObjects;
					done(err);
				});
			});
		});

		afterEach(function(done){
			async.parallel([
				function(callback){
					CollaborationObject.remove({ groupId: group._id }, callback);
				},
				function(callback){
					Desktop.remove({ userId: testUser._id }, callback);
				},
				function(callback){
					async.each(collaborationObjects, removeMessages, callback);

					function removeMessages(conversation, callback){
						Message.remove({ collaborationObjectId: conversation._id }, callback);
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
				expect(url).toBe('conversations');
				verifyCollaborationObjects(JSON.parse(result.collaborationObjects));
				verifyDesktop(JSON.parse(result.desktop));
				verifyCurrentUser(JSON.parse(result.currentUser));
				verifyGroup(JSON.parse(result.group));

				done();
			};

			handler.renderDesktop(req, res);
		});

		function verifyCollaborationObjects(collaborationObjects){
			expect(collaborationObjects.length).toBe(3);

			for(var i = 0; i < collaborationObjects.length; i++){
				var collaborationObject = collaborationObjects[i];
				expect(collaborationObject.groupId).toBe(group._id.toString());
				expect(collaborationObject.createdById).toBe(testUser._id.toString());
				expect(collaborationObject.createdBy).toBe(testUser.name);
				expect(collaborationObject.topic).toContain('test');
			}

			expect(collaborationObjects[0].items.length).toBe(2);

			// items are provided in reverse order
			expect(collaborationObjects[0].items[1].content).toBe('test message 1');
			expect(collaborationObjects[0].items[0].content).toBe('test message 1.2');

			expect(collaborationObjects[1].items.length).toBe(50);
			expect(collaborationObjects[1].items[0].content).toBe('test message 2.1');
			expect(collaborationObjects[1].items[49].content).toBe('test message 2.50');

			expect(collaborationObjects[2].items.length).toBe(1);
			expect(collaborationObjects[2].items[0].content).toBe('test message 3');

			expect(collaborationObjects[0].unread).toBe(1);
			expect(collaborationObjects[1].unread).toBe(23);
		}

		function verifyDesktop(desktop){
			expect(desktop.userId).toBe(testUser._id.toString());
			expect(desktop.conversations).toContain(collaborationObjects[0]._id.toString());
			expect(desktop.conversations).toContain(collaborationObjects[1]._id.toString());
			expect(desktop.conversations).not.toContain(collaborationObjects[2]._id.toString());
		}

		function verifyCurrentUser(currentUser){
			expect(currentUser._id).toBe(testUser._id.toString());
			expect(currentUser.email).toBe(testUser.email);
		}

		function verifyGroup(resultGroup){
			expect(resultGroup.name).toBe(group.name);
			expect(resultGroup.users.length).toBe(2);
			expect(resultGroup.users[0].name).toBe(TEST_NAME);
			expect(resultGroup.users[1].name).toBe(TEST_NAME + '2');
		}
	});

	describe('#get groups', function(){
		var anotherGroup;

		beforeEach(function(done){
			Group.create({ name: 'another group', rawName: 'Another Group' }, function(err, aGroup){
				anotherGroup = aGroup;

				async.parallel([
					function(callback){
						User.create([
							{ name: TEST_NAME + 'A', email: 'get.groups@test.com', groupId: group._id, password: 'pass' },
							{ name: TEST_NAME + 'C', email: 'get.groups2@test.com', groupId: group._id, password: 'pass' },
							{ name: TEST_NAME + 'B', email: 'get.groups3@test.com', groupId: group._id, password: 'pass' }
						], callback);
					},
					function(callback){
						User.create([
							{ name: TEST_NAME + 'Z', email: 'get.groups4@test.com', groupId: anotherGroup._id, password: 'pass' },
							{ name: TEST_NAME + 'X', email: 'get.groups5@test.com', groupId: anotherGroup._id, password: 'pass' }
						], callback);
					}
				], done);
			});
		});

		afterEach(function(done){
			anotherGroup.remove(function(err){
				group.remove(done);
			});
		});

		it('renders all groups with all users', function(done){
			res.render = function(url, result){
				expect(url).toBe('admin/groups');
				expect(result.groups.length).toBe(2);

				var firstGroup = result.groups[0];
				expect(firstGroup.users.length).toBe(2);
				expect(firstGroup.name).toBe('another group');

				expect(firstGroup.users[0].name).toBe(TEST_NAME + 'x');
				expect(firstGroup.users[1].name).toBe(TEST_NAME + 'z');

				var secondGroup = result.groups[1];
				expect(secondGroup.name).toBe('test');
				expect(secondGroup.users.length).toBe(3);

				expect(secondGroup.users[0].name).toBe(TEST_NAME + 'a');
				expect(secondGroup.users[1].name).toBe(TEST_NAME + 'b');
				expect(secondGroup.users[2].name).toBe(TEST_NAME + 'c');

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
		});
	});
});