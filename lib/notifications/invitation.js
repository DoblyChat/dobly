'use strict';

module.exports = (function() {
    var wrapper = require('./mandrill_wrapper'),
        User = require('../models/user'),
        Group = require('../models/group'),
        InvitationModel = require('../models/invitation'),
        async = require('async'),
        self = {};

    self.send = function(userId, emails, callback) {

        async.each(emails, processEmail, callback);

        function processEmail(email, callback) {
            var _user = null,
                _group = null;

            async.waterfall([
                function(callback) {
                    User.findById(userId, callback);
                },
                function(user, callback) {
                    _user = user;
                    Group.findById(_user.groupId, callback);
                },
                function(group, callback) {
                    _group = group;
                    InvitationModel.create({ email: email, groupId: _group._id, invitedByUserId: _user._id }, callback);
                }
            ], function(err, invitation) {
                if (err) {
                    callback(err);
                } else {
                    var message = generateMessage(invitation, _user, _group);
                    sendEmail(_user, message, email);
                    callback(null);
                }
            });
        }
    };

    function sendEmail(user, message, email) {
        var fromName = user.firstName + ' ' + user.lastName,
            fromEmail = "invitation@dobly.com",
            replyToEmail = "no-reply@dobly.com", 
            subject = "You have been invited to Dobly!",            
            tags = [ "invitation" ],
            text = message,
            to = [{ 
                "email": email,
                "name": ''
            }];

        wrapper.send(fromName, fromEmail, to, replyToEmail, subject, text, tags);
    }

    function generateMessage(invitation, user, group) {
        var message = 
            newLine('Hi there!') +
            newLine() +
            newLine(user.getFullName() + ' invited you to use Dobly. Use the link below to join:') +
            newLine() +
            newLine(process.env.INVITATION_URL + invitation._id) +
            newLine() + 
            newLine('Dobly is a very simple tool to help you work better with your group. Learn more about Dobly at our website:') +
            newLine() +
            newLine(process.env.HOME_PAGE_URL) +
            newLine() +
            newLine('Cheers,') +
            newLine() +
            newLine('The Dobly Team');

        return message;
    }

    function newLine(line) {
        if (line) {
            return line + '\r\n';
        } else {
            return '\r\n';
        }
    }

    return self;
})();