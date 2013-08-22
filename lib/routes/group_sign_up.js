module.exports = (function() {
    var log = require('../common/log'),
        User = require('../models/user'),
        Group = require('../models/group'),
        Validator = require('../common/validator'),
        async = require('async'),
        passport = require('passport'),
        consts = require('../common/consts')
        self = {};

    var req, res, validator;
    var fields = ['groupname', 'firstname', 'lastname', 'email'];

    self.init = function(request, response) {
        req = request;
        res = response;
    };

    self.get = function() {
        resetFields();
        render();
    };

    self.post = function() {
        setFields();
        validator = new Validator();
        validateAndSave();
    };

    function resetFields() {
        fields.forEach(function(field) {
            res.local(field,'');
        });
    }

    function setFields() {
        fields.forEach(function(field) {
            res.local(field, req.body[field]);
        });
    }

    function render() {
        var errorFlash = req.flash(consts.flashKeys.error);
        res.render('security/group-signup', 
            { 
                title: 'Sign up - ' + consts.title, 
                showFlashError: errorFlash.length > 0, 
                error: errorFlash
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
                authenticate();
            }
        });
    }

    function checkFieldsNotEmpty(callback) {
        validator.check(req.body.groupname, 'Group name is missing.').notEmpty();
        validator.check(req.body.firstname, 'First name is missing.').notEmpty();
        validator.check(req.body.lastname, 'Last name is missing.').notEmpty();
        validator.check(req.body.email, 'Email is missing.').notEmpty();
        validator.check(req.body.password, 'Password is missing.').notEmpty();
        validator.check(req.body.password2, 'The password confirmation is missing.').notEmpty();
        
        callback(validator.hasErrors());
    }

    function checkFieldValues(callback) {
        validator.check(req.body.password, 'Passwords do not match.').equals(req.body.password2);
        validator.check(req.body.email, 'Email is invalid.').isEmail();

        callback(validator.hasErrors());        
    }

    function findGroupByGroupName(callback) {
        Group.findOne({ name: req.body.groupname.toLowerCase() }, callback);
    }

    function checkGroupNameIsUnique(group, callback) {
        if (group) {
            validator.error('Someone is already using that group name, please try another one.');
        }

        callback(validator.hasErrors());
    }

    function findUserByEmail(callback) {
        User.findOne({ email: req.body.email }, callback);
    }

    function checkEmailIsUnique(user, callback) {
        if (user) {
            validator.error('That email is already in use.');
        }

        callback(validator.hasErrors());
    }

    function saveGroup(callback) {
        Group.create({ name: req.body.groupname, rawName: req.body.groupname }, callback);
    }

    function saveUser(group, callback) {
        User.create({ firstName: req.body.firstname, lastName: req.body.lastname, email: req.body.email, groupId: group._id, password: req.body.password }, callback);
    }

    function handleErrors(err) {
        if (validator.hasErrors()) {
            failureRedirect(validator.getErrors());
        } else {
            log.error(err, 'Error during group sign up.');
            failureRedirect('There was an error, please try again.');
        }
    }

    function failureRedirect(message) {
        req.flash(consts.flashKeys.error, message);
        render();
    }

    function authenticate() {
        return passport.authenticate('local', { successRedirect: '/conversations?groupSignedUp=1',
                                                failureRedirect: '/login',
                                                failureFlash: 'There is a problem authenticating your new credentials.' })(req, res);
    }

    return self;
})();