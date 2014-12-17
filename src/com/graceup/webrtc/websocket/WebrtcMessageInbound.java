package com.graceup.webrtc.websocket;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.WsOutbound;

/**
 * WebRTC视频请求
 */
public class WebrtcMessageInbound extends MessageInbound {

	/**
	 * 连接池
	 */
	private static final Map<String, List<WebrtcMessageInbound>> allConnections = new Hashtable<String, List<WebrtcMessageInbound>>();
	
	/**
	 * 两个人的房间的Id
	 */
	private String roomId;

	public String getConferenceId() {
		return roomId;
	}

	public void setConferenceId(String roomId) {
		this.roomId = roomId;
	}

	public WebrtcMessageInbound(String roomId) {
		this.roomId = roomId;
	}

	@Override
	protected void onOpen(WsOutbound outbound) {

		List<WebrtcMessageInbound> oneConnection = allConnections.get(roomId);

		if (null == oneConnection) {
			List<WebrtcMessageInbound> newConnection = new ArrayList<WebrtcMessageInbound>();
			newConnection.add(this);
			allConnections.put(roomId, newConnection);
		} else {
			oneConnection.add(this);
		}
		String message = "{\"message\":\"websocket open!\"}";
		broadcast(message);
	}

	@Override
	protected void onClose(int status) {

		List<WebrtcMessageInbound> oneConnection = allConnections.get(roomId);

		if (null != oneConnection) {
			oneConnection.remove(this);
			if (null != oneConnection && oneConnection.size() <= 0) {
				allConnections.remove(roomId);
			}
		}

		String message = "{\"message\":\"webSocket close!\"}";
		broadcast(message);
	}

	@Override
	protected void onBinaryMessage(ByteBuffer message) throws IOException {
		// 在这里处理二进制数据
		System.out.println(message.toString());
	}

	@Override
	protected void onTextMessage(CharBuffer message) throws IOException {
		// 这里处理的是文本数据
		String filteredMessage = message.toString();
		broadcast(filteredMessage);
	}

	// 将数据传回客户端
	private void broadcast(String message) {
		System.out.println(message.toString());
		List<WebrtcMessageInbound> oneConnection = allConnections.get(roomId);
		if (null != oneConnection) {
			for (WebrtcMessageInbound connection : oneConnection) {
				try {
					CharBuffer buffer = CharBuffer.wrap(message);
					connection.getWsOutbound().writeTextMessage(buffer);
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}
	}

}
