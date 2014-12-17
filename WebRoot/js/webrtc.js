//显示加载框
loading();

/**
 * 动态改变视频窗口大小
 */
function bodyOnResize() {
	var bodyHeight = document.body.clientHeight;
	var containerHeiht = window.document.getElementById('container').offsetHeight;
	document.getElementById("card").style.height = bodyHeight + "px";
}
/**
 *初始化
 */
function initialize() {
	
	bodyOnResize();

	var card = document.getElementById("card");
	var miniVideo = document.getElementById("miniVideo");
	var remoteVideo = document.getElementById("remoteVideo");

	remoteVideo.style.opacity = 1;
	miniVideo.style.opacity = 1;
}

setTimeout(initialize, 1);
/**
 * 进入全屏
 */
function enterFullScreen() {
	var element = document.getElementById('container');
	if (element.requestFullScreen) {
		element.requestFullScreen();
	} else if (element.webkitRequestFullScreen) {
		element.webkitRequestFullScreen();
	} else if (element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	}
}


/**
 * 获取url参数
 * @param {Object} name
 * @return {TypeName} 
 */
function getQueryString(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
	var r = window.location.search.substr(1).match(reg);
	if (r != null)
		return unescape(r[2]);
	return null;
}

/**
 *WebRTC兼容浏览器
 */
var PeerConnection = (window.PeerConnection || window.webkitPeerConnection00
		|| window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
var URL = (window.URL || window.webkitURL || window.msURL || window.oURL);
var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia
		|| navigator.mozGetUserMedia || navigator.msGetUserMedia);
var RTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);
var RTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription);

navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia
		|| navigator.mozGetUserMedia || navigator.msGetUserMedia);

/**
 * 生成随机串
 * @return {TypeName} 
 */
function getToken() {
	return Math.round(Math.random() * 9999999999) + 9999999999;
}
//用随机串作为用户名称
var userName = getToken();

// 与信令服务器的WebSocket连接
var socket = new WebSocket(webrtcWebSocketUrl + "?roomId="
		+ getQueryString("roomId"));

// stun和turn服务器
var iceServer = {
	"iceServers" : [ {
		"url" : "stun:stun.l.google.com:19302"
	}, {
		"url" : "turn:numb.viagenie.ca",
		"username" : "webrtc@live.com",
		"credential" : "muazkh"
	} ]
};

// 创建PeerConnection实例 (参数为null则没有iceserver，即使没有stunserver和turnserver，仍可在局域网下通讯)
var answerPeerConnection = new PeerConnection(iceServer);

var offerPeerConnection = new PeerConnection(iceServer);

// 发送ICE候选到其他客户端
answerPeerConnection.onicecandidate = function(event) {
	if (event.candidate !== null) {
		socket.send(JSON.stringify( {
			"userName" : userName,
			"type" : "_ice_answer",
			"event" : "_ice_candidate",
			"data" : {
				"candidate" : event.candidate
			}
		}));
	}
};

offerPeerConnection.onicecandidate = function(event) {
	if (event.candidate !== null) {
		socket.send(JSON.stringify( {
			"userName" : userName,
			"type" : "_ice_offer",
			"event" : "_ice_candidate",
			"data" : {
				"candidate" : event.candidate
			}
		}));
	}
};

// 如果检测到媒体流连接到本地，将其绑定到一个video标签上输出
answerPeerConnection.onaddstream = function(event) {
	unLoading();
	document.getElementById('remoteVideo').src = URL
			.createObjectURL(event.stream);
};

offerPeerConnection.onaddstream = function(event) {
	unLoading();
	document.getElementById('remoteVideo').src = URL
			.createObjectURL(event.stream);
};

// 发送answer的函数，发送本地session描述
var sendAnswerFn = function(desc) {
	answerPeerConnection.setLocalDescription(desc);
	socket.send(JSON.stringify( {
		"userName" : userName,
		"event" : "_answer",
		"data" : {
			"sdp" : desc
		}
	}));
};

// 发送offer的函数，发送本地session描述
var sendOfferFn = function(desc) {
	offerPeerConnection.setLocalDescription(desc);
	socket.send(JSON.stringify( {
		"userName" : userName,
		"event" : "_offer",
		"data" : {
			"sdp" : desc
		}
	}));
};

// 获取本地音频和视频流
navigator.getMedia( {
	"audio" : true,
	"video" : true
}, function(stream) {

	//绑定本地媒体流到video标签用于输出
		document.getElementById('miniVideo').src = URL.createObjectURL(stream);

		//静音处理
		document.getElementById('miniVideo').muted = true;

		//向PeerConnection中加入需要发送的流
		answerPeerConnection.addStream(stream);
		offerPeerConnection.addStream(stream);

		$("#tips-content").html("正在等待连接，请等待...");

		//发送一个offer信令,如果有回应，则作为发起方；否则，是应答方
		offerPeerConnection.createOffer(sendOfferFn, function(error) {
			console.log('Failure callback: ' + error);
		});

	}, function(error) {
		//处理媒体流创建失败错误
		console.log('getUserMedia error: ' + error);
	});

//处理到来的信令
socket.onmessage = function(event) {
	var json = JSON.parse(event.data);
	//如果是一个ICE的候选，则将其加入到PeerConnection中，否则设定对方的session描述为传递过来的描述
	if (json.event == "_ice_candidate") {
		if (json.userName != userName) {
			if (json.type == "_ice_offer") {
				answerPeerConnection.addIceCandidate(new RTCIceCandidate(
						json.data.candidate));
			}
			if (json.type == "_ice_answer") {
				offerPeerConnection.addIceCandidate(new RTCIceCandidate(
						json.data.candidate));
			}
		}
	} else if (json.message === "websocket open!") {
		console.log("open!");
	} else {
		if (json.userName != userName) {
			answerPeerConnection
					.setRemoteDescription(new RTCSessionDescription(
							json.data.sdp));
			offerPeerConnection.setRemoteDescription(new RTCSessionDescription(
					json.data.sdp));
			// 如果是一个offer，那么需要回复一个answer
			if (json.event === "_offer") {
				answerPeerConnection.createAnswer(sendAnswerFn,
						function(error) {
							console.log('Failure callback: ' + error);
						});
			}
		}

	}
};

/**
 * 加载提示款
 * @memberOf {TypeName} 
 */
function loading() {

	$('#my-modal-loading').modal( {
		relatedElement : this,
		cancelable : false
	});

}

/**
 * 关闭加载提示款
 * @memberOf {TypeName} 
 */
function unLoading() {
	$('#my-modal-loading').modal("close")
}
