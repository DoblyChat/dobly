function createNavigationModule(viewModel) {
    var self = {};

    self.showingDesktop = ko.observable(true);
    self.showingAll = ko.observable(false);
    self.showingNewConvo = ko.observable(false);
    self.showingNotificationSetup = ko.observable(false);
    self.showingGroup = ko.observable(false);
    self.changingTopic = ko.observable(false);
    self.showingConversationInfo = ko.observable(false);

    var flags = [ 
        self.showingDesktop, 
        self.showingAll, 
        self.showingNewConvo, 
        self.showingNotificationSetup, 
        self.showingGroup, 
        self.changingTopic,
        self.showingConversationInfo
    ];

    self.all = function() {
		viewModel.allConversations.refresh();
		onlyShow(self.showingAll);
        common.delayedFocus('#all-convos .search input');
    };

    function onlyShow(flagToShow) {
		for (var i = flags.length - 1; i >= 0; i--) {
			if (flags[i] === flagToShow) {
				flags[i](true);
			} else {
				flags[i](false);
			}
		};
    }

    self.desktop = function() {
		onlyShow(self.showingDesktop);
		viewModel.desktop.ui.show();
    };

    self.newConvo = function() {
		onlyShow(self.showingNewConvo);
    };

    self.notificationSetup = function(){
		onlyShow(self.showingNotificationSetup);
    };

    self.group = function(){
		onlyShow(self.showingGroup);
    };

    self.showBack = function(){
		return self.showingAll() 
			|| self.showingNewConvo() 
			|| self.showingNotificationSetup()
			|| self.showingGroup()
            || self.showingConversationInfo();
    };

    self.changeTopic = function(){
		onlyShow(self.changingTopic);
    }

    self.conversationInfo = function(convo){
        onlyShow(self.showingConversationInfo);
        viewModel.conversationInfo.set(convo);
    };

    return self;
}