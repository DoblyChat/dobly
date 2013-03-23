function createChangeTopic(nav){
	var self = {};

    var conversation;

    self.newTopic = ko.observable('');

    self.click = function(conversationToChange){
      conversation = conversationToChange;
      self.newTopic(conversation.topic());
      nav.changeTopic();
    };

    self.updateOnEnter = function(obj, event){
      if(common.enterKeyPressed(event)){
        update();
      } else {
        return true;
      }
    };

    self.updateOnClick = function(obj, event){
      update();
    };

    function update(){
      app.socket.emit('update_topic', { conversationId: conversation.id, newTopic: self.newTopic() })
      conversation.topic(self.newTopic());
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
}