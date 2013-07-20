define(['jquery', 'knockout', 'client/common', 'highlight'], function($, ko, common){
    return function (conversation) {
        var self = {};
        var messages = conversation.messages();
        self.foundMessage = {
            id: '',
            offset: -1,
        };
        self.matches = [];
        var currentQuery = '';

        self.topicMatched = ko.computed(function() {
            return conversation.topic().toLowerCase().indexOf(app.topicSearch().toLowerCase()) > -1;
        });

        self.query = ko.observable('');
        self.exhausted = ko.observable(false);
        self.searching = ko.observable(false);

        self.show = function() {
            conversation.ui.showSearch();
        };

        self.next = function() {
            if (self.query().length > 0) {

                self.searching(true);
                resetIfNeeded();

                if (nextFound()) {
                    self.scrollToMatchAndHighlight();
                    self.searching(false);
                } else {
                    pageIfPossible();
                }
            }
        };

        self.prev = function() {
            if (self.query().length > 0) {

                resetIfNeeded();

                if (prevFound()) {
                    self.scrollToMatchAndHighlight();
                } else {
                    searchExhausted();
                }
            }
        };

        function resetIfNeeded() {
            if (currentQuery !== self.query()) {
                self.reset();
            }
        }

        self.reset = function() {
            var matchesLength = self.matches.length;
            
            for (var i = matchesLength - 1; i >= 0; i--) {
                self.matches[i].removeClass('match');
                self.matches[i].removeHighlight();
                self.matches.pop();
            }

            currentQuery = self.query();
            self.foundMessage.id = '';
            self.foundMessage.offset = -1;
            conversation.ui.resizeBodyFromHeaderChange(function() {
                self.exhausted(false);
            });
        };

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
            if (self.foundMessage.offset > -1) {
                startingPoint = messages.length - self.foundMessage.offset;
            }

            for (var i = initialization(startingPoint); condition(i); i = increment(i)) {
                message = messages[i];

                if (matchFound(message, queryLower)) {
                    self.foundMessage.id = message.id();
                    self.foundMessage.offset = messages.length - i;
                    return true;
                }
            }

            return false;
        }

        function matchFound(message, queryLower) {
            return message.rawContent.trim().toLowerCase().indexOf(queryLower) > -1;
        }

        self.scrollToMatchAndHighlight = function() {
            var match = $('#' + self.foundMessage.id);
            highlight(match);
            scrollIfNeeded(match);
            addToMatches(match);        
        };

        function highlight(match) {
            self.matches.forEach(function(element) { element.removeHighlight(); });
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
            var alreadyMatched = self.matches.some(function(element) {
                return element.attr('id') === self.foundMessage.id;
            });

            if (!alreadyMatched) {
                self.matches.push(match);
            }
        }

        function pageIfPossible() {
            if (conversation.allMessagesLoaded()) {
                searchExhausted();
                self.searching(false);
            } else {
                self.page();
            }
        }

        function searchExhausted() {
            conversation.ui.resizeBodyFromHeaderChange(function() {
                self.exhausted(true);
            });
        }

        self.exhausted.subscribe(function(isTrue) {
            if (isTrue) {
                $(conversation.ui.getSelector('.convo-header .search .exhausted')).effect("highlight", { color: '#ffafbf' }, 2000);
            }
        });

        self.page = function() {
            conversation.page(function(messages) {
                conversation.loadingMore(false);
                conversation.ui.scroll.adjust();
                self.next();
            });

            conversation.loadingMore(true);
        };

        self.done = function() {
            self.query('');
            self.reset();
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
    };
});