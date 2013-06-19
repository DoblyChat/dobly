function createConversationSearch(conversation) {
    var self = {};
    var messages = conversation.messages();
    var foundMessage = {
        id: '',
        offset: -1,
    }
    var matches = [];
    var currentQuery = '';

    self.topicMatched = ko.computed(function() {
        return conversation.topic().toLowerCase().indexOf(app.topicSearch().toLowerCase()) > -1;
    });

    self.query = ko.observable('');

    self.show = function() {
        conversation.ui.showSearch();
    };

    self.next = function() {
        if (self.query().length > 0) {

            resetIfNeeded();

            if (nextFound()) {
                scrollToMatchAndHighlight();
            } else {
                pageIfPossible();
            }
        }
    };

    self.prev = function() {
        if (self.query().length > 0) {

            resetIfNeeded();

            if (prevFound()) {
                scrollToMatchAndHighlight();
            } else {
                searchExhausted();
            }
        }
    };

    function resetIfNeeded() {
        if (currentQuery !== self.query()) {
            reset();
        }
    }

    function reset() {
        for (var i = matches.length - 1; i >= 0; i--) {
            matches[i].removeClass('match');
            matches[i].removeHighlight();
            matches.pop();
        }

        currentQuery = self.query();
        foundMessage.id = '';
        foundMessage.offset = -1;
    }

    function nextFound() {
        var initialization = function(startingPoint) { return startingPoint - 1; };
        var condition = function(i) { return i >= 0; };
        var increment = function(i) { return --i; };
        return found(initialization, condition, increment);
    }

    function prevFound() {
        var initialization = function(startingPoint) { return startingPoint + 1; };
        var condition = function(i) { return i < messages.length; };
        var increment = function(i) { return ++i; };
        return found(initialization, condition, increment);
    }

    function found(initialization, condition, increment) {
        var queryLower = currentQuery.toLowerCase();
        var message;

        var startingPoint = messages.length;
        if (foundMessage.offset > -1) {
            startingPoint = messages.length - foundMessage.offset;
        }

        for (var i = initialization(startingPoint); condition(i); i = increment(i)) {
            message = messages[i];

            if (matchFound(message, queryLower)) {
                foundMessage.id = message.id();
                foundMessage.offset = messages.length - i;
                return true;
            }
        }

        return false;
    }

    function matchFound(message, queryLower) {
        return message.rawContent.trim().toLowerCase().indexOf(queryLower) > -1;
    }

    function scrollToMatchAndHighlight() {
        var match = $('#' + foundMessage.id);
        highlight(match);
        scrollIfNeeded(match);
        addToMatches(match);        
    }

    function highlight(match) {
        matches.forEach(function(element) { element.removeHighlight(); })
        match.addClass('match');
        match.find('.text').highlight(currentQuery);
    }

    function scrollIfNeeded(match) {
        if (isAbove(match) || isBelow(match)) {
            scrollTo(match);
            conversation.ui.scroll.flash();
        }        
    }

    function isAbove(match) {
        return match.position().top <= 0;
    }

    function isBelow(match) {
        return match.position().top + match.outerHeight(true) > conversation.ui.bodyHeight();
    }

    function scrollTo(match) {
        var firstMessagePosition = $('#' + messages[0].id()).position();
        var offset = Math.abs(firstMessagePosition.top - match.position().top);
        
        if (offset > 0) {
            conversation.ui.scroll.adjustToOffset(offset);
        } else {
            conversation.ui.scroll.adjustToTop();
        }
    }

    function addToMatches(match) {
        var alreadyMatched = matches.some(function(element) {
            return element.attr('id') === foundMessage.id;
        });

        if (!alreadyMatched) {
            matches.push(match);
        }
    }

    function pageIfPossible() {
        if (conversation.allMessagesLoaded()) {
            searchExhausted();
        } else {
            page();
        }
    }

    function searchExhausted() {
        alert('search exhausted');
    }

    function page() {
        conversation.page(function(messages) {
            conversation.loadingMore(false);
            conversation.ui.scroll.adjust();
            self.next();
        });

        conversation.loadingMore(true);
    }

    self.done = function() {
        self.query('');
        reset();
        conversation.ui.hideSearch();
    };

    self.nextOnEnter = function(data, event) {
       if (common.enterKeyPressed(event)) {
           self.next();
           return false;
       }
       else {
           return true;
       }
    };

    return self;
}