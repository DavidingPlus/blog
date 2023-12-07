# clean命令加上sudo，其他的不用

# 部署到远端
sudo npx hexo clean
npx hexo g

# 推送到远端，这里不能加sudo，否则会出问题
npx hexo d

# 把本分支推送到Code
git add .
git commit -m "update Code"
git push -u origin Code
