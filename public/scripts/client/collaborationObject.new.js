define(['jquery', 'knockout', 'client/common', 'chosen'], function($, ko, common){
    'use strict';
    
    return function (navigation, group) {
        var self = {},
            otherUsers = group.otherUsers,
            groupKey = 'g',
            CONVERSATION_TYPE = 'C';

        self.type = ko.observable(CONVERSATION_TYPE);
        self.topic = ko.observable('');
        self.options = ko.observableArray();

        for(var i = 0; i < otherUsers.length; i++){
            self.options.push({
                value: otherUsers[i].id,
                text: otherUsers[i].name
            });
        }

        self.options.push({
            value: groupKey,
            text: 'Entire Group'
        });

        self.selectedOptions = ko.observableArray([ groupKey ]); 
        
        self.setup = function() {
            common.delayedFocus('#new-collaboration-object textarea');
            $('#members-select').chosen({ placeholder: '' });
        };

        self.createOnEnter = function(data, event) {
           if (common.enterKeyPressed(event) && canCreate()) {
               self.create();
               return false;
           }
           else {
               return true;
           }
        };

        function canCreate(){
            return self.topic().length > 0 && self.selectedOptions().length > 0;
        }

        self.createOnClick = function() {
            if (canCreate()) {
                self.create();
            }
        };

        self.create = function() {
            var selectedOptions = self.selectedOptions();
            var groupKeyIndex = selectedOptions.indexOf(groupKey);
            
            if(groupKeyIndex >= 0){
                selectedOptions.splice(groupKeyIndex, 1);
            }

            var data = { 
                topic: self.topic(), 
                forEntireGroup: groupKeyIndex >= 0, 
                selectedMembers: selectedOptions,
                type: self.type()
            };

            app.socket.emit('create_collaboration_object', data);
            restoreDefaults();
            navigation.desktop();  
        };

        self.cancel = function() {
            restoreDefaults();
            navigation.desktop();    
        };

        function restoreDefaults(){
            self.topic('');
            self.type(CONVERSATION_TYPE);
            self.selectedOptions([ groupKey ]);
        }

        return self;
    };
});