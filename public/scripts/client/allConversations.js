function createAllConversations(desktop, navigation, conversationsObservable) {
  var self = {};

  self.open = function(conversation){
    navigation.desktop();
    desktop.addAndFocus(conversation);
  };

  self.conversationPairs = ko.computed(function() {
    var sortedConversations = conversationsObservable.sort(function(left, right){
      return left.unreadCounter() < right.unreadCounter();
    });

    var pairs = [];

    for (var i = 0; i < sortedConversations.length; i = i + 2) {
      if (i + 1 < sortedConversations.length) {
        var pair = [sortedConversations[i], sortedConversations[i + 1]];
      } else {
        var pair = [sortedConversations[i]];
      }
      pairs.push(pair);
    };

    return pairs;
  });


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