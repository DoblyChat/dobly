describe('Sockets', function(){
	describe('Authorize', function(){
		var authorize, userMock, data, accept, 
			sessionStoreMock, cookieParserMock,
			cookieMock;

		beforeEach(function(){
			accept = jasmine.createSpy();
		
			data = {
				headers: {
					cookie: 'a cookie'
				},
			};

			sessionStoreMock = {
				load: jasmine.createSpy(),
			};

			cookieMock = {
				'express.sid': 'sess-id'
			};

			spyOn(global, 'unescape').andReturn('u-sess-id');

			mockery.enable({ useCleanCache: true});
			mockery.registerAllowable('../sockets/authorize_io');

			cookieParserMock = buildMock('cookie', 'parse');
			cookieParserMock.parse = cookieParserMock.parse.andReturn(cookieMock);

			userMock = buildMock('../models/user', 'findById');

			authorize = require('../sockets/authorize_io');
		});

		afterEach(function(){
			mockery.disable();
			mockery.deregisterAll();
		});

		it('does not authorize if no cookie is passed in', function(){
			data.headers.cookie = undefined;
			authorize(data, accept, sessionStoreMock);
			expect(accept).toHaveBeenCalledWith('No cookie transmitted.', false);
		});

		describe('when cookie is provided', function(){
			var callback;

			beforeEach(function(){
				authorize(data, accept, sessionStoreMock);
				callback = sessionStoreMock.load.getCallback();
				spyOn(console, 'warn');
				expect(sessionStoreMock.load.mostRecentCall.args[0]).toBe('u-sess-id');
			});

			it('does not authorize if error loading session', function(){
				callback('my error', {});
				expect(console.warn).toHaveBeenCalledWith('Session not found', 'my error');
				expect(accept).toHaveBeenCalledWith('Session not found', false);
			});

			it('does not authorize if session not found', function(){
				callback(null, null);
				expect(console.warn).toHaveBeenCalledWith('Session not found', null);
				expect(accept).toHaveBeenCalledWith('Session not found', false);
			});

			describe('and session is available', function(){
				var findUserCallback, session;

				beforeEach(function(){
					spyOn(console, 'error');
					session = { passport: { user: 'usr' } };
					callback(null, session);
					findUsercallback = userMock.findById.getCallback();
				});

				it('loads user if session is found', function(){
					expect(userMock.findById.mostRecentCall.args[0]).toBe('usr');
					var user = { _doc: { name: 'hello world '} };
					
					findUsercallback(null, user);

					expect(data.session).toBe(session);
					expect(data.user).toBe(user._doc);
					expect(accept).toHaveBeenCalledWith(null, true);
				});

				it('does not authorize if there is an error finding the user', function(){
					findUsercallback('an error', {});
					expect(console.error).toHaveBeenCalledWith('User not found', 'an error');
					expect(accept).toHaveBeenCalledWith('User not found', false);
				});

				it('does not authorize if user is not found', function(){
					findUsercallback(null, null);
					expect(console.error).toHaveBeenCalledWith('User not found', null);
					expect(accept).toHaveBeenCalledWith('User not found', false);
				});
			});
		});
	});
});