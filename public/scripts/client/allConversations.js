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

  return self;
}