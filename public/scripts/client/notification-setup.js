define(['knockout', 'client/routing'], function(ko, routing){
    'use strict';

    var notifications = window.webkitNotifications,
        canUseNotifications = !!(window.webkitNotifications || window.mozNotifications || window.oNotifications || window.msNotifications || window.notifications), 
        NOT_SET = 1, HASH = 'notification-setup';
    
    function goToDesktop(){
        routing.routeTo('conversations');
    }

    function permissionsNotSet(){
        // not set = 1
        // denied = 2
        // allowed = 0
        return notifications.checkPermission() === NOT_SET;
    }

    var self = {};

    self.showing = ko.observable(false);

    self.requestPermission = function(){
        if(canUseNotifications && permissionsNotSet()){
            routing.routeTo(HASH);
        }
    };

    self.allow = function(){
        notifications.requestPermission();
        goToDesktop();
    };
    
    self.cancel = goToDesktop;

    routing.subscribe(HASH, self.showing);

    return self;
});