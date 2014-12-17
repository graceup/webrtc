/**
 * 用户名称
 */
var userName = '';
/**
 *WebSocket连接地址 
 */
var websocketUrl;

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
	var appendHtml = '<li id="'
			+ userName
			+ '">'
			+ '<div class="am-cf">'
			+ '<a >&nbsp;&nbsp;&nbsp;'
			+ userName
			+ '</a>'
			+ '<button class="am-btn am-btn-success am-btn-xs am-fr" onclick="connectTo(\''
			+ userName + '\')">通话</button>' + '</div>' + '</li>';
	$('#user-list').append(appendHtml);
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
	var roomId = getToken();
	webSocket.send(JSON.stringify( {
		"type" : "connect",
		"roomId" : roomId,
		"userName" : oneOnlineUser
	}));

	openNewWindow("webrtc.html?roomId=" + roomId);

}

/**
 * 从在线用户列表中移除用户
 */
function removeUser(liId) {
	$('#' + liId + '').remove();
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
	var timeString = formatDate(new Date(), "yyyy-MM-dd hh:mm:ss")
	//发送聊天内容
	webSocket.send(JSON.stringify( {
		"type" : "message",
		"contentVal" : contentVal
	}));
	//清空输入框
	$('#content').val('');

}

/**
 * 在聊天内容框里增加内容
 * 
 * @param userName 用户名称
 * @param chatVal  聊天内容
 * @param timeString  时间
 */
function appendChat(userName, chatVal, timeString) {
	var appendHtml = '<div>'
			+ '<span class="am-badge am-badge-secondary am-radius">' + userName
			+ '</span>说:' + chatVal
			+ '<span class="am-badge am-radius">------------' + timeString
			+ '</span>' + '<hr></div>';

	$('#show-chat').append(appendHtml);

	//定位到聊天内容的底部
	showChatDetail.scrollTop = 100000;

}

/**
 * 美化提示框，类似alert
 * 
 * @param tipContent 提示内容
 */
function showTips(tipContent) {
	$('#tip-content').html(tipContent);
	$('#my-tip').modal( {
		relatedElement : this
	});
	// 1秒后关闭 Modal窗口
	setTimeout('$("#my-tip").modal("close")', 1000);
}

/**
 * 格式化CST日期的字串
 */
function formatDate(date, format) {
	var paddNum = function(num) {
		num += "";
		return num.replace(/^(\d)$/, "0$1");
	}
	// 指定格式字符
	var cfg = {
		yyyy : date.getFullYear() // 年 : 4位
		,
		yy : date.getFullYear().toString().substring(2)// 年 : 2位
		,
		M : date.getMonth() + 1 // 月 : 如果1位的时候不补0
		,
		MM : paddNum(date.getMonth() + 1) // 月 : 如果1位的时候补0
		,
		d : date.getDate() // 日 : 如果1位的时候不补0
		,
		dd : paddNum(date.getDate())// 日 : 如果1位的时候补0
		,
		hh : date.getHours() // 时
		,
		mm : date.getMinutes() // 分
		,
		ss : date.getSeconds()
	// 秒
	}
	format || (format = "yyyy-MM-dd hh:mm:ss");
	return format.replace(/([a-z])(\1)*/ig, function(m) {
		return cfg[m];
	});
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
		setTimeout('getUserName()', 300);
	} else {
		userName = data;
		websocketUrl = chatWebSocketUrl + "?user=" + userName;
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

	webSocket.onmessage = function(returnMessage) {//消息接收
		console.log(returnMessage);
		var message = JSON.parse(returnMessage.data);
		console.log(message.type);
		if (message.type == 'message') {//接收用户发送的消息
			var timeString = formatDate(new Date(returnMessage.timeStamp),
					"yyyy-MM-dd hh:mm:ss")
			appendChat(message.user, message.msg, timeString);
		} else if (message.type == 'user_is_contain') {//用户名已存在
			console.log("用户名已存在");
			webSocket.close();
			$('#prompt-tips').html("用户名已存在");
			setTimeout('getUserName()', 300);

		} else if (message.type == 'get_online_user') {//获取在线用户列表
			var users = message.list;
			for ( var i = 0; i < users.length; i++) {
				if (users[i] == userName) {
					var appendHtml = '<li id="' + userName + '">'
							+ '<div class="am-cf">' + '<a >&nbsp;&nbsp;&nbsp;'
							+ userName + '</a>(me)' + '</div>' + '</li>';
					$('#user-list').append(appendHtml);
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
			$('#connect-name')
					.html(
							'<span class="am-badge am-badge-secondary am-radius">' + message.userName + '</span>正在请求与您视频通话');

			$('#my-connect').modal( {
				relatedElement : this,
				cancelable : true,
				onConfirm : function(data) {
					openNewWindow("webrtc.html?roomId=" + message.roomId);
				}
			});

		}
	};

	webSocket.onclose = function(evt) {
		console.log("close!");
	};

	webSocket.onopen = function(evt) {
		console.log("open");
	};
}
