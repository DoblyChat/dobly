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
});