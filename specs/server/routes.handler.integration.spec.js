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
		req.body.firstName = TEST_NAME;
		req.body.lastName = 'last';
		req.body.email = TEST_EMAIL;

		res.redirect = function(){
			User.findOne({ email: TEST_EMAIL }, function(err, user){
				expect(user).toBeDefined();
				expect(user.firstName).toBe(TEST_NAME);
				expect(user.lastName).toBe('last');
				expect(user.groupId).toEqual(group._id);
				done(err);
			});
		};

		handler.createUser(req, res);
	});

	describe('#get groups', function(){
		var anotherGroup;

		beforeEach(function(done){
			Group.create({ name: 'another group', rawName: 'Another Group' }, function(err, aGroup){
				anotherGroup = aGroup;

				async.parallel([
					function(callback){
						User.create([
							{ firstName: TEST_NAME + 'A', lastName: 'last', email: 'get.groups@test.com', groupId: group._id, password: 'pass' },
							{ firstName: TEST_NAME + 'C', lastName: 'last', email: 'get.groups2@test.com', groupId: group._id, password: 'pass' },
							{ firstName: TEST_NAME + 'B', lastName: 'last', email: 'get.groups3@test.com', groupId: group._id, password: 'pass' }
						], callback);
					},
					function(callback){
						User.create([
							{ firstName: TEST_NAME + 'Z', lastName: 'last', email: 'get.groups4@test.com', groupId: anotherGroup._id, password: 'pass' },
							{ firstName: TEST_NAME + 'X', lastName: 'last', email: 'get.groups5@test.com', groupId: anotherGroup._id, password: 'pass' }
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

				contains(firstGroup.users, TEST_NAME + 'Z');
				contains(firstGroup.users, TEST_NAME + 'X');

				var secondGroup = result.groups[1];
				expect(secondGroup.name).toBe('test');
				expect(secondGroup.users.length).toBe(3);

				contains(secondGroup.users, TEST_NAME + 'A');
				contains(secondGroup.users, TEST_NAME + 'B');
				contains(secondGroup.users, TEST_NAME + 'C');

				done();
			};

			handler.getGroups(req, res);

			function contains(users, name){
				var found = false;

				for(var i = 0; i < users.length; i++){
					if(users[i].firstName === name){
						found = true;
						break;
					}
				}

				expect(found).toBe(true);
			}
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

		it("test group name is unique", function(done) {
		  	Group.create({name: groupName, rawName: 'abc'}, function(err, myGroup) {
		  		Group.create({name: groupName, rawName: 'abc'}, function(err, otherGroup) {
		  			expect(err.err.indexOf('duplicate key error') > -1).toBe(true);
		  			done();
		  		});
		  	});
		});
	});
});