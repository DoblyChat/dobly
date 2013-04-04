function createAllConversations(desktop, navigation, conversationsObservable) {
  var self = {};

  self.open = function(conversation){
    navigation.desktop();
    desktop.addAndActivate(conversation);
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
    if(conversation.messages().length > 0){
      toggle('.messages');
    }else{
      toggle('.no-messages');
    }

    function toggle(selector){
      $(event.currentTarget).closest('.header').siblings(selector).toggle('slideDown');
      $(event.currentTarget).hide().siblings().show();
    }
  };

  return self;
}