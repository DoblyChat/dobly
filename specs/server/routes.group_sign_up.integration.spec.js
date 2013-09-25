describe("Routes group sign up", function() {
  	'use strict';

  	var route, req, res;
  	var groupSignUpForm = 'forms/group-signup';

  	beforeEach(function(){
		req = {};
		res = { 
			redirect: jasmine.createSpy(),
			render: jasmine.createSpy(),
			locals: {},
			local: function(field, value) {
				res.locals[field] = value;
			}
		};

		route = require('../../lib/routes/group_sign_up');
	});

	it("get", function() {
	  	route.get(req, res);
	  	expect(res.render).toHaveBeenCalledWith(groupSignUpForm, { title: APP_TITLE });
	  	expect(res.locals.groupname).toEqual('');
	  	expect(res.locals.firstname).toEqual('');
	  	expect(res.locals.lastname).toEqual('');
	  	expect(res.locals.email).toEqual('');
	  	expect(res.locals.validationErrors.length).toBe(0);
	});

	describe("post", function() {

		describe("validates", function() {
		  
			beforeEach(function() {
				req.body = {
					groupname: 'Flex Team',
					firstname: 'Mario',
					lastname: 'Gomez',
					email: 'mariog@flex.com',
					password: 'pass',
					password2: 'pass'
				};
			});

			it("group name missing", function(done) {
				req.body.groupname = '';
				res.render = function(view, params) {
					expect(view).toEqual(groupSignUpForm);
					expect(res.locals.groupname).toEqual('');
					expect(res.locals.firstname).toEqual('Mario');
					expect(res.locals.lastname).toEqual('Gomez');
					expect(res.locals.email).toEqual('mariog@flex.com');
					expect(res.locals.validationErrors.length).toBe(1);
					expect(res.locals.validationErrors[0]).toEqual('Group name is missing.');
					done();
				}
				route.post(req, res);
			});
		});
	});
});