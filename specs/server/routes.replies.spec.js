describe("Replies routes", function() {
    'use strict';

    var replies;

    beforeEach(function() {
        replies = require('../../lib/routes/replies');
    });

    it("gets status ok", function() {
        var req = null;

        var res = {
            send: jasmine.createSpy(),
        };

        replies.get(req, res);

        expect(res.send).toHaveBeenCalledWith(200);
    });
});