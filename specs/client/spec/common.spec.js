define(['client/common'], function(common){
    describe("common", function() {
        it('html encodes text', function(){
            var unencodedText = '<script>alert("hello world");</script>';
            expect(common.htmlEncode(unencodedText)).toBe('&lt;script&gt;alert("hello world");&lt;/script&gt;');
        });

        describe("formats time stamp", function() {

            it("when date", function() {
                var april9 = Date.parse('2013.04.09 22:13:34');
                expect(common.formatTimestamp(april9)).toBe('4/9 10:13 PM');
            });

            it("when string", function() {
                var april9 = '2013.04.09 22:13:34';
                expect(common.formatTimestamp(april9)).toBe('4/9 10:13 PM');
            });

            it("today's time stamp", function() {
                var now = Date.now();   
                expect(common.formatTimestamp(now)).toBe(now.toString('h:mm tt'));
            });

            it("simple time stamp when date", function() {
                var april9 = Date.parse('2013.04.09 22:13:34');
                expect(common.formatSimpleTimestamp(april9)).toBe('4/9');
            });

            it("simple time stamp when string", function() {
                var april9 = '2013.04.09 22:13:34';
                expect(common.formatSimpleTimestamp(april9)).toBe('4/9');
            });

            it("today's simple time stamp", function() {
                var now = Date.now();
                expect(common.formatSimpleTimestamp(now)).toBe(now.toString('h:mm tt'));
            });
        });

        describe("enter key", function() {

            it("pressed", function() {
                var testEvent = { keyCode: 13 };
                expect(common.enterKeyPressed(testEvent)).toBe(true);
            });

            it("not pressed", function() {
                var testEvent = { keyCode: 10 };
                expect(common.enterKeyPressed(testEvent)).toBe(false);
            });      
        });

        describe("delayed focus", function() {

             it("short delay", function() {
                 var flag = false;

                 runs(function() {
                     spyOn(common, "focus").andCallFake(function() {
                         flag = true;
                     });
                     common.delayedFocus('.some-selector', 50);
                 });

                 waitsFor(function() {
                     return flag;
                 }, "common.focus should have been called.", 50);

                 runs(function() {
                     expect(common.focus).toHaveBeenCalledWith('.some-selector');
                 });
             });

            it("default delay", function() {
                spyOn(window, 'setTimeout');
                common.delayedFocus('.someselector');
                expect(window.setTimeout).toHaveBeenCalled();
                expect(window.setTimeout.mostRecentCall.args[1]).toBe(400);
            });


             it("long delay", function() {
                 spyOn(window, 'setTimeout');
                 common.delayedFocus('.some-selector', 1000);
                 expect(window.setTimeout).toHaveBeenCalled();
                 expect(window.setTimeout.mostRecentCall.args[1]).toBe(1000);
             });

             it("hook", function() {
                 var flag = false;

                 runs(function() {
                     spyOn(common, "focus");
                     var testHook = function() {
                         flag = true;
                     };
                     common.delayedFocus('.a-selector', 50, testHook);
                 });

                 waitsFor(function() {
                     return flag;
                 }, "hook should have been called.", 50);

                 runs(function() {
                     expect(common.focus).toHaveBeenCalledWith('.a-selector');
                 });
             });
        });

        describe("focus", function() {

            beforeEach(function() {
                loadFixtures('focus.fixture.html');
            });

            it("when chrome", function() {
                spyOn(common.browser, 'isSafari').andReturn(false);
                spyOn(common.browser, 'isIE').andReturn(false);

                common.focus('textarea');

                expect($('textarea')).toBeFocused();
            });

            it("when safari", function() {
                spyOn(common.browser, 'isSafari').andReturn(true);
                spyOn(common.browser, 'isIE').andReturn(false);

                common.focus('textarea');

                expect($('textarea')).not.toBeFocused();
            });

            it("when ie", function() {
                spyOn(common.browser, 'isSafari').andReturn(false);
                spyOn(common.browser, 'isIE').andReturn(true);

                common.focus('textarea');

                expect($('textarea')).not.toBeFocused();
            });
        });
    });

    describe("common.browser", function() {
        it("is safari", function() {
            spyOn(common.browser, 'getUserAgent').andReturn('safari');
            expect(common.browser.isSafari()).toBe(true);
            expect(common.browser.isIE()).toBe(false);
        });

        it("is ie", function() {
            spyOn(common.browser, 'getUserAgent').andReturn('msie');
            expect(common.browser.isIE()).toBe(true);
            expect(common.browser.isSafari()).toBe(false);
        });

        it("is not safari, it is chrome", function() {
            spyOn(common.browser, 'getUserAgent').andReturn('safari chrome');
            expect(common.browser.isSafari()).toBe(false);
        });
    });
});

