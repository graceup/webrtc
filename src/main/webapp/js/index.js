//websocket 多人文字对话主要js

/**
 * 用户名称
 */
var userName = '';
/**
 *WebSocket连接地址 
 */
var websocketUrl;

/**
 * 是否主动关闭websocket
 */
var autoClose=false;

/**
 * 初始化
 */
(function($) {
	$('#send').on('click', function() {
		sendContent();
	});

	getUserName();

})(window.Zepto);

/**
 * 添加用户到在线用户列表
 */
function apendUser(userName) {
	if (document.getElementById(userElementId(userName))) {
		return;
	}

	var item = document.createElement('li');
	item.id = userElementId(userName);

	var container = document.createElement('div');
	container.className = 'am-cf';

	var link = document.createElement('a');
	link.appendChild(document.createTextNode('   ' + userName));

	var button = document.createElement('button');
	button.type = 'button';
	button.className = 'am-btn am-btn-success am-btn-xs am-fr';
	button.appendChild(document.createTextNode('通话'));
	button.addEventListener('click', function() {
		connectTo(userName);
	});

	container.appendChild(link);
	container.appendChild(button);
	item.appendChild(container);
	$('#user-list').append(item);
}
/**
 * 生成随机串
 * @return {TypeName} 
 */
function getToken() {
	return Math.round(Math.random() * 9999999999) + 9999999999;
}

/**
 * 打开新窗口
 * 
 * @param owurl
 */
function openNewWindow(owurl) {
	var tmp = window.open("about:blank", "", "")
	tmp.top.location = owurl;
}

/**
 * 连接到一位在线用户
 * @param userName
 */
function connectTo(oneOnlineUser) {
	//alert(oneOnlineUser);
	var roomId = String(getToken());
	webSocket.send(JSON.stringify( {
		"type" : "connect",
		"roomId" : roomId,
		"fromUser" : userName,
		"userName" : oneOnlineUser
	}));

	openNewWindow("webrtc.html?roomId=" + encodeURIComponent(roomId));

}

/**
 * 从在线用户列表中移除用户
 */
function removeUser(liId) {
	var item = document.getElementById(userElementId(liId));
	if (item && item.parentNode) {
		item.parentNode.removeChild(item);
	}
}

var showChatDetail = document.getElementById("show-chat")

/**
 * 发送聊天内容
 */
function sendContent() {

	var contentVal = $('#content').val().trim();
	if (contentVal == null || contentVal == "") {
		showTips("请输入内容");
		return;
	}
	var timeString =new Date().Format("yyyy-MM-dd hh:mm:ss");
	//发送聊天内容
	webSocket.send(JSON.stringify( {
		"type" : "message",
		"contentVal" : contentVal
	}));
	//清空输入框
	editor1.html('');
//	$('#content').val('');

	
	
}

/**
 * 在聊天内容框里增加内容
 * 
 * @param userName 用户名称
 * @param chatVal  聊天内容
 * @param timeString  时间
 */
function appendChat(userName, chatVal, timeString) {
	var item = document.createElement('div');
	var userBadge = document.createElement('span');
	userBadge.className = 'am-badge am-badge-secondary am-radius';
	userBadge.appendChild(document.createTextNode(userName));

	var messageText = document.createTextNode('说:' + chatVal);

	var timeBadge = document.createElement('span');
	timeBadge.className = 'am-badge am-radius';
	timeBadge.appendChild(document.createTextNode('------------' + timeString));

	item.appendChild(userBadge);
	item.appendChild(messageText);
	item.appendChild(timeBadge);
	item.appendChild(document.createElement('hr'));
	$('#show-chat').append(item);

	//定位到聊天内容的底部
	showChatDetail.scrollTop = 100000;

}

/**
 * 美化提示框，类似alert
 * 
 * @param tipContent 提示内容
 */
function showTips(tipContent) {
	$('#tip-content').text(tipContent);
	$('#my-tip').modal( {
		relatedElement : this
	});
	// 1秒后关闭 Modal窗口
	setTimeout(function() {
		$("#my-tip").modal("close");
	}, 1000);
}






