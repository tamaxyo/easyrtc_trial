(function(window) {
  var selfEasyrtcid = "";

  var init = function() {
    easyrtc.setRoomOccupantListener(roomListener);
    easyrtc.easyApp("trial.videoConference", "self", ["caller"], loginSuccess, loginFailure);
  };

  var loginSuccess = function(easyrtcId) {
    selfEasyrtcid = easyrtcId;
  };

  var loginFailure = function(errorCode, message) {
    easyrtc.showError(errorCode, message);
  };


  var clearPeerList = function() {
    var otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }
  };

  var roomListener = function(roomName, otherPeers) {
    clearPeerList();

    var otherClientDiv = document.getElementById('otherClients');
    for(var peer in otherPeers) {
      var button = document.createElement('button');
      button.onclick = function(easyrtcid) {
        return function() {
          performCall(easyrtcid);
        };
      }(peer);

      var label = document.createTextNode(easyrtc.idToName(peer));
      button.appendChild(label);
      otherClientDiv.appendChild(button);
    }
  };

  var performCall = function(easyrtcid) {
    easyrtc.call(
      easyrtcid,
      function(easyrtcid) { console.log("completed call to", easyrtcid); },
      function(errorMessage) { console.error("err:",  errorMessage); },
      function(accepted, bywho) { console.log((accepted ? "accepted" : "rejected"), "by", bywho); }
    )
  }

  window.addEventListener('load', init);
})(window);
