define(['knockout', 'client/common'], function(ko, common){
    'use strict';
    
    return function (viewModel) {
        var self = {};

        self.showingDesktop = ko.observable(true);
        self.showingAll = ko.observable(false);
        self.showingNewCollaborationObject = ko.observable(false);
        self.showingNotificationSetup = ko.observable(false);
        self.showingGroup = ko.observable(false);
        self.changingTopic = ko.observable(false);

        var flags = [ 
            self.showingDesktop, 
            self.showingAll, 
            self.showingNewCollaborationObject, 
            self.showingNotificationSetup, 
            self.showingGroup, 
            self.changingTopic
        ];

        function onlyShow(flagToShow, callback) {
            if(!flagToShow()){
                for (var i = flags.length - 1; i >= 0; i--) {
                    if (flags[i] === flagToShow) {
                        flags[i](true);
                    } else {
                        flags[i](false);
                    }
                }

                if(callback) { 
                    callback();
                }
            }
        }

        self.all = function() {
            viewModel.allConversations.refresh();
            onlyShow(self.showingAll);
            common.delayedFocus('#all-convos .search input');
        };

        self.desktop = function() {
            onlyShow(self.showingDesktop, function(){
                viewModel.desktop.ui.show();
            });
        };

        self.newCollaborationObject = function() {
            onlyShow(self.showingNewCollaborationObject);
        };

        self.notificationSetup = function(){
            onlyShow(self.showingNotificationSetup);
        };

        self.group = function(){
            onlyShow(self.showingGroup);
        };

        self.changeTopic = function(){
            onlyShow(self.changingTopic);
        };

        return self;
    };
});