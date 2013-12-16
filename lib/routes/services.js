'use strict';

exports.config = function(app, sockets) {

    var replies = require('./replies');

    replies.init(sockets);

    app.get('/replies', replies.get);

    app.post('/replies', replies.post);
};