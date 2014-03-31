define([
        'knockout',
        'client/socket',
        'client/group', 
        'client/desktop',
        'client/archive',
        'client/collaboration-object.new', 
        'client/changeTopic',
        'client/events',
        'client/notifications',
        'client/notification-setup',
        'client/top-nav',
        'client/group',
        'client/collaboration-object.db'], 
                            function(  ko, 
                                    socket,
                                    createGroup, 
                                    createDesktop,
                                    createArchive,
                                    newCollaborationObject,
                                    createChangeTopic, 
                                    events,
                                    createNotifier,
                                    notificationSetup,
                                    topNav, 
                                    group,
                                    db){
    'use strict';
    
    return function createViewModel(desktopData) {
        var self = {};
  
        self.collaborationObjects = ko.observableArray(db.getCollaborationObjects());

        self.group = group;

        function subscribe(){
            var toSubscribe = db.getCollaborationObjects().map(function(obj){
                return obj.id;
            });

            socket.emit('subscribe_to_collaboration_objects', toSubscribe);
        }

        subscribe();

        socket.on('reconnect', subscribe);

        self.unreadCounter = ko.computed(function(){
            var unread = 0;
            ko.utils.arrayForEach(self.collaborationObjects(), function(conversation){
                unread += conversation.unreadCounter();
            });

            return unread;
        });

        self.unreadCounter.subscribe(function(unread){
            self.notifier.updateTitle(unread);
        });

        self.hasUnread = ko.computed(function(){
            return self.unreadCounter() > 0;
        });

        self.desktop = createDesktop(desktopData);
        self.archive = createArchive(self.desktop, self.collaborationObjects);
        self.newCollaborationObject = newCollaborationObject;
        self.changeTopic = createChangeTopic();
        self.notificationSetup = notificationSetup;
        self.notifier = createNotifier(self.desktop);        

        notificationSetup.requestPermission();

        events.register(self);

        return self;
    };
});

