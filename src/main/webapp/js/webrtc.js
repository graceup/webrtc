// webrtc 视频点对点主要js

loading();

/**
 * 动态改变视频窗口大小
 */
function bodyOnResize() {
	var bodyHeight = document.body.clientHeight;
	document.getElementById("card").style.height = bodyHeight + "px";
}

/**
 * 初始化
 */
function initialize() {
	bodyOnResize();

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
	var element = document.getElementById("container");
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
 *
 * @param {Object} name
 * @return {TypeName}
 */
function getQueryString(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
	var result = window.location.search.substr(1).match(reg);
	if (result != null) {
		return decodeURIComponent(result[2]);
	}
	return null;
}

/**
 * 生成随机串
 *
 * @return {TypeName}
 */
function getToken() {
	return Math.round(Math.random() * 9999999999) + 9999999999;
}

var userName = getToken();
var roomId = getQueryString("roomId");
var localStream = null;
var peerConnection = null;
var remoteDescriptionSet = false;
var pendingIceCandidates = [];
var roomBusy = false;
var mediaReady = false;

// stun和turn服务器，如果搭建了自己的stun和turn服务器，请修改此处。
var iceServer = {
	"iceServers": [
		{
			"urls": "turn:turn.igustudio.com:3478",
			"username": "helloword",
			"credential": "helloword"
		},
		{
			"urls": "stun:39.108.210.140:3478"
		}
	]
};

if (!roomId) {
	showTip("缺少 roomId 参数，无法建立通话");
	throw new Error("missing roomId");
}

var socket = new WebSocket(webrtcWebSocketUrl + "/" + encodeURIComponent(roomId));

socket.onopen = function() {
	console.log("websocket opened.");
	startLocalMedia();
};

socket.onmessage = function(event) {
	handleSignal(JSON.parse(event.data));
};

socket.onclose = function() {
	if (roomBusy) {
		stopLocalMedia();
		return;
	}
	showTip("信令连接已断开");
	closePeerConnection();
	stopLocalMedia();
};

socket.onerror = function(error) {
	console.log("websocket error: " + error);
	showTip("信令连接异常");
};

window.onbeforeunload = function() {
	sendHangup();
	sendSignal({
		"event": "_leave"
	});
	stopLocalMedia();
};

async function startLocalMedia() {
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		showTip("当前浏览器不支持 mediaDevices.getUserMedia");
		return;
	}

	try {
		localStream = await navigator.mediaDevices.getUserMedia({
			"audio": true,
			"video": true
		});

		var miniVideo = document.getElementById("miniVideo");
		miniVideo.srcObject = localStream;
		miniVideo.muted = true;

		createPeerConnection();
		mediaReady = true;
		showTip("正在等待连接，请等待...");
	} catch (error) {
		var msgTip = "获取不到媒体流，请确认麦克风或者视频设备";
		alert(msgTip);
		showTip(msgTip);
		mediaReady = false;
		console.log("getUserMedia error: " + error);
	}
}

function createPeerConnection() {
	if (peerConnection) {
		return peerConnection;
	}

	peerConnection = new RTCPeerConnection(iceServer);

	peerConnection.onicecandidate = function(event) {
		if (event.candidate) {
			sendSignal({
				"event": "_ice_candidate",
				"data": {
					"candidate": event.candidate
				}
			});
		}
	};

	peerConnection.ontrack = function(event) {
		unLoading();
		document.getElementById("remoteVideo").srcObject = event.streams[0];
	};

	peerConnection.onconnectionstatechange = function() {
		var connection = this;
		if (connection.connectionState === "disconnected"
				|| connection.connectionState === "failed"
				|| connection.connectionState === "closed") {
			showTip("通话已断开");
		}
	};

	if (localStream) {
		localStream.getTracks().forEach(function(track) {
			peerConnection.addTrack(track, localStream);
		});
	}

	return peerConnection;
}

