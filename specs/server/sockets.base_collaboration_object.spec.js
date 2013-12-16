describe('Sockets', function(){
    'use strict';

    describe('Base Collaboration Object', function(){
        var collaborationObjectIo, socketMock, 
            notificationMock, itemMock,
            sockets, clients;

        beforeEach(function(){
            socketMock = {
                handshake: {
                    user: {
                        groupId: 'gru-id',
                        _id: 'usr-id',
                    },
                },
                broadcastToCollaborationObjectMembers: jasmine.createSpy()
            };

            sockets = {};
            clients = 
            [
                { 
                    handshake: {
                        user: {
                            _id: 'usr-id'
                        }
                    }
                },
                { 
                    handshake: {
                        user: {
                            _id: 'usr-id-2'
                        }
                    }
                },
                { 
                    handshake: {
                        user: {
                            _id: 'usr-id-3'
                        }
                    }
                },
            ];

            mockery.enable({ useCleanCache: true, warnOnUnregistered: false });
            mockery.registerAllowable('../../lib/sockets/base_collaboration_object_io');

            notificationMock = buildMock('../notifications/offline_notification', 'init', 'notify');
            itemMock = buildMock('../models/item', 'init', 'send');

            collaborationObjectIo = require('../../lib/sockets/base_collaboration_object_io');
        });

        it("sends item", function() {
            var confirm = jasmine.createSpy('confirm');
            var save = jasmine.createSpy('save');

            var data = { 
                content: 'my text',
                timestamp: new Date(),
                collaborationObjectId: 'object-id'
            };

            var item = {};

            collaborationObjectIo.sendItem(socketMock, sockets, data, save, confirm);

            expect(itemMock.init).toHaveBeenCalled();
            expect(itemMock.init).toHaveBeenCalledWith(
                socketMock.handshake.user._id, 
                socketMock.handshake.user.groupId, 
                data.collaborationObjectId);

            expect(itemMock.send).toHaveBeenCalled();
            var args = itemMock.send.mostRecentCall.args;

            args[0]();
            args[1](item);
            args[2]();
            args[3](item);

            expect(save).toHaveBeenCalled();
            expect(socketMock.broadcastToCollaborationObjectMembers).toHaveBeenCalledWith(
                'receive_item',
                data.collaborationObjectId,
                item
                );
            expect(confirm).toHaveBeenCalled();
            expect(notificationMock.init).toHaveBeenCalledWith(socketMock, sockets);
            expect(notificationMock.notify).toHaveBeenCalledWith(item);
        });
    });
});