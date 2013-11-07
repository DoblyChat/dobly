describe('Sockets', function(){
	'use strict';

    describe('Base Collaboration Object - integration', function(){
		var collaborationObjectIo, socketMock,
            CollaborationObject, notificationMock,
            Unread, User;

        beforeEach(function(){
        	CollaborationObject = require('../../lib/models/collaboration_object');
            Unread = require('../../lib/models/unread_marker');
            User = require('../../lib/models/user');
            
            mockery.enable({ warnOnUnregistered: false });
			
			notificationMock = buildMock('../notifications/offline_notification', 'init', 'notify');
            collaborationObjectIo = require('../../lib/sockets/base_collaboration_object_io');

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
	            }, function(err, collaborationObject){
	                if (err) { console.log(err) };

	                collaborationObjectId = collaborationObject._id;

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
	        	User = require('../../lib/models/user');
	            CollaborationObject.findByIdAndRemove(collaborationObjectId, function(){
	                User.remove({ email: email }, function(){
	                    Unread.remove({ userId: userId }, done);
	                });
	            });
	        });

	        it('saves item and stores unread marker', function(done){
	            var data = {
	                collaborationObjectId: collaborationObjectId,
	            };

	            var item = { my: 'item' };

	            function save(callback){
	                callback(null, item);
	            }

	            var sockets = {};

	            collaborationObjectIo.sendItem(socketMock, sockets, data, save, function(savedItem){
	                expect(savedItem).toBe(item);

	                Unread.find({ userId: userId }, function(err, markers){
	                    expect(err).toBeNull();
	                    expect(markers.length).toBe(1);
	                    expect(markers[0].collaborationObjectId).toEqual(data.collaborationObjectId);
	                    expect(markers[0].count).toBe(1);

	                   	expect(notificationMock.init).toHaveBeenCalledWith(socketMock, sockets);
	                	expect(notificationMock.notify).toHaveBeenCalledWith(item);
	                    done();
	                });
	            });
	        });
	    });
	});
});