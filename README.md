# DavidingPlus.github.io

- 我的博客的源代码分支：
  - 源代码是依托于`hexo`框架搭建的.

  - 主题是`stun`.

- 另一个分支`master`是用来部署网站站点的，因为`hexo deploy`里面的默认分支是`master`，所以就用`master`吧，另一个学长也是这么用的

- 关于`CNAME`的问题，`GitHub Pages`想用自定义域名在部署目录下需要有`CNAME`文件，里面存放自定义域名，但是每次部署之后就会自动把`CNAME`清理掉，所以这里我们把`CNAME`放到根目录的`source`中，这样在产生推送文件的时候就能够推送到网站的根目录当中!非常方便!

