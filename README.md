# DavidingPlus's Blog

这是我的个人博客。

- 依托于`hexo`框架搭建。
- 主题是`stun`。

目前已做好`Linux`和`Windows`平台的适配，建议在`Windows`或者`Wsl`中跑本项目。不推荐在虚拟机中跑，因为需要输入虚拟机的`IP`加端口号才能访问到本地页面。

# 注意事项

下面是一些细节注意事项：

- 另一个分支`master`是用来部署网站站点的，因为`hexo deploy`里面的默认分支是`master`，所以就用`master`吧，另一个学长也是这么用的。
- 关于`CNAME`的问题，`GitHub Pages`想用自定义域名在部署目录下需要有`CNAME`文件，里面存放自定义域名，但是每次部署之后就会自动把`CNAME`清理掉，所以这里我们把`CNAME`放到根目录的`source`中，这样在产生推送文件的时候就能够推送到网站的根目录当中！非常方便！
  - `2024.06.24`更新：自定义域名更新为`blog.lzx0626.me`。
  - `2024.07.15`更新：自定义域名更新为`blog.davidingplus.cn`，已部署到我自己的服务器上。
- 关于推送给搜索引擎，使用了一个非常好用的插件`Hexo SEO Auto Push`，这个东西是部署之后在每天的特定时间推送给搜索引擎，而不是部署了就推送了，当然可以作者设定可以手动点击`star`进行推送，官方文档：[https://github.com/Lete114/hexo-seo-autopush.git](https://github.com/Lete114/hexo-seo-autopush.git)，讲的非常清楚，非常好用。
- 考虑使用`cnpm`
  - 除了npm包管理器以外，推荐使用`cnpm`包管理器来启动本项目。关于本地构建和部署到远端的`cnpm`命令统一，自定义命令统一在`package.json`中，包括清理`cnpm run clean`，本地构建`cnpm run s`，部署到远端`cnpm run d`，其中部署到远端启用了`gulp`压缩文件，本地部署则没有。
  - 记得删除`node_modules`之后每次`cnpm install`之后在`source/_custom_node_modules`当中找到我们修改过的模块覆盖下载下来的，以保证功能正常。
    - `2024.06.26`更新：已经将修改过后的自定义包发布到`npm`官网了，拉取直接使用即可，不用做覆盖工作了。因此删除此目录，后续有自定义的包直接修改给原作者提`pr`或者发布自己的`npm`包即可。
    - 目前自定义过的`npm`包
      - [hexo-generator-index-pin-top-better](https://github.com/DavidingPlus/hexo-generator-index-pin-top-better)
      - [hexo-seo-autopush](https://github.com/Lete114/Hexo-SEO-AutoPush)
  - `2024.07.06`更新：为了拉包的时候同步更新`package-lock.json`，已移除`cnpm`包管理器，就使用原生的`npm`包管理器。
- 注意没事不要在`GitHub`网页上增添文件，也不要在本地项目中使用`git pull`命令，因为`.deploy_git`这个目录是链接到远端的`master`分支的，然后整个根目录另一个分支`master`，本地没有同步，`git pull`的话在切换，由于没有`.gitignore`就会出现奇奇怪怪的问题，到时候把整个项目删了重新部署，`master`分支的更新时间就重置了，我看着不舒服，所以`Code`就用来推就好了，不用`pull`，切记...。
  - `2024.07.06`更新：源代码`Code`分支更名`dev`，部署分支`master`更名为`gh-pages`。
  - `2024.07.19`更新：源代码`dev`分支更名`master`，部署分支`gh-pages`更名为`gh-pages-deprecated`（未使用`GitHub Pages`，转而部署到我自己的服务器上）。
- 关于项目中的图片资源，放到公网上以后图片资源如果臃肿，请求的时间是非常长的，网站的效果就会非常不好，因此这里统一使用`webp`后缀的格式，减小体积，加快网站加载速度。
- 关于项目中的`.deploy_git`目录，实际上是利用`hexo`的插件将代码部署到`github`某仓库的某分支，在这里就是`master`分支，但是`hexo`的`deploy`插件只会强制推送，会丢失`commit`很烦。因此我这里是在插件替我生成该目录以前将当前仓库重新克隆下来，我这里只克隆了`master`分支，为了防止强制推送丢失`commit`，因此每次部署以前进入`.deploy_git`目录`git pull`一下，之后再部署，就不会丢失`commit`了。
  - `2024.06.26`更新：部署的工作交给自动化的`github workflows`了。关于之前的`hexo-deployer-git`包，选择保留，但是不用。
- 请注意在`Windows`下启动本地服务器以后，使用`Ctrl+C`退出`Hexo`进程的时候会提示`Terminate batch job (Y/N)?`。这时候请手动输入`N`，也就是不终止批处理作业，我也不知道为什么。不要回车或者输入`Y`，否则会导致终端卡死（自己试过，血与泪的教训）。`Linux`不会有这个问题。
- 对于本项目，在部署的时候不能使用`Github Actions`的静态页面部署，也就是对应`static.yml`的部署方式，我也不知道为什么。正确的做法是在`Github Pages`的`Build and deployment`的`source`中选择`Deploy from a branch`，也就是从一个分支部署。
- 在`package.json`中存储了所有依赖包以及版本号，位于`dependencies`字段，例如`hexo`的`7.2.0`。为了防止包更新导致的`API`不兼容或者其他问题，这里使用固定的包版本。注意在写入的时候注意`7.2.0`和`^7.2.0`是有区别的。对于`^7.2.0`，如果有更新的包，比如`7.3.0`，会选择`7.3.0`的包，完整的规则我不是很清楚，反正包的版本不是固定的。`7.2.0`就是固定的这个版本的包。因此在`npm install <package> --save`以后，记得手动删除包版本前面的`^`符号，以保证使用固定的版本的包。目前决定使用`7.2.0`固定版本的`hexo`包。
- 已优化`gitalk`的代理配置`proxy`，目前默认的国内访问会被墙。
    - 起初阅读`issue`：[https://github.com/gitalk/gitalk/issues/506](https://github.com/gitalk/gitalk/issues/506)
    - 最后参考项目成功解决：[https://github.com/Dedicatus546/cors-server](https://github.com/Dedicatus546/cors-server)

# TODO LIST

1. 研究`pjax`中部分加载的`loading-bar`的逻辑，`pjax.pug`可能有`bug`。进一步选择美化进度加载，现在是一个进度条。个人想弄一个全屏的加载动画，样式参考文章：[https://www.jianshu.com/p/808a647dc324](https://www.jianshu.com/p/808a647dc324)。

2. `pjax`+`reward`混合使用出了些问题，第一次没办法加载出收款码，需要手动刷新一次才行。调研原因并尝试修复。 

3. `CCache`文章`Windows`部分的适配书写。

4. `Linux`下`gcc`对`map`和`unordered_map`底层的红黑树和哈希表的实现部分细节的总结。

