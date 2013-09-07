describe("Common", function() {
    'use strict';

    describe("Log", function() {
        it("error", function() {
            spyOn(console, 'error');
            spyOn(console, 'trace');

            var log = require('../../lib/common/log');

            var err = {};
            log.error(err, 'Some Error');

            expect(console.error).toHaveBeenCalledWith('~~~ Some Error ~~~', err);
            expect(console.trace).toHaveBeenCalledWith('~~~ Some Error ~~~');
        });
    });
});