define(['knockout', 'client/common', 'client/routing'], function(ko, common, routing){
    'use strict';
    
    return function (desktop, collaborationObjects) {
        var self = {};

        self.open = function(collaborationObject){
            desktop.addAndActivate(collaborationObject);
            routing.routeTo('desktop');
        };

        self.showing = ko.observable(false);
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

        routing.subscribe('archive', self.showing, function(){
            self.refresh();
            common.delayedFocus('#archive .search input');
        });

        return self;
    };
});

