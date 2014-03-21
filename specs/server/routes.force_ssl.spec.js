describe('Routes Force SSL', function() {
	'use strict';

	var routeConfig, app, req, res, next;
	var getCallback, postCallback;

	beforeEach(function() {
		req = {
			headers: {}
		};
		res = {
			redirect: jasmine.createSpy(),
			send: jasmine.createSpy()
		};
		next = jasmine.createSpy();
		app = {
			get: jasmine.createSpy(),
			post: jasmine.createSpy()
		};
		routeConfig = require('../../lib/routes/force_ssl').config;
		routeConfig(app);
		getCallback = app.get.mostRecentCall.args[1];
		postCallback = app.post.mostRecentCall.args[1];
		process.env.NODE_ENV = 'production';
	});

	describe('get', function() {
		it('get called', function() {
			expect(app.get).toHaveBeenCalled();
			expect(app.get.mostRecentCall.args[0]).toEqual('*');
		});

		it('calls next if request is https', function() {
			req.headers['x-forwarded-proto'] = 'https';
			getCallback(req, res, next);
			expect(next).toHaveBeenCalled();
		});

		it('redirects to https if request is http', function() {
			req.headers['x-forwarded-proto'] = 'http';
			process.env.DOMAIN_NAME = 'www.somedomain.com';
			req.url = '/someurl';
			getCallback(req, res, next);
			expect(res.redirect).toHaveBeenCalledWith('https://www.somedomain.com/someurl');
			expect(next).not.toHaveBeenCalled();
		});

		it('calls next if request is http and environment is development', function() {
			req.headers['x-forwarded-proto'] = 'http';
			process.env.NODE_ENV = 'development';
			getCallback(req, res, next);
			expect(next).toHaveBeenCalled();
		});
	});

	describe('post', function() {
		it('post called', function() {
			expect(app.post).toHaveBeenCalled();
			expect(app.post.mostRecentCall.args[0]).toEqual('*');
		});

		it('calls next if request is https', function() {
			req.headers['x-forwarded-proto'] = 'https';
			postCallback(req, res, next);
			expect(next).toHaveBeenCalled();
		});

		it('sends bad request if request is http', function() {
			req.headers['x-forwarded-proto'] = 'http';
			postCallback(req, res, next);
			expect(res.send).toHaveBeenCalledWith(400);
			expect(next).not.toHaveBeenCalled();
		});

		it('calls next if request is http and environment is development', function() {
			req.headers['x-forwarded-proto'] = 'http';
			process.env.NODE_ENV = 'development';
			postCallback(req, res, next);
			expect(next).toHaveBeenCalled();
		});
	});
});