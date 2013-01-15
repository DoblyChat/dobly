function createMessage(data) {
  var self = {};

  self.content = ko.observable(data.content);
  self.timestamp = formatTimestamp(data.timestamp, "h:mm tt", "M/d h:mm tt");
  self.username = data.username;
  self.simpleTimestamp = formatTimestamp(data.timestamp, "h:mm tt", "M/d");

  function formatTimestamp(timestampString, todayFormat, otherFormat) {
    var timestamp = new Date(timestampString);
    var datestamp = new Date(timestampString).clearTime();

    if (datestamp.equals(Date.today())) {
      return timestamp.toString(todayFormat);
    } else {
      return timestamp.toString(otherFormat);
    }
  }

  return self;
}