# code

我的博客的源代码分支：

- 源代码是依托于`hexo`框架搭建的.
- 主题是`stun`.

下面是一些细节注意事项：

- 另一个分支`master`是用来部署网站站点的，因为`hexo deploy`里面的默认分支是`master`，所以就用`master`吧，另一个学长也是这么用的
- 关于`CNAME`的问题，`GitHub Pages`想用自定义域名在部署目录下需要有`CNAME`文件，里面存放自定义域名，但是每次部署之后就会自动把`CNAME`清理掉，所以这里我们把`CNAME`放到根目录的`source`中，这样在产生推送文件的时候就能够推送到网站的根目录当中!非常方便!
  - `2024.06.24`更新：自定义域名更新为`blog.lzx0626.me`
- 关于推送给搜索引擎，使用了一个非常好用的插件`Hexo SEO Auto Push`，这个东西是部署之后在每天的特定时间推送给搜索引擎，而不是部署了就推送了，当然可以作者设定可以手动点击star进行推送，官方文档：[https://github.com/Lete114/hexo-seo-autopush.git](https://github.com/Lete114/hexo-seo-autopush.git)，讲的非常清楚，非常好用
- 记得删除`node_modules`之后每次`cnpm install`之后在`source/_custom_node_modules`当中找到我们修改过的模块覆盖下载下来的，以保证功能正常
- 关于本地构建和部署到远端的`cnpm`命令统一，自定义命令统一在`package.json`中，包括清理`cnpm run clean`，本地构建`cnpm run s`，部署到远端`cnpm run d`，其中部署到远端启用了`gulp`压缩文件，本地部署则没有
- 注意没事不要在`GitHub`网页上增添文件，也不要在本地项目中使用`git pull`命令，因为`.deploy_git`这个目录是链接到远端的`master`分支的，然后整个根目录另一个分支`master`，本地没有同步，`git pull`的话在切换，由于没有`.gitignore`就会出现奇奇怪怪的问题，到时候把整个项目删了重新部署，`master`分支的更新时间就重置了，我看着不舒服，所以`Code`就用来推就好了，不用`pull`，切记...
- 关于项目中的图片资源，放到公网上以后图片资源如果臃肿，请求的时间是非常长的，网站的效果就会非常不好，因此这里统一使用`webp`后缀的格式，减小体积，加快网站加载速度
- 关于项目中的`.deploy_git`目录，实际上是利用`hexo`的插件将代码部署到`github`某仓库的某分支，在这里就是`master`分支，但是`hexo`的`deploy`插件只会强制推送，会丢失`commit`很烦。因此我这里是在插件替我生成该目录以前将当前仓库重新克隆下来，我这里只克隆了`master`分支，为了防止强制推送丢失`commit`，因此每次部署以前进入`.deploy_git`目录`git pull`一下，之后再部署，就不会丢失`commit`了

