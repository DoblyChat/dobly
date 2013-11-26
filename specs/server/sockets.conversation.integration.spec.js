describe('Sockets', function(){
    'use strict';

    describe('Conversation - integration', function(){
        var conversationIo, socketMock,
            CollaborationObject, Message, 
            Unread, User;

        beforeEach(function(){
            conversationIo = require('../../lib/sockets/conversation_io');
            CollaborationObject = require('../../lib/models/collaboration_object');
            Message = require('../../lib/models/message');
            Unread = require('../../lib/models/unread_marker');
            User = require('../../lib/models/user');

            socketMock = {
                emit: jasmine.createSpy(),
                broadcastToGroup: jasmine.createSpy(),
                broadcastToCollaborationObjectMembers: jasmine.createSpy(),
                handshake: {
                    user: {
                        firstName: 'socket-convo-test',
                        groupId: new mongo.Types.ObjectId(),
                        _id: new mongo.Types.ObjectId(),
                    },
                },
            };
        });

        describe('#sendMessage', function(){
            var content = 'socket-send-message-test',
                firstName = 'user-send',
                lastName = 'message-test',
                email = 'send.message@test.com';

            var userId, collaborationObjectId;

            beforeEach(function(done){
                CollaborationObject.create({
                    type: 'C',
                    topic: 'sendMessage test',
                    groupId: socketMock.handshake.user.groupId,
                    createdById: socketMock.handshake.user._id,
                    members: {
                        entireGroup: true
                    }
                }, function(err, collaborationObject){
                    if (err) { console.log(err); }

                    collaborationObjectId = collaborationObject._id;

                    User.create({ 
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        groupId: socketMock.handshake.user.groupId,
                        password: 'pass'
                    }, function(err, user){
                        if (err) { console.log(err); }
                        userId = user._id;
                        done(err);
                    });
                });
            });

            afterEach(function(done){
                CollaborationObject.findByIdAndRemove(collaborationObjectId, function(){
                    Message.remove({ content: content }, function(){
                        User.remove({ email: email }, function(){
                            Unread.remove({ userId: userId }, done);
                        });
                    }); 
                });
            });

            it('sends a message', function(done){
                var data = {
                    content: content,
                    collaborationObjectId: collaborationObjectId,
                };

                var sockets = { sock: 'ets' };

                conversationIo.sendMessage(socketMock, sockets, data, function(message){
                    expect(message.content).toBe(content);
                    expect(message.createdById).toBe(socketMock.handshake.user._id);
                    expect(message.collaborationObjectId).toEqual(data.collaborationObjectId);
                    expect(message.timestamp).toBeEquivalentDates(Date.now());
                    expect(message._id).not.toBeNull();

                    Message.count({ content: content }, function(err, count){
                        expect(err).toBeNull();
                        expect(count).toBe(1);

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
        });

        describe('#readMessages', function(){
            var collaborationObjectId;

            beforeEach(function(done){
                CollaborationObject.create({ 
                    type: 'C',
                    topic: 'socket-conversation',
                    createdById: socketMock.handshake.user._id,
                    groupId: socketMock.handshake.user.groupId,
                }, function(err, collaborationObject){
                    collaborationObjectId = collaborationObject._id;

                    Message.create({
                        content: 'socket-collaborationObject-test',
                        createdById: socketMock.handshake.user._id,
                        timestamp: new Date(),
                        collaborationObjectId: collaborationObjectId
                    }, done);
                });
            });

            afterEach(function(done){
                CollaborationObject.findByIdAndRemove(collaborationObjectId, function(){
                    Message.remove({ collaborationObjectId: collaborationObjectId }, done);
                });
            });

            it('returns messages', function(done){
                var confirm = function(messages){
                    expect(messages.length).toBe(1);
                    done();
                };

                conversationIo.readMessages({ collaborationObjectId: collaborationObjectId, page: 0 }, confirm);
            });

            it('pages messages', function(done){
                var confirm = function(messages){
                    expect(messages.length).toBe(0);
                    done();
                };

                conversationIo.readMessages({ collaborationObjectId: collaborationObjectId, page: 1 }, confirm);
            });
        });
    });
});