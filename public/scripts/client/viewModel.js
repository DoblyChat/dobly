define([
        'knockout', 
        'client/group', 
        'client/desktop',
        'client/archive', 
        'client/builder', 
        'client/collaboration-object.new', 
        'client/changeTopic',
        'client/events',
        'client/notifications',
        'client/notification-setup',
        'client/top-nav',
        'client/group'], function(ko, 
                                    createGroup, 
                                    createDesktop,
                                    createArchive,
                                    builder,
                                    newCollaborationObject,
                                    createChangeTopic, 
                                    events,
                                    createNotifier,
                                    notificationSetup,
                                    topNav, 
                                    group){
    'use strict';
    
    return function createViewModel(collaborationObjectsData, desktopData) {
        var self = {};
  
        self.collaborationObjects = ko.observableArray([]);

        self.group = group;

        var toSubscribe = [];

        for(var i = 0; i < collaborationObjectsData.length; i++){
            var obj = builder.collaborationObject(collaborationObjectsData[i], self.group);
            self.collaborationObjects.push(obj);
            toSubscribe.push(collaborationObjectsData[i]._id);
        }

        app.socket.emit('subscribe_to_collaboration_objects', toSubscribe);

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

        self.desktop = createDesktop(desktopData, self.collaborationObjects());
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

