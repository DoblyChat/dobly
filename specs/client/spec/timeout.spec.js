define(['squire'], function(Squire){
    'use strict';

    describe("timeout", function() {
        var timeout;
        var testGlobal;
        var pingInterval = 4990; // reducing pingInterval to increase test stability
        var socketMock;

        beforeEach(function() {
            testGlobal = {
                location: {
                    href: 'http://testing-dobly.com/conversations',
                    host: 'testing-dobly.com',
                },
            };
            socketMock = createMockSocket();
            socketMock.maxReconnects = 5;

            var done = false;

            runs(function(){
                var injector = new Squire();
                injector.mock('client/socket', socketMock);

                injector.require(['client/timeout'], function(createTimeout){
                    timeout = createTimeout(testGlobal);
                    done = true;
                });
            });

            waitsFor(function(){
                return done;
            });
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
            socketMock.mockEmit('reconnecting', null, attempt);
            expect(testGlobal.location.href).toEqual('http://testing-dobly.com/conversations');
        }

        function expectTimeout(attempt) {
            socketMock.mockEmit('reconnecting', null, attempt);
            expect(testGlobal.location.href).toEqual('http://testing-dobly.com/timeout');
        }

        describe("start ping", function() {

            it("emit ping on interval", function() {
                spyOn(window, "setInterval");
                timeout.startPing();

                expect(window.setInterval).toHaveBeenCalledWith(timeout.emitPing, 5000);
            });

            it("handle timeout", function() {
                spyOn(window, "setInterval");
                timeout.startPing();

                socketMock.mockEmit('timeout');
                expectTimeout();
            });
        });

        describe("emit ping", function() {
            beforeEach(function() {
                loadFixtures('connectivity.fixture.html');
            });

            it("emit ping", function() {
                timeout.emitPing();
                expect(socketMock.emit).toHaveBeenCalledWith('ping');
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
                socketMock.mockEmit('pong');
                timeout.emitPing();
                expect($('#connectivityIssues')).toBeHidden();
                expect(socketMock.emit).toHaveBeenCalledWith('ping');
            });

            function doNotExpectConnectivityIssues(numberOfIntervals) {
                timeout.lastPong.add( { milliseconds: -pingInterval*numberOfIntervals });
                timeout.emitPing();
                expect($('#connectivityIssues')).toBeHidden();
                expect(socketMock.emit).toHaveBeenCalledWith('ping');
            }

            function expectConnectivityIssues(numberOfIntervals) {
                timeout.lastPong.add( { milliseconds: -pingInterval*numberOfIntervals });
                timeout.emitPing();
                expect($('#connectivityIssues')).not.toBeHidden();
                expect(socketMock.emit).toHaveBeenCalledWith('ping');
            }
        });

        describe("pong", function() {
            it("last pong is now", function() {
                socketMock.mockEmit('pong');
                expect(aproximateDate(timeout.lastPong)).toEqual(aproximateDate(new Date()));
            });
        });
    });
});