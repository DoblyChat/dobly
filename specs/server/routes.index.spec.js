describe('Routes configuration', function(){
	'use strict';

    var config = require('../../lib/routes/').config;
	var appMock, handlerMock, groupSignUpMock, inviteMock, desktopMock, userSignUpMock;

	beforeEach(function(){
		mockery.enable();

		appMock = {
			get: jasmine.createSpy(),
			post: jasmine.createSpy()
		};

		handlerMock = {
			home: jasmine.createSpy('home'),
			logIn: jasmine.createSpy('logIn'),
			authenticate: jasmine.createSpy('authenticate'),
			logOut: jasmine.createSpy('logOut'),
			timeout: jasmine.createSpy('timeOut'),
			checkUserIsLoggedIn: jasmine.createSpy('checkUserIsLoggedIn'),
			checkUserIsLoggedOut: jasmine.createSpy('checkUserIsLoggedOut'),
			renderDesktop: jasmine.createSpy('renderDesktop')
		};

		groupSignUpMock = buildMock('./group_sign_up', 'get', 'post');
		inviteMock = buildMock('./invite', 'get', 'post', 'getWelcome', 'postWelcome');
		desktopMock = buildMock('./desktop', 'get');
		userSignUpMock = buildMock('./user_sign_up', 'get', 'post');
		mockery.registerMock('./handler', handlerMock);

		config(appMock);
	});

	it('configures routes', function(){
		verifyGet('/', handlerMock.home);
		verifyGet('/login', handlerMock.logIn);
		verifyPost('/login', handlerMock.authenticate);
		verifyGet('/logout', handlerMock.logOut);
		verifyGet('/timeout', handlerMock.timeOut);
		verifyGet('/signup', handlerMock.checkUserIsLoggedOut, groupSignUpMock.get);
		verifyPost('/signup', handlerMock.checkUserIsLoggedOut, groupSignUpMock.post);
		verifyGet('/invite', handlerMock.checkUserIsLoggedIn, inviteMock.get);
		verifyPost('/invite', handlerMock.checkUserIsLoggedIn, inviteMock.post);
		verifyGet('/welcome', handlerMock.checkUserIsLoggedIn, inviteMock.getWelcome);
		verifyPost('/welcome', handlerMock.checkUserIsLoggedIn, inviteMock.postWelcome);
		verifyGet('/invitation/:id', handlerMock.checkUserIsLoggedOut, userSignUpMock.get);
		verifyPost('/invitation/:id', handlerMock.checkUserIsLoggedOut, userSignUpMock.post);
		verifyGet('/conversations', handlerMock.checkUserIsLoggedIn, desktopMock.get);
	});

	function verifyGet(route, handler, handler2){
		if(handler2){
			expect(appMock.get).toHaveBeenCalledWith(route, handler, handler2);
		}else{
			expect(appMock.get).toHaveBeenCalledWith(route, handler);
		}
	}

	function verifyPost(route, handler, handler2){
		if(handler2){
			expect(appMock.post).toHaveBeenCalledWith(route, handler, handler2);
		}else{
			expect(appMock.post).toHaveBeenCalledWith(route, handler);
		}
	}
});