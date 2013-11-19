describe("Routes invite", function() {
    'use strict';

    var route, req, res;
    var inviteForm = 'forms/invite';
    var welcomeForm = 'forms/welcome';

    var invitationMock, logMock, userMock;

    beforeEach(function() {
        mockery.enable({
            useCleanCache: true,
            warnOnReplace: false,
            warnOnUnregistered: false
        });

        req = {
            user: {
                _id: '123'
            },
            body: {}
        };
        res = { 
            render: jasmine.createSpy(),
            locals: {},
            local: function(field, value) {
                res.locals[field] = value;
            }
        };

        invitationMock = buildMock('../notifications/invitation', 'send');
        logMock = buildMock('../common/log', 'error');
        userMock = buildMock('../models/user', 'findById');

        route = require('../../lib/routes/invite');
    });

    afterEach(function() {
        mockery.disable();
    });

    describe("get", function() {
        it("invite", function() {
            route.get(req, res);

            expect(res.render).toHaveBeenCalledWith(inviteForm, { title: APP_TITLE });
            expectFieldsReset();
        });

        it("welcome", function() {
            route.getWelcome(req, res);

            var callback = getUserCallback();
            callback(null, { firstName: 'Mario' });

            expect(res.render).toHaveBeenCalledWith(welcomeForm, { title: APP_TITLE });
            expect(res.locals.userFirstName).toEqual('Mario');
            expectFieldsReset();
        });

        it("welcome with error", function() {
            route.getWelcome(req, res);

            var callback = getUserCallback();
            callback('some error', null);

            expect(res.render).toHaveBeenCalledWith(inviteForm, { title: APP_TITLE });
            expect(res.locals.userFirstName).toBeUndefined();
            expectFieldsReset();
        });
    });

    function expectFieldsReset() {
        expect(res.locals.emails).toEqual('');
        expect(res.locals.invalidEmails).toBe(false);
        expect(res.locals.inviteError).toBe(false);
        expect(res.locals.invitationsSent).toBe(false);
    }

    function getUserCallback() {
        expect(userMock.findById).toHaveBeenCalled();
        expect(userMock.findById.mostRecentCall.args[0]).toEqual('123');
        expect(userMock.findById.mostRecentCall.args[1]).toEqual('firstName');
        expect(userMock.findById.mostRecentCall.args[2].lean).toBe(true);

        return userMock.findById.mostRecentCall.args[3];
    }

    describe("post", function() {
        it("validate invite", function() {
            req.body.emails = 'b2b.com';

            route.post(req, res);
            
            expect(res.render).toHaveBeenCalledWith(inviteForm, { title: APP_TITLE });
            expect(res.locals.emails).toEqual('b2b.com');
            expect(res.locals.invalidEmails).toBe(true);
            expect(res.locals.inviteError).toBe(false);
            expect(res.locals.invitationsSent).toBe(false);
        });

        it("validate welcome", function() {
            req.body.emails = 'a@b.com,b2b.com';

            route.postWelcome(req, res);

            var callback = getUserCallback();
            callback(null, { firstName: 'Mario' });

            expect(res.render).toHaveBeenCalledWith(welcomeForm, { title: APP_TITLE });
            expect(res.locals.emails).toEqual('a@b.com,b2b.com');
            expect(res.locals.invalidEmails).toBe(true);
            expect(res.locals.inviteError).toBe(false);
            expect(res.locals.invitationsSent).toBe(false);         
        });

        describe("send invitation", function() {

            it("error", function() {
                req.body.emails = 'a@b.com';

                route.post(req, res);

                expect(invitationMock.send).toHaveBeenCalled();
                
                var arg_userId = invitationMock.send.mostRecentCall.args[0];
                var arg_emails = invitationMock.send.mostRecentCall.args[1];
                var arg_callback = invitationMock.send.mostRecentCall.args[2];
                
                expect(arg_userId).toEqual('123');
                expect(arg_emails.length).toBe(1);
                expect(arg_emails[0]).toEqual('a@b.com');

                var err = 'silly error';
                arg_callback(err);

                expect(res.render).toHaveBeenCalledWith(inviteForm, { title: APP_TITLE });
                expect(res.locals.emails).toEqual('a@b.com');
                expect(res.locals.invalidEmails).toBe(false);
                expect(res.locals.inviteError).toBe(true);
                expect(res.locals.invitationsSent).toBe(false);
                expect(logMock.error).toHaveBeenCalledWith('silly error');
            });

            it("success", function() {
                req.body.emails = 'a@b.com,c@d.com';

                route.postWelcome(req, res);

                expect(invitationMock.send).toHaveBeenCalled();
                
                var arg_userId = invitationMock.send.mostRecentCall.args[0];
                var arg_emails = invitationMock.send.mostRecentCall.args[1];
                var invitation_callback = invitationMock.send.mostRecentCall.args[2];
                
                expect(arg_userId).toEqual('123');
                expect(arg_emails.length).toBe(2);
                expect(arg_emails[0]).toEqual('a@b.com');
                expect(arg_emails[1]).toEqual('c@d.com');

                invitation_callback(null);

                var user_callback = getUserCallback();

                user_callback(null, { firstName: 'Mario' });
                
                expect(res.render).toHaveBeenCalledWith(welcomeForm, { title: APP_TITLE });
                expect(res.locals.emails).toEqual('');
                expect(res.locals.invalidEmails).toBe(false);
                expect(res.locals.inviteError).toBe(false);
                expect(res.locals.invitationsSent).toBe(true);

                expect(logMock.error).not.toHaveBeenCalled();             
            });
        });
    });
});