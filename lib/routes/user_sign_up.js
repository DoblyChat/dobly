'use strict';

module.exports = (function() {
    var Invitation = require('../models/invitation'),
        Validator = require('../common/validator'),
        User = require('../models/user'),
        Desktop = require('../models/desktop'),
        passport = require('passport'),
        async = require('async'),
        consts = require('../common/consts'),
        log = require('../common/log'),
        self = {};

    var _req, _res, validator;
    var fields = ['firstname', 'lastname'];
    var validationErrors = 'validationErrors';

    self.get = function(req, res) {
        init(req, res);
        if (_req.params.id) {
            checkInvitationAndRender();
        } else {
            redirectToLogin();
        }        
    };

    function checkInvitationAndRender() {
        Invitation.findById(_req.params.id, function(err, invitation) {
            if (err) {
                log.error(err);
                redirectToLogin();
            } else if (invitation === null) {
                log.error( { 
                    ErrorMessage: 'Invitation Id not found.',
                    InvitationId: _req.params.id
                });
                redirectToLogin();
            } else {
                if (invitation.accepted) {
                    redirectToLogin();
                } else {
                    resetFields();
                    render();
                }
            }
        });
    }

    self.post = function(req, res) {
        init(req, res);
        setFields();
        validateAndSave();
    };

    function init(req, res) {
        _req = req;
        _res = res;
        validator = new Validator();
    }

    function resetFields() {
        for (var i = fields.length - 1; i >= 0; i--) {
            _res.local(fields[i],'');
        }
        _res.local(validationErrors, []);
    }

    function setFields() {
        for (var i = fields.length - 1; i >= 0; i--) {            
            _res.local(fields[i], _req.body[fields[i]]);
        }
    }

    function render() {
        _res.render('forms/user-signup', 
            { 
                title: consts.title,
                formAction: '/invitation/' + _req.params.id
            });
    }

    function redirectToLogin() {
        _res.redirect('/login');
    }   

    function validateAndSave() {
        async.waterfall([
            function(callback) {
                checkFieldsNotEmpty(callback);
            },
            function(callback) {
                checkFieldValues(callback);
            },
            function(callback) {
                Invitation.findById(_req.params.id, callback);
            },
            function(invitation, callback) {
                saveUser(invitation, callback);
            },
            function(user, callback) {
                _req.body.email = user.email;
                acceptInvitation(user, function(err, numberAffected) {
                    callback(err, user);
                });
            },
            function(user, callback) {
                Desktop.findOrCreateByUserId(user._id, callback);
            },
            function(desktop, callback) {
                desktop.addRecentCollaborationObjects(callback);
            }
        ], function(err, result) {
            if (err) {
                handleErrors(err);
            } else {
                self.authenticate();
            }
        });
    }

    function checkFieldsNotEmpty(callback) {
        validator.check(_req.body.firstname, 'First name is missing.').notEmpty();
        validator.check(_req.body.lastname, 'Last name is missing.').notEmpty();
        validator.check(_req.body.password, 'Password is missing.').notEmpty();
        validator.check(_req.body.password2, 'The password confirmation is missing.').notEmpty();
        
        callback(validator.hasErrors());
    }

    function checkFieldValues(callback) {
        validator.check(_req.body.password, 'Passwords do not match.').equals(_req.body.password2);

        callback(validator.hasErrors());        
    }

    function saveUser(invitation, callback) {
        User.create({ firstName: _req.body.firstname, lastName: _req.body.lastname, email: invitation.email, groupId: invitation.groupId, password: _req.body.password }, callback);
    }

    function acceptInvitation(user, callback) {
        Invitation.update({ email: user.email }, { accepted: true }, { multi: true }, callback);
    }

    function handleErrors(err) {
        if (!validator.hasErrors()) {
            log.error(err, 'Error during user sign up.');
            validator.error('There was an error, please try again.');
        }

        _res.local(validationErrors, validator.getErrors());
        render();
    }

    self.authenticate = function() {
        return passport.authenticate('local', { successRedirect: '/conversations',
                                                failureRedirect: '/login',
                                                failureFlash: 'There is a problem authenticating your new credentials.' })(_req, _res);
    };

    return self;
})();