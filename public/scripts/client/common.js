(function(global){
    'use strict';
    
    function common($){
        var self = {};

        // RegExp moved outside of the function to make sure they are compiled only once.
        //  URLs starting with http://, https://, or ftp://
        var REPLACEMENT_PATTERN_1 = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;

        // URLs starting with "www." (without // before it, or it'd re-link the ones done above).
        var REPLACEMENT_PATTERN_2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

        self.browser = {
            getUserAgent : function() {
                return navigator.userAgent.toLowerCase();
            },

            isSafari : function() {
                return this.getUserAgent().indexOf('safari') > -1 && this.getUserAgent().indexOf('chrome') <= -1;
            },

            isIE : function() {
                return this.getUserAgent().indexOf('msie') > -1;
            },
        };

        self.enterKeyPressed = function(event) {
            var keyCode = (event.which ? event.which : event.keyCode);
            return keyCode === 13;
        };

        self.focus = function(selector) {       
            if (!self.browser.isSafari() && !self.browser.isIE()){ 
                $(selector).focus();
            }
        };

        self.delayedFocus = function(selector, delay, hook){
            setTimeout(function () { 
                self.focus(selector);
                if(hook) {
                    hook();
                }
            }, delay ? delay : 400);
        };

        self.formatTimestamp = function(timestamp){
            return formatTimestamp(timestamp, "h:mm tt", "M/d h:mm tt", "M/d/yyyy h:mm tt");
        };

        self.formatSimpleTimestamp = function(timestamp){
            return formatTimestamp(timestamp, "h:mm tt", "M/d", "M/d/yyyy");
        };

        function formatTimestamp(timestampString, todayFormat, otherFormat, yearFormat) {
            if (timestampString === null) {
                return '';
            }

            var timestamp = new Date(timestampString);
            var datestamp = new Date(timestampString).clearTime();

            if (datestamp.equals(Date.today())) {
                return timestamp.toString(todayFormat);
            } else {
                if (timestamp.getYear() < Date.today().getYear()) {
                    return timestamp.toString(yearFormat);
                } else {
                    return timestamp.toString(otherFormat);
                }
            }
        }

        self.htmlEncode = function(value){
            //create a in-memory div, set it's inner text(which jQuery automatically encodes)
            //then grab the encoded contents back out.  The div never exists on the page.
            return $('<div/>').text(value).html();
        };

        self.formatUserInput = function(input){
            var lines = input.split('\n');
      
            for(var i = 0; i < lines.length; i++){
                lines[i] = self.htmlEncode(lines[i]);
            }

            return parseLinks(lines.join('<br />'));
        };

        function parseLinks(input){
            var replacedText = input.replace(REPLACEMENT_PATTERN_1, '<a href="$1" target="_blank">$1</a>');
            replacedText = replacedText.replace(REPLACEMENT_PATTERN_2, '$1<a href="http://$2" target="_blank">$2</a>');

            return replacedText;
        }
        
        return self;
    }

    if(typeof define === 'function'){
        define(['jquery', 'date'], common);
    }else{
        global.common = common(jQuery);
    }
})(window);


