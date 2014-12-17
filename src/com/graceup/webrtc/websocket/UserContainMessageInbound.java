package com.graceup.webrtc.websocket;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;

import net.sf.json.JSONObject;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.WsOutbound;
/**
 * 
 * 用户名称存在时返回
 * 
 * @author graceup<br/>
 * @version 1.0<br/>
 * @email: charmails@163.com<br/>
 */
public class UserContainMessageInbound extends MessageInbound {

	/**
	 *  当前连接的用户名称
	 */
	private final String user;

	public UserContainMessageInbound(String user) {
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

		result = new JSONObject();
		result.element("type", "user_is_contain");
		try {
			this.getWsOutbound().writeTextMessage(CharBuffer.wrap(result.toString()));
		} catch (IOException e) {
			e.printStackTrace();
		}

	}

	@Override
	protected void onClose(int status) {
	}

	@Override
	protected void onBinaryMessage(ByteBuffer message) throws IOException {
		throw new UnsupportedOperationException("Binary message not supported.");
	}

	@Override
	protected void onTextMessage(CharBuffer message) throws IOException {
		throw new UnsupportedOperationException("CharBuffer message not supported.");
	}
}
