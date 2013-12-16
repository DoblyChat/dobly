describe('Services Routes configuration', function(){
    'use strict';

    var config = require('../../lib/routes/services').config;
    var appMock, repliesMock, socketsMock;

    beforeEach(function(){
        mockery.enable();

        appMock = {
            get: jasmine.createSpy(),
            post: jasmine.createSpy()
        };

        socketsMock = {};

        repliesMock = buildMock('./replies', 'init', 'get', 'post');

        config(appMock, socketsMock);
    });

    it("inits replies", function() {
        expect(repliesMock.init).toHaveBeenCalledWith(socketsMock);
    });

    it('configures services routes', function(){
        verifyGet('/replies', repliesMock.get);
        verifyPost('/replies', repliesMock.post);
    });

    function verifyGet(route, handler, handler2){
        if(handler2){
            expect(appMock.get).toHaveBeenCalledWith(route, handler, handler2);
        }else{
            expect(appMock.get).toHaveBeenCalledWith(route, handler);
        }
    }

    function verifyPost(route, handler, handler2){
        if(handler2){
            expect(appMock.post).toHaveBeenCalledWith(route, handler, handler2);
        }else{
            expect(appMock.post).toHaveBeenCalledWith(route, handler);
        }
    }
});