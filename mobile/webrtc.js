$(document).ready(function() {   

document.body.classList.add('default');

var mobile;
if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
	var mobile = true;
} else {
	var mobile = false;
}

destination = getSearchVariable("destination");

navigator.geolocation.getCurrentPosition(setLocation);

var latitude;
var longitude;

function setLocation(position) {
	latitude = position.coords.latitude;
	longitude = position.coords.longitude;
}

function getSearchVariable(variable) {
       var search = window.location.search.substring(1);
       var vars = search.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

function getCookie(name) {
	var pattern = RegExp(name + "=.[^;]*");
	matched = document.cookie.match(pattern);
	if(matched) {
		var cookie = matched[0];
		return cookie;
	}
	return false
}

var cookie = getCookie("userID");

function makeid() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < 12; i++)
	text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

if (cookie == "") {
	var userID = makeid();
	timestamp = new Date();
	var expires = 1825;
        timestamp.setDate(timestamp.getDate() + expires);
	document.cookie = ('userID=' + userID + '; expires=' + timestamp.toUTCString());
} else {
	value = cookie.split('=')[1]
	userID = value;
}	

JsSIP.debug.enable('JsSIP:*');

// Config settings
var socket = new JsSIP.WebSocketInterface('wss://troc.staging.vocinity.com:443');
var configuration = {
	sockets  : [ socket ],
	uri      : ('sip:2000020@troc.vocinity.com'),
	password : 'C-3PO#77',
	register : true
};

var sipStack = new JsSIP.UA(configuration);
var MediaStream = window.MediaStream;	
var audio = document.createElement('audio');
var video = document.createElement('video');

// sipStack callbacks 
sipStack.on('connected', function(e) {
        	urlCall(destination);
		$("#connected").fadeIn(500);
        });
sipStack.on('disconnected', function(e) {
		$("#connected").hide();
        });
sipStack.on('newSession', function(e) {
        if (e.data.session.direction == "incoming") {
        	incommingCall(e);
        	}
	});
sipStack.on('newMessage', function(e) {
	if (e.message.direction === 'outgoing') {
		console.log('Sending Message!');
	}
	else if (e.message.direction === 'incoming') {
		console.log('Received Message Dude!');
		let msg = JSON.parse(e.request.body);
		let url = msg.type;
		e.message.accept();
		$("#remoteUrl").show();
		remoteUrl.setAttribute('src', url);
		remoteUrl.play();
		document.getElementById('remoteUrl').addEventListener('ended',hideRemoteUrl,false);

    		function hideRemoteUrl(e) {
        		$("#remoteUrl").hide();
    		}
	}
	});
sipStack.on('registered', function(e) {
        });
sipStack.on('registrationFailed', function(e) {
	});

sipStack.start();

sipStack.on('newRTCSession', function(data){
	session = data.session;
        session.connection.addEventListener('track', function (e) {
		console.log(e);
		if (e.track.kind === "audio") {
			audio.srcObject = e.streams[0];
			audio.play();
		}
        });

	if (session.direction === "outgoing") {
    		session.on('confirmed', (e) => {
			var remoteVideo = $('#remoteVideo')[0];
				var stream = new MediaStream();
				remoteVideo.srcObject = session.connection.getReceivers().forEach(function(receiver) {
					console.log(receiver);
					if (receiver.track.kind === "video") {
						stream.addTrack(receiver.track);
						remoteVideo.play();
					}
				});
				remoteVideo.srcObject = stream;
				if (mobile) {
        				$('#remoteVideo').fadeIn(100);
				} else {
        				$('#remoteVideo').fadeIn(100);
				}
			});
		}
});

// URL call
function urlCall(destination) {
	// Register callbacks to desired call events
	var eventHandlers = {
		'connecting': function(e) {
	},
		'progress': function(e) {
	},
		'failed': function(e) {
		endCall();
	},
		'ended': function(e) {
		endCall();
	},
		'confirmed': function(e) {
	}
	};

	var options = {
		'eventHandlers'		: eventHandlers,
		'extraHeaders'		: [ 'X-Location: ' + latitude + ',' + longitude ],
		'mediaConstraints'	: { 'audio': true, 'video': true },
	};

	$("#hangup").fadeIn(1000);

        session = sipStack.call(destination, options);
}

$('#hangup').click(function() {
	try {
	        session.terminate();
	} catch {
	}
	remoteUrl.pause();
	$("#remoteUrl").fadeOut(100);	
        endCall();
});

$('#mic').click(function() {
	$("#mic").fadeOut(100);
	$("#mic_off").fadeIn(100);
	toggleMute();
});

$('#mic_off').click(function() {
	$("#mic").fadeIn(100);
	$("#mic_off").fadeOut(100);
	toggleMute();
});

$('#videocam').click(function() {
	$("#videocam").fadeOut(100);
	$("#videocam_off").fadeIn(100);
});

$('#videocam_off').click(function() {
	$("#videocam").fadeIn(100);
	$("#videocam_off").fadeOut(100);
});

var session;

function endCall() {
	$("#remoteVideo").fadeOut(100);
	$("#connected").fadeOut(100);
	//window.location.assign("https://www.vocinity.com");
}

function terminateSession() {    
	try {    
		session.terminate();    
	}                                  
	catch(error) {    
		console.error(error);    
	}                 
}                                                                                     

function toggleMute() {
	if(session.isMuted().audio) {
        	session.unmute({audio: true});
	} else {
        	session.mute({audio: true});   
	}
}

$(window).on("beforeunload", function() {    
	terminateSession();                                                      
});    
                  
$(window).on("unload", function() {    
	terminateSession();    
}); 

});
