define(['client/timeout'], function(createTimeout){
    'use strict';

    describe("timeout", function() {
        var timeout;
        var maxReconnects = 5;
        var testGlobal;
        var pingInterval = 5000;

        beforeEach(function() {
            testGlobal = {
                location: {
                    href: 'http://testing-dobly.com/conversations',
                    host: 'testing-dobly.com',
                },
            };
            app.socket = createMockSocket();

            timeout = createTimeout(maxReconnects, testGlobal);
        });

        describe("reconnecting", function() {

            it("attempt 1", function() {
                doNotExpectTimeout(1);
            });

            it("attempt 2", function() {
                doNotExpectTimeout(2);
            });

            it("attempt 3", function() {
                doNotExpectTimeout(3);
            });

            it("attempt 4", function() {
                doNotExpectTimeout(4);
            });

            it("attempt 5", function() {
                expectTimeout(5);
            });
        });

        function doNotExpectTimeout(attempt) {
            app.socket.mockEmit('reconnecting', null, attempt);
            expect(testGlobal.location.href).toEqual('http://testing-dobly.com/conversations');
        }

        function expectTimeout(attempt) {
            app.socket.mockEmit('reconnecting', null, attempt);
            expect(testGlobal.location.href).toEqual('http://testing-dobly.com/timeout');
        }

        describe("start ping", function() {

            it("emit ping on interval", function() {
                spyOn(window, "setInterval");
                timeout.startPing();

                expect(window.setInterval).toHaveBeenCalledWith(timeout.emitPing, pingInterval);
            });

            it("handle timeout", function() {
                spyOn(window, "setInterval");
                timeout.startPing();

                app.socket.mockEmit('timeout');
                expectTimeout();
            });
        });

        describe("emit ping", function() {
            beforeEach(function() {
                loadFixtures('connectivity.fixture.html');
            });

            it("emit ping", function() {
                timeout.emitPing();
                expect(app.socket.emit).toHaveBeenCalledWith('ping');
            });

            it("one ping interval", function() {
                doNotExpectConnectivityIssues(1);
            });

            it("two ping intervals", function() {
                doNotExpectConnectivityIssues(2);
            });

            it("three ping intervals", function() {
                doNotExpectConnectivityIssues(3);
            });

            it("four ping intervals", function() {
                expectConnectivityIssues(4);
            });

            it("five ping intervals", function() {
                expectConnectivityIssues(5);
            });

            it("six ping intervals with pong", function() {
                expectConnectivityIssues(6);
                app.socket.mockEmit('pong');
                timeout.emitPing();
                expect($('#connectivityIssues')).toBeHidden();
                expect(app.socket.emit).toHaveBeenCalledWith('ping');
            });

            function doNotExpectConnectivityIssues(numberOfIntervals) {
                timeout.lastPong.add( { milliseconds: -pingInterval*numberOfIntervals });
                timeout.emitPing();
                expect($('#connectivityIssues')).toBeHidden();
                expect(app.socket.emit).toHaveBeenCalledWith('ping');
            }

            function expectConnectivityIssues(numberOfIntervals) {
                timeout.lastPong.add( { milliseconds: -pingInterval*numberOfIntervals });
                timeout.emitPing();
                expect($('#connectivityIssues')).not.toBeHidden();
                expect(app.socket.emit).toHaveBeenCalledWith('ping');
            }
        });

        describe("pong", function() {
            it("last pong is now", function() {
                app.socket.mockEmit('pong');
                expect(aproximateDate(timeout.lastPong)).toEqual(aproximateDate(new Date()));
            });
        });
    });
});