package com.graceup.webrtc.control;

import javax.servlet.http.HttpServletRequest;

import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;

import com.graceup.webrtc.websocket.WebrtcMessageInbound;

/**
 * 接收ws://协议的请求
 * 
 * 用于 处理webrtc请求
 * 
 * @author graceup<br/>
 * @version 1.0<br/>
 * @email: charmails@163.com<br/>
 */
public class WebrtcWebSocket extends WebSocketServlet {


	
	/**
	 * 
	 */
	private static final long serialVersionUID = 5221899681376313963L;


	@Override
	protected StreamInbound createWebSocketInbound(String subProtocol, HttpServletRequest request) {

		String roomId = request.getParameter("roomId");
		System.out.println("id是:" + roomId);

		return new WebrtcMessageInbound(roomId);
	}
 

}
