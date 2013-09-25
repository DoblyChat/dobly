describe("Routes group sign up - integration", function() {
  	'use strict';

  	var route, 
  		req, 
  		res,
  		Group = require('../../lib/models/group'),
  		User = require('../../lib/models/user');

  	beforeEach(function(){
  		req = {};
  		res = {
  			locals: {},
  			local: function(field, value) {
  				res.locals[field] = value;
  			}
  		}
	});

	describe("post", function() {

		describe("saves group and user", function() {

			var _testGroup;

			it("saves and authenticates", function(done) {
				route = require('../../lib/routes/group_sign_up');

			  	req.body = {
					groupname: 'The A-Team',
					firstname: 'Hannibal',
					lastname: 'Smith',
					email: 'hannibals@theateam.com',
					password: 'pass',
					password2: 'pass'
				};

				spyOn(route, 'authenticate').andCallFake(function() {
					Group.findOne({ name: req.body.groupname.toLowerCase() }, function(err, testGroup) {
						_testGroup = testGroup;
						expect(err).toBeNull();
						expect(testGroup._id).not.toBeNull();
						expect(testGroup.rawName).toEqual('The A-Team');
						expect(testGroup.name).toEqual('the a-team');

						User.findOne({ email: req.body.email.toLowerCase() }, function(err, testUser) {
							expect(err).toBeNull();
							expect(testUser._id).not.toBeNull();
							expect(testUser.firstName).toEqual('Hannibal');
							expect(testUser.lastName).toEqual('Smith');
							expect(testUser.email).toEqual('hannibals@theateam.com');
							expect(testUser.groupId).toEqual(testGroup._id);

							testUser.comparePassword('pass', function(err, isMatch) {
								expect(isMatch).toBe(true);
								done(err);
							})
						})
					})
				});

				route.post(req, res);
			});

			afterEach(function(done) {
				if (_testGroup) {
					_testGroup.remove(done);
				}
			});
		});
	});

	describe("authenticate", function() {
		it("check passport params", function() {
			mockery.enable({ 
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			});

			var passportMock = (function(){
				var self = {};
				self.authenticator = jasmine.createSpy();
				self.authenticate = jasmine.createSpy().andReturn(self.authenticator);

				return self;
			})();

			mockery.registerMock('passport', passportMock);
			route = require('../../lib/routes/group_sign_up');

			route.authenticate();

			expect(passportMock.authenticate).toHaveBeenCalledWith('local', {
				successRedirect: '/welcome',
				failureRedirect: '/login',
				failureFlash: 'There is a problem authenticating your new credentials.'
			});
		});
	});
});

















