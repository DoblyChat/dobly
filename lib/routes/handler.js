'use strict';

module.exports = (function() {
    var User = require('../models/user'),
        Group = require('../models/group'),
        passport = require('passport'),
        async = require('async'),
        log = require('../common/log'),
        flashErrorKey = 'error',
        flashInfoKey = 'info',
        title = 'Dobly',
        self = {};

    self.checkUserIsLoggedIn = function(req, res, next) {
        if (req.user) {
            next();
        } else {
            res.redirect('/login');
        }
    };

    self.checkUserIsLoggedOut = function(req, res, next) {
        if (req.user) {
            res.redirect('/conversations');
        } else {
            next();
        }
    }

    self.home = function(req, res) {
        routeIfLoggedIn(req, res, function() {
            res.render('index', { title: title, layout: '' });
        }); 
    };

    self.logIn = function(req, res) {
        routeIfLoggedIn(req, res, function() {
            var errorFlash = req.flash(flashErrorKey);
            var infoFlash = req.flash(flashInfoKey);
            res.render('forms/login', {      
                                    title: title,
                                    error: errorFlash, 
                                    showFlashError: shouldShow(errorFlash),
                                    info: infoFlash,
                                    showFlashInfo: shouldShow(infoFlash)
                                }); 
        });
    };

    function shouldShow(flash) {
        return flash.length > 0;
    }

    function routeIfLoggedIn(req, res, render) {
        if (req.user) {
            res.redirect('/conversations');
        } else {
            render();
        }
    }

    self.authenticate = function(req, res) {
        return passport.authenticate('local', { successRedirect: '/conversations',
                                                failureRedirect: '/login',
                                                failureFlash: 'Email and password do not match.' })(req, res);
    };

    self.logOut = function(req, res) {
        req.logOut();
        res.redirect('/login');
    };

    self.timeOut = function(req, res) {
        req.flash(flashInfoKey, 'Your session timed out.');
        res.redirect('/login');
    };

    self.getGroups = function(req, res) {
        async.parallel({
            groups: function(callback) {
                Group.find({}, null, { lean: true, sort: { name: 1 } }, callback);      
            },
            users: function(callback) {
                User.find({}, null, { lean: true, sort: { name: 1 } }, callback);   
            }
        },
        function(err, results) {
            if (err) {
                log.error('Error getting groups/users', err);
            }

            results.users.forEach(function(user) {
                var group = findGroup(user.groupId);
                group.users = group.users || [];
                group.users.push(user);
            });

            res.render('admin/groups', { groups: results.groups, title: title, layout: '' });

            function findGroup(groupId) {
                var foundGroup;
                results.groups.forEach(function(group) {
                    if (group._id.equals(groupId)) {
                        foundGroup = group;
                    }
                });

                return foundGroup;
            }
        });
    };

    return self;
})();