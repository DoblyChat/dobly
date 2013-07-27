describe("Common", function() {
    describe("Log", function() {
        it("error", function() {
            spyOn(console, 'error');
            spyOn(console, 'trace');

            var log = require('../../common/log');

            var err = {};
            log.error('Some Error', err);

            expect(console.error).toHaveBeenCalledWith('~~~ Some Error ~~~', err);
            expect(console.trace).toHaveBeenCalledWith('~~~ Some Error ~~~');
        });
    });
});