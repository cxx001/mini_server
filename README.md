
#【快速搭载http服务】
python -m SimpleHTTPServer 8000
python ./SimpleHTTP.py (跨域访问)

#【调试】
1.servers.json添加对应要调试的服务配置(本机调试:"args": " --inspect=5858", 远程调试:"--inspect=0.0.0.0:5858", 安全考虑正式环境不建议开远程调试)
2.命令行后台启动服务器(cd根目录，执行pomelo start)
3.选择要调试的服务端口(launch.json),启动vscode远程调试(由于是多进程,每次只能调试一个进程)

#【环境】
一：安装nodejs(-v 8.11.x)
二：安装python(--version 2.5<version<3.0)
三：安装pomelo(npm install pomelo -g)
四：安装mongodb 3.6.10

#【阿里云部署gitlab】
1.选择市场镜像(centos7.3版本)
2.实例安全组开放需要端口(80, 22等)
3.目录下/etc/gitlab/gitlab.rb 这个修改为自己的IP external_url 'http://ip';
4.修改 /opt/gitlab/embedded/service/gitlab-rails/config/gitlab.yml 中的 host:ip
5.重启gitlab服务 sudo gitlab-ctl restart (如果有timeout再试一次) (sudo gitlab-ctl stop/restart)
6.浏览器访问url,第一次重设密码
7.安装git,生成ssh key,并配置

#【常用操作】
1.pomelo启动: pomelo start [-e production] [-D -d -t -i]
(-D,设为守护进程，不然后台会被杀掉 pomelo start -e production -D)

2.后台运行mongodb:
配置方式启动: mongod -f /usr/mongodb/mongodb.conf
命令参数启动: mongod --fork --dbpath=/usr/mongodb/db --logpath=/usr/mongodb/log/mongodb.log --logappend

3.后台运行:
nohup xxx & (注意不能直接关闭shell窗口,要先exit命令退出)
nohup xxx >/dev/null 2>log &  只输出错误信息到日志文件 
nohup xxx >/dev/null 2>&1 &  什么信息也不要

4.端口被占用操作
Linux:
1、进程详情: ps -aux --sort -pmem | less 按照内存从大到小(或者-pcpu)
2、kill -9 pid

Windows: 
打开任务管理器,杀掉node.exe的进程

#【问题集】
1.linux上初次git pull fatal: Not a git repository (or any of the parent directories): .git
解决：先git init，再pull

2.Error:timer is not exsits...
是远程调用cb回调了两次以上引起，一般是读取数据库异步操作引起，可以使用Async.waterfall避免

3.mongodb创建密码访问账号用:db.createUser({user:"root",pwd:"123456",roles:["root"]})
