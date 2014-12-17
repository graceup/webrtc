package com.graceup.webrtc.control;

import java.util.Set;

import javax.servlet.http.HttpServletRequest;

import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;

import com.graceup.webrtc.pool.UserWebSocketMessageInboundPool;
import com.graceup.webrtc.websocket.UserContainMessageInbound;
import com.graceup.webrtc.websocket.UserMessageInbound;
/**
 * 接收ws://协议的请求
 * 
 * 处理用户上线、下线、发送文本数据和发起视频请求
 * 
 * @author graceup<br/>
 * @version 1.0<br/>
 * @email: charmails@163.com<br/>
 */
public class OnlineUserControl extends WebSocketServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 5772759773980650853L;

	/**
	 * 初始化自定义的WebSocket连接对象
	 * 
	 * 
	 */
	@Override
	protected StreamInbound createWebSocketInbound(String arg0,
			HttpServletRequest request) {
		String user = (String) request.getParameter("user");
		
		Set<String> onlneUser=UserWebSocketMessageInboundPool.getOnlineUser();
		/**
		 * 用户名已存在
		 */
		if(onlneUser.contains(user)){
			System.out.println("用户名:"+user+",已存在");
			return new UserContainMessageInbound(user);
		}
		

		return new UserMessageInbound(user);
	}
}
