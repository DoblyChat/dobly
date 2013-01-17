function createAllConversations(desktop, navigation, conversationsObservable) {
  var self = {};

  self.open = function(conversation){
    navigation.desktop();
    desktop.addAndFocus(conversation);
  };

  self.pairs = [];

  self.refresh = function () {
    var sortedConversations = conversationsObservable.sort(function(left, right){
      if (left.unreadCounter() == right.unreadCounter()) {
        return left.topic().toLowerCase().localeCompare(right.topic().toLowerCase());
      } else {
        return left.unreadCounter() < right.unreadCounter() ? 1 : -1; 
      }
    });

    self.pairs = [];

    for (var i = 0; i < sortedConversations.length; i = i + 2) {
      if (i + 1 < sortedConversations.length) {
        var pair = [sortedConversations[i], sortedConversations[i + 1]];
      } else {
        var pair = [sortedConversations[i]];
      }
      self.pairs.push(pair);
    };
  };

  self.unreadCounter = ko.computed(function(){
    var count = 0;
    ko.utils.arrayForEach(conversationsObservable(), function(conversation){
      count += conversation.unreadCounter();
    });

    return count;
  });

  self.showUnreadCounter = ko.computed(function(){
    return self.unreadCounter() > 0;
  });

  return self;
}