describe("Models", function() {
    'use strict';

    describe("Item", function() {
        var Item, collaborationObjectMock, asyncMock,
            unreadMock, userMock, logMock;

        beforeEach(function() {
            mockery.enable({ 
                useCleanCache: true,
                warnOnReplace: false,
                warnOnUnregistered: false
            });

            logMock = buildMock('../common/log','error');
            collaborationObjectMock = buildMock('./collaboration_object', 'updateLastActivity', 'findById');
            asyncMock = buildMock('async', 'parallel', 'each');
            unreadMock = buildMock('./unread_marker', 'increaseCounter');
            userMock = buildMock('./user', 'find', 'findExcept');
            
            Item = require('../../lib/models/item');
        });

        it("when error saving item", function(done) {
            var saveItem = function(callback) {
                callback({ msg: 'some error' }, null);
            };

            Item.init('123', '456', '789');
            Item.send(saveItem, null, null, null, function(err, item) {
                expect(err).not.toBeNull();
                expect(err.msg).toEqual('some error');
                expect(item).toBeUndefined();
                expect(logMock.error).toHaveBeenCalled();
                expect(logMock.error).toHaveBeenCalledWith(err, 'Error saving collaboration item.');
                done();
            });
        });

        describe("when saved", function() {

            var testItem = { _id: 'abc' };

            var saveItem = function(callback) {
                callback(null, testItem);
            };

            it("executes callbacks", function(done) {
                var notifyOnlineUsers = jasmine.createSpy(),
                    senderConfirmation = jasmine.createSpy(),
                    notifyOfflineUsers = jasmine.createSpy();
                    Item.saveUnreadMarkersAndLastActivity = jasmine.createSpy();

                Item.init('123', '456', '789');
                Item.send(saveItem, notifyOnlineUsers, senderConfirmation, notifyOfflineUsers, function(err, item) {
                    expect(item).toEqual(testItem);
                    expect(notifyOnlineUsers).toHaveBeenCalledWith(testItem);
                    expect(senderConfirmation).toHaveBeenCalledWith(testItem);
                    expect(notifyOfflineUsers).toHaveBeenCalledWith(testItem);
                    done();
                });

                expect(Item.saveUnreadMarkersAndLastActivity).toHaveBeenCalled();
                var args = Item.saveUnreadMarkersAndLastActivity.mostRecentCall.args;
                expect(args[0]).toEqual(testItem);
                var callback = args[1];
                callback(null, testItem);
            });

            describe("unread and last activity", function() {
                var saveUnread, saveLastActivity;

                var someFunction = function() {};

                beforeEach(function(){
                    Item.init('usr-id', 'gru-id', 'object-id');
                });

                it("handles errors", function(done) {
                    Item.saveUnreadMarkersAndLastActivity(testItem, function(err, item) {
                        expect(err).not.toBeNull();
                        expect(item).toEqual(testItem);
                        expect(err.msg).toEqual("some error");
                        expect(logMock.error).toHaveBeenCalledWith(err);
                        done();
                    });

                    expect(asyncMock.parallel).toHaveBeenCalled();
                    var callback = asyncMock.parallel.mostRecentCall.args[1];
                    callback({ msg: "some error"});
                });

                describe('unread', function(){
                    var callback, findCallback;

                    beforeEach(function(){
                        Item.saveUnreadMarkersAndLastActivity(testItem, function(err, item) { });

                        expect(asyncMock.parallel).toHaveBeenCalled();
                        var process = asyncMock.parallel.mostRecentCall.args[0];
                        saveUnread = process[0];

                        callback = jasmine.createSpy('callback');
                        saveUnread(callback);
                        findCallback = collaborationObjectMock.findById.getCallback();
                    });

                    it('finds collaboration object by id', function(){
                        expect(collaborationObjectMock.findById).toHaveBeenCalled();
                        var args = collaborationObjectMock.findById.mostRecentCall.args;

                        expect(args[0]).toEqual('object-id');
                    });

                    it('executes callback with error if there is an error reading the collaboration object', function(){
                        findCallback('reading object error', null);
                        expect(callback).toHaveBeenCalledWith('reading object error');
                    });

                    describe('users', function(){
                        var collaborationObject;

                        describe('for entire group', function(){
                            beforeEach(function(){
                                collaborationObject = {
                                    members: {
                                        entireGroup: true,
                                        users: [ ]
                                    }
                                };

                                findCallback(null, collaborationObject);
                                expect(userMock.findExcept).toHaveBeenCalled();
                                findCallback = userMock.findExcept.getCallback();
                            });

                            it('saves for each user in group', function(){
                                var args = userMock.findExcept.mostRecentCall.args;

                                expect(args[0][0]).toBe('usr-id');
                                expect(args[1]).toBe('gru-id');                 

                                var users = [ 
                                    {
                                        _id: 'first'
                                    },
                                    {
                                        _id: 'second'
                                    }
                                ];

                                findCallback(null, users);

                                expect(asyncMock.each).toHaveBeenCalled();
                                expect(asyncMock.each.mostRecentCall.args[0]).toBe(users);

                                var save = asyncMock.each.mostRecentCall.args[1];
                                var saveCallback = jasmine.createSpy('save callback');
                                save(users[0], saveCallback);

                                expect(unreadMock.increaseCounter).toHaveBeenCalledWith('first', 'object-id', saveCallback);

                                var eachCallback = asyncMock.each.getCallback();
                                eachCallback('each error');
                                expect(callback).toHaveBeenCalledWith('each error');
                            });
                        });

                        describe('for select users', function(){
                            beforeEach(function(){
                                collaborationObject = {
                                    members: {
                                        entireGroup: false,
                                        users: [ 'usr-1', 'usr-2' ]
                                    }
                                };

                                findCallback(null, collaborationObject);
                                expect(asyncMock.each).toHaveBeenCalled();
                            });

                            it('saves unread for only selected users', function(){
                                expect(asyncMock.each.mostRecentCall.args[0]).toBe(collaborationObject.members.users);

                                var save = asyncMock.each.mostRecentCall.args[1];
                                var saveCallback = jasmine.createSpy();

                                save('userid', saveCallback);

                                expect(unreadMock.increaseCounter).toHaveBeenCalledWith('userid', 'object-id', saveCallback);

                                var eachCallback = asyncMock.each.getCallback();
                                eachCallback('each error');
                                expect(callback).toHaveBeenCalledWith('each error');
                            });
                        });
                    });
                });

                describe("last activity", function() {
                    var callback;

                    beforeEach(function(){
                        Item.saveUnreadMarkersAndLastActivity(testItem, function(err, item) { });

                        expect(asyncMock.parallel).toHaveBeenCalled();
                        var process = asyncMock.parallel.mostRecentCall.args[0];
                        saveLastActivity = process[1];

                        callback = jasmine.createSpy('callback');
                        saveLastActivity(callback);
                    });

                    it("calls last activity", function() {
                        expect(collaborationObjectMock.updateLastActivity).toHaveBeenCalled();
                        var args = collaborationObjectMock.updateLastActivity.mostRecentCall.args;

                        expect(args[0]).toEqual('object-id');
                        expect(args[1]).toEqual(callback);
                    });
                });
            });
        });
    });
});