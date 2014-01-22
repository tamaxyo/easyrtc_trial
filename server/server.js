var http    = require("http");
var express = require("express");
var io      = require("socket.io");
var easyrtc = require("easyrtc");

var httpApp = express();
httpApp.configure(function() {
  httpApp.use(express.static(__dirname + "/static/"));
});

var webServer = http.createServer(httpApp).listen(8080);
var socketServer = io.listen(webServer, { "log level":1});
var rtc = easyrtc.listen(httpApp, socketServer);
