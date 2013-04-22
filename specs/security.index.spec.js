describe('Security', function(){
	describe('Index', function(){
		var passport, userMock, strategy, strategyConfig;

		beforeEach(function(){
			passport = {
				use: jasmine.createSpy('user'),
				serializeUser: jasmine.createSpy('serializeUser'),
				deserializeUser: jasmine.createSpy('deserializeUser'),
			};

			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../security/');

			userMock = buildMock('../models/user', 'findOne', 'findById');
			strategy = {};
			mockery.registerMock('passport-local', {
				Strategy: function(callback){
					strategyConfig = callback;
					return strategy;
				}
			});

			var security = require('../security/');
			security.config(passport);
		});

		afterEach(function(){
			mockery.disable();
			mockery.deregisterAll();
		});

		describe('strategy config', function(){
			var username, password, done;

			beforeEach(function(){
				username = 'USR_D12';
				password = 'MY_PASS';
				done = jasmine.createSpy('done');

				expect(passport.use).toHaveBeenCalledWith(strategy);
				strategyConfig(username, password, done);
			});

			it('find user by lower cased username', function(){
				expect(userMock.findOne).toHaveBeenCalled();
				expect(userMock.findOne.mostRecentCall.args[0].username).toBe('usr_d12');
			});

			describe('When finding user', function(){
				var callback;

				beforeEach(function(){
					callback = userMock.findOne.getCallback();
				});

				it('bubbles up an error if any when finding user', function(){
					callback('find error', null);
					expect(done).toHaveBeenCalledWith('find error');
				});

				it('does not authenticate if it can not find user', function(){
					callback(null, null);
					expect(done).toHaveBeenCalledWith(null, false);
				});

				describe('and user is found', function(){
					var user;

					beforeEach(function(){
						user = {
							comparePassword: jasmine.createSpy(),
						};

						callback(null, user);
					});

					it('compares users password to provided password', function(){
						expect(user.comparePassword).toHaveBeenCalled();
						expect(user.comparePassword.mostRecentCall.args[0]).toBe('MY_PASS');
					});

					describe('and password has been compared', function(){
						var callback;

						beforeEach(function(){
							callback = user.comparePassword.getCallback();
						});

						it('bubbles up error if there is an error comparing password', function(){
							callback('error!', true);
							expect(done).toHaveBeenCalledWith('error!');
						});

						it('does not authenticate if passwords do not match', function(){
							callback(null, false);
							expect(done).toHaveBeenCalledWith(null, false);
						});

						it('auntheticates correctly if passwords match', function(){
							callback(null, user);
							expect(done).toHaveBeenCalledWith(null, user);
						});
					});
				});

			});			
		});
		
		describe('serialization', function(){
			var done, userId;

			beforeEach(function(){
				done = jasmine.createSpy();
				userId = new mongo.Types.ObjectId();
			});

			it('serializes user', function(){
				expect(passport.serializeUser).toHaveBeenCalled();
				var callback = passport.serializeUser.getCallback();
				callback({ _id: userId }, done);

				expect(done).toHaveBeenCalledWith(null, userId);
			});

			it('deserializes user', function(){
				expect(passport.deserializeUser).toHaveBeenCalled();
				var callback = passport.deserializeUser.getCallback();
				callback(userId, done);
				expect(userMock.findById).toHaveBeenCalled();

				var args = userMock.findById.mostRecentCall.args;
				expect(args[0]).toBe(userId);
				expect(args[1]).toBe('_id groupId username');
				expect(args[2].lean).toBe(true);

				var findCallback = userMock.findById.getCallback();
				var user = {};
				findCallback('an error', user);
				expect(done).toHaveBeenCalledWith('an error', user);
			});
		});
	});
});