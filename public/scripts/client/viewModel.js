define([
        'client/group', 
        'client/desktop',
        'client/archive',
        'client/collaboration-object.new', 
        'client/changeTopic',
        'client/events',
        'client/unread',
        'client/notification-setup',
        'client/top-nav',
        'client/group'], 
                            function(createGroup, 
                                    createDesktop,
                                    createArchive,
                                    newCollaborationObject,
                                    createChangeTopic, 
                                    events,
                                    unread,
                                    notificationSetup,
                                    topNav, 
                                    group){
    'use strict';
    
    return function createViewModel(desktopData) {
        var self = {};
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

