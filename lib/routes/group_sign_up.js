'use strict';

module.exports = (function() {
    var log = require('../common/log'),
        User = require('../models/user'),
        Group = require('../models/group'),
        Validator = require('../common/validator'),
        async = require('async'),
        passport = require('passport'),
        consts = require('../common/consts'),
        self = {};

    var _req, _res, validator;
    var fields = ['groupname', 'firstname', 'lastname', 'email'];
    var validationErrors = 'validationErrors';

    self.get = function(req, res) {
        init(req, res);
        resetFields();
        render();
    };

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
        _res.render('forms/group-signup', 
            { 
                title: consts.title
            });
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
                findGroupByGroupName(callback);
            },
            function(group, callback) {
                checkGroupNameIsUnique(group, callback);
            },
            function(callback) {
                findUserByEmail(callback);
            },
            function(user, callback) {
                checkEmailIsUnique(user, callback);
            },
            function(callback) {
                saveGroup(callback);
            },
            function(group, callback) {
                saveUser(group, callback);
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
        validator.check(_req.body.groupname, 'Group name is missing.').notEmpty();
        validator.check(_req.body.firstname, 'First name is missing.').notEmpty();
        validator.check(_req.body.lastname, 'Last name is missing.').notEmpty();
        validator.check(_req.body.email, 'Email is missing.').notEmpty();
        validator.check(_req.body.password, 'Password is missing.').notEmpty();
        validator.check(_req.body.password2, 'The password confirmation is missing.').notEmpty();
        
        callback(validator.hasErrors());
    }

    function checkFieldValues(callback) {
        validator.check(_req.body.password, 'Passwords do not match.').equals(_req.body.password2);
        validator.check(_req.body.email, 'Please enter a valid email address.').isEmail();

        callback(validator.hasErrors());        
    }

    function findGroupByGroupName(callback) {
        Group.findOne({ name: _req.body.groupname.trim().toLowerCase() }, callback);
    }

    function checkGroupNameIsUnique(group, callback) {
        if (group) {
            validator.error('Someone is already using that group name, please try another one.');
        }

        callback(validator.hasErrors());
    }

    function findUserByEmail(callback) {
        User.findOne({ email: _req.body.email.trim().toLowerCase() }, callback);
    }

    function checkEmailIsUnique(user, callback) {
        if (user) {
            validator.error('That email is already in use.');
        }

        callback(validator.hasErrors());
    }

    function saveGroup(callback) {
        Group.create({ name: _req.body.groupname, rawName: _req.body.groupname }, callback);
    }

    function saveUser(group, callback) {
        User.create({ firstName: _req.body.firstname, lastName: _req.body.lastname, email: _req.body.email, groupId: group._id, password: _req.body.password }, callback);
    }

    function handleErrors(err) {
        if (!validator.hasErrors()) {
            log.error(err, 'Error during group sign up.');
            validator.error('There was an error, please try again.');
        }

        _res.local(validationErrors, validator.getErrors());
        render();
    }

    self.authenticate = function() {
        return passport.authenticate('local', { successRedirect: '/welcome',
                                                failureRedirect: '/login',
                                                failureFlash: 'There is a problem authenticating your new credentials.' })(_req, _res);
    };

    return self;
})();