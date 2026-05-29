package com.graceup.webrtc;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;

/**
 * 处理用户对话 WebSocket。
 */
@ServerEndpoint("/onlineUserControl")
public class OnlineUserControlWebSocket {

	private static final Gson GSON = new Gson();

	/**
	 * key 为 sessionId，value 为对应连接对象。
	 */
	private static final Map<String, Session> connections =
			new ConcurrentHashMap<String, Session>();

	/**
	 * key 为用户名称，value 为对应连接对象的 sessionId。
	 */
	private static final Map<String, String> users =
			new ConcurrentHashMap<String, String>();

	/**
	 * key 为 sessionId，value 为用户名称。
	 */
	private static final Map<String, String> sessionUsers =
			new ConcurrentHashMap<String, String>();

	/**
	 * 连接建立成功调用的方法。
	 *
	 * @param session
	 *            与某个客户端的连接会话
	 */
	@OnOpen
	public void onOpen(Session session) throws IOException {
		String user = getQueryParameter(session, "user");
		if (isBlank(user)) {
			sendMessageToUser(session, toJson("type", "invalid_user"));
			session.close();
			return;
		}

		String sessionId = session.getId();
		String oldSessionId = users.putIfAbsent(user, sessionId);
		if (oldSessionId != null) {
			sendMessageToUser(session, toJson("type", "user_is_contain"));
			session.close();
			return;
		}

		connections.put(sessionId, session);
		sessionUsers.put(sessionId, user);

		Map<String, Object> joinMessage = new LinkedHashMap<String, Object>();
		joinMessage.put("type", "user_join");
		joinMessage.put("user", user);
		sendMessageToAllUser(GSON.toJson(joinMessage), session);

		Map<String, Object> onlineMessage = new LinkedHashMap<String, Object>();
		onlineMessage.put("type", "get_online_user");
		onlineMessage.put("list", getOnlineUsers());
		sendMessageToUser(session, GSON.toJson(onlineMessage));
	}

	/**
	 * 连接关闭调用的方法。
	 */
	@OnClose
	public void onClose(Session session) {
		removeSession(session);
	}

	/**
	 * 收到客户端消息后调用的方法。
	 *
	 * @param message
	 *            客户端发送过来的消息
	 * @param session
	 *            与某个客户端的连接会话
	 */
	@OnMessage
	public void onMessage(String message, Session session) {
		String user = sessionUsers.get(session.getId());
		if (user == null) {
			return;
		}

		JsonObject jsonObj;
		try {
			JsonElement element = new JsonParser().parse(message);
			if (!element.isJsonObject()) {
				sendMessageToUser(session, toJson("type", "invalid_message"));
				return;
			}
			jsonObj = element.getAsJsonObject();
		} catch (JsonSyntaxException e) {
			sendMessageToUser(session, toJson("type", "invalid_message"));
			return;
		}

		String type = getString(jsonObj, "type");
		if ("message".equals(type)) {
			Map<String, Object> result = new LinkedHashMap<String, Object>();
			result.put("user", user);
			result.put("type", "message");
			result.put("msg", getString(jsonObj, "contentVal"));
			sendMessageToAllUser(GSON.toJson(result), null);
		} else if ("connect".equals(type)) {
			String targetUser = getString(jsonObj, "userName");
			Map<String, Object> result = new LinkedHashMap<String, Object>();
			result.put("userName", targetUser);
			result.put("fromUser", user);
			result.put("roomId", getString(jsonObj, "roomId"));
			result.put("type", "connect");
			sendMessageToUser(targetUser, GSON.toJson(result));
		}
	}

	/**
	 * 发生错误时调用。
	 *
	 * @param session
	 *            与某个客户端的连接会话
	 * @param error
	 *            错误信息
	 */
	@OnError
	public void onError(Session session, Throwable error) {
		removeSession(session);
	}

	private static List<String> getOnlineUsers() {
		List<String> onlineUsers = new ArrayList<String>(users.keySet());
		Collections.sort(onlineUsers);
		return onlineUsers;
	}

	private static void removeSession(Session session) {
		String sessionId = session.getId();
		String user = sessionUsers.remove(sessionId);
		connections.remove(sessionId);
		if (user == null) {
			return;
		}

		users.remove(user, sessionId);

		Map<String, Object> result = new LinkedHashMap<String, Object>();
		result.put("type", "user_leave");
		result.put("user", user);
		sendMessageToAllUser(GSON.toJson(result), session);
	}

	private static void sendMessageToUser(String user, String message) {
		String id = users.get(user);
		if (id == null) {
			return;
		}

		Session session = connections.get(id);
		if (!sendMessageToUser(session, message)) {
			cleanupClosedSession(id, session);
		}
	}

	private static boolean sendMessageToUser(Session session, String message) {
		if (session == null || !session.isOpen()) {
			return false;
		}

		try {
			synchronized (session) {
				session.getBasicRemote().sendText(message);
			}
			return true;
		} catch (IOException e) {
			e.printStackTrace();
			return false;
		}
	}

	private static void sendMessageToAllUser(String message, Session sender) {
		for (Map.Entry<String, Session> entry : connections.entrySet()) {
			Session session = entry.getValue();
			if (sender != null && sender.equals(session)) {
				continue;
			}
			if (!sendMessageToUser(session, message)) {
				cleanupClosedSession(entry.getKey(), session);
			}
		}
	}

	private static void cleanupClosedSession(String sessionId, Session session) {
		connections.remove(sessionId, session);
		String user = sessionUsers.remove(sessionId);
		if (user != null) {
			users.remove(user, sessionId);
		}
	}

	private static String getQueryParameter(Session session, String name) {
		List<String> values = session.getRequestParameterMap().get(name);
		if (values == null || values.isEmpty()) {
			return null;
		}
		return values.get(0);
	}

	private static boolean isBlank(String value) {
		return value == null || value.trim().length() == 0;
	}

	private static String getString(JsonObject data, String key) {
		JsonElement value = data.get(key);
		if (value == null || value.isJsonNull()) {
			return "";
		}
		return value.getAsString();
	}

	private static String toJson(String key, String value) {
		Map<String, Object> result = new LinkedHashMap<String, Object>();
		result.put(key, value);
		return GSON.toJson(result);
	}
}
