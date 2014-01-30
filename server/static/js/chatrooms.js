(function(window){
  var selfEasyrtcid = "";
  var isConnected = false;
  var waitingForRoomList = true;

  var connect = function() {
    easyrtc.setPeerListener(peerListener);
    easyrtc.setRoomOccupantListener(occupantListener);
    easyrtc.setRoomEntryListener(roomEntryListener);
    easyrtc.setDisconnectListener(function() {
      document.getElementById('rooms').innerHTML = "";
    });

    updatePresence();
    var username = document.getElementById("userNameField").value;
    var password = document.getElementById("credentialField").value;

    if (username) {
      easyrtc.setUsername(username);
    }
    if (password) {
      easyrtc.setCredential({password: password});
    }

    easyrtc.connect("trial.chatrooms", loginSuccess, loginFailure);
  };

  var sanitize = function(content) {
    return content.
      replace(/&/g,'&amp;').
      replace(/</g,'&lt;').
      replace(/>/g,'&gt;').
      replace(/\n/g, '<br />');
  };
  
  var addToConversation = function(who, msgType, content, targeting) {
    content = sanitize(content);
    if( !content ) {
      content = "**no body**";
    }
    
    var message = [];
    message = message.concat("<b>").concat(who).concat("sent");
    if(targeting) {
      if(targeting.targetEasyrtcid) {
        message.push("user=" + targeting.targetEasyrtcid);
      }
      if(targeting.targetRoom) {
        message.push("room=" + targeting.targetRoom);
      }
      if(targeting.targetGroup) {
        message.push("group=" + targeting.targetGroup);
      }
    }
    message = message.concat(":</b>&nbsp;").concat(content).concat("<br />");

    document.getElementById('conversation').innerHTML += message.join(" ");
  };

  var genRoomDivName = function(roomName) {
    return "roomblock_" + roomName;
  };

  var genRoomOccupantName = function(roomName) {
    return "roomOccupant_" + roomName;
  };

  var setCredential = function(event, value) {
    if(event.keyCode == 13) {
      easyrtc.setCredential(value);
    }
  };

  var addRoom = function(roomName, paramString, userAdded) {
    if(!roomName) {
      roomName = document.getElementById("roomToAdd").value;
      paramString = document.getElementById("optRoomParams").value;
    }

    var roomid = genRoomDivName(roomName);
    if(document.getElementById(roomid)) {
      console.error("room", roomName, "already exists");
      return;
    }

    var addRoomButton = function() {
      var roomButtonHolder = document.getElementById("rooms");
      var roomdiv = document.createElement("div");
      roomdiv.id = roomid;
      roomdiv.className = "roomDiv";
      
      var button = document.createElement("button");
      button.onclick = function() {
        sendMessage(null, roomName);
      };

      var label = document.createTextNode(roomName);
      button.appendChild(label);

      roomdiv.appendChild(button);
      roomButtonHolder.appendChild(roomdiv);
      var occupants = document.createElement("div");
      occupants.id = genRoomOccupantName(roomName);
      occupants.className = "roomOccupants";
      roomdiv.appendChild(occupants);
      
      var link = document.createElement("a");
      link.href = "javascript:leaveRoom(" + roomName + ");";
      link.innerText = "leave";
      roomdiv.appendChild(link);
    };
    
    var roomParams = null;
    if(paramString && paramString !== "") {
      try {
        roomParams = JSON.parse(paramString);
      } catch (error) {
        roomParams = null;
        easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "Room Parameters must be an object containing key/value pairs. eg: {\"fruit\":\"banana\",\"color\":\"yellow\"}");
        return;
      }
    }

    if(!isConnected || !userAdded) {
      addRoomButton();
      console.log("adding gui for room", roomName);
    } 
    else {
      console.log("not adding gui for room " + roomName + " because already connected and it's a user action");
    }

    if(userAdded) {
      console.log("calling joinRoom(" + roomName + ") because it was a user action ");
      easyrtc.joinRoom(roomName, roomParams, 
                       function() {},
                       function(errorCode, errorText, roomName) {
                         easyrtc.showError(errorCode,
                                           errorText + ": room name was(" + roomName + ")");
                       });
    }
  }

  var leaveRoom = function(roomName) {
    if(!roomName) {
      console.log("no room was specified to leave");
    }

    easyrtc.leaveRoom(roomName, null);

    var entry = document.getElementById(genRoomDivName(roomName));
    var roomButtonHolder = document.getElementById("rooms");
    roomButtonHolder.removeChild(entry);
  };

  var roomEntryListener = function(entered, roomName) {
    if(entered) {
      console.log("saw add of room", roomName);
      addRoom(roomName, null, false);
    }
    else {
      var room = document.getElementById(genRoomDivName(roomName));
      if(room) {
        document.getElementById('rooms').removeChild(room);
      }
    }
    refreshRoomList();
  };

  var refreshRoomList = function () {
    if(isConnected) {
      easyrtc.getRoomList(addQuickJoinButtons, null);
    }
  };

  var peerListener = function(who, msgType, content, targeting) {
    addToConversation(who, msgType, content, targeting);
  };

  var occupantListener = function(roomName, occupants, isPrimary) {
    if(roomName === null) {
      return;
    }

    var roomid = genRoomOccupantName(roomName);
    var roomdiv = document.getElementById(roomName);
    if(!roomdiv) {
     addRoom(roomName, "", false);
      roomdiv = document.getElementById(roomid);
    }
    else{
      document.getElementById(roomid).innerHTML = "";
    }

    for (var occupant in occupants) {
      var button = document.createElement("button");
      button.onclick = (function(roomName, easyrtcid) {
        return function() {
          sendMessage(easyrtcid, roomName);
        };
      })(roomName, occupant);

      var presenceText = [];
      if(occupant.presence) {
        presenceText.concat("(");
        if(occupant.presence.show) {
          presenceText.concat("show=" + occupant.presence.show);
        }
        if(occupant.presence.status) {
          presenceText.concat("status" + occupant.presence.status);
        }
        presenceText.concat(")");
      }

      var label = document.createTextNode(easyrtc.idToName(occupant) + presenceText);
      button.appendChild(label);
      roomdiv.appendChild(button);
    }
    refreshRoomList();
  };

  var getGroupId = function() {
    return null;
  };

  var sendMessage = function(targetId, targetRoom) {
    var text = document.getElementById("sendMessageText").value;
    if (text.replace(/\s/g, "").length === 0) {
      return;
    }
    
    var target;
    var targetGroup = getGroupId();

    if(targetRoom || targetGroup) {
      target = {};
      if(targetRoom) {
        target.targetRoom = targetRoom;
      }
      if(targetGroup) {
        target.targetGroup = targetGroup;
      }
      if(targetId) {
        target.targetEasyrtcid = targetId;
      }
    }
    else if(targetId) {
      target = targetId;
    }
    else {
      easyrtc.showError("user error", "no destination selected");
      return;
    }

    if(text === "empty") {
      easyrtc.sendPeerMessage(target, "message");
    }
    else {
      easyrtc.sendPeerMessage(target, "message", text, function(msgType, msgData) {
        console.log("message sent successfully.");
      }, function(errorCode, errorText) {
        easyrtc.showError(errorCode, errorText);
      });
    }
    addToConversation("Me", "message", text);
    document.getElementById("sendMessageText").value = "";

  }

  var loginSuccess = function(easyrtcId) {
    selfEasyrtcid = easyrtcId;
    document.getElementById("iam").innerHTML = "I am " + easyrtc.idToName(easyrtcId);

    refreshRoomList();
    document.getElementById("connectButton").disabled = true;
    isConnected = true;
    displayFields();
    document.getElementById("main").className = "connected";
  };

  var displayFields = function() {
    var outstr = "Application fields<div style='margin-left:1em'>";
    outstr += JSON.stringify(easyrtc.getApplicationFields());
    outstr += "</div><br>";

    outstr += "Session fields<div style='margin-left:1em'>";
    outstr += JSON.stringify(easyrtc.getSessionFields());
    outstr += "</div><br>";

    outstr += "Connection fields<div style='margin-left:1em'>";
    outstr += JSON.stringify(easyrtc.getConnectionFields());
    outstr += "</div><br>";

    var roomlist = easyrtc.getRoomsJoined();
    for (var roomname in roomlist) {
      var roomfields = easyrtc.getRoomFields(roomname);
      if (roomfields != null) {
        outstr += "Room " + roomname + " fields<div style='margin-left:1em'>";
        outstr += JSON.stringify(roomfields);
        outstr += "</div><br>";
      }
    }
    document.getElementById('fields').innerHTML = outstr;
  };

  var loginFailure = function(errorCode, message) {
    easyrtc.showError("LOGIN-FAILURE", message);
    document.getElementById('connectButton').disabled = false;
    document.getElementById('rooms').innerHTML = "";
  };

  
  var currentShowState = 'chat';
  var currentShowText = '';

  var setPresence = function(value) {
    currentShowState = value;
    updatePresence();
  };

  var updatePresenceStatus = function(value) {
    currentShowText = value;
    updatePresence();
  };

  var updatePresence = function() {
    easyrtc.updatePresence(currentShowState, currentShowText);
  };


  var addApiField = function() {
    var roomName = document.getElementById("apiroomname").value;
    var fieldname = document.getElementById("apifieldname").value;
    var fieldvaluetext = document.getElementById("apifieldvalue").value;
    var fieldvalue;
    if(fieldvaluetext.indexOf("{") >= 0) {
      fieldvalue = JSON.parse(fieldvaluetext);
    }
    else {
      fieldvalue = fieldvaluetext;
    }
    easyrtc.setRoomApiField(roomName, fieldname, fieldvalue);
  };


  var getIdsOfName = function() {
    var name = document.getElementById("targetName").value;
    var ids = easyrtc.usernameToIds(name);
    document.getElementById("foundIds").innerHTML = JSON.stringify(ids);
  };

  var addQuickJoinButtons = function(roomList) {
    var quickJoinBlock = document.getElementById("quickJoinBlock");
    var n = quickJoinBlock.childNodes.length;
    for (var i = n - 1; i >= 0; i--) {
      quickJoinBlock.removeChild(quickJoinBlock.childNodes[i]);
    }
    function addQuickJoinButton(roomname, numberClients) {
      var checkid = "roomblock_" + roomname;
      if (document.getElementById(checkid)) {
        return; // already present so don't add again
      }
      var id = "quickjoin_" + roomname;
      var div = document.createElement("div");
      div.id = id;
      div.className = "quickJoin";
      var parmsField = document.getElementById("optRoomParams");
      var button = document.createElement("button");
      button.onclick = function() {
        addRoom(roomname, parmsField.value, true);
        refreshRoomList();
      };
      button.appendChild(document.createTextNode("Join " + roomname + "(" + numberClients + ")"));
      div.appendChild(button);
      quickJoinBlock.appendChild(div);

    }
    if( !roomList["room1"]) {
      roomList["room1"] = { numberClients:0};
    }
    if( !roomList["room2"]) {
      roomList["room2"] = { numberClients:0};
    }
    if( !roomList["room3"]) {
      roomList["room3"] = { numberClients:0};
    }
    for (var roomName in roomList) {
      addQuickJoinButton(roomName, roomList[roomName].numberClients);
    }
  }

  var init = function() {
    window.connect = connect;
    window.setPresence = setPresence;
    window.updatePresenceStatus = updatePresenceStatus;
    window.addApiField = addApiField;
    window.getIdsOfName = getIdsOfName;
    window.addRoom = addRoom;
  };

  window.addEventListener('load', init);
})(window);
