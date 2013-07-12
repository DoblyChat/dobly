define(['knockout', 'client/common'], function(ko, common){
    return function (nav){
        var self = {};

        self.newTopic = ko.observable('');

        self.click = function(conversationToChange){
          self.conversation = conversationToChange;
          nav.changeTopic();
          common.delayedFocus('#change-topic textarea', 100, function(){
            self.newTopic(self.conversation.topic());
          });
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
          app.socket.emit('update_topic', { conversationId: self.conversation.id, newTopic: self.newTopic() })
          self.conversation.topic(self.newTopic());
          close();
        }

        function close(){
          self.newTopic('');
          nav.desktop();
        }

        self.cancel = function(){
          close();
        };

        return self;
    };
});