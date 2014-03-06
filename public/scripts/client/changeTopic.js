define(['knockout', 'client/socket', 'client/common', 'client/routing'], 
    function(ko, socket, common, routing){
    'use strict';
    
    return function (){
        var self = {}, hash = 'change-topic';

        self.newTopic = ko.observable('');
        self.showing = ko.observable(false);

        self.click = function(collaborationObjectToChange){
            self.collaborationObject = collaborationObjectToChange;
            return true;
        };

        self.updateOnEnter = function(obj, event){
            if(common.enterKeyPressed(event)){
                self.update();
            } else {
                return true;
            }
        };

        self.updateOnClick = function(obj, event){
            self.update();
        };

        self.update = function(){
            socket.emit('update_topic', { collaborationObjectId: self.collaborationObject.id, newTopic: self.newTopic() });
            self.collaborationObject.topic(self.newTopic());
            close();
        };

        function close(){
            self.newTopic('');
            routing.routeTo('conversations');
        }

        self.cancel = function(){
            close();
        };

        routing.subscribe(hash, self.showing, function(){
            common.delayedFocus('#change-topic textarea', 100, function(){
                self.newTopic(self.collaborationObject.topic());
            });
        });

        return self;
    };
});