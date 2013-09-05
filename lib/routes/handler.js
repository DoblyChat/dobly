'use strict';

module.exports = (function (){
    var CollaborationObject = require('../models/collaboration_object'),
        Message = require('../models/message'),
        User = require('../models/user'),
        Group = require('../models/group'),
        Desktop = require('../models/desktop'),
        UnreadMarker = require('../models/unread_marker'),
        passport = require('passport'),
        async = require('async'),
        log = require('../common/log'),
        flashErrorKey = 'error',
        flashInfoKey = 'info',
        title = 'Dobly',
        self = {};

    self.checkUserIsLoggedIn = function(req, res, next) {
        if(req.user) {
            next();
        } else {
            res.redirect('/login');
        }
    };

    self.home = function(req, res) {
        routeIfLoggedIn(req, res, function(){
            res.render('index', { title: title, layout: '' });
        }); 
    };

    self.logIn = function(req, res){
        routeIfLoggedIn(req, res, function(){
            var errorFlash = req.flash(flashErrorKey);
            var infoFlash = req.flash(flashInfoKey);
            res.render('security/login', {      
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

    function routeIfLoggedIn(req, res, render){
        if(req.user) {
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

    self.signUpOld = function(req, res) {
        var flash = req.flash(flashKey);
        Group.findOne({ name: req.params.group }, 'rawName', function(err, groupObj) {
            res.render('security/sign-up', { group: groupObj.rawName, title: 'Sign up - ' + title, showFlash: shouldShow(flash), info: flash });
        });
    };

    self.renderDesktop = function(req, res) {
        async.parallel({
            collaborationObjects: function(callback){
                CollaborationObject.findAllowedCollaborationObjects(req.user.groupId, req.user._id, function(err, collaborationObjects){
                    if(err){
                        callback(err);
                    }else{
                        async.parallel([
                            function(callback){
                                async.each(collaborationObjects, loadItems, callback);

                                function loadItems(collaborationObject, callback){
                                    if (collaborationObject.type === 'C') {
                                        Message.readMessagesByPage(collaborationObject._id, 0, function(err, messages){
                                            collaborationObject.items = messages.reverse();
                                            callback(err);
                                        });
                                    } else {
                                        // read tasks
                                    }
                                }
                            },
                            function(callback){
                                async.each(collaborationObjects, loadMessageCount, callback);

                                function loadMessageCount(collaborationObject, callback){
                                    if (collaborationObject.type === 'C') {
                                        Message.count({ collaborationObjectId: collaborationObject._id }, function(err, count){
                                            collaborationObject.totalMessages = count;
                                            callback(err);
                                        });
                                    }
                                }
                            }
                        ], function(err){
                            callback(err, collaborationObjects);
                        });
                    }
                });
            },
            desktop: function(callback){
                Desktop.findOrCreateByUserId(req.user._id, callback);
            },
            markers: function(callback){
                UnreadMarker.find({ userId: req.user._id }, null, { lean: true }, callback);
            },
            group: function(callback){
                Group.findById(req.user.groupId, 'name rawName', { lean: true }, callback);
            },
            users: function(callback){
                User.find({ groupId: req.user.groupId }, '_id firstName lastName', { lean: true }, callback);
            }
        },
        function(err, results) {
            function addUnread(collaborationObject){
                collaborationObject.unread = 0;
                
                results.markers.forEach(function(marker){
                    if(marker.collaborationObjectId.equals(collaborationObject._id)){
                        collaborationObject.unread = marker.count;

                        if(results.desktop.conversations.indexOf(collaborationObject._id) < 0){
                            results.desktop.conversations.push(collaborationObject._id);
                        }

                        return;
                    }
                });
            }

            function addCreatorName(collaborationObject, users){
                results.users.forEach(function(user){
                    if(user._id.equals(collaborationObject.createdById)){
                        collaborationObject.createdBy = user.firstName;
                        return;
                    }
                });
            }

            function render() {
                res.render('conversations', 
                { 
                    title: title,
                    collaborationObjects: JSON.stringify(results.collaborationObjects),
                    desktop: JSON.stringify(results.desktop), 
                    currentUser: JSON.stringify(req.user),
                    group: JSON.stringify(results.group),
                    layout: ''
                }); 
            }
            
            if(err){
                log.error(err, 'Error rendering desktop');
            }else{
                results.group.users = results.users;

                results.collaborationObjects.forEach(function(collaborationObject){
                    addUnread(collaborationObject);
                    addCreatorName(collaborationObject);
                });

                if(results.desktop.isModified('conversations')){
                    results.desktop.save(function(err){
                        if(err){
                            log.error(err, 'Error updating desktop when rendering');
                        }else{
                            render();   
                        }
                    });
                }else{
                    render();
                }
            }           
        });
    };

    self.getGroups = function(req, res){
        async.parallel({
            groups: function(callback){
                Group.find({}, null, { lean: true, sort: { name: 1 } }, callback);      
            },
            users: function(callback){
                User.find({}, null, { lean: true, sort: { name: 1 } }, callback);   
            }
        },
        function(err, results){
            if(err){
                log.error(err, 'Error getting groups/users');
            }

            results.users.forEach(function(user){
                var group = findGroup(user.groupId);
                group.users = group.users || [];
                group.users.push(user);
            });

            res.render('admin/groups', { groups: results.groups, title: title, layout: '' });

            function findGroup(groupId){
                var foundGroup;
                results.groups.forEach(function(group){
                    if(group._id.equals(groupId)){
                        foundGroup = group;
                    }
                });

                return foundGroup;
            }
        });
    };

    self.createGroup = function(req, res){
        Group.create({ name: req.body.name, rawName: req.body.name }, function(err){
            if(err){
                log.error(err, 'Error creating group');
            }
            res.redirect('admin/groups');
        });
    };

    self.createUser = function(req, res) {
        if(req.body.password === req.body.password2) {
            Group.findOne({ name: req.body.group.toLowerCase() }, function(err, group) {
                User.create(
                    { name: req.body.name, email: req.body.email, groupId: group._id, password: req.body.password },
                    function(err){
                        if(err){                            
                            log.error(err, 'Error creating user');
                            redirectToSignUp('Email is already in use.');
                        }else{
                            res.redirect('/login'); 
                        }
                    });
            });
        } else {
            redirectToSignUp('Password does not match.');
        }

        function redirectToSignUp(flash) {
            req.flash(flashErrorKey, flash);
            res.redirect(req.header('Referrer'));
        }
    };

    return self;
})();