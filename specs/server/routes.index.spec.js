describe('Routes configuration', function(){
	'use strict';

    var config = require('../../lib/routes/').config;
	var appMock, handlerMock;

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
			signUp: jasmine.createSpy('signUp'),
			createUser: jasmine.createSpy('createUser'),
			checkUserIsLoggedIn: jasmine.createSpy('checkUserIsLoggedIn'),
			renderDesktop: jasmine.createSpy('renderDesktop'),
			getGroups: jasmine.createSpy('getGroups'),
			createGroup: jasmine.createSpy('createGroup')
		};

		mockery.registerMock('./handler', handlerMock);

		config(appMock);
	});

	it('configures routes', function(){
		verifyGet('/', handlerMock.home);
		verifyGet('/login', handlerMock.logIn);
		verifyPost('/login', handlerMock.authenticate);
		verifyGet('/logout', handlerMock.logOut);
		verifyGet('/timeout', handlerMock.timeOut);
		verifyGet('/sign-up/:group', handlerMock.signUp);
		verifyPost('/create-user', handlerMock.createUser);
		verifyGet('/conversations', handlerMock.checkUserIsLoggedIn, handlerMock.renderDesktop);
		verifyGet('/admin/groups', handlerMock.checkUserIsLoggedIn, handlerMock.getGroups);
		verifyPost('/admin/create-group', handlerMock.checkUserIsLoggedIn, handlerMock.createGroup);
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