/**
 * 获取用户名
 * @memberOf {TypeName} 
 */
function getUserName() {

	$('#my-prompt').modal( {
		relatedElement : this,
		cancelable : false,
		onConfirm : function(data) {
		data = data.trim();
		if (data == null || data == "") {
			//如果输入内容为空，延迟300毫秒再次弹出输入框
			setTimeout(getUserName, 300);
		} else {
			userName = data;
			websocketUrl = chatWebSocketUrl + "?user=" + encodeURIComponent(userName);
			autoClose = false;
			startWebSocket();
		}
	}
	});

}

/**
 * 验证是否为中英文
 * 
 * @param str
 */
function isChineseOrEnglish(str) {
	var reg = /^\w+$/;
	return reg.test(str);
}

var webSocket = null;
/**
 * websocket连接
 */
function startWebSocket() {

	if ('WebSocket' in window) {
		try {
			webSocket = new WebSocket(websocketUrl);
		} catch (e) {
			console.log(e);
		}
	} else if ('MozWebSocket' in window) {
		webSocket = new MozWebSocket(websocketUrl);
		} else {
			console.log("not support");
		}

		if (!webSocket) {
			showTips("当前浏览器不支持 WebSocket");
			return;
		}

	webSocket.onmessage = function(returnMessage) {//消息接收
		console.log(returnMessage);
		var message = JSON.parse(returnMessage.data);
		console.log(message.type);
		if (message.type == 'message') {//接收用户发送的消息
			var timeString = new Date().Format("yyyy-MM-dd hh:mm:ss");
			appendChat(message.user, message.msg, timeString);
		} else if (message.type == 'user_is_contain') {//用户名已存在
			console.log("用户名已存在");
			autoClose=true;
				webSocket.close();
				$('#prompt-tips').text("用户名已存在");
				setTimeout(getUserName, 300);

			} else if (message.type == 'get_online_user') {//获取在线用户列表
				var users = message.list;
				$('#user-list').empty();
				for ( var i = 0; i < users.length; i++) {
					if (users[i] == userName) {
						appendCurrentUser(userName);
					} else {
						apendUser(users[i]);
					}
			}

		} else if (message.type == 'user_join') {//用户上线
			var user = message.user;
			apendUser(user);

		} else if (message.type == 'user_leave') {//用户下线
			var user = message.user;
			removeUser(user);
			} else if (message.type == 'connect') {//用户通话请求
				var connectName = document.getElementById('connect-name');
				connectName.innerHTML = '';
				var fromUserBadge = document.createElement('span');
				fromUserBadge.className = 'am-badge am-badge-secondary am-radius';
				fromUserBadge.appendChild(document.createTextNode(message.fromUser));
				connectName.appendChild(fromUserBadge);
				connectName.appendChild(document.createTextNode('正在请求与您视频通话'));

				$('#my-connect').modal( {
					relatedElement : this,
					cancelable : true,
					onConfirm : function(data) {
						openNewWindow("webrtc.html?roomId=" + encodeURIComponent(message.roomId));
					}
				});

		}
		};

		webSocket.onclose = function(evt) {
		console.log("close!");
		if(!autoClose){
			alert("连接已断开，请重新登录");
			window.location.reload();
		}
	};

	webSocket.onopen = function(evt) {
		console.log("open");
	};
}

function appendCurrentUser(currentUserName) {
	if (document.getElementById(userElementId(currentUserName))) {
		return;
	}

	var item = document.createElement('li');
	item.id = userElementId(currentUserName);

	var container = document.createElement('div');
	container.className = 'am-cf';

	var link = document.createElement('a');
	link.appendChild(document.createTextNode('   ' + currentUserName));

	container.appendChild(link);
	container.appendChild(document.createTextNode('(me)'));
	item.appendChild(container);
	$('#user-list').append(item);
}

function userElementId(value) {
	return 'user-' + encodeURIComponent(value).replace(/[^a-zA-Z0-9_-]/g, '_');
}