async function handleSignal(message) {
	if (message.userName === userName) {
		return;
	}

	try {
		if (message.event === "_join") {
			showTip("正在等待连接，请等待...");
		} else if (message.event === "_ready") {
			await waitForPeerConnection();
			if (!mediaReady) {
				return;
			}
			if (message.initiator) {
				await createAndSendOffer();
			}
		} else if (message.event === "_offer") {
			await waitForPeerConnection();
			await handleOffer(message.data.sdp);
		} else if (message.event === "_answer") {
			await waitForPeerConnection();
			await handleAnswer(message.data.sdp);
		} else if (message.event === "_ice_candidate") {
			await handleIceCandidate(message.data.candidate);
		} else if (message.event === "_leave" || message.event === "_hangup") {
			handleRemoteLeave();
		} else if (message.event === "_busy") {
			roomBusy = true;
			showTip("房间人数已满，请稍后再试");
			closePeerConnection();
			stopLocalMedia();
		}
	} catch (error) {
		console.log("handle signal error: " + error);
	}
}

async function createAndSendOffer() {
	if (peerConnection.signalingState !== "stable") {
		console.log("ignore create offer in state: " + peerConnection.signalingState);
		return;
	}

	var offer = await peerConnection.createOffer();
	await peerConnection.setLocalDescription(offer);
	sendSignal({
		"event": "_offer",
		"data": {
			"sdp": peerConnection.localDescription
		}
	});
}

async function handleOffer(sdp) {
	if (peerConnection.signalingState !== "stable") {
		console.log("ignore offer in state: " + peerConnection.signalingState);
		return;
	}

	await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
	remoteDescriptionSet = true;
	await flushPendingIceCandidates();

	var answer = await peerConnection.createAnswer();
	await peerConnection.setLocalDescription(answer);
	sendSignal({
		"event": "_answer",
		"data": {
			"sdp": peerConnection.localDescription
		}
	});
}

async function handleAnswer(sdp) {
	if (peerConnection.signalingState !== "have-local-offer") {
		console.log("ignore answer in state: " + peerConnection.signalingState);
		return;
	}

	await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
	remoteDescriptionSet = true;
	await flushPendingIceCandidates();
}

async function handleIceCandidate(candidate) {
	if (!candidate) {
		return;
	}

	await waitForPeerConnection();

	if (!remoteDescriptionSet) {
		pendingIceCandidates.push(candidate);
		return;
	}

	await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

async function flushPendingIceCandidates() {
	while (pendingIceCandidates.length > 0) {
		var candidate = pendingIceCandidates.shift();
		await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
	}
}

function handleRemoteLeave() {
	showTip("对方已离开，正在等待重新连接...");
	closePeerConnection();
	if (localStream) {
		createPeerConnection();
	}
}

function closePeerConnection() {
	if (peerConnection) {
		peerConnection.close();
		peerConnection = null;
	}
	remoteDescriptionSet = false;
	pendingIceCandidates = [];
	document.getElementById("remoteVideo").srcObject = null;
}

function stopLocalMedia() {
	if (localStream) {
		localStream.getTracks().forEach(function(track) {
			track.stop();
		});
		localStream = null;
	}
	mediaReady = false;
	document.getElementById("miniVideo").srcObject = null;
}

function sendHangup() {
	sendSignal({
		"event": "_hangup"
	});
}

function sendSignal(message) {
	if (socket.readyState !== WebSocket.OPEN) {
		return;
	}

	message.userName = userName;
	socket.send(JSON.stringify(message));
}

function waitForPeerConnection() {
	return new Promise(function(resolve, reject) {
		if (peerConnection) {
			resolve(peerConnection);
			return;
		}

		var waited = 0;
		var timer = setInterval(function() {
			if (peerConnection) {
				clearInterval(timer);
				resolve(peerConnection);
				return;
			}
			waited += 50;
			if (waited >= 5000) {
				clearInterval(timer);
				reject(new Error("wait peer connection timeout"));
			}
		}, 50);
	});
}

function showTip(message) {
	$("#tips-content").text(message);
}

/**
 * 加载提示款
 *
 * @memberOf {TypeName}
 */
function loading() {
	$("#my-modal-loading").modal({
		relatedElement: this,
		cancelable: false
	});
}

/**
 * 关闭加载提示款
 *
 * @memberOf {TypeName}
 */
function unLoading() {
	$("#my-modal-loading").modal("close");
}
