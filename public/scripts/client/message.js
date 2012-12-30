function createMessage(data) {
  var self = {};

  self.content = ko.observable(data.content);
  self.timestamp = formatTimestamp(data.timestamp);
  self.username = data.user.name;

  function formatTimestamp(timestampString) {
    var timestamp = new Date(timestampString);
    var datestamp = new Date(timestampString).clearTime();

    if (datestamp.equals(Date.today())) {
      return timestamp.toString("h:m tt");
    } else {
      return timestamp.toString("M/d h:m tt");
    }
  }

  return self;
}