# WebRTC 点对点视频通话系统

基于 WebSocket 信令的 WebRTC 实时音视频通信系统，支持在线用户、文字聊天和 1 对 1 点对点视频通话。

## 主要功能

1. **在线用户列表** - 基于 WebSocket 的实时在线用户展示
2. **视频通话** - 使用 WebSocket 作为信令通道，构建 WebRTC 点对点视频通话
3. **文字聊天** - 支持文字消息实时通信
4. **房间控制** - 视频通话房间限制为 2 人，第三人进入时返回忙碌提示
5. **稳定信令** - 使用单个 `RTCPeerConnection`，支持 `_join`、`_ready`、`_leave`、`_hangup`、`_busy` 等状态信令

## 技术栈

- **后端**: Java 8, Servlet, WebSocket (JSR 356)
- **构建工具**: Maven 3.x
- **服务器**: Apache Tomcat 7/8
- **前端**: HTML5, JavaScript, WebRTC API, Amaze UI
- **依赖库**:
  - `javax.websocket-api` 1.0 - WebSocket 规范 API
  - `javaee-api` 7.0 - Java EE 规范
  - `gson` 2.8.5 - JSON 处理

## 快速开始

### 环境要求

- JDK 8 或更高版本
- Maven 3.6.0 或更高版本
- 支持 WebRTC 的现代浏览器 (Chrome, Firefox, Edge)

### 运行项目

```bash
# 克隆项目
git clone <repository-url>
cd webrtc

# 运行项目
mvn tomcat7:run
```

应用将运行在: http://localhost:8090/webrtc

如果 8090 端口已被占用，可以指定临时端口：

```bash
mvn tomcat7:run -Dtomcat.port=18090
```

### 访问应用

- **首页**: http://localhost:8090/webrtc/
- **视频通话**: http://localhost:8090/webrtc/webrtc.html?roomId=room001

## 项目结构

```
webrtc/
├── src/main/
│   ├── java/com/graceup/webrtc/    # Java 源代码
│   │   ├── OnlineUserControlWebSocket.java
│   │   └── WebrtcWebSocket.java
│   ├── resources/                  # 配置文件
│   └── webapp/                     # Web 应用资源
│       ├── assets/                 # 静态资源 (CSS, JS, 图片)
│       ├── js/                     # 前端脚本
│       ├── WEB-INF/                # Web 配置
│       ├── index.html              # 首页
│       └── webrtc.html             # 视频通话页面
├── docs/                           # 文档
├── pic/                            # 截图资源
└── pom.xml                         # Maven 配置
```

## 配置说明

`src/main/webapp/js/config.js` 会根据当前页面地址自动生成 WebSocket 地址：

```javascript
var chatWebSocketUrl = wsProtocol + "://" + url + projectName + "/onlineUserControl";
var webrtcWebSocketUrl = wsProtocol + "://" + url + projectName + "/websocket";
```

部署到 HTTPS 时会自动使用 `wss://`，部署到 HTTP 时使用 `ws://`。

WebRTC 信令地址格式为：

```text
ws://host:port/webrtc/websocket/{roomId}
```

## 使用说明

### 视频通话测试

1. 在首页输入用户名进入在线用户列表
2. 允许浏览器访问摄像头和麦克风
3. 点击在线用户旁边的“通话”按钮发起邀请
4. 对方确认后，双方进入相同 roomId 的视频通话页面
5. 同一 roomId 最多允许 2 人进入，后续用户会收到房间忙碌提示

### 信令流程

视频通话页面只维护一个 `RTCPeerConnection`：

1. 第一个用户进入房间后等待
2. 第二个用户进入房间后收到 `_ready` 并发起 offer
3. 双方通过 `_offer`、`_answer`、`_ice_candidate` 完成连接
4. 断开或关闭页面时通过 `_leave` / `_hangup` 通知对方

---

## 界面预览

<span style="margin-left:50px;">-------------------------------------------------------2014-12-17</span>

PC端，初次进入输入用户名称：
-----------------------------------
<img src="https://github.com/graceup/webrtc/blob/master/pic/1.jpg"></img><br>
PC端，已进入页面：
-----------------------------------
<img src="https://github.com/graceup/webrtc/blob/master/pic/2.jpg"></img><br>
PC端，通话请求提示：
-----------------------------------
<img src="https://github.com/graceup/webrtc/blob/master/pic/3.jpg"></img><br>
PC端，进入视频通话提示：
-----------------------------------
<img src="https://github.com/graceup/webrtc/blob/master/pic/4.jpg"></img><br>
PC端，视频通话连接中：
-----------------------------------
<img src="https://github.com/graceup/webrtc/blob/master/pic/5.jpg"></img><br>
PC端，进入视频通话页面（因为没有摄像头，所以显示只是一幅图像）：
-----------------------------------
<img src="https://github.com/graceup/webrtc/blob/master/pic/6.jpg"></img><br>
手机端，初次进入输入用户名称：
-----------------------------------
<img src="https://github.com/graceup/webrtc/blob/master/pic/7.png"></img><br>
手机端，已进入页面：
-----------------------------------
<img src="https://github.com/graceup/webrtc/blob/master/pic/8.png"></img><br>
手机端，文字聊天页面：
-----------------------------------
<img src="https://github.com/graceup/webrtc/blob/master/pic/9.png"></img><br>
<br>
手机端(支持WebRTC的浏览器)，进入视频通话页面：
-----------------------------------
<img src="https://github.com/graceup/webrtc/blob/master/pic/10.png"></img><br>
<br>

<span style="margin-left:50px;">-------------------------------------------------------2014-12-18</span>

页面使用的前端框架是 Amaze UI（http://amazeui.org/），所以兼容支持 WebRTC 的移动端。

<span style="margin-left:50px;">-------------------------------------------------------2014-12-23</span>
