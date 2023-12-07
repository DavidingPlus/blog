---
title: I/O多路复用技术
categories:
  - Linux学习
  - 牛客Linux
  - 第4章 Linux网络编程
abbrlink: 3a41a624
date: 2023-09-23 01:00:00
updated: 2023-09-23 01:00:00
---

<meta name="referrer" content="no-referrer"/>

`牛客Linux`的`第4章 Linux网络编程`的`I/O多路复用技术`部分。

<!-- more -->

`CSDN`：[https://blog.csdn.net/m0_61588837/article/details/132427713](https://blog.csdn.net/m0_61588837/article/details/132427713)

`markdown`文档在：[https://github.com/DavidingPlus/Md_Files/blob/master/Cpp/C%2B%2B%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0/Linux/%E7%89%9B%E5%AE%A2%20Linux.md](https://github.com/DavidingPlus/Md_Files/blob/master/Cpp/C%2B%2B%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0/Linux/%E7%89%9B%E5%AE%A2%20Linux.md)

代码在：[https://github.com/DavidingPlus/Linux_Learning/tree/Newcoder_Linux](https://github.com/DavidingPlus/Linux_Learning/tree/Newcoder_Linux)

## I/O多路复用(I/O多路转接)

### I/O含义

**I/O就是英文单词in out，但是不是指从键盘读入数据叫in或者输出到中断屏幕到out，它指的是我们操作文件或者管道或者套接字，依赖文件描述符，将数据和内存(比如缓冲区)进行通信，写入内存叫in，从内存中读取叫out；比如我们的TCP通信的例子，连接套接字的形式就是文件描述符fd，然后通过他的读写是先存到内存缓冲区的，这就有很多的I/O过程了**

**I/O 多路复用使得程序能同时监听多个文件描述符，能够提高程序的性能。Linux 下实现 I/O 多路复用的系统调用主要有 select、poll 和 epoll。**

### 几种常见的I/O模型

#### 阻塞等待

比如accept()和wait()就是阻塞等待的例子，阻塞等待客户端的连接和子进程的结束，优点就是阻塞在那里不吃CPU的时间片，缺点就是同一时刻只能处理一个操作，效率很低；所以想到用多进程或者多线程解决，但是缺点就是消耗资源

![image-20230821101046107](https://img-blog.csdnimg.cn/1c688cc1b8c2440d855581c4642f0a54.png)

##### BIO模型

这就是阻塞等待的例子，就是因为read()或者recv()是阻塞的，当我主程序接受客户端连接之后阻塞等待客户端的数据到达，这段时间内主程序没有办法接受其他客户端的连接，所以我们选择多进程或者多线程来解决问题，缺点也显而易见就是消耗资源，但是究其根本原因就是阻塞blocking的问题

![image-20230821101622911](https://img-blog.csdnimg.cn/2e88bc1613fe4da98a7f5e020f0efe38.png)

#### 非阻塞，忙轮询

因此我们可以选择就不阻塞了，忙着轮询来询问任务的情况，优点就是提高了程序的执行效率，但是缺点就是需要吃更多的CPU和系统资源

解决方案：使用I/O多路转接技术select/poll/epoll

![image-20230821102216612](https://img-blog.csdnimg.cn/dfbfb6da04e64f7185e71d1a033d0808.png)

##### NIO模型

这里把accept()和read()都设置成为非阻塞的，意味着我程序执行到这里的时候我不阻塞了，但是需要判断是否有客户端连接或者有数据到达，如果没有就继续循环直到有，有就进行相应的处理，但是这样消耗的CPU和资源代价非常大

![image-20230821102411708](https://img-blog.csdnimg.cn/51f830e8af8040bf9d82b1441a638404.png)

### I/O多路转接技术

**在NIO模型下，假设我们的用户非常多，因此每次执行到非阻塞的位置，比如read()我们都需要判断所有的客户是否有数据到达，我们的本意是通过非阻塞来提高程序的效率，但是我们现在每次到这里都要自己询问所有的客户数据是否到达，这不就消耗了CPU和资源嘛，违背了我们的初衷，I/O多路转接技术就是用来解决这个问题，他的目的是委托内核帮我们询问查看有多少客户的数据到达了，然后告诉我们，因此我们只需要调用一次就可以知道哪些客户数据到达了，大大提高了效率**

#### 简单理解

第一种 select/poll

![image-20230821102813978](https://img-blog.csdnimg.cn/ef95d11175684337bc47cf9fd72087f3.png)

第二种 epoll

![image-20230821102923936](https://img-blog.csdnimg.cn/b74bcb79a7974aff897882f972cb21ea.png)

#### select

主旨思想： 

1. **首先要构造一个关于文件描述符的列表，将要监听的文件描述符添加到该列表中。** 
2. **调用一个系统函数，监听该列表中的文件描述符，直到这些描述符中的一个或者多个进行 I/O 操作时，该函数才返回。 **
   **a.这个函数是阻塞的 **
   **b.函数对文件描述符的检测的操作是由内核完成的**
3. **在返回时，它会告诉进程有多少（哪些）描述符要进行I/O操作。**

~~~cpp
// sizeof(fd_set) = 128(个字节) 1024(个bit位)
#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>
#include <sys/select.h>
int select(int nfds, fd_set *readfds, fd_set *writefds, fd_set *exceptfds, struct timeval *timeout);
    - 参数：
    	- nfds : 委托内核检测的最大文件描述符的值 + 1，传这个参数是是为了提高效率，没必要遍历最大文件描述符之后的，+1是底层实现的逻辑规定的要+1，我猜测可能类似于 for(int i = 0 ; i < nfds + 1 ;++i)，这样刚好最后一个能被遍历到
    	- readfds : 要检测的文件描述符的读的集合，委托内核检测哪些文件描述符的读的属性
    			 - 一般检测读操作
    			 - 对应的是对方发送过来的数据，因为读是被动的接收数据，检测的就是读缓冲区是否有数据，有的话就可以进行读取
    			 - 是一个传入传出参数
    	- writefds : 要检测的文件描述符的写的集合，委托内核检测哪些文件描述符的写的属性
            	  - 一般不检测写操作 
    			 - 委托内核检测写缓冲区是不是还可以写数据，没有满就可以继续向其中写入数据
    	- exceptfds : 检测发生异常的文件描述符的集合
    	- timeout : 设置的超时时间
        struct timeval {
            long tv_sec; /* seconds */
            long tv_usec; /* microseconds */
        };
            - NULL : 永久阻塞，直到检测到了文件描述符有变化，才会往下执行并且返回
            - tv_sec = 0 tv_usec = 0， 不阻塞
            - tv_sec > 0 tv_usec > 0， 阻塞对应的时间
            - 返回值 :
                  -1 : 失败
                  >0(n) : 检测的集合中有n个文件描述符发生了变化
// 将参数文件描述符fd对应的标志位设置为0
void FD_CLR(int fd, fd_set *set);
// 判断fd对应的标志位是0还是1， 返回值 ： fd对应的标志位的值，0，返回0， 1，返回1
int FD_ISSET(int fd, fd_set *set);
// 将参数文件描述符fd 对应的标志位，设置为1
void FD_SET(int fd, fd_set *set);
// fd_set一共有1024 bit, 全部初始化为0
void FD_ZERO(fd_set *set);
~~~

**在我们的例子当中，我们需要检测的是文件描述符中读的属性，因此我们就将 fd_set 类型中对应要检测的文件描述符的对应的标志位设为1表示我要检测，然后传给select()函数遍历，如果文件描述符为0则表示不用检测跳过，为1则委托内核去帮我们进行检测，如果确实有数据来了就将该标志位仍保持为1，没有则修改为0，最后把修改之后的 readfds 返回，就得到了有数据的集合，但是select()的返回值不会告诉我们哪些值发生了变化，只会告诉我们有几个，n个返回n，至于是那些需要我们自己遍历**

##### 工作过程分析

**在函数执行的过程中，系统先把用户区的这份文件描述符集合拷贝一份到内核当中，然后在内核当中检测标志位并且根据实际情况(比如这里就是哪些文件描述符的读端数据到达了)然后修改标志位，0就是没有，1就是有，然后从内核态重新拷贝到用户态，工作过程大致就是这样**

![image-20230821132937309](https://img-blog.csdnimg.cn/804d90a244f44ffebb08f73d08988b44.png)

##### 代码

~~~cpp
// Client_Info.h
#ifndef _CLIENT_INFO_
#define _CLIENT_INFO_

#include <arpa/inet.h>

#include <cstring>

#define MAX_IPV4_STRING 16

class Client_Info {
public:
    Client_Info() {
        __init__();
    };

    Client_Info& operator=(const Client_Info& _cli_info) {
        strcpy(this->client_ip, _cli_info.client_ip);
        this->client_port = _cli_info.client_port;

        return *this;
    }

    Client_Info(const char* _ip, const in_port_t& _port) {
        strcpy(this->client_ip, _ip);
        this->client_port = _port;
    }

    Client_Info(const Client_Info& _cli_info) {
        *this = _cli_info;
    }

    void __init__() {
        bzero(this->client_ip, sizeof(this->client_ip));
        this->client_port = 0;
    }

public:
    char client_ip[MAX_IPV4_STRING];
    in_port_t client_port;
};

#endif
~~~

以下是服务端和客户端

~~~cpp
// server.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <unistd.h>

#include "Client_Info.h"

#define MAXSIZE 1024
#define MAX_CLIENT_SIZE 1024

// 全局存放客户端连接的IP和端口
class Client_Info cli_infos[MAX_CLIENT_SIZE];

// 全局存放需要检测的文件描述符的数组
fd_set read_set;

int bigger(const int& val1, const int& val2) {
    return val1 > val2 ? val1 : val2;
}

void Communicate(const int& _connect_fd) {
    char* _client_ip = cli_infos[_connect_fd].client_ip;
    in_port_t& _client_port = cli_infos[_connect_fd].client_port;

    char buf[MAXSIZE] = {0};
    // 读
    bzero(buf, sizeof(buf));
    int len = read(_connect_fd, buf, sizeof(buf) - 1);
    if (-1 == len) {
        perror("read");
        exit(-1);
    }
    if (len > 0)
        printf("recv client (ip : %s , port : %d) : %s", _client_ip, _client_port, buf);
    else if (0 == len) {  // 客户端关闭
        printf("client ip : %s , port : %d has closed...\n", _client_ip, _client_port);
        // 这里关闭之后需要移除文件描述符集合中的标志位表示我不需要监听这个了
        FD_CLR(_connect_fd, &read_set);
        // 关闭文件描述符
        close(_connect_fd);
        return;
    }
    // 写
    write(_connect_fd, buf, strlen(buf));
}

int main() {
    // 1.创建socket
    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (-1 == listen_fd) {
        perror("socket");
        return -1;
    }

    // 设置一下端口复用
    int _optval = 1;
    setsockopt(listen_fd, SOL_SOCKET, SO_REUSEPORT, &_optval, sizeof(_optval));

    // 2.绑定IP和端口
    struct sockaddr_in server_addr;
    // 地址族
    server_addr.sin_family = AF_INET;
    // IP
    server_addr.sin_addr.s_addr = INADDR_ANY;
    // 端口
    server_addr.sin_port = htons(9999);

    int ret = bind(listen_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    if (-1 == ret) {
        perror("bind");
        return -1;
    }

    printf("server has initialized.\n");

    // 3.开始监听
    ret = listen(listen_fd, 8);
    if (-1 == ret) {
        perror("listen");
        return -1;
    }

    // 使用NIO模型，创建fd_set集合，存放的是需要检测的文件描述符
    // 全局定义 read_set
    // 初始化
    FD_ZERO(&read_set);
    // 添加需要检测的文件描述符
    FD_SET(listen_fd, &read_set);
	// 定义最大的文件描述符序号(参数里面要加1)
    int max_fd = listen_fd;

    // 这个地方我不能把read_set集合拿进去让内核进行拷贝修改然后覆盖我的这个
    // 我们设想这样一种情况，AB都检测，A发数据，B的被修改为0，但是下一次我肯定还要检测B的啊

    while (1) {
        fd_set tmp_set = read_set;
        // 调用select系统函数，让内核帮忙检测哪些文件描述符有数据
        // 这里是在检测listen_fd，因为如果有客户端请求连接了，那么这里listen_fd肯定会有数据进来
        ret = select(max_fd + 1, &tmp_set, nullptr, nullptr, nullptr);
        if (-1 == ret) {
            perror("select");
            return -1;
        } else if (0 == ret)
            // 为0表示超时并且没有检测到有改变的
            continue;  // 这里我们的设置因为是阻塞的，所以不会走到这里
        else if (ret > 0) {
            // 说明检测到了有文件描述符对应缓冲区的数据发生了改变
            if (FD_ISSET(listen_fd, &tmp_set)) {
                // 表示有新的客户端连接进来了
                struct sockaddr_in client_addr;
                socklen_t client_addr_len = sizeof(client_addr);
                int connect_fd = accept(listen_fd, (struct sockaddr*)&client_addr, &client_addr_len);

                if (-1 == connect_fd) {
                    perror("accept");
                    return -1;
                }

                // 获取客户端的信息
                char ip[MAX_IPV4_STRING] = {0};
                inet_ntop(AF_INET, &client_addr.sin_addr.s_addr, ip, sizeof(ip));

                in_port_t port = ntohs(client_addr.sin_port);

                // 打印信息
                printf("client ip : %s , port : %d has connected...\n", ip, port);

                // 将客户端的信息保存到全局数组中
                cli_infos[connect_fd] = Client_Info(ip, port);

                // 将新的文件描述符加入到集合中，这样select()就可以监听客户端的数据了
                FD_SET(connect_fd, &read_set);
                // 更新max_fd
                max_fd = bigger(connect_fd, max_fd);
            }

            // 看完监听的文件描述符，还要看其他的文件描述符标识位
            for (int i = listen_fd + 1; i < max_fd + 1; ++i) {
                if (FD_ISSET(i, &tmp_set))
                    // 表示有数据到来，进行通信，服务端只处理一次，然后又重新检测是否有数据，有数据则又走这段代码
                    // 并且如果服务端里面处理用循环处理，那么这个客户端一直抢占者服务端，其他服务端没办法发送数据
                    Communicate(i);
            }
        }
    }

    // 4.关闭连接
    close(listen_fd);

    return 0;
}
~~~

~~~cpp
// client.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <unistd.h>

#define MAXSIZE 1024

int main() {
    // 1.创建套接字
    int connect_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (-1 == connect_fd) {
        perror("socket");
        return -1;
    }

    // 2.建立连接
    struct sockaddr_in server_addr;
    // 地址族
    server_addr.sin_family = AF_INET;
    // 端口
    server_addr.sin_port = htons(9999);
    // IP
    inet_pton(AF_INET, "127.0.0.2", &server_addr.sin_addr.s_addr);

    int ret = connect(connect_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    if (-1 == ret) {
        perror("connect");
        return -1;
    }

    printf("connected successfully , waiting for communicating.\n");

    char buf[MAXSIZE] = {0};
    // 3.开始通信
    while (1) {
        // 写
        bzero(buf, sizeof(buf));
        fgets(buf, sizeof(buf), stdin);

        // 增加退出功能
        if (strcmp(buf, "quit\n") == 0 || strcmp(buf, "QUIT\n") == 0)
            goto END;

        write(connect_fd, buf, strlen(buf));
        printf("send : %s", buf);

        // 读
        bzero(buf, sizeof(buf));
        int len = read(connect_fd, buf, sizeof(buf) - 1);
        if (-1 == len) {
            perror("read");
            return -1;
        }
        if (len > 0)
            printf("recv : %s", buf);
        else if (0 == len) {  // 说明写端关闭，也就是服务端关闭
            printf("server has closed...\n");
            break;
        }
    }

END:
    // 4.关闭连接
    close(connect_fd);

    return 0;
}
~~~

##### 代码分析

好，现在我们来分析一下这段代码

首先我们使用的是，NIO模型，就是不阻塞，而是轮询，所以我们需要使用while循环来实现这个机制，然后在select()基础上我们要确认需要检测的文件描述符的读的状态，所以我们定义 fd_set read_set ，由于监听的listen_fd当有客户端连接的时候也是算有数据进入，对应read_set[]的标志位会改变，所以将其添加进去

~~~cpp
// 先初始化
FD_ZERO(&read_set);
// 添加需要检测的文件描述符
FD_SET(listen_fd, &read_set);
~~~

之后进入while循环我们检测是否有变化，有变化则说明有新客户端连接或者连接上的客户端有数据进入，这里我们设置阻塞等待变化，当然也可以设置一个等待的周期时间

注意返回值 ret 代表的是检测到变化的个数，-1表示错误，0表示没有，可以重开循环(但是我们这里不会，因为我们阻塞)；>0则表示有变化，我们可以进行后续处理

~~~cpp
ret = select(max_fd + 1, &tmp_set, nullptr, nullptr, nullptr);
~~~

可能是新客户端连接或者已连接的客户端发送数据，分别如下：

**新客户端连接**

~~~cpp
// 表示有新的客户端连接进来了
struct sockaddr_in client_addr;
socklen_t client_addr_len = sizeof(client_addr);
int connect_fd = accept(listen_fd, (struct sockaddr*)&client_addr, &client_addr_len);

if (-1 == connect_fd) {
    perror("accept");
    return -1;
}

// 获取客户端的信息
char ip[MAX_IPV4_STRING] = {0};
inet_ntop(AF_INET, &client_addr.sin_addr.s_addr, ip, sizeof(ip));

in_port_t port = ntohs(client_addr.sin_port);

// 打印信息
printf("client ip : %s , port : %d has connected...\n", ip, port);

// 将客户端的信息保存到全局数组中
cli_infos[connect_fd] = Client_Info(ip, port);

// 将新的文件描述符加入到集合中，这样select()就可以监听客户端的数据了
FD_SET(connect_fd, &read_set);
// 更新max_fd
max_fd = bigger(connect_fd, max_fd);
~~~

我们不看上面打印信息的部分，看最后两句

- 我们将新的connect_fd添加到read_set当中，这样就可以检测了
- 我们更新的max_fd，这样可以提高效率

**已经连接上的客户端收到数据**

我们就从listen_fd开始遍历，因为listen_fd最开始创建，在普遍情况下是最小的，遍历到max_fd为止

~~~cpp
// 看完监听的文件描述符，还要看其他的文件描述符标识位
for (int i = listen_fd + 1; i < max_fd + 1; ++i) {
    if (FD_ISSET(i, &tmp_set))
        // 表示有数据到来，进行通信，服务端只处理一次，然后又重新检测是否有数据，有数据则又走这段代码
        // 并且如果服务端里面处理用循环处理，那么这个客户端一直抢占者服务端，其他服务端没办法发送数据
        Communicate(i);
}
~~~

接下来我们看通信函数

我们注意到一个细节，就是没有使用while循环，这是为什么呢？

因为如果服务端里面处理用循环处理，那么这个客户端一直抢占者服务端，其他服务端没办法发送数据；

并且我不用循环处理我把数据读了就结束函数，然后又重新开始检测，代码里移除标志位并且关闭文件描述符是在写端关闭的时候，这时候也是合情合理的

~~~cpp
void Communicate(const int& _connect_fd) {
    char* _client_ip = cli_infos[_connect_fd].client_ip;
    in_port_t& _client_port = cli_infos[_connect_fd].client_port;

    char buf[MAXSIZE] = {0};
    // 读
    bzero(buf, sizeof(buf));
    int len = read(_connect_fd, buf, sizeof(buf) - 1);
    if (-1 == len) {
        perror("read");
        exit(-1);
    }
    if (len > 0)
        printf("recv client (ip : %s , port : %d) : %s", _client_ip, _client_port, buf);
    else if (0 == len) {  // 客户端关闭
        printf("client ip : %s , port : %d has closed...\n", _client_ip, _client_port);
        // 这里关闭之后需要移除文件描述符集合中的标志位表示我不需要监听这个了
        FD_CLR(_connect_fd, &read_set);
        // 关闭文件描述符
        close(_connect_fd);
        return;
    }
    // 写
    write(_connect_fd, buf, strlen(buf));
}
~~~

我们的代码中还有一个细节

就是在这里为什么要用tmp_set，有的地方是read_set，有的地方是tmp_set

这个地方我不能把read_set集合拿进去让内核进行拷贝修改然后覆盖我的这个；

我们设想这样一种情况，AB都检测，A发数据，B的被修改为0，但是下一次我肯定还要检测B的啊，这就出现问题了

所以我们想到的解决方案就是使用临时变量，但是像新客户端连接，写端关闭的时候删除文件描述符的检测这些还是要操作read_set，也很好理解

<img src="https://img-blog.csdnimg.cn/91c795f91f9842abaae9ff0ec3e2552a.png" alt="image-20230821162010058" style="zoom: 80%;" />

#### poll

**poll技术是对select技术进行改进，所以select技术肯定具有缺点**

##### select技术的缺点

当客户端多了的时候，也就是fd多了的时候，就会出现如下的一系列问题

**其中的第四条就是不使用临时 tmp_set 的问题，read_set应该要继续检测的部分被置为0了，就因为这个时候没有数据进来，所以言下之意就是不能重用，每次都需要重置**

![image-20230821162714320](https://img-blog.csdnimg.cn/a90dd7c747d64f47850f7c74b17ce789.png)

##### poll()

**使用时引头文件 <poll.h>**

~~~cpp
#include <poll.h>
struct pollfd {
    int fd; /* 委托内核检测的文件描述符 */
    short events; /* 委托内核检测文件描述符的什么事件 */
    short revents; /* 文件描述符实际发生的事件 */
};

struct pollfd myfd;
myfd.fd = 5;
myfd.events = POLLIN | POLLOUT;

int poll(struct pollfd *fds, nfds_t nfds, int timeout);
    - 参数：
        - fds : 是一个struct pollfd 结构体数组，这是一个需要检测的文件描述符的集合
        - nfds : 这个是第一个参数数组中最后一个有效元素的下标 + 1
        - timeout : 阻塞时长
            0 : 不阻塞
            -1 : 阻塞，当检测到需要检测的文件描述符有变化，解除阻塞
            >0 : 阻塞的时长，单位是毫秒
    - 返回值：
        -1 : 失败
        >0（n） : 成功,n表示检测到集合中有n个文件描述符发生变化
~~~

![image-20230821095539250](https://img-blog.csdnimg.cn/aff558d48a9347b2811ae03f6451333f.png)

##### 代码

代码的架构和前面的几乎没有区别，只有server.cpp进行了修改，这里只放出server.cpp

~~~cpp
// server.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <poll.h>
#include <unistd.h>

#include "Client_Info.h"

#define MAXSIZE 1024
#define MAX_CLIENT_SIZE 1024
#define MAX_POLLFD_SIZE 1025

// 全局存放客户端连接的IP和端口
class Client_Info cli_infos[MAX_CLIENT_SIZE];

// 全局存放需要检测的文件描述符数组
struct pollfd fds[MAX_POLLFD_SIZE];

int bigger(const int& val1, const int& val2) {
    return val1 > val2 ? val1 : val2;
}

void Communicate(const int& _index) {
    int _connect_fd = fds[_index].fd;

    char* _client_ip = cli_infos[_connect_fd].client_ip;
    in_port_t& _client_port = cli_infos[_connect_fd].client_port;

    char buf[MAXSIZE] = {0};
    // 读
    bzero(buf, sizeof(buf));
    int len = read(_connect_fd, buf, sizeof(buf) - 1);
    if (-1 == len) {
        perror("read");
        exit(-1);
    }
    if (len > 0)
        printf("recv client (ip : %s , port : %d) : %s", _client_ip, _client_port, buf);
    else if (0 == len) {  // 客户端关闭
        printf("client ip : %s , port : %d has closed...\n", _client_ip, _client_port);
        // 关闭文件描述符
        close(_connect_fd);
        // 将对应的文件描述符置为-1
        fds[_index].fd = -1;
        return;
    }
    // 写
    write(_connect_fd, buf, strlen(buf));
}

int main() {
    // 1.创建socket
    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (-1 == listen_fd) {
        perror("socket");
        return -1;
    }

    // 设置一下端口复用
    int _optval = 1;
    setsockopt(listen_fd, SOL_SOCKET, SO_REUSEPORT, &_optval, sizeof(_optval));

    // 2.绑定IP和端口
    struct sockaddr_in server_addr;
    // 地址族
    server_addr.sin_family = AF_INET;
    // IP
    server_addr.sin_addr.s_addr = INADDR_ANY;
    // 端口
    server_addr.sin_port = htons(9999);

    int ret = bind(listen_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    if (-1 == ret) {
        perror("bind");
        return -1;
    }

    printf("server has initialized.\n");

    // 3.开始监听
    ret = listen(listen_fd, 8);
    if (-1 == ret) {
        perror("listen");
        return -1;
    }

    // 使用NIO模型，使用poll解决问题
    // 初始化检测的文件描述符数组
    for (int i = 0; i < MAX_POLLFD_SIZE; ++i) {
        fds[i].fd = -1;
        fds[i].events = POLLIN;  // 表示一会儿要去检测读事件
    }
    // 加入监听的文件描述符
    fds[0].fd = listen_fd;

    // 定义最大的文件描述符的fds[]数组的索引
    int nfds = 0;

    while (1) {
        // 调用poll()函数，这是select()函数的改进版本
        ret = poll(fds, nfds + 1, -1);
        if (-1 == ret) {
            perror("select");
            return -1;
        } else if (0 == ret)
            // 为0表示超时并且没有检测到有改变的
            continue;  // 这里我们的设置因为是阻塞的，所以不会走到这里
        else if (ret > 0) {
            // 说明检测到了有文件描述符对应缓冲区的数据发生了改变
            if (fds[0].revents & POLLIN == POLLIN) {
                // 表示有新的客户端连接进来了
                struct sockaddr_in client_addr;
                socklen_t client_addr_len = sizeof(client_addr);
                int connect_fd = accept(listen_fd, (struct sockaddr*)&client_addr, &client_addr_len);

                if (-1 == connect_fd) {
                    perror("accept");
                    return -1;
                }

                // 获取客户端的信息
                char ip[MAX_IPV4_STRING] = {0};
                inet_ntop(AF_INET, &client_addr.sin_addr.s_addr, ip, sizeof(ip));

                in_port_t port = ntohs(client_addr.sin_port);

                // 打印信息
                printf("client ip : %s , port : %d has connected...\n", ip, port);

                // 将客户端的信息保存到全局数组中
                cli_infos[connect_fd] = Client_Info(ip, port);

                // 将新的文件描述符加入到事件中，注意文件描述符的优先用小的机制
                for (int i = 1; i < MAX_POLLFD_SIZE; ++i)
                    if (fds[i].fd == -1) {
                        fds[i].fd = connect_fd;
                        fds[i].events = POLLIN;
                        // 更新nfds
                        nfds = bigger(nfds, i);
                        break;
                    }
            }

            // 看完监听的文件描述符，看其他的文件描述符是否收到数据
            for (int i = 1; i < nfds + 1; ++i) {
                if (fds[i].revents & POLLIN == POLLIN)
                    Communicate(i);
            }
        }
    }

    // 4.关闭连接
    close(listen_fd);

    return 0;
}
~~~

##### 代码分析

首先我们要理解结构体 pollfd 的含义

**这是用来保存委托内核检测的文件描述符；委托内核检测的文件描述符的什么事件，比如读写，类似于select中的read_set；还有检测过后实际发生的事件，比如没有读，就修改，类似于select中的 tmp_set；的一个结构体**

~~~cpp
struct pollfd {
    int fd; /* 委托内核检测的文件描述符 */
    short events; /* 委托内核检测文件描述符的什么事件 */
    short revents; /* 文件描述符实际发生的事件 */
};
~~~

值得注意的是这些事件的类型和存储方法，是short类型的，我们来看它可以描述哪些事件

![image-20230821095539250](https://img-blog.csdnimg.cn/aff558d48a9347b2811ae03f6451333f.png)

**其实他和文件属性stat变量里面st_mode(表示文件类型和权限)是一个道理，一个bit位表示一个权限，1表示有，0表示没有，因此添加权限应该用 按位或 | ， 这里的事件也是一样的道理，我们一般判断读事件就POLLIN，写事件就POLLOUT**

**第三个参数就是经过检测之后的状态，可以用它来判断是否有检测到读；由于我们设置的event没有变化，所以相对于select()还是好了很多**

**其次，我们查看poll()接口的第一个参数是： struct pollfd *fds，需要一个结构体的数组传入进来，每一个元素就封装了一个文件描述符对应的信息，我们从0开始依次记录，如果该元素的fd为-1就表示没有使用，可以存放新的元素，注意这个下标，或者我们称他为索引，索引的值和文件描述符的值是不同的，为了提高效率我们这么设计，在代码中一定要注意，其他的逻辑没什么区别**

还有一点，我们看如何判断最后的 revents 检测到读信息

**还是前面的思想，每一位对应一个，读对应一位为1，其他为0；当然为什么不是直接相等呢？可能我们设置了其他性质也需要检测，内核处理后还是有了其他的性质为1，我们最好不要冒险，所以这里我们用 & **

~~~cpp
if (fds[i].revents & POLLIN == POLLIN)
    //下面的操作
~~~

#### epoll

**epoll和前面两种技术不同，epoll技术直接在内核态当中进行操作，完全省去了用户态到内核态拷贝的过程，并且由内核通知用户，实现了内核和用户的并发操作，提高了效率。**

##### 工作过程分析

select技术和poll技术虽然实现方式有所不同，poll技术是select技术的改进，但是他们在实际操作的时候都是先在用户区生成一个表，select就是文件描述符表，对应位置置为1，下标表示为文件描述符；poll技术是用事件表示的，并且定义了我们想要的检测事件和实际发生的事件供我们比对，比如我们想要检测读事件，他返回0则表示没发生，两个都定义出来就免去了我们用临时变量的麻烦；好，这两个都是先在用户区然后拷贝到内核区然后再回来，众所周知，从内核区到用户区的二者切换要消耗CPU资源，所以一旦文件描述符多了，检测的事件多了就会影响性能

**所以才有了epoll的技术，调用epoll之后会直接在内核区生成检测事件的东西，系统会提供给我们epoll的一系列API来帮助我们操作内核中的这块区域，从图中我们可以看出定义为 eventpoll ，里面比较重要的存着 rbr 和 rdlist，前者的数据结构是红黑树，是我们想要检测的事件体，红黑树使得查询和遍历非常快；后者的数据结构是双链表，是检测事件发生变化，在网络编程中就是有读的数据进来或者新客户端连接，用双链表可以直接了当的遍历出来**

**总结一下，二者的区别一是epoll省去了从用户态到内核态相互的切换，直接在内核态操作，效率更高；二是epoll不仅返回了检测到了多少个，而且还直接通过双链表的形式告诉我们哪几个返回了，而select和poll技术并未做到这一点，select技术修改了我们传给他的表，返回值是检测到了多少个，但是哪些变化了需要我们遍历这个以文件描述符为下标的表；poll技术给每个需要检测的文件描述符封装了一个结构体，并且保存了需要检测的事件和实际发生的事件，但是仍然需要我们去遍历poll()参数中的pollfd结构体数组才行；但是epoll却将检测到的事件封装在双链表 rdlist 中，由此可见这就是他的优势**

![image-20230821194458779](https://img-blog.csdnimg.cn/0dd32b37de6842c6ac965b85fa345e07.png)

##### epoll() 

**epoll创建在内核区的东西操作是通过API返回的文件描述符操作的，这也是和select和poll技术不同的地方，select技术用 fd_set 变量(本质是个数组)，poll技术用 pollfd 结构体数组，这些东西在代码中都是在用户区的；而epoll用文件描述符托管也代表内核区的性质**

~~~cpp
#include <sys/epoll.h>
// 创建一个新的epoll实例。在内核中创建了一个数据，这个数据中有两个比较重要的数据，一个是需要检测的文件描述符的信息（红黑树），还有一个是就绪列表，存放检测到数据发送改变的文件描述符信息（双向链表）。
int epoll_create(int size);
    - 参数：
    	size : 目前没有意义了。随便写一个数，必须大于0
    - 返回值：
        -1 : 失败
        > 0 : 文件描述符，操作epoll实例的
            
// 结构类型是联合union，我们一般使用 fd 参数就行了
typedef union epoll_data {
    void *ptr;
    int fd;
    uint32_t u32;
    uint64_t u64;
} epoll_data_t;

struct epoll_event {
    uint32_t events; /* Epoll events */
    epoll_data_t data; /* User data variable */
};
常见的Epoll检测事件events：
    - EPOLLIN
    - EPOLLOUT
    - EPOLLERR

// 对epoll实例进行管理：添加文件描述符信息，删除信息，修改信息
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);
    - 参数：
        - epfd : epoll实例对应的文件描述符
        - op : 要进行什么操作
            EPOLL_CTL_ADD: 添加
            EPOLL_CTL_MOD: 修改
            EPOLL_CTL_DEL: 删除
        - fd : 要检测的文件描述符
        - event : 检测文件描述符什么事情
            
// 检测函数
int epoll_wait(int epfd, struct epoll_event *events, int maxevents, int timeout);
    - 参数：
        - epfd : epoll实例对应的文件描述符
        - events : 传出参数，保存了发送了变化的文件描述符的信息，是一个结构体数组
        - maxevents : 第二个参数结构体数组的大小
        - timeout : 阻塞时间
              0 : 不阻塞
              -1 : 阻塞，直到检测到fd数据发生变化，解除阻塞
              > 0 : 阻塞的时长（毫秒）
        - 返回值：
            - 成功，返回发送变化的文件描述符的个数 > 0
            - 失败 -1
~~~

##### 代码和分析

还是只放server.cpp

~~~cpp
// server.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <sys/epoll.h>
#include <unistd.h>

#include "Client_Info.h"

#define MAX_CLIENT_SIZE 1024
#define MAX_BUF_SIZE 1024

// 全局存放客户端连接的IP和端口
class Client_Info cli_infos[MAX_CLIENT_SIZE];

void Communicate(const struct epoll_event &_ret_event, const int &_epoll_fd) {
    int _connect_fd = _ret_event.data.fd;
    // 读
    char buf[MAX_BUF_SIZE] = {0};
    int len = read(_connect_fd, buf, sizeof(buf) - 1);
    if (-1 == len) {
        perror("read");
        exit(-1);
    }

    if (len > 0)
        printf("client (ip : %s , port : %d) recv : %s", cli_infos[_connect_fd].client_ip, cli_infos[_connect_fd].client_port, buf);
    else if (0 == len) {
        // 写端，客户端关闭连接
        printf("client (ip : %s , port : %d) has closed...\n", cli_infos[_connect_fd].client_ip, cli_infos[_connect_fd].client_port);
        // 从检测事件中删除他
        epoll_ctl(_epoll_fd, EPOLL_CTL_DEL, _connect_fd, nullptr);
        // 关闭文件描述符
        close(_connect_fd);

        return;
    }
    // 写
    write(_connect_fd, buf, strlen(buf));
}

int main() {
    // 1.创建socket套接字
    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (-1 == listen_fd) {
        perror("socket");
        return -1;
    }

    // 设置端口复用
    int _optval = 1;
    int ret = setsockopt(listen_fd, SOL_SOCKET, SO_REUSEPORT, &_optval, sizeof(_optval));
    if (-1 == ret) {
        perror("setsockopt");
        return -1;
    }

    // 2.绑定IP和端口
    struct sockaddr_in server_addr;
    // 地址族
    server_addr.sin_family = AF_INET;
    // IP
    server_addr.sin_addr.s_addr = INADDR_ANY;
    // 端口
    server_addr.sin_port = htons(9999);

    ret = bind(listen_fd, (struct sockaddr *)&server_addr, sizeof(server_addr));
    if (-1 == ret) {
        perror("bind");
        return -1;
    }

    // 3.监听端口
    ret = listen(listen_fd, 8);
    if (-1 == ret) {
        perror("listen");
        return -1;
    }

    printf("server has initialized.\n");

    // 4.用epoll技术实现接受客户端和进行通信
    // 创建epoll示例
    int epoll_fd = epoll_create(1);
    if (-1 == epoll_fd) {
        perror("epoll_create");
        return -1;
    }

    // 将监听套接字添加进入检测中
    struct epoll_event listen_event;
    listen_event.events = EPOLLIN;     // 检测读
    listen_event.data.fd = listen_fd;  // 文件描述符

    epoll_ctl(epoll_fd, EPOLL_CTL_ADD, listen_fd, &listen_event);

    int _maxevents = MAX_CLIENT_SIZE;

    // 开始检测
    while (1) {
        // 这个结构体数组存放了检测到的文件描述符的信息，保存在这里面
        // 内核中是把双链表中的数据写入到这里
        struct epoll_event ret_events[_maxevents];

        // 返回值是表示有多少个被检测到了；第三个参数可以一般放数组的最大容量
        int ret = epoll_wait(epoll_fd, ret_events, _maxevents, -1);
        if (-1 == ret) {
            perror("epoll_wait");
            return -1;
        }

        // 检测到了，开始处理
        for (int i = 0; i < ret; ++i) {
            if (ret_events[i].events && EPOLLIN == EPOLLIN) {
                if (ret_events[i].data.fd == listen_fd) {
                    // 表示有新客户端连接
                    struct sockaddr_in client_addr;
                    socklen_t client_addr_len = sizeof(client_addr);

                    int connect_fd = accept(listen_fd, (struct sockaddr *)&client_addr, &client_addr_len);
                    if (-1 == connect_fd) {
                        perror("accept");
                        return -1;
                    }

                    // 设置read非阻塞
                    int flag = fcntl(connect_fd, F_GETFL);
                    flag |= O_NONBLOCK;
                    fcntl(connect_fd, F_SETFL, flag);
                    
                    // 将客户端信息存入结构体数组，下标用connect_fd代替
                    inet_ntop(AF_INET, &client_addr.sin_addr.s_addr, cli_infos[connect_fd].client_ip, sizeof(cli_infos[connect_fd].client_ip));
                    cli_infos[connect_fd].client_port = ntohs(client_addr.sin_port);

                    printf("client (ip : %s , port : %d) has connected...\n", cli_infos[connect_fd].client_ip, cli_infos[connect_fd].client_port);

                    // 添加到检测中
                    struct epoll_event connect_event;
                    connect_event.data.fd = connect_fd;
                    connect_event.events = EPOLLIN;

                    epoll_ctl(epoll_fd, EPOLL_CTL_ADD, connect_fd, &connect_event);
                } else  // 客户端接收到数据
                    Communicate(ret_events[i], epoll_fd);
            }
        }
    }

    // 5.关闭连接
    close(epoll_fd);
    close(listen_fd);

    return 0;
}
~~~

这段代码的思路和前面的基本没有区别，就是先创建epoll_create()的示例，由于内核区的数据用文件描述符操作

~~~cpp
int epoll_fd = epoll_create(1);
~~~

然后将监听套接字加入到检测当中

~~~cpp
// 将监听套接字添加进入检测中
struct epoll_event listen_event;
listen_event.events = EPOLLIN;     // 检测读
listen_event.data.fd = listen_fd;  // 文件描述符

epoll_ctl(epoll_fd, EPOLL_CTL_ADD, listen_fd, &listen_event);
~~~

然后不断循环，调用epoll_wait()接口检测哪些发生了变化

我们来重点关注下这个接口的参数，第一个参数是epoll示例的文件描述符epoll_fd，第二个参数是保存检测到发生变化的结构体数组，类型是epoll_event，第三个参数是这个结构体数组的最大容量，可以自己设定，因为一般放不满，他也是从头开始放所以我们给你一个最大的值 _maxevents 就行，第四个参数是阻塞时间，这里设置-1表示阻塞

~~~cpp
while (1) {
    // 这个结构体数组存放了检测到的文件描述符的信息，保存在这里面
    // 内核中是把双链表中的数据写入到这里
    struct epoll_event ret_events[_maxevents];

    // 返回值是表示有多少个被检测到了；第三个参数可以一般放数组的最大容量
    int ret = epoll_wait(epoll_fd, ret_events, _maxevents, -1);
    if (-1 == ret) {
        perror("epoll_wait");
        return -1;
    }
    
    //后续代码
    ...
}
~~~

之后就是分新客户端连接和已连接客户端发送数据了

从0遍历到epoll_wait()接口的返回值，因为返回的是检测到的个数，刚好告诉我了我就用

~~~cpp
for (int i = 0; i < ret; ++i) {
    if (ret_events[i].events && EPOLLIN == EPOLLIN) {
        if (ret_events[i].data.fd == listen_fd) {
            // 表示有新客户端连接
            struct sockaddr_in client_addr;
            socklen_t client_addr_len = sizeof(client_addr);

            int connect_fd = accept(listen_fd, (struct sockaddr *)&client_addr, &client_addr_len);
            if (-1 == connect_fd) {
                perror("accept");
                return -1;
            }

            // 将客户端信息存入结构体数组，下标用connect_fd代替
            inet_ntop(AF_INET, &client_addr.sin_addr.s_addr, cli_infos[connect_fd].client_ip, sizeof(cli_infos[connect_fd].client_ip));
            cli_infos[connect_fd].client_port = ntohs(client_addr.sin_port);

            printf("client (ip : %s , port : %d) has connected...\n", cli_infos[connect_fd].client_ip, cli_infos[connect_fd].client_port);

            // 添加到检测中
            struct epoll_event connect_event;
            connect_event.data.fd = connect_fd;
            connect_event.events = EPOLLIN;

            epoll_ctl(epoll_fd, EPOLL_CTL_ADD, connect_fd, &connect_event);
        } else  // 客户端接收到数据
            Communicate(ret_events[i], epoll_fd);
    }
}
~~~

communicate()接口和之前的没什么区别，就针对修改了一点，注意还是不是循环，因为出去了我们走下一次检测也是一样的

~~~cpp
void Communicate(const struct epoll_event &_ret_event, const int &_epoll_fd) {
    int _connect_fd = _ret_event.data.fd;
    // 读
    char buf[MAX_BUF_SIZE] = {0};
    int len = read(_connect_fd, buf, sizeof(buf) - 1);
    if (-1 == len) {
        perror("read");
        exit(-1);
    }

    if (len > 0)
        printf("client (ip : %s , port : %d) recv : %s", cli_infos[_connect_fd].client_ip, cli_infos[_connect_fd].client_port, buf);
    else if (0 == len) {
        // 写端，客户端关闭连接
        printf("client (ip : %s , port : %d) has closed...\n", cli_infos[_connect_fd].client_ip, cli_infos[_connect_fd].client_port);
        // 从检测事件中删除他
        epoll_ctl(_epoll_fd, EPOLL_CTL_DEL, _connect_fd, nullptr);
        // 关闭文件描述符
        close(_connect_fd);

        return;
    }
    // 写
    write(_connect_fd, buf, strlen(buf));
}
~~~

##### Epoll 的工作模式

- > **LT 模式 （水平触发）** 
  > 假设委托内核检测读事件 -> 检测fd的读缓冲区 
  > 读缓冲区有数据 - > epoll检测到了会给用户通知 
  > 	a.用户不读数据，数据一直在缓冲区，epoll 会一直通知 
  > 	b.用户只读了一部分数据，epoll会通知 
  > 	c.缓冲区的数据读完了，不通知
  >
  > **LT（level - triggered）是缺省的工作方式，并且同时支持 block 和 no-block socket。**在这 种做法中，内核告诉你一个文件描述符是否就绪了，然后你可以对这个就绪的 fd 进行 IO 操作。**如果你不作任何操作，内核还是会继续通知你的。**

- > **ET 模式（边沿触发）** 
  > 假设委托内核检测读事件 -> 检测fd的读缓冲区 
  > 读缓冲区有数据 - > epoll检测到了会给用户通知
  > a.用户不读数据，数据一致在缓冲区中，epoll下次检测的时候就不通知了 
  > b.用户只读了一部分数据，epoll不通知
  > c.缓冲区的数据读完了，不通知
  >
  > **ET（edge - triggered）是高速工作方式，只支持 no-block socket。**在这种模式下，当描述符从未就绪变为就绪时，内核通过epoll告诉你。然后它会假设你知道文件描述符已经就绪， 并且不会再为那个文件描述符发送更多的就绪通知，直到你做了某些操作导致那个文件描述 符不再为就绪状态了。**但是请注意，如果一直不对这个 fd 作 IO 操作（从而导致它再次变成 未就绪），内核不会发送更多的通知（only once）**。 **ET 模式在很大程度上减少了 epoll 事件被重复触发的次数，因此效率要比 LT 模式高。epoll 工作在 ET 模式的时候，必须使用非阻塞套接口，以避免由于一个文件句柄的阻塞读/阻塞写操作把处理多个文件描述符的任务饿死。**

~~~cpp
struct epoll_event {
    uint32_t events; /* Epoll events */
    epoll_data_t data; /* User data variable */
};
常见的Epoll检测事件：
    - EPOLLIN
    - EPOLLOUT
    - EPOLLERR
    - EPOLLET //设置边沿触发，Epoll技术默认的是水平触发，也就是在读完之前一直通知
~~~

##### LT模式(水平触发)

**LT模式是检测到有数据，如果我们用户不读或者没有读完，那么下一次仍旧会通知，也就是检测到，直到缓冲区的数据读完了之后才停止通知**

在这里我们把缓冲区的数组大小弄小点

~~~cpp
// 我将一次读取的大小弄小点
#define MAX_BUF_SIZE 5
~~~

然后故意多写点数据来看看输出结果：

客户端

![image-20230822113418607](https://img-blog.csdnimg.cn/c6d045587bd6415e869b394b7049029e.png)

服务端

![image-20230822113459363](https://img-blog.csdnimg.cn/43747cf17d2c41e19fd09e6956a5af13.png)

**我们明显可以看出，缓冲区调小之后，一次读不完，然后循环之后仍然能够检测得到，直到将其全部读完**

但是客户端为什么第二次有一部分数据留在缓冲区中没输出出来我就不知道了(这个真不知道)

##### ET模式(边沿触发)

**LT模式循环每次都会被内核提醒，这样的重复提醒对资源还是有很多的浪费的，所以ET模式假设我们已经知道这个提醒了，并且放在心上，马上就去处理它，所以后续内核不会提醒，这就是区别，也是提升效率的关键。因此如何读取到正确完整的数据就成了我们的关键**

首先我们给通信的文件描述符 connect_fd 设置ET属性，也就是加上 EPOLLET 宏

~~~cpp
// 添加到检测中
struct epoll_event connect_event;
connect_event.data.fd = connect_fd;
connect_event.events = EPOLLIN | EPOLLET;  // 设置边沿触发，结合非阻塞的API使用!!!
~~~

我们的通信函数保持不变，也就是没有循环操作，并且read()函数阻塞，结果如下：

客户端

![image-20230822114219505](https://img-blog.csdnimg.cn/9da81dffc21e43969da760a8a7097026.png)

服务端

![image-20230822114228554](https://img-blog.csdnimg.cn/a1332276ea664b16bce8704c67c085f8.png)

可以看出只读取了一次，后续就没有下文了，只有当我第二次手动让客户端检测，比如这里我输入字符，服务端才会继续收到数据，注意上次通信没读完，数据还在缓冲区中，是接着缓冲区读的，如下：

客户端

![image-20230822114407108](https://img-blog.csdnimg.cn/08ee9bce838546ee9dd428ffe8a4c6bc.png)

服务端

![image-20230822114413347](https://img-blog.csdnimg.cn/11482b8639a24b5699b19ec887696cf1.png)

好，既然想到了读不完，那么我们就需要循环读，但是循环读如果配上阻塞的read()函数，读完了就会阻塞在那里，程序就尬住了，其他工作没办法做，这也是前面提到的需要使用非阻塞non-block的API，因此这里我们需要设置read()为非阻塞

设置read()为非阻塞需要依赖于他的文件描述符，而关于文件描述符有fcntl()函数可以获取或者设置信息

**注意看到这些什么属性或者标志位为int short这种数字类型，第一反应想到用二进制01表示，因为这样最省空间**

~~~cpp
// 设置非阻塞，否则读完就阻塞在这里，read非阻塞通过文件描述符操作
int _flag = fcntl(connect_fd, F_GETFL);
_flag |= O_NONBLOCK;  // 不能把原来的属性设置没了所以先获得
fcntl(connect_fd, F_SETFL, _flag);
~~~

紧接着我们也需要修改我们的通信函数

其他地方基本没什么变化，要注意一点：

**当我缓冲区的数据读完了，但是写端没关闭怎么办？因为我们知道写端关闭了返回0，那这里返回什么呢？**

**我们查看了man文档知道返回-1，并且errno会被设置为EAGAIN，这就是非阻塞情况下read()函数数据读完了的返回**

**和之前accept()函数在被软中断，信号处理回收子进程之后变成非阻塞，返回-1，设置errno为EINTR有点类似**

~~~cpp
void Communicate(const struct epoll_event &_ret_event, const int &_epoll_fd) {
    int _connect_fd = _ret_event.data.fd;

    // ET工作模式不会通知第二次，只有再次变化的时候才会检测到，因此我们需要调用非阻塞的接口把数据读完
    char buf[MAX_BUF_SIZE] = {0};
    while (1) {
        int len = read(_connect_fd, buf, sizeof(buf) - 1);

        if (-1 == len) {
            // 里面有一种情况就是我写端没有关闭但是我在非阻塞的情况下已经把数据读完了，这个时候就会产生EAGAIN的错误
            if (errno == EAGAIN) {
                printf("read data over.\n");
                return;
            }

            perror("read");
            exit(-1);
        }

        // 读到正确数据
        if (len > 0) {
            printf("client (ip : %s , port : %d) recv : %s\n", cli_infos[_connect_fd].client_ip, cli_infos[_connect_fd].client_port, buf);
            write(_connect_fd, buf, strlen(buf));
            bzero(buf, sizeof(buf));
        }

        else if (0 == len) {
            // 写端，客户端关闭连接
            printf("client (ip : %s , port : %d) has closed...\n", cli_infos[_connect_fd].client_ip, cli_infos[_connect_fd].client_port);
            // 从检测事件中删除他
            epoll_ctl(_epoll_fd, EPOLL_CTL_DEL, _connect_fd, nullptr);
            // 关闭文件描述符
            close(_connect_fd);

            return;
        }
    }
}
~~~

最终我们的程序运行结果就是这样：

客户端

![image-20230822115230225](https://img-blog.csdnimg.cn/af84c3353ab840b2b9062d6a2a300f89.png)

服务端

可以看出我做的特殊判断也被打印出来了

![image-20230822115243021](https://img-blog.csdnimg.cn/008fff4f7de64bf285b2b316206e2264.png)

这个程序应该还有小bug，但是大体逻辑是没有问题的，这个我就尚不知道了

