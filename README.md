# WebRTC 点对点视频通话系统

基于 WebSocket 信令的 WebRTC 实时音视频通信系统。

## 主要功能

1. **在线用户列表** - 基于 WebSocket 的实时在线用户展示
2. **视频通话** - 使用 WebSocket 作为信令通道，构建 WebRTC 点对点视频通话
3. **文字聊天** - 支持文字消息实时通信

## 技术栈

- **后端**: Java 8, Servlet, WebSocket (JSR 356)
- **构建工具**: Maven 3.x
- **服务器**: Apache Tomcat 7/8
- **前端**: HTML5, JavaScript, WebRTC API, Amaze UI
- **依赖库**:
  - `javax.websocket-api` 1.0 - WebSocket 规范 API
  - `javaee-api` 7.0 - Java EE 规范
  - `fastjson` 2.0.43 - JSON 处理

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

### 访问应用

- **首页**: http://localhost:8090/webrtc/
- **视频通话**: http://localhost:8090/webrtc/webrtc.html?roomId=room001

## 项目结构

```
webrtc/
├── src/main/
│   ├── java/com/graceup/webrtc/    # Java 源代码
│   │   ├── OnlineUserControlWebSocket.java
│   │   ├── WebSocket.java
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

部署时，需要根据实际情况修改 `src/main/webapp/js/config.js` 中的 WebSocket 连接地址：

```javascript
// 开发环境
ws://localhost:8090/webrtc/

// 生产环境
ws://服务器IP:端口/webrtc/
```

## 使用说明

### 视频通话测试

1. 在两个不同的浏览器标签页或不同设备上打开相同 roomId 的链接
2. 允许浏览器访问摄像头和麦克风
3. 点击用户进行视频通话

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
