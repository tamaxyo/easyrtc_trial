var http    = require("http");
var express = require("express");
var io      = require("socket.io");
var easyrtc = require("easyrtc");
var opts    = require("opts");

opts.parse([
  {
    'short': 'p'
    , 'long': 'port'
    , 'description': 'port number'
    , 'value': true
    , 'required': false
  },
  {
    'short': 'r'
    , 'long': 'resource'
    , 'description': 'path to resource'
    , 'value': true
    , 'required': false
  }
]);

var port = opts.get('port') || 8080;
var resource = opts.get('resource') || '';


var httpApp = express();
httpApp.configure(function() {
  httpApp.get('/js/resource.js', function(req, res) {
    res.setHeader('Content-Type', 'text/javascript');
    res.send('(function() { easyrtc.setSocketResource("' + resource + '")})(window)');
  });
  httpApp.use(express.static(__dirname + '/static/'));
});

var webServer = http.createServer(httpApp).listen(port);
var socketServer = io.listen(webServer, { 'log level': 1 });
socketServer.set('resource', '/' + resource);
var rtc = easyrtc.listen(httpApp, socketServer);

