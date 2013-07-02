var fs = require('fs');

fs.rename('migrations/production', 'migrations/.migrate', function (err) {
  if (err) throw err;
  process.exit();
});