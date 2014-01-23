(function(){
  var selfEasyrtcid = "";

  var init = function() {
    easyrtc.setPeerListener(addToConversation);
    easyrtc.setRoomOccupantListener(convertListToButtons);
    easyrtc.connect("trial.chat", loginSuccess, loginFailure);
  };

  var sanitize = function(content) {
    return content.
      replace(/&/g,'&amp;').
      replace(/</g,'&lt;').
      replace(/>/g,'&gt;').
      replace(/\n/g, '<br />');
  };
  
  var addToConversation = function(who, msgType, content) {
    document.getElementById('conversation').innerHTML +=
    "<b>" + who + ":</b>&nbsp;" + sanitize(content) + "<br />";
  };

  var convertListToButtons = function(roomName, otherClients, isPrimary) {
    clearClientList();

    var otherClientDiv = document.getElementById('otherClients');
    for(var client in otherClients) {
      var button = document.createElement('button');
      button.onclick = function(easyrtcid) {
        return function() {
          sendStuffWS(easyrtcid);
        };
      }(client);
      
      var label = document.createTextNode("Send to " + easyrtc.idToName(client));
      button.appendChild(label);

      otherClientDiv.appendChild(button);
    }
    if( !otherClientDiv.hasChildNodes() ) {
      otherClientDiv.innerHTML = "<em>Nobody else logged in to talk to.. </em>";
    }
  };

  var clearClientList = function() {
    var otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }
  };

  var sendStuffWS = function(receiver) {
    var text = document.getElementById('sendMessageText').value;
    if(text.replace(/\s/g, "").length == 0) {
      return;
    }
    
    easyrtc.sendDataWS(receiver, 'message', text);
    addToConversation('Me', 'message', text);
    document.getElementById('sendMessageText').value = "";
  }

  var loginSuccess = function(easyrtcId) {
    selfEasyrtcid = easyrtcId;
    easyrtc.setUsername("tamaxyo");
    document.getElementById("iam").innerHTML = "I am " + easyrtc.idToName(easyrtcId);
  };

  var loginFailure = function(errorCode, message) {
    easyrtc.showError(errorCode, message);
  };

  window.addEventListener('load', init);
})(window);
