describe('Sockets', function(){
    'use strict';

    describe('Collaboration Object - integration', function(){
        var collaborationObjectIo, socketMock,
            CollaborationObject,
            Unread, User;

        beforeEach(function(){
            collaborationObjectIo = require('../../lib/sockets/collaboration_object_io');
            CollaborationObject = require('../../lib/models/collaboration_object');
            Unread = require('../../lib/models/unread_marker');
            User = require('../../lib/models/user');

            socketMock = {
                emit: jasmine.createSpy(),
                broadcastToGroup: jasmine.createSpy(),
                broadcastToCollaborationObjectMembers: jasmine.createSpy(),
                handshake: {
                    user: {
                        firstName: 'socket-collaboration-object-test',
                        groupId: new mongo.Types.ObjectId(),
                        _id: new mongo.Types.ObjectId(),
                    },
                },
            };
        });

        describe('#create collaboration object', function(){
            var topic = 'socket-object-test';

            afterEach(function(done){
                CollaborationObject.remove({ topic: topic }, done);
            });

            it('creates a collaboration object', function(done){
                var data = { 
                    topic: topic,
                    forEntireGroup: true,
                    selectedMembers: [ new mongo.Types.ObjectId(), new mongo.Types.ObjectId() ]
                };

                socketMock.broadcastToCollaborationObjectMembers = function(event, collaborationObjectId, collaborationObject){
                    expect(collaborationObject.topic).toBe(topic);
                    expect(collaborationObject.createdById).toBe(socketMock.handshake.user._id);
                    expect(collaborationObject._doc.createdBy).toBe(socketMock.handshake.user.firstName);
                    expect(collaborationObject.groupId.toString()).toBe(socketMock.handshake.user.groupId.toString());
                    expect(collaborationObject._id).not.toBeNull();
                    expect(collaborationObject._id).toEqual(collaborationObjectId);
                    expect(collaborationObject.members.entireGroup).toBe(true);
                    expect(collaborationObject.members.users.length).toBe(2);
                    expect(collaborationObject.members.users).toContain(data.selectedMembers[0]);
                    expect(collaborationObject.members.users).toContain(data.selectedMembers[1]);

                    done();
                };

                var sockets = { groupClients: function(){ return []; } };
                collaborationObjectIo.createCollaborationObject(socketMock, sockets, data);
            });
        });

        describe('#sendItem', function(){
            var content = 'socket-send-item-test',
                firstName = 'user-send',
                lastName = 'item-test',
                email = 'send.item@test.com';

            var userId, collaborationObjectId;

            beforeEach(function(done){
                CollaborationObject.create({
                    type: 'C',
                    topic: 'sendItem test',
                    groupId: socketMock.handshake.user.groupId,
                    createdById: socketMock.handshake.user._id,
                    members: {
                        entireGroup: true
                    }
                }, function(err, conversation){
                    if (err) { console.log(err) };

                    collaborationObjectId = conversation._id;

                    User.create({ 
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        groupId: socketMock.handshake.user.groupId,
                        password: 'pass'
                    }, function(err, user){
                        if (err) { console.log(err) };
                        userId = user._id;
                        done(err);
                    });
                });
            });

            afterEach(function(done){
                CollaborationObject.findByIdAndRemove(collaborationObjectId, function(){
                    User.remove({ email: email }, function(){
                        Unread.remove({ userId: userId }, done);
                    });
                });
            });

            it('sends saves item and stores unread marker', function(done){
                var data = {
                    collaborationObjectId: collaborationObjectId,
                };

                var item = { my: 'item' };

                function save(callback){
                    callback(null, item);
                }

                var offlineNotification = jasmine.createSpyObj('offlineNotification', ['notify']);

                collaborationObjectIo.sendItem(socketMock, offlineNotification, data, save, function(savedItem){
                    expect(savedItem).toBe(item);

                    Unread.find({ userId: userId }, function(err, markers){
                        expect(err).toBeNull();
                        expect(markers.length).toBe(1);
                        expect(markers[0].collaborationObjectId).toEqual(data.collaborationObjectId);
                        expect(markers[0].count).toBe(1);
                        done();
                    });
                });
            });
        });

        describe('#markAsRead', function(){
            var collaborationObjectId, userId;

            beforeEach(function(done){  
                collaborationObjectId = new mongo.Types.ObjectId();
                Unread.create({ userId: socketMock.handshake.user._id, collaborationObjectId: collaborationObjectId, count: 1 }, done);
            });

            afterEach(function(done){
                Unread.remove({ collaborationObjectId: collaborationObjectId }, done);
            });

            it('removes unread markers', function(done){
                var checkMatched = false;

                runs(function(){
                    collaborationObjectIo.markAsRead(socketMock, collaborationObjectId);
                });
                
                waitsFor(function(){
                    Unread.count({ collaborationObjectId: collaborationObjectId }, function(err, count){
                        checkMatched = count === 0;
                    });

                    return checkMatched;

                }, 'Waiting for unread marker to have been cleared', 2000);

                runs(function(){
                    done();
                });
            });
        });

        describe('#updateTopic', function(){
            var collaborationObjectId;

            beforeEach(function(done){
                CollaborationObject.create({ 
                    type: 'C',
                    topic: 'socket-conversation-orig',
                    createdById: socketMock.handshake.user._id,
                    groupId: socketMock.handshake.user.groupId,
                }, 
                function(err, collaborationObject){
                    collaborationObjectId = collaborationObject._id;
                    done(err); 
                });
            });

            afterEach(function(done){
                CollaborationObject.findByIdAndRemove(collaborationObjectId, done);
            });

            it('updates collaboration object topic', function(done){
                var checkMatched = false,
                    newTopic = 'new socket-io topic';

                runs(function(){
                    collaborationObjectIo.updateTopic({ collaborationObjectId: collaborationObjectId, newTopic: 'new socket-io topic'});
                });
                
                waitsFor(function(){
                    CollaborationObject.findById(collaborationObjectId, function(err, collaborationObject){
                        checkMatched = collaborationObject.topic === newTopic;
                    });

                    return checkMatched;

                }, 'Waiting for topic to be updated', 2000);

                runs(function(){
                    done();
                });
            });
        });
    });
});