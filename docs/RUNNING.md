# 本地运行与调试指南

本文档介绍如何在本地运行和调试 WebRTC 信令服务器项目。

## 环境要求

- **JDK**: Java 8 或更高版本
- **Maven**: 3.6.0 或更高版本
- **浏览器**: Chrome、Firefox、Edge 等支持 WebRTC 的现代浏览器
- **IDE** (可选): VS Code、IntelliJ IDEA 或 Eclipse

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd webrtc
```

### 2. 编译项目

```bash
mvn clean compile
```

### 3. 运行项目

#### 方式一：使用 Maven Tomcat 插件（推荐）

```bash
mvn tomcat7:run
```

应用将运行在: `http://localhost:8090/webrtc`

#### 方式二：打包 WAR 部署到 Tomcat

```bash
mvn clean package
```

将生成的 `target/webrtc.war` 复制到 Tomcat 的 `webapps` 目录下，启动 Tomcat。

## 访问应用

### 首页

打开浏览器访问：
```
http://localhost:8090/webrtc/
```

### 视频通话页面

创建一个房间并加入：
```
http://localhost:8090/webrtc/webrtc.html?roomId=room001
```

**注意**：要进行视频通话测试，需要：
1. 在两个不同的浏览器标签页或不同设备上打开相同 roomId 的链接
2. 允许浏览器访问摄像头和麦克风
3. 确保网络环境支持 WebRTC（或使用配置的 TURN 服务器）

## 调试配置

### VS Code 调试

项目已配置好 VS Code 调试文件（`.vscode/launch.json`）。

#### 步骤 1：以调试模式启动 Tomcat

```bash
mvn tomcat7:run -Dmaven.tomcat.debug=8000
```

#### 步骤 2：在 VS Code 中附加调试器

1. 打开 VS Code
2. 切换到调试视图（Debug view）
3. 选择 "Debug (Attach)" 配置
4. 点击开始调试按钮（F5）

#### 步骤 3：设置断点

在 Java 源代码中点击行号左侧设置断点，当代码执行到断点时会自动暂停。

### IntelliJ IDEA 调试

1. 导入 Maven 项目
2. 创建 Tomcat 本地运行配置
3. 在 "Startup/Connection" 选项卡中启用调试，端口设置为 8000
4. 启动调试模式

### Eclipse 调试

1. 导入 Maven 项目
2. 右键点击项目 → Debug As → Debug Configurations
3. 创建 Maven Build 配置，Goals 设置为 `tomcat7:run`
4. 在 Environment 中添加变量：`MAVEN_OPTS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=8000`

## 常见问题

### 1. 端口被占用

如果 8090 端口被占用，可以修改 `pom.xml` 中的端口配置：

```xml
<plugin>
    <groupId>org.apache.tomcat.maven</groupId>
    <artifactId>tomcat7-maven-plugin</artifactId>
    <configuration>
        <port>8080</port>  <!-- 修改为其他端口 -->
        <path>/webrtc</path>
    </configuration>
</plugin>
```

### 2. WebSocket 连接失败

- 检查浏览器控制台是否有错误信息
- 确认防火墙没有阻止 WebSocket 连接
- 检查 `js/config.js` 中的 WebSocket URL 配置是否正确

### 3. 无法获取摄像头/麦克风

- 确保使用 HTTPS 或 localhost 访问
- 检查浏览器权限设置，允许网站访问摄像头和麦克风
- 确认设备已正确连接

### 4. 调试端口连接失败

- 确认 Tomcat 是以调试模式启动的
- 检查端口 8000 是否被其他程序占用
- 确认防火墙允许该端口的连接

## 日志查看

### Maven 运行日志

直接在终端查看 Maven 输出。

### Tomcat 日志

如果使用独立 Tomcat，查看 `logs` 目录下的 `catalina.out` 和 `localhost_access_log`。

### 浏览器控制台

按 F12 打开开发者工具，查看 Console 和 Network 标签页。

## 生产环境部署

### 1. 打包

```bash
mvn clean package -DskipTests
```

### 2. 部署

将 `target/webrtc.war` 部署到生产环境的 Tomcat 或 Jetty 服务器。

### 3. 配置 HTTPS

生产环境必须使用 HTTPS，WebRTC 要求安全上下文。

## 相关文件

| 文件 | 说明 |
|------|------|
| `pom.xml` | Maven 构建配置 |
| `.vscode/launch.json` | VS Code 调试配置 |
| `.vscode/settings.json` | VS Code 编辑器设置 |
| `src/main/webapp/WEB-INF/web.xml` | Web 应用配置 |
| `src/main/webapp/js/config.js` | 前端 WebSocket 配置 |

## 参考链接

- [Maven Tomcat Plugin](https://tomcat.apache.org/maven-plugin.html)
- [WebRTC 调试指南](https://webrtc.org/getting-started/debugging)
- [VS Code Java 调试](https://code.visualstudio.com/docs/java/java-debugging)
