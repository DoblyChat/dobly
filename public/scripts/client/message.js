function createMessage(data) {
  var self = {};

  self.content = ko.observable(data.content);
  self.timestamp = formatTimestamp(data.timestamp);
  self.username = data.username;

  function formatTimestamp(timestampString) {
    var timestamp = new Date(timestampString);
    var datestamp = new Date(timestampString).clearTime();

    if (datestamp.equals(Date.today())) {
      return timestamp.toString("h:mm tt");
    } else {
      return timestamp.toString("M/d h:mm tt");
    }
  }

  return self;
}