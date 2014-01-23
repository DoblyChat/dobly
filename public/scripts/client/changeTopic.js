define(['knockout', 'client/common', 'client/routing'], function(ko, common, routing){
    'use strict';
    
    return function (){
        var self = {}, hash = 'change-topic';

        self.newTopic = ko.observable('');
        self.showing = ko.observable(false);

        self.click = function(collaborationObjectToChange){
            self.collaborationObject = collaborationObjectToChange;
            routing.setHash(hash);
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
            app.socket.emit('update_topic', { collaborationObjectId: self.collaborationObject.id, newTopic: self.newTopic() });
            self.collaborationObject.topic(self.newTopic());
            close();
        };

        function close(){
            self.newTopic('');
            routing.setHash('desktop');
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