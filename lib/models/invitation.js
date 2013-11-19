'use strict';

var mongo = require('mongoose'),
    emailValidator = require('../common/email_validator');

var schema = new mongo.Schema({
    email: { type: String, required: true, lowercase: true },
    groupId: { type: mongo.Schema.Types.ObjectId, required: true },
    invitedByUserId: { type: mongo.Schema.Types.ObjectId, required: true },
    accepted: { type: Boolean, default: false, required: true }
});

schema.path('email').validate(emailValidator.isValid, 'Invalid email');

module.exports = mongo.model('Invitation', schema);