package com.graceup.webrtc;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import javax.websocket.CloseReason;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;

/**
 * 接收 WebRTC 信令请求。
 */
@ServerEndpoint("/websocket/{roomId}")
public class WebrtcWebSocket {

	private static final int MAX_ROOM_SIZE = 2;

	/**
	 * 房间连接池。
	 */
	private static final Map<String, CopyOnWriteArrayList<Session>> allConnections =
			new ConcurrentHashMap<String, CopyOnWriteArrayList<Session>>();

	/**
	 * 连接建立成功调用的方法。
	 *
	 * @param session
	 *            与某个客户端的连接会话
	 * @param roomId
	 *            房间 ID
	 */
	@OnOpen
	public void onOpen(Session session, @PathParam("roomId") String roomId) {
		CopyOnWriteArrayList<Session> roomSessions = getRoomSessions(roomId);
		int roomSize;
		synchronized (roomSessions) {
			if (roomSessions.size() >= MAX_ROOM_SIZE) {
				sendMessage(session, "{\"event\":\"_busy\",\"message\":\"room is full\"}");
				closeSession(session, CloseReason.CloseCodes.TRY_AGAIN_LATER, "room is full");
				return;
			}

			roomSessions.add(session);
			roomSize = roomSessions.size();
		}
		sendMessage(session, "{\"event\":\"_join\",\"count\":" + roomSize + "}");

		if (roomSize == MAX_ROOM_SIZE) {
			sendMessage(session, "{\"event\":\"_ready\",\"initiator\":true}");
			broadcast("{\"event\":\"_ready\",\"initiator\":false}", roomId, session);
		}
	}

	/**
	 * 连接关闭调用的方法。
	 *
	 * @param session
	 *            与某个客户端的连接会话
	 * @param roomId
	 *            房间 ID
	 */
	@OnClose
	public void onClose(Session session, @PathParam("roomId") String roomId) {
		if (removeSession(roomId, session)) {
			broadcast("{\"event\":\"_leave\"}", roomId, session);
		}
	}

	/**
	 * 收到客户端消息后调用的方法。
	 *
	 * @param message
	 *            客户端发送过来的消息
	 * @param session
	 *            与某个客户端的连接会话
	 * @param roomId
	 *            房间 ID
	 */
	@OnMessage
	public void onMessage(String message, Session session, @PathParam("roomId") String roomId) {
		broadcast(message, roomId, session);
	}

	/**
	 * 发生错误时调用。
	 *
	 * @param session
	 *            与某个客户端的连接会话
	 * @param error
	 *            错误信息
	 * @param roomId
	 *            房间 ID
	 */
	@OnError
	public void onError(Session session, Throwable error, @PathParam("roomId") String roomId) {
		if (removeSession(roomId, session)) {
			broadcast("{\"event\":\"_leave\"}", roomId, session);
		}
	}

	private CopyOnWriteArrayList<Session> getRoomSessions(String roomId) {
		CopyOnWriteArrayList<Session> newRoom = new CopyOnWriteArrayList<Session>();
		CopyOnWriteArrayList<Session> existingRoom = allConnections.putIfAbsent(roomId, newRoom);
		if (existingRoom == null) {
			return newRoom;
		}
		return existingRoom;
	}

	private boolean removeSession(String roomId, Session session) {
		List<Session> roomSessions = allConnections.get(roomId);
		if (roomSessions == null) {
			return false;
		}

		boolean removed = roomSessions.remove(session);
		if (roomSessions.isEmpty()) {
			allConnections.remove(roomId, roomSessions);
		}
		return removed;
	}

	private void broadcast(String message, String roomId, Session sender) {
		List<Session> roomSessions = allConnections.get(roomId);
		if (roomSessions == null) {
			return;
		}

		for (Session session : roomSessions) {
			if (session.equals(sender) || !session.isOpen()) {
				continue;
			}
			sendMessage(session, message);
		}
	}

	private void sendMessage(Session session, String message) {
		try {
			if (session.isOpen()) {
				session.getBasicRemote().sendText(message);
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private void closeSession(Session session, CloseReason.CloseCode closeCode, String reason) {
		try {
			if (session.isOpen()) {
				session.close(new CloseReason(closeCode, reason));
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
