# gh-pages

此文件会被上传到`gh-pages`分支的根目录，做`README.md`文档用。

- 本文档不采用小写`.md`结尾是因为`hexo`会自动把`md`转化为`html`，所以这里就用大写的`.MD`了...
- 我的网站的部署分支`gh-pages`。
- 采用`hexo deploy`集成命令和`GitHub Pages`服务自动部署。
  - `2024.06.26`更新：已改为`github workflows`自动化`CI`和`GitHub Pages`服务自动部署的模式，原有`npm`包保留的方式。
- 绑定域名`lzx0626.me`
  - `2024.06.24`更新：域名已更新为二级域名`blog.lzx0626.me`。
  - `2024.07.15`更新：自定义域名更新为`blog.davidingplus.cn`，已部署到我自己的服务器上。
- 本目录中存放的`favicon.ico`文件部署以后会在部署分支的根目录下，是为`code browser`的标题`icon`服务的，因为它的地址是[https://lzx0626.me/code-browser](https://lzx0626.me/code-browser)，根目录还是在本项目的部署分支，虽然在`github`上是两个不同的项目，但是部署以后的效果是这样的，因此需要在本项目部署分支的根目录放上`favicon.ico`。
  - `2024.06.24`更新：两个网站已绑定各自的二级域名，因此也就不需要把`favicon.ico`传到根目录了，但是还是保留吧，怕出现奇奇怪怪的问题。
- 本目录中之前放了一个`CNAME`文件，用来自定义域名，因为会被传到部署分支的根目录。但是我通过`github workflows`帮我自动化完成了这步操作，因此本目录中就删除了`CNAME`文件，`homepage`主页的项目同理。

