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
                };
                route.post(req, res);
            });

            it("first name missing", function(done) {
                req.body.firstname = '';
                res.render = function(view, params) {
                    expect(view).toEqual(groupSignUpForm);
                    expect(res.locals.groupname).toEqual('Flex Team');
                    expect(res.locals.firstname).toEqual('');
                    expect(res.locals.lastname).toEqual('Gomez');
                    expect(res.locals.email).toEqual('mariog@flex.com');
                    expect(res.locals.validationErrors.length).toBe(1);
                    expect(res.locals.validationErrors[0]).toEqual('First name is missing.');
                    done();
                };
                route.post(req, res);
            });

            it("last name missing", function(done) {
                req.body.lastname = '';
                res.render = function(view, params) {
                    expect(view).toEqual(groupSignUpForm);
                    expect(res.locals.groupname).toEqual('Flex Team');
                    expect(res.locals.firstname).toEqual('Mario');
                    expect(res.locals.lastname).toEqual('');
                    expect(res.locals.email).toEqual('mariog@flex.com');
                    expect(res.locals.validationErrors.length).toBe(1);
                    expect(res.locals.validationErrors[0]).toEqual('Last name is missing.');
                    done();
                };
                route.post(req, res);
            });

            it("Email missing", function(done) {
                req.body.email = '';
                res.render = function(view, params) {
                    expect(view).toEqual(groupSignUpForm);
                    expect(res.locals.groupname).toEqual('Flex Team');
                    expect(res.locals.firstname).toEqual('Mario');
                    expect(res.locals.lastname).toEqual('Gomez');
                    expect(res.locals.email).toEqual('');
                    expect(res.locals.validationErrors.length).toBe(1);
                    expect(res.locals.validationErrors[0]).toEqual('Email is missing.');
                    done();
                };
                route.post(req, res);
            });

            it("password missing", function(done) {
                req.body.password = '';
                res.render = function(view, params) {
                    expect(view).toEqual(groupSignUpForm);
                    expect(res.locals.groupname).toEqual('Flex Team');
                    expect(res.locals.firstname).toEqual('Mario');
                    expect(res.locals.lastname).toEqual('Gomez');
                    expect(res.locals.email).toEqual('mariog@flex.com');
                    expect(res.locals.validationErrors.length).toBe(1);
                    expect(res.locals.validationErrors[0]).toEqual('Password is missing.');
                    done();
                };
                route.post(req, res);
            });

            it("password confirmation missing", function(done) {
                req.body.password2 = '';
                res.render = function(view, params) {
                    expect(view).toEqual(groupSignUpForm);
                    expect(res.locals.groupname).toEqual('Flex Team');
                    expect(res.locals.firstname).toEqual('Mario');
                    expect(res.locals.lastname).toEqual('Gomez');
                    expect(res.locals.email).toEqual('mariog@flex.com');
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
                    expect(view).toEqual(groupSignUpForm);
                    expect(res.locals.validationErrors.length).toBe(1);
                    expect(res.locals.validationErrors[0]).toEqual('Passwords do not match.');
                    done();
                };
                route.post(req, res);
            });

            it("invalid email", function(done) {
                req.body.email = 'mariog2flex.com';
                res.render = function(view, params) {
                    expect(view).toEqual(groupSignUpForm);
                    expect(res.locals.validationErrors.length).toBe(1);
                    expect(res.locals.validationErrors[0]).toEqual('Please enter a valid email address.');
                    done();
                };
                route.post(req, res);
            });

            describe("duplicates", function() {

                var Group = require('../../lib/models/group');
                var User = require('../../lib/models/user');
                var testGroupName = 'Test Team';
                var testGroup;
                var testEmail = 'test@flex.com';
                var testUser;

                beforeEach(function(done) {
                    Group.create({ name: testGroupName, rawName: testGroupName }, function(err, group) {
                        testGroup = group;
                        expect(testGroup._id).not.toBeNull();

                        User.create({ 
                            email: testEmail, 
                            firstName: 'Mario', 
                            lastName: 'Gago', 
                            password: 'pass', 
                            groupId: testGroup._id 
                        }, function(err, user) {
                            testUser = user;
                            expect(testUser._id).not.toBeNull();
                            done(err);
                        });
                    });
                });

                afterEach(function(done) {
                    testGroup.remove(done);
                });

                it("group name already in use", function(done) {
                    req.body.groupname = testGroupName;
                    res.render = function(view, params) {
                        expect(view).toEqual(groupSignUpForm);
                        expect(res.locals.validationErrors.length).toBe(1);
                        expect(res.locals.validationErrors[0]).toEqual('Someone is already using that group name, please try another one.');
                        done();
                    };
                    route.post(req, res);
                });

                xit("email already in use", function(done) {
                    req.body.email = testEmail;
                    res.render = function(view, params) {
                        expect(view).toEqual(groupSignUpForm);
                        expect(res.locals.validationErrors.length).toBe(1);
                        expect(res.locals.validationErrors[0]).toEqual('That email is already in use.');
                        done();
                    };
                    route.post(req, res);
                });
            });
        });
    });
});