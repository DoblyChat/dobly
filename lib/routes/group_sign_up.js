module.exports = (function() {
    var log = require('../common/log'),
        User = require('../models/user'),
        Group = require('../models/group'),
        Validator = require('../common/validator'),
        async = require('async'),
        passport = require('passport'),
        consts = require('../common/consts')
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
    };

    function resetFields() {
        fields.forEach(function(field) {
            _res.local(field,'');
        });
        _res.local(validationErrors, []);
    }

    function setFields() {
        fields.forEach(function(field) {
            _res.local(field, _req.body[field]);
        });
    }

    function render() {
        _res.render('security/group-signup', 
            { 
                title: 'Sign up - ' + consts.title
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
        validator.check(_req.body.email, 'Email is invalid.').isEmail();

        callback(validator.hasErrors());        
    }

    function findGroupByGroupName(callback) {
        Group.findOne({ name: _req.body.groupname.toLowerCase() }, callback);
    }

    function checkGroupNameIsUnique(group, callback) {
        if (group) {
            validator.error('Someone is already using that group name, please try another one.');
        }

        callback(validator.hasErrors());
    }

    function findUserByEmail(callback) {
        User.findOne({ email: _req.body.email }, callback);
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

    function failureRender(messages) {
        _req.flash(consts.flashKeys.error, messages);
        render();
    }

    function authenticate() {
        return passport.authenticate('local', { successRedirect: '/conversations?groupSignedUp=1',
                                                failureRedirect: '/login',
                                                failureFlash: 'There is a problem authenticating your new credentials.' })(_req, _res);
    }

    return self;
})();