define(['jquery'], function($){
    'use strict';
    
    return function (desktop, navigation, collaborationObjects) {
        var self = {};

        self.open = function(conversation){
            desktop.addAndActivate(conversation);
            navigation.desktop();
        };

        self.sortedCollaborationObjects = [];

        self.refresh = function () {
            self.sortedCollaborationObjects = collaborationObjects().sort(function(left, right){
                if (left.unreadCounter() == right.unreadCounter()) {
                    return left.topic().toLowerCase().localeCompare(right.topic().toLowerCase());
                } else {
                    return left.unreadCounter() < right.unreadCounter() ? 1 : -1; 
                }
            });
        };

        return self;
    };
});

