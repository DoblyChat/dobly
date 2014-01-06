define(['knockout'], function(ko){
    'use strict';
    
    return function (desktop, navigation, collaborationObjects) {
        var self = {};

        self.open = function(collaborationObject){
            desktop.addAndActivate(collaborationObject);
            navigation.desktop();
        };

        self.topicSearch = ko.observable('');
        
        var _sortedCollaborationObjects = [];

        self.collaborationObjects = ko.observableArray([]);

        self.refresh = function () {
            _sortedCollaborationObjects = collaborationObjects().sort(function(left, right){
                if (left.unreadCounter() == right.unreadCounter()) {
                    return left.topic().toLowerCase().localeCompare(right.topic().toLowerCase());
                } else {
                    return left.unreadCounter() < right.unreadCounter() ? 1 : -1; 
                }
            });

            self.collaborationObjects(_sortedCollaborationObjects);
        };

        self.topicSearch.subscribe(function(topicSearch){
            var filtered = _sortedCollaborationObjects.filter(function(collaborationObject){
                return collaborationObject.topic().toLowerCase().indexOf(topicSearch.toLowerCase()) > -1;
            });

            self.collaborationObjects(filtered);
        });

        return self;
    };
});

