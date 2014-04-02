define([
        'client/socket',
        'client/group', 
        'client/desktop',
        'client/archive',
        'client/collaboration-object.new', 
        'client/changeTopic',
        'client/events',
        'client/unread',
        'client/notification-setup',
        'client/top-nav',
        'client/group',
        'client/collaboration-object.db'], 
                            function(socket,
                                    createGroup, 
                                    createDesktop,
                                    createArchive,
                                    newCollaborationObject,
                                    createChangeTopic, 
                                    events,
                                    unread,
                                    notificationSetup,
                                    topNav, 
                                    group,
                                    db){
    'use strict';
    
    return function createViewModel(desktopData) {
        var self = {};


        function subscribe(){
            var toSubscribe = db.getCollaborationObjects().map(function(obj){
                return obj.id;
            });

            socket.emit('subscribe_to_collaboration_objects', toSubscribe);
        }

        subscribe();

        socket.on('reconnect', subscribe);

        self.group = group;
        self.unread = unread;
        self.desktop = createDesktop(desktopData);
        self.archive = createArchive(self.desktop);
        self.newCollaborationObject = newCollaborationObject;
        self.changeTopic = createChangeTopic();
        self.notificationSetup = notificationSetup;  

        notificationSetup.requestPermission();

        return self;
    };
});

