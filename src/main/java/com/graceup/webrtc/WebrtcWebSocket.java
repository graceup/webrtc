package com.graceup.webrtc;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;

import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

/**
 * 接收ws://协议的请求
 * 
 * 用于 处理webrtc请求
 * 
 * 
 */
@ServerEndpoint("/websocket")
public class WebrtcWebSocket {

	/**
	 * 连接池
	 */
	private static final Map<String, List<Session>> allConnections = new Hashtable<String, List<Session>>();

	/**
	 * 连接建立成功调用的方法
	 * 
	 * @param session
	 *            可选的参数。session为与某个客户端的连接会话，需要通过它来给客户端发送数据
	 */
	@OnOpen
	public void onOpen(Session session) {

		// 房间的Id
		String roomId = session.getRequestURI().toString().split("=")[1];

		List<Session> oneConnection = allConnections.get(roomId);

		if (null == oneConnection) {
			List<Session> newConnection = new ArrayList<Session>();
			newConnection.add(session);
			allConnections.put(roomId, newConnection);
		} else {
			oneConnection.add(session);
		}
		String message = "{\"message\":\"websocket open!\"}";

		
		broadcast(message,roomId);
		

	}

	/**
	 * 连接关闭调用的方法
	 */
	@OnClose
	public void onClose(Session session) {
		// 房间的Id
		String roomId = session.getRequestURI().toString().split("=")[1];

		List<Session> oneConnection = allConnections.get(roomId);
		if (null != oneConnection) {
			oneConnection.remove(session);
			if (null != oneConnection && oneConnection.size() <= 0) {
				allConnections.remove(roomId);
			}
		}

		String message = "{\"message\":\"webSocket close!\"}";

		broadcast(message,roomId);

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
		// 房间的Id
		String roomId = session.getRequestURI().toString().split("=")[1];
		
		// 这里处理的是文本数据
		broadcast(message,roomId);
	}

	/**
	 * 发生错误时调用
	 * 
	 * @param session
	 * @param error
	 */
	@OnError
	public void onError(Session session, Throwable error) {
		
	}

	// 将数据传回客户端
	private void broadcast(String message, String roomId) {
		System.out.println(message.toString());
		List<Session> oneConnection = allConnections.get(roomId);
		if (null != oneConnection) {
			for (Session session : oneConnection) {
				try {
					session.getBasicRemote().sendText(message);
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}
	}

}
