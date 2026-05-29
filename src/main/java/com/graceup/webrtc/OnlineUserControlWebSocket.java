package com.graceup.webrtc;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import com.alibaba.fastjson.JSONObject;

/**
 * 
 * 处理用户对话 websocket
 *
 */
@ServerEndpoint("/onlineUserControl")
public class OnlineUserControlWebSocket {

	
	/**
	 * 保存连接的Map容器 用来存放每个客户端对应的WebSocket对象。使用Map来存放，其中Key可以为用户标识
	 */
	private static final Map<String, Session> connections = new HashMap<String, Session>();

	/**
	 * key为用户名称，value为对应连接对象的id
	 */
	private static final Map<String, String> users = new HashMap<String, String>();

	/**
	 * 连接建立成功调用的方法
	 * 
	 * @param session
	 *            可选的参数。session为与某个客户端的连接会话，需要通过它来给客户端发送数据
	 * @throws IOException
	 */
	@OnOpen
	public void onOpen(Session session) throws IOException {
		
		// 获取用户名，解决乱码问题
		String user = session.getRequestURI().toString();
		try {
			user = URLDecoder.decode(user, "utf-8").split("=")[1];
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}

		Set<String> onlineUsers = getOnlineUser();
		/**
		 * 用户名已存在
		 */
		if (onlineUsers.contains(user)) {
			System.out.println("用户名:" + user + ",已存在");
			JSONObject result = new JSONObject();
			result.put("type", "user_is_contain");
			sendMessageToUser(session, result.toString());// 向当前连接发送当前在线用户的列表
		}else {

			JSONObject result = new JSONObject();
	
			// 触发连接事件，在连接池中添加连接
			result.put("type", "user_join");
			result.put("user", user);
			sendMessageToAllUser(result.toString());// 向所有在线用户推送当前用户上线的消息
	
			String sessionId=session.getId();
			// 向连接池添加当前的连接对象
			connections.put(sessionId, session);
			users.put(user, sessionId);
			
			onlineUsers = getOnlineUser();
			
			result = new JSONObject();
			result.put("type", "get_online_user");
			result.put("list", onlineUsers);
	
			sendMessageToUser(session, result.toString());// 向当前连接发送当前在线用户的列表
	
		
		}
		

	}

	/**
	 * 连接关闭调用的方法
	 */
	@OnClose
	public void onClose(Session session) {
		
		
		String sessionId=session.getId();
		
		if(connections.get(sessionId)!=null){
			// 获取用户名，解决乱码问题
			String user = session.getRequestURI().toString();
			try {
				user = URLDecoder.decode(user, "utf-8").split("=")[1];
			} catch (UnsupportedEncodingException e) {
				e.printStackTrace();
			}
	
			
			// 触发关闭事件，在连接池中移除连接
			connections.remove(sessionId);
			users.remove(user);
	
			JSONObject result = new JSONObject();
			result.put("type", "user_leave");
			result.put("user", user);
			sendMessageToAllUser(result.toString());// 向在线用户发送当前用户退出的消息
		}
	}

	/**
	 * 收到客户端消息后调用的方法
	 * 
	 * @param message
	 *            客户端发送过来的消息
	 * @param session
	 *            可选的参数
	 */
	@OnMessage
	public void onMessage(String message, Session session) {
		

		// 获取用户名，解决乱码问题
		String user = session.getRequestURI().toString();
		try {
			user = URLDecoder.decode(user, "utf-8").split("=")[1];
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}

		System.out.println("来自客户端的消息:" + message);
		
		JSONObject jsonObj = JSONObject.parseObject(message);
		String type = jsonObj.getString("type");
		if ("message".equals(type)) {
			JSONObject result = new JSONObject();
			result.put("user", user);
			result.put("type", "message");
			result.put("msg", jsonObj.getString("contentVal"));
			String resultStr = result.toString();

			sendMessageToAllUser(resultStr);// 向所有在线用户发送消息
		}

		if ("connect".equals(type)) {
			String roomId = jsonObj.getString("roomId");
			String userName = jsonObj.getString("userName");
			JSONObject result = new JSONObject();
			result.put("userName", userName);
			result.put("fromUser", jsonObj.getString("fromUser"));
			result.put("roomId", roomId);
			result.put("type", "connect");
			String resultStr = result.toString();
			
			sendMessageToUser(userName, resultStr);

		}

	}

	/**
	 * 发生错误时调用
	 * 
	 * @param session
	 * @param error
	 */
	@OnError
	public void onError(Session session, Throwable error) {
		System.out.println("关闭了");
	}
	
	

	/**
	 * 获取所有的在线用户
	 *
	 * 
	 */
	private static Set<String> getOnlineUser() {
		return users.keySet();
	}
	


	/**
	 * 向特定的用户发送数据
	 *
	 * 
	 */
	private static void sendMessageToUser(String user, String message) {
		try {
			String id=users.get(user);
			if(id!=null) {
				Session session = connections.get(id);
				if (session != null) {
					session.getBasicRemote().sendText(message);
				}
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	/**
	 * 向特定的用户发送数据
	 *
	 * 
	 */
	private static void sendMessageToUser(Session session, String message) {
		try {
			if (session != null) {
				session.getBasicRemote().sendText(message);
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	/**
	 * 向所有的用户发送消息
	 *
	 */
	private static void sendMessageToAllUser(String message) {
		try {
			Set<String> keySet = connections.keySet();
			for (String key : keySet) {
				Session session = connections.get(key);
				if (session != null) {
					session.getBasicRemote().sendText(message);
				}
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

}
