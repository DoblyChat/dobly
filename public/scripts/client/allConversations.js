define(['jquery'], function($){
    'use strict';
    
    return function (desktop, navigation, conversationsObservable) {
        var self = {};

        self.open = function(conversation){
            desktop.addAndActivate(conversation);
            navigation.desktop();
        };

        self.sortedConversations = [];

        self.refresh = function () {
            self.sortedConversations = conversationsObservable().sort(function(left, right){
                if (left.unreadCounter() == right.unreadCounter()) {
                    return left.topic().toLowerCase().localeCompare(right.topic().toLowerCase());
                } else {
                    return left.unreadCounter() < right.unreadCounter() ? 1 : -1; 
                }
            });
        };

        self.toggleMessages = function(conversation, event){
            if(conversation.items().length > 0){
                self.toggle('.messages', event);
            }else{
                self.toggle('.no-messages', event);
            }
        };

        self.toggle = function(selector, event) {
            $(event.currentTarget).closest('.header').siblings(selector).toggle();
            $(event.currentTarget).hide().siblings().show();
        };

        return self;
    };
});

