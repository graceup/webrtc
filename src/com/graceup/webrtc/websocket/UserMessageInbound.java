package com.graceup.webrtc.websocket;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;

import net.sf.json.JSONObject;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.WsOutbound;

import com.graceup.webrtc.pool.UserWebSocketMessageInboundPool;
/**
 * 建立连接
 * 
 * @author graceup<br/>
 * @version 1.0<br/>
 * @email: charmails@163.com<br/>
 */
public class UserMessageInbound extends MessageInbound {

	/**
	 * 当前连接的用户名称
	 */
	private final String user;

	public UserMessageInbound(String user) {
		this.user = user;
	}

	public String getUser() {
		return this.user;
	}

	/**
	 * 建立连接的触发的事件
	 * 
	 * 
	 */
	@Override
	protected void onOpen(WsOutbound outbound) {
		
		JSONObject result = new JSONObject();
//		Set<String> onlneUser=WebSocketMessageInboundPool.getOnlineUser();
//		if(onlneUser.contains(this.user)){
//			
//			result = new JSONObject();
//			result.element("type", "get_online_user");
//			result.element("list", "isContain");
//			WebSocketMessageInboundPool.sendMessageToUser(this.user, result.toString());//向当前连接发送用户已存在，等边不成功
//			
//			return;
//		}
		
		
		// 触发连接事件，在连接池中添加连接
		result.element("type", "user_join");
		result.element("user", this.user);
		UserWebSocketMessageInboundPool.sendMessageToAllUser(result.toString());//向所有在线用户推送当前用户上线的消息
		
		result = new JSONObject();
		result.element("type", "get_online_user");
		UserWebSocketMessageInboundPool.addMessageInbound(this);//向连接池添加当前的连接对象
		result.element("list", UserWebSocketMessageInboundPool.getOnlineUser());
		UserWebSocketMessageInboundPool.sendMessageToUser(this.user, result.toString());//向当前连接发送当前在线用户的列表
	}

	@Override
	protected void onClose(int status) {
		UserWebSocketMessageInboundPool.removeMessageInbound(this);// 触发关闭事件，在连接池中移除连接
		JSONObject result = new JSONObject();
		result.element("type", "user_leave");
		result.element("user", this.user);
		UserWebSocketMessageInboundPool.sendMessageToAllUser(result.toString());//向在线用户发送当前用户退出的消息
	}

	@Override
	protected void onBinaryMessage(ByteBuffer message) throws IOException {
		throw new UnsupportedOperationException("Binary message not supported.");
	}

	/**
	 * 客户端发送消息到服务器时触发事件
	 * 
	 * 
	 */
	@Override
	protected void onTextMessage(CharBuffer message) throws IOException {
		String messageStr=message.toString();
		
		JSONObject jsonObj = JSONObject.fromObject(messageStr);
	    String type = jsonObj.getString("type");
	    if("message".equals(type)){
			JSONObject result = new JSONObject();
			result.element("user", this.user);
			result.element("type", "message");
			result.element("msg", jsonObj.getString("contentVal"));
			String resultStr=result.toString();
			
			UserWebSocketMessageInboundPool.sendMessageToAllUser(resultStr);//向所有在线用户发送消息
	    }
	    if("connect".equals(type)){
	    	String roomId=jsonObj.getString("roomId");
	    	String userName=jsonObj.getString("userName");
	    	JSONObject result = new JSONObject();
	    	result.element("userName", userName);
			result.element("roomId", roomId);
			result.element("type", "connect");
			String resultStr=result.toString();
	    	
			UserWebSocketMessageInboundPool.sendMessageToUser(userName, resultStr);
			
	    }
	}
}
