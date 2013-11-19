describe("Routes user sign up", function() {
    'use strict';

    var route, req, res;
    var loginPage = '/login', userSignUpForm = 'forms/user-signup';
    var logMock;

    beforeEach(function() {
        req = {
            params: {}
        };
        res = {
            redirect: jasmine.createSpy(),
            render: jasmine.createSpy(),
            locals: {},
            local: function(field, value) {
                res.locals[field] = value;
            }
        };

        mockery.enable({
            useCleanCache: true,
            warnOnReplace: false,
            warnOnUnregistered: false
        });

        logMock = buildMock('../common/log', 'error');
    });

    afterEach(function() {
        mockery.disable();
    });

    describe("get", function() {

        var invitationMock;

        beforeEach(function() {
            invitationMock = buildMock('../models/invitation', 'findById');
            route = require('../../lib/routes/user_sign_up');
        });

        it("missing invitation id", function() {
            route.get(req, res);
            expect(res.redirect).toHaveBeenCalledWith(loginPage);
        });

        it("error getting invitation", function() {
            req.params.id = new mongo.Types.ObjectId();

            route.get(req, res);
            
            expect(invitationMock.findById).toHaveBeenCalled();
            var args = invitationMock.findById.mostRecentCall.args;
            expect(args[0]).toEqual(req.params.id);
            var callback = args[1];
            
            callback('some error', null);
            expect(logMock.error).toHaveBeenCalledWith('some error');
            expect(res.redirect).toHaveBeenCalledWith(loginPage);   
        });

        it("invalid invitation id", function() {
            req.params.id = new mongo.Types.ObjectId();

            route.get(req, res);
            
            expect(invitationMock.findById).toHaveBeenCalled();
            var args = invitationMock.findById.mostRecentCall.args;
            expect(args[0]).toEqual(req.params.id);
            var callback = args[1];
            
            callback(null, null);
            expect(logMock.error).toHaveBeenCalledWith({ ErrorMessage: 'Invitation Id not found.', InvitationId: req.params.id });
            expect(res.redirect).toHaveBeenCalledWith(loginPage);
        });

        it("invitation already accepted", function() {
            req.params.id = new mongo.Types.ObjectId();

            route.get(req, res);
            
            expect(invitationMock.findById).toHaveBeenCalled();
            var args = invitationMock.findById.mostRecentCall.args;
            expect(args[0]).toEqual(req.params.id);
            var callback = args[1];
            
            callback(null, { accepted: true });
            expect(res.redirect).toHaveBeenCalledWith(loginPage);   
        });

        it("render user sign up", function() {
            req.params.id = '123';

            route.get(req, res);
            
            expect(invitationMock.findById).toHaveBeenCalled();
            var args = invitationMock.findById.mostRecentCall.args;
            expect(args[0]).toEqual('123');
            var callback = args[1];
            
            callback(null, { accepted: false });
            expect(res.locals.firstname).toEqual('');
            expect(res.locals.lastname).toEqual('');
            expect(res.locals.validationErrors.length).toBe(0);
            expect(res.render).toHaveBeenCalledWith(userSignUpForm, { title: APP_TITLE, formAction: '/invitation/123' });           
        });
    });

    describe("post", function() {

        describe("validates", function() {
            
            beforeEach(function() {
                req.body = {
                    firstname: 'Mario',
                    lastname: 'Gomez',
                    password: 'pass',
                    password2: 'pass'
                };    
            });

            it("first name missing", function(done) {
                req.body.firstname = '';
                res.render = function(view, params) {
                    expect(view).toEqual(userSignUpForm);
                    expect(res.locals.firstname).toEqual('');
                    expect(res.locals.lastname).toEqual('Gomez');
                    expect(res.locals.validationErrors.length).toBe(1);
                    expect(res.locals.validationErrors[0]).toEqual('First name is missing.');
                    done();
                };
                route.post(req, res);
            });

            it("last name missing", function(done) {
                req.body.lastname = '';
                res.render = function(view, params) {
                    expect(view).toEqual(userSignUpForm);
                    expect(res.locals.firstname).toEqual('Mario');
                    expect(res.locals.lastname).toEqual('');
                    expect(res.locals.validationErrors.length).toBe(1);
                    expect(res.locals.validationErrors[0]).toEqual('Last name is missing.');
                    done();
                };
                route.post(req, res);
            });

            it("password missing", function(done) {
                req.body.password = '';
                res.render = function(view, params) {
                    expect(view).toEqual(userSignUpForm);
                    expect(res.locals.firstname).toEqual('Mario');
                    expect(res.locals.lastname).toEqual('Gomez');
                    expect(res.locals.validationErrors.length).toBe(1);
                    expect(res.locals.validationErrors[0]).toEqual('Password is missing.');
                    done();
                };
                route.post(req, res);
            });

            it("password confirmation missing", function(done) {
                req.body.password2 = '';
                res.render = function(view, params) {
                    expect(view).toEqual(userSignUpForm);
                    expect(res.locals.firstname).toEqual('Mario');
                    expect(res.locals.lastname).toEqual('Gomez');
                    expect(res.locals.validationErrors.length).toBe(1);
                    expect(res.locals.validationErrors[0]).toEqual('The password confirmation is missing.');
                    done();
                };
                route.post(req, res);
            });

            it("passwords do not match", function(done) {
                req.body.password = 'pass';
                req.body.password2 = 'bass';
                res.render = function(view, params) {
                    expect(view).toEqual(userSignUpForm);
                    expect(res.locals.validationErrors.length).toBe(1);
                    expect(res.locals.validationErrors[0]).toEqual('Passwords do not match.');
                    done();
                };
                route.post(req, res);
            });
        });
    });
});