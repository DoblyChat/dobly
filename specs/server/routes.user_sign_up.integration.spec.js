describe("Routes user sign up - integration", function() {
    'use strict';

    var route, req, res;
    var Invitation = require('../../lib/models/invitation'),
        User = require('../../lib/models/user'),
        CollaborationObject = require('../../lib/models/collaboration_object'),
        Desktop = require('../../lib/models/desktop');

    beforeEach(function(){
        req = {
            params: {}
        };
        res = {
            locals: {},
            local: function(field, value) {
                res.locals[field] = value;
            }
        };
    });

    describe("post", function() {

        var testInvitation, testUser, testCollaborationObject;

        beforeEach(function(done) {
            Invitation.create({ 
                email: 'hannibal.smith@abc.com', 
                groupId: new mongo.Types.ObjectId(), 
                invitedByUserId: new mongo.Types.ObjectId(),
                accepted: false
            }, function(err, someInvitation) {
                testInvitation = someInvitation;
                expect(testInvitation._id).not.toBeNull();

                CollaborationObject.create({
                    topic: 'a recent conversation', 
                    createdById: new mongo.Types.ObjectId(), 
                    members: { entireGroup: true, users: [] }, 
                    groupId: testInvitation.groupId, 
                    type: 'C'
                }, function(err, collaborationObject) {
                    testCollaborationObject = collaborationObject;
                    done(err);
                });
            });
        });

        afterEach(function(done) {          
            CollaborationObject.remove({ groupId: testInvitation.groupId }, function(err) {
                testInvitation.remove(done);
            });
        });
        
        it("saves user and accepts invitation", function(done) {
            route = require('../../lib/routes/user_sign_up');

            req.body = {
                firstname: 'Hannibal',
                lastname: 'Smith',
                password: 'pass',
                password2: 'pass'
            };

            req.params.id = testInvitation._id;

            spyOn(route, 'authenticate').andCallFake(function() {
                Invitation.findById(testInvitation._id, function(err, acceptedInvitation) {
                    expect(err).toBeNull();
                    expect(acceptedInvitation.accepted).toBe(true);

                    User.findOne({ email: acceptedInvitation.email }, function(err, someUser) {
                        testUser = someUser;
                        expect(err).toBeNull();
                        expect(testUser._id).not.toBeNull();
                        expect(testUser.firstName).toEqual('Hannibal');
                        expect(testUser.lastName).toEqual('Smith');
                        expect(testUser.email).toEqual('hannibal.smith@abc.com');
                        expect(testUser.groupId).toEqual(testInvitation.groupId);

                        testUser.comparePassword('pass', function(err, isMatch) {
                            expect(isMatch).toBe(true);

                            Desktop.findOne({ userId: testUser._id }, function(err, desktop) {
                                expect(desktop._id).not.toBeNull();
                                expect(desktop.collaborationObjects.length).toBe(1);
                                expect(desktop.collaborationObjects[0]).toEqual(testCollaborationObject._id);

                                Desktop.remove({ userId: testUser._id }, function(err) {
                                    testUser.remove(done);
                                });
                            });                         
                        });
                    });
                });
            });

            route.post(req, res);
        });
    });

    describe("authenticate", function() {
        it("check passport params", function() {
            mockery.enable({ 
                useCleanCache: true,
                warnOnReplace: false,
                warnOnUnregistered: false
            });

            var passportMock = (function(){
                var self = {};
                self.authenticator = jasmine.createSpy();
                self.authenticate = jasmine.createSpy().andReturn(self.authenticator);

                return self;
            })();

            mockery.registerMock('passport', passportMock);
            route = require('../../lib/routes/user_sign_up');

            route.authenticate();

            expect(passportMock.authenticate).toHaveBeenCalledWith('local', {
                successRedirect: '/conversations',
                failureRedirect: '/login',
                failureFlash: 'There is a problem authenticating your new credentials.'
            });
        });
    });
});