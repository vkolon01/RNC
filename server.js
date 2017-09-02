var app = require('./app');
var reload = require('reload');

var server = app.listen(5000,function(){
    console.log('Listening on port ' + server.address().port);
});

reload(server,app);

module.exports = server;
