# freess项目说明
### 这是啥？
自动抓取free-ss.site上面高质量的代理服务器并更新到本地v2ray配置的项目。

### v2ray是啥？
一个科学上网的工具，参考官方地址：[https://www.v2ray.com/](https://www.v2ray.com/)

因为v2ray实现了shadowsocks协议，所以可以用它来充当shadowsocks的客户端和服务器。本地科学上网只需要用它充当客户端即可。

### 为啥要写这个？
因为免费的shadowsocks账号和密码可能果断时间就失效了，所以需要更新。每次手动打开网址再复制粘贴到本地配置文件，然后重启太麻烦，所以写了个脚本干这件事。

### 为啥依赖puppeteer？
因为爬取的网站有反爬机制，直接抓接口是不可能的，所以只能模拟真实浏览器操作。

### 怎么使用？
1. 正确安装v2ray，windows推荐使用scoop，mac推荐使用brew安装
2. 正确配置v2ray，可以参考项目中的config.json示例配置
3. 下载本项目后执行`npm install`
4. 修改main.js中v2ray和chromium内核浏览器的路径
5. 修改本地hosts，添加`104.18.36.36 free-ss.site`
6. 执行node main.js，没有报错就表示成功
7. 按需使用http或者socket代理，端口分别师1091和1090

### 更好的体验？
chromium内核浏览器搭配SwitchyOmega扩展使用。
