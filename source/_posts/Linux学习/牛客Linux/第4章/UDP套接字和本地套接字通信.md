---
title: UDP套接字和本地套接字通信
categories:
  - Linux学习
  - 牛客Linux
  - 第4章 Linux网络编程
abbrlink: 483cdbfc
date: 2023-09-23 02:00:00
updated: 2023-09-23 02:00:00
---

<meta name="referrer" content="no-referrer"/>

`牛客Linux`的`第4章 Linux网络编程`的`UDP套接字和本地套接字通信`部分。

<!-- more -->

`CSDN`：[https://blog.csdn.net/m0_61588837/article/details/132432152](https://blog.csdn.net/m0_61588837/article/details/132432152)

`markdown`文档在：[https://github.com/DavidingPlus/Md_Files/blob/master/Cpp/C%2B%2B%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0/Linux/%E7%89%9B%E5%AE%A2%20Linux.md](https://github.com/DavidingPlus/Md_Files/blob/master/Cpp/C%2B%2B%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0/Linux/%E7%89%9B%E5%AE%A2%20Linux.md)

代码在：[https://github.com/DavidingPlus/Linux_Learning/tree/Newcoder_Linux](https://github.com/DavidingPlus/Linux_Learning/tree/Newcoder_Linux)

## UDP

### UDP通信

**相比于TCP，UDP的通信就非常简单了，TCP的服务端需要创建监听的套接字用于监听建立连接，客户端需要使用connect()和服务端建立连接；而UDP创建了用于通信的文件描述符后直接通信即可，注意服务端还是要绑定bind()IP和端口**

![image-20230822145319237](https://img-blog.csdnimg.cn/29df015808b741549fc4f63009d33f43.png)

**在UDP中系统专门给我们提供了接口叫 sendto() 和 recvfrom() ；同样的在TCP当中，我们之前一直使用的是read()和write()来操作通信的文件描述符，没问题，但是系统当然也提供了专门的API，叫 send() 和 recv()**

~~~cpp
#include <sys/types.h>
#include <sys/socket.h>

ssize_t sendto(int sockfd, const void *buf, size_t len, int flags,
               const struct sockaddr *dest_addr, socklen_t addrlen);
    - 参数：
        - sockfd : 通信的fd
        - buf : 要发送的数据
        - len : 发送数据的长度
        - flags : 0，标志，没有什么用，我们设置为0就可以了
        - dest_addr : 通信的另外一端的地址信息，需要指定，因为没有建立连接不给不知道给谁发
        - addrlen : 地址的内存大小
            
ssize_t recvfrom(int sockfd, void *buf, size_t len, int flags, 
                 struct sockaddr *src_addr, socklen_t *addrlen);
    - 参数：
        - sockfd : 通信的fd
        - buf : 接收数据的数组
        - len : 数组的大小
        - flags : 0
        - src_addr : 用来保存另外一端的地址信息，不需要可以指定为NULL
        - addrlen : 地址的内存大小
~~~

#### 代码

大体框架没有变，注意UDP中没有建立连接这个概念

~~~cpp
// server.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <unistd.h>

#define MAX_BUF_SIZE 1024
#define MAX_IPV4_STRING 16

int main() {
    // 1.创建通信的socket套接字
    int socket_fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (-1 == socket_fd) {
        perror("socket");
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

    int ret = bind(socket_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    if (-1 == socket_fd) {
        perror("bind");
        return -1;
    }

    printf("server has initialized.\n");

    char buf[MAX_BUF_SIZE] = {0};

    // 3.开始通信
    while (1) {
        bzero(buf, sizeof(buf));
        struct sockaddr_in client_addr;
        socklen_t client_addr_len = sizeof(client_addr);

        // 读
        int len = recvfrom(socket_fd, buf, sizeof(buf) - 1, 0, (struct sockaddr*)&client_addr, &client_addr_len);
        if (-1 == len) {
            perror("recvfrom");
            return -1;
        }
        // 获得客户端信息
        char client_ip[MAX_IPV4_STRING] = {0};
        inet_ntop(AF_INET, &client_addr.sin_addr.s_addr, client_ip, sizeof(client_ip));
        in_port_t client_port = ntohs(client_addr.sin_port);

        // recvfrom返回0是可以接受的，不像read返回0表示对端关闭连接。因为UDP是无连接的，也就没有所谓的关闭。
        printf("recv client (ip : %s , port : %d) : %s", client_ip, client_port, buf);

        // 写
        sendto(socket_fd, buf, strlen(buf), 0, (struct sockaddr*)&client_addr, client_addr_len);
    }

    // 4.关闭套接字
    close(socket_fd);

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

#define MAX_BUF_SIZE 1024
#define MAX_IPV4_STRING 16

int main() {
    // 1.创建通信的socket套接字
    int socket_fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (-1 == socket_fd) {
        perror("socket");
        return -1;
    }

    // 存储服务端地址信息
    struct sockaddr_in server_addr;
    // 地址族
    server_addr.sin_family = AF_INET;
    // IP
    inet_pton(AF_INET, "127.0.0.2", &server_addr.sin_addr.s_addr);
    // 端口
    server_addr.sin_port = htons(9999);

    char buf[MAX_BUF_SIZE] = {0};

    static int num = 0;

    // 2.开始通信
    while (1) {
        // 写
        bzero(buf, sizeof(buf));
        sprintf(buf, "hello i am client , %d\n", num++);
        printf("send : %s", buf);
        sendto(socket_fd, buf, strlen(buf), 0, (struct sockaddr*)&server_addr, sizeof(server_addr));

        sleep(1);

        // 读
        bzero(buf, sizeof(buf));

        int len = recvfrom(socket_fd, buf, sizeof(buf) - 1, 0, nullptr, nullptr);
        if (-1 == len) {
            perror("recvfrom");
            return -1;
        }
        // recvfrom返回0是可以接受的，不像read返回0表示对端关闭连接。因为UDP是无连接的，也就没有所谓的关闭。
        printf("recv : %s", buf);
    }

    // 4.关闭套接字
    close(socket_fd);

    return 0;
}
~~~

##### 注意

- **recvfrom() 函数的参数，后面两项是可以选择接受对方的信息，可以获得对方的socket地址信息，不要就传nullptr就可以了**

- **sendto() 函数的参数，最后两项也是对方的信息，这是必须要给的，因为TCP没有建立连接同于通信的文件描述符，所以必须要给出对方的信息才可能正确发到；由此我们也可以推出我们的这个 sockfd 可以和很多客户端连接，因此UDP不用多进程或者多线程也可以实现，结果类似如下：**

  ![image-20230822154224472](https://img-blog.csdnimg.cn/f3b47e5abcf948a18ec5457436fc5409.png)

- **recvfrom 返回0是可以接受的，不像read返回0表示对端关闭连接。因为UDP是无连接的，也就没有所谓的关闭。我们的程序在另一方断开之后会卡住，这里我尚不知道为什么，应该是recvfrom() 内核里面的设计了；我们总之知道 UDP 提供的 recvfrom() 函数返回0是合法的**

- 另外，我想谈谈关于TCP和UDP双方的文件描述符，TCP里面就是connect_fd，UDP里面就是socket_fd
  我们通过程序查看是否相同，首先是TCP：

  服务端
  ![image-20230822155038817](https://img-blog.csdnimg.cn/08367d8edb32437fa7963c9269609071.png)

  客户端
  ![image-20230822155057787](https://img-blog.csdnimg.cn/28fc438c4b844619978db40f3394aee4.png)

  **他们是不相同的，如何理解？**
  **这是两个进程，TCP的3号文件描述符用在了监听，4号用来和客户端进行通信，客户端也具有自己的文件描述符表，用的自然就是3号文件描述符**

  然后是UDP：

  服务端
  ![image-20230822155443323](https://img-blog.csdnimg.cn/fbf4e6fd55b5445cba518665e9f1a727.png)

  客户端
  ![image-20230822155501635](https://img-blog.csdnimg.cn/d4248c3dd7d143bf9ed0fccae06c8811.png)

  **两个进程都只建立了一个文件描述符，所以当然各自进程都用自己最小可用的文件描述符就是3啊，这个跟文件描述符引用计数没关系，前提是需要是同一个进程，并且socket套接字指向的东西还是一样的**

### 广播和组播

**广播和多播就是发送方向多个接收方的主机发送消息，也就是一对多，广播是给所有的主机发送消息，只能用在局域网中；多播是给一个多播组中的所有主机发送消息，既可以用于广域网，也可以用于局域网；由于都是一对多，所以TCP的端对端的单播协议明显不适用，而只能用无连接不可靠的UDP协议**

#### 广播

向子网中多台计算机发送消息，并且子网中所有的计算机都可以接收到发送方发送的消息，每个广播消息都包含一个特殊的IP地址，这个IP中子网内主机标志部分的二进制全部为1。 

a.只能在局域网中使用。 

b.客户端需要绑定服务器广播使用的端口，才可以接收到广播消息。

<img src="https://img-blog.csdnimg.cn/6d54f94878654dd3ba7e7e853154cff0.png" alt="image-20230822160604851" style="zoom:67%;" />

~~~cpp
// 设置广播属性的函数
int setsockopt(int sockfd, int level, int optname,const void *optval, socklen_t optlen);
    - sockfd : 文件描述符
    - level : SOL_SOCKET
    - optname : SO_BROADCAST
    - optval : int类型的值，为1表示允许广播
    - optlen : optval的大小
~~~

##### 代码(有一处不明白)

~~~cpp
// server.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <unistd.h>

#define MAX_BUF_SIZE 1024
#define MAX_IPV4_STRING 16

// 广播的IP地址
const char* Broadcast_IP = "127.255.255.255";

int main() {
    // 1.创建通信的socket套接字
    int socket_fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (-1 == socket_fd) {
        perror("socket");
        return -1;
    }

    // 开启广播设置
    int _optval = 1;
    setsockopt(socket_fd, SOL_SOCKET, SO_BROADCAST, &_optval, sizeof(_optval));

    // 2.绑定IP和端口，其实在这里我们不接受数据，帮不绑定其实无所谓
    struct sockaddr_in server_addr;
    // 地址族
    server_addr.sin_family = AF_INET;
    // IP
    inet_pton(AF_INET, "127.0.0.1", &server_addr.sin_addr.s_addr);
    // 端口
    server_addr.sin_port = htons(9999);

    int ret = bind(socket_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    if (-1 == socket_fd) {
        perror("bind");
        return -1;
    }

    printf("server has initialized.\n");

    // 封装广播客户端的socket地址
    struct sockaddr_in All_Client_addr;
    All_Client_addr.sin_family = AF_INET;
    All_Client_addr.sin_port = htons(10000);
    inet_pton(AF_INET, Broadcast_IP, &All_Client_addr.sin_addr.s_addr);

    // 3.开始通信
    static int num = 0;
    char buf[MAX_BUF_SIZE] = {0};

    while (1) {
        // 服务端向所有的客户端广播数据
        bzero(buf, sizeof(buf));
        sprintf(buf, "hello , i am server , num = %d\n", num++);
        printf("send : %s", buf);

        sendto(socket_fd, buf, strlen(buf), 0, (struct sockaddr*)&All_Client_addr, sizeof(All_Client_addr));
        sleep(1);
    }

    // 4.关闭套接字
    close(socket_fd);

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

#define MAX_BUF_SIZE 1024
#define MAX_IPV4_STRING 16

int main() {
    // 1.创建通信的socket套接字
    int socket_fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (-1 == socket_fd) {
        perror("socket");
        return -1;
    }

    // 2.绑定端口信息，让发送方能够正确找到
    struct sockaddr_in client_addr;
    // 地址族
    client_addr.sin_family = AF_INET;
    // IP
    // inet_pton(AF_INET, "127.0.0.2", &client_addr.sin_addr.s_addr);  // 这行代码会出问题，但是我也不知道为什么
    client_addr.sin_addr.s_addr = INADDR_ANY;
    // 端口
    client_addr.sin_port = htons(10000);

    int ret = bind(socket_fd, (struct sockaddr*)&client_addr, sizeof(client_addr));
    if (-1 == ret) {
        perror("bind");
        return -1;
    }

    char buf[MAX_BUF_SIZE] = {0};

    // 2.开始通信
    while (1) {
        // 读数据
        recvfrom(socket_fd, buf, sizeof(buf) - 1, 0, nullptr, nullptr);
        printf("recv : %s", buf);
    }

    // 4.关闭套接字
    close(socket_fd);

    return 0;
}
~~~

我们的代码需要做的功能是服务端启动后，即可开始向局域网内的所有主机广播信息，当有客户端连接进来的时候可以收到客户端的信息

**我们先来解释bind()函数，为什么这里服务端和客户端都使用了bind()？**

**bind()函数可以给我们socket()创建出来的文件描述符绑定我们自己设定的IP和端口信息，比如这里我就给服务端绑定了"127.0.0.1"和9999的信息，客户端绑定了任意IP(局域网内)和10000端口，IP是次要的，bind()函数绑定socket的时候应该首先考虑到给优先接受数据的一方绑定，比如这里就是客户端，为什么呢？因为我发送方一定需要知道一个具体的端口号我才能发送，在UDP中IP倒不一定必须，因为有可能是广播或者组播，这就不是一个具体的IP了，但是端口号是标识不同主机的进程的，所以发送方一定是根据这个端口号找到你对应的进程的，然后如果我得客户端不绑定，就由系统给我自动分配，那就找不到了，所以这里其实服务端的绑定其实没有必要，但是为了习惯我还是加上了；在TCP中也是一样的，我客户端先向服务端发送数据，在这之前需要建立连接，我也是通过人为指定的端口连接服务端，所以服务端绑定了端口，也就调用了bind()**

但是这里我不明白我给客户端指定IP为 127.0.0.2 收不到服务端广播的消息，必须是局域网内的任意IP，也就是INADDR_ANY才行，这里我不明白

另外还有一点就是广播的发送方要给socket()设置广播属性，就像这样

~~~cpp
// 开启广播设置
int _optval = 1;
setsockopt(socket_fd, SOL_SOCKET, SO_BROADCAST, &_optval, sizeof(_optval));
~~~

#### 组播(多播)

**单播地址标识单个 IP 接口，广播地址标识某个子网的所有 IP 接口，多播地址标识一组 IP 接口。 单播和广播是寻址方案的两个极端（要么单个要么全部），多播则意在两者之间提供一种折中方案。多播数据报只应该由对它感兴趣的接口接收，也就是说由运行相应多播会话应用系统的主机上的接口接收。另外，广播一般局限于局域网内使用，而多播则既可以用于局域网，也可以跨广域网使用。** 

**a.组播既可以用于局域网，也可以用于广域网** 

**b.客户端需要加入多播组，才能接收到多播的数据**

<img src="https://img-blog.csdnimg.cn/b197ab6e1a274a7ca1c2a0d8e053f2ee.png" alt="image-20230822160649282" style="zoom:80%;" />

- 组播地址

IP 多播通信必须依赖于 IP 多播地址，在 IPv4 中它的范围从 224.0.0.0 到 239.255.255.255 ， 并被划分为局部链接多播地址、预留多播地址和管理权限多播地址三类:

![image-20230822160933192](https://img-blog.csdnimg.cn/d31c9e84fef34a0694f9f0c0b1d09868.png)

- 设置组播

  ![image-20230823114653916](https://img-blog.csdnimg.cn/77adeff9b9fa4420be25e2ca97d06fc1.png)

多播的API用的比较少，需要用的时候来查询就可以了，但是要知道工作原理

~~~cpp
int setsockopt(int sockfd, int level, int optname, const void *optval, socklen_t optlen);
// 服务器设置多播的信息，外出接口
    - level : IPPROTO_IP
    - optname : IP_MULTICAST_IF
    - optval : struct in_addr
// 客户端加入到多播组：
    - level : IPPROTO_IP
    - optname : IP_ADD_MEMBERSHIP
    - optval : struct ip_mreq
        
struct ip_mreq {
    /* IP multicast address of group. */
    struct in_addr imr_multiaddr; // 组播的IP地址
    /* Local IP address of interface. */
    struct in_addr imr_interface; // 本地的IP地址
};

typedef uint32_t in_addr_t;
struct in_addr {
    in_addr_t s_addr;
};
~~~

##### 代码(和前面同样的问题)

~~~cpp
// server.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <unistd.h>

#define MAX_BUF_SIZE 1024
#define MAX_IPV4_STRING 16

// 多播的IP地址
const char* Multicast_IP = "239.0.0.10";

int main() {
    // 1.创建通信的socket套接字
    int socket_fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (-1 == socket_fd) {
        perror("socket");
        return -1;
    }

    // 设置多播属性，设置外出接口
    struct in_addr _optval;
    // 初始化多播地址
    inet_pton(AF_INET, Multicast_IP, &_optval.s_addr);
    setsockopt(socket_fd, IPPROTO_IP, IP_MULTICAST_IF, &_optval, sizeof(_optval));

    // 发送方，这里我就不绑定端口了

    printf("server has initialized.\n");

    // 封装广播客户端的socket地址
    struct sockaddr_in All_Client_addr;
    All_Client_addr.sin_family = AF_INET;
    All_Client_addr.sin_port = htons(10000);
    inet_pton(AF_INET, Multicast_IP, &All_Client_addr.sin_addr.s_addr);

    // 3.开始通信
    static int num = 0;
    char buf[MAX_BUF_SIZE] = {0};

    while (1) {
        // 服务端向所有的客户端广播数据
        bzero(buf, sizeof(buf));
        sprintf(buf, "hello , i am server , num = %d\n", num++);
        printf("send : %s", buf);

        sendto(socket_fd, buf, strlen(buf), 0, (struct sockaddr*)&All_Client_addr, sizeof(All_Client_addr));
        sleep(1);
    }

    // 4.关闭套接字
    close(socket_fd);

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

#define MAX_BUF_SIZE 1024
#define MAX_IPV4_STRING 16

// 多播的IP地址
const char* Multicast_IP = "239.0.0.10";

int main() {
    // 1.创建通信的socket套接字
    int socket_fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (-1 == socket_fd) {
        perror("socket");
        return -1;
    }

    // 加入多播组
    struct ip_mreq _optval;
    // 初始化
    _optval.imr_interface.s_addr = INADDR_ANY;
    inet_pton(AF_INET, Multicast_IP, &_optval.imr_multiaddr.s_addr);

    setsockopt(socket_fd, IPPROTO_IP, IP_ADD_MEMBERSHIP, &_optval, sizeof(_optval));

    // 2.绑定端口信息，让发送方能够正确找到
    struct sockaddr_in client_addr;
    // 地址族
    client_addr.sin_family = AF_INET;
    // IP
    // inet_pton(AF_INET, "127.0.0.2", &client_addr.sin_addr.s_addr);  // 和之前一样的问题
    client_addr.sin_addr.s_addr = INADDR_ANY;
    // 端口
    client_addr.sin_port = htons(10000);

    int ret = bind(socket_fd, (struct sockaddr*)&client_addr, sizeof(client_addr));
    if (-1 == ret) {
        perror("bind");
        return -1;
    }

    char buf[MAX_BUF_SIZE] = {0};

    // 2.开始通信
    while (1) {
        // 读数据
        recvfrom(socket_fd, buf, sizeof(buf) - 1, 0, nullptr, nullptr);
        printf("recv : %s", buf);
    }

    // 4.关闭套接字
    close(socket_fd);

    return 0;
}
~~~

同样的客户端也能收到服务端发送而来的数据

我们同样注意服务端和客户端对于设置多播和加入多播的设置方法

服务端

~~~cpp
// 多播的IP地址
const char* Multicast_IP = "239.0.0.10";    

// 设置多播属性，设置外出接口
struct in_addr _optval;
// 初始化多播地址
inet_pton(AF_INET, Multicast_IP, &_optval.s_addr);
setsockopt(socket_fd, IPPROTO_IP, IP_MULTICAST_IF, &_optval, sizeof(_optval));
~~~

客户端

~~~cpp
// 多播的IP地址
const char* Multicast_IP = "239.0.0.10";

// 加入多播组
struct ip_mreq _optval;
// 初始化
_optval.imr_interface.s_addr = INADDR_ANY;
inet_pton(AF_INET, Multicast_IP, &_optval.imr_multiaddr.s_addr);

setsockopt(socket_fd, IPPROTO_IP, IP_ADD_MEMBERSHIP, &_optval, sizeof(_optval));
~~~

## 本地套接字

本地套接字的作用：本地的进程间通信 
	有关系的进程间的通信 
	没有关系的进程间的通信

**之前我们学过的本地间进程之间通信的方式有：管道(匿名管道pipe，有名管道fifo)；内存映射；信号，信号集；共享内存。记得去复习**

本地套接字实现流程和网络套接字类似，一般呢采用**TCP**的通信流程。

<img src="https://img-blog.csdnimg.cn/7d1897a4b2324c0d9740d51ed0e4d9fd.png" alt="image-20230823123131126" style="zoom: 80%;" />

### API

~~~cpp
// 本地套接字通信的流程 - tcp

// 服务器端
1. 创建监听的套接字
	int lfd = socket(AF_UNIX/AF_LOCAL, SOCK_STREAM, 0);
2. 监听的套接字绑定本地的套接字文件 -> server端
	struct sockaddr_un addr;
	// 绑定成功之后，指定的sun_path中的套接字文件会自动生成。addr里面存的就是他的路径
	bind(lfd, addr, len);
3. 监听
	listen(lfd, 100);
4. 等待并接受连接请求
	struct sockaddr_un cliaddr; // 用的时候记得引头文件 #include <sys/un.h>
	int cfd = accept(lfd, &cliaddr, len);
5. 通信
	接收数据：read/recv
	发送数据：write/send
6. 关闭连接
	close();

// 客户端的流程
1. 创建通信的套接字
	int fd = socket(AF_UNIX/AF_LOCAL, SOCK_STREAM, 0);
2. 监听的套接字绑定本地的套接字文件 -> client端
	struct sockaddr_un addr;
	// 绑定成功之后，指定的sun_path中的套接字文件会自动生成。
	bind(lfd, addr, len);
3. 连接服务器
	struct sockaddr_un serveraddr;
	connect(fd, &serveraddr, sizeof(serveraddr));
4. 通信
	接收数据：read/recv
	发送数据：write/send
5. 关闭连接
	close();
~~~

~~~cpp
// 头文件: sys/un.h
#define UNIX_PATH_MAX 108
struct sockaddr_un {
	sa_family_t sun_family; // 地址族协议 af_local
	char sun_path[UNIX_PATH_MAX]; // 套接字文件的路径, 这是一个伪文件, 大小永远=0
}
~~~

###  工作原理

**我们观察他的流程图以及结合上面API的注释，在本地文件socket地址中，由于是本地的通信，我们不使用IPV4地址或者IPV6地址，也就是sockaddr_in和sockadd_in6，我们使用 sockaddr_un 这个结构体来封装本地的信息，这个结构体一个参数是地址族，另一个参数就非常重要了，就是指定我们用于通信的套接字文件的路径，例如图中就是server.sock和client.sock，这是一个伪文件，大小永远都是0，是用来进行本地进程间通信的；这个文件会在磁盘中被创建出来，在通信的时候，在内核中对应了一块缓冲区，如图所示，客户端B发送数据，先将数据写道他的写缓冲区，在发送到服务端的读缓冲区，因此读写双方都必须有一个这个套接字文件的路径，也就是都需要绑定bind()，这就和一般的TCP通信有区别**

![image-20230823124612140](https://img-blog.csdnimg.cn/cd3dea22a8784da59ba9c9d2802429ec.png)

### 代码

这里我第一次使用TCP特有的send()和recv()函数，他们的返回值和什么时候返回我现在还不是很明白，和write()和read()大差不差，但是还是有区别，需要后续对内核源码的学习才能更好的理解

~~~cpp
// server.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <sys/un.h>
#include <unistd.h>

#define MAX_BUF_SIZE 1024

int main() {
    // 1.创建socket本地套接字
    int listen_fd = socket(AF_LOCAL, SOCK_STREAM, 0);
    if (-1 == listen_fd) {
        perror("socket");
        return -1;
    }

    // 2.绑定本地套接字文件
    struct sockaddr_un server_addr;
    // 地址族
    server_addr.sun_family = AF_LOCAL;
    // 套接字文件绑定了之后自动生成一个文件用于通信
    strcpy(server_addr.sun_path, "server.sock");

    int ret = bind(listen_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    if (-1 == ret) {
        perror("bind");
        return -1;
    }

    // 3.监听
    ret = listen(listen_fd, 5);
    if (-1 == ret) {
        perror("listen");
        return -1;
    }

    // 4.等待客户端连接
    struct sockaddr_un client_addr;
    socklen_t client_addr_len = sizeof(client_addr);

    int connect_fd = accept(listen_fd, (struct sockaddr*)&client_addr, &client_addr_len);
    if (-1 == connect_fd) {
        perror("accept");
        return -1;
    }

    printf("client (socket filename : %s) has connected.\n", client_addr.sun_path);

    char buf[MAX_BUF_SIZE] = {0};
    // 5.开始通信
    while (1) {
        // 读
        bzero(buf, sizeof(buf));
        int len = recv(connect_fd, buf, sizeof(buf) - 1, 0);
        if (-1 == len) {
            if (errno == ECONNRESET)  // 报错处理
                goto CLOSE;
            perror("recv");
            return -1;
        }

        if (len > 0)
            printf("recv : %s", buf);
        else if (0 == len) {
        CLOSE:
            printf("client (socket filename : %s) has closed...\n", client_addr.sun_path);
            break;
        }

        // 写
        send(connect_fd, buf, strlen(buf), 0);
    }

    // 6.关闭连接
    close(connect_fd);
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
#include <sys/un.h>
#include <unistd.h>

#define MAX_BUF_SIZE 1024

int main() {
    // 1.创建本地socket套接字
    int connect_fd = socket(AF_LOCAL, SOCK_STREAM, 0);
    if (-1 == connect_fd) {
        perror("socket");
        return -1;
    }

    // 2.绑定本地套接字文件
    struct sockaddr_un client_addr;
    client_addr.sun_family = AF_LOCAL;
    strcpy(client_addr.sun_path, "client.sock");

    int ret = bind(connect_fd, (struct sockaddr*)&client_addr, sizeof(client_addr));
    if (-1 == ret) {
        perror("bind");
        return -1;
    }

    // 3.连接客户端
    struct sockaddr_un server_addr;
    server_addr.sun_family = AF_LOCAL;
    strcpy(server_addr.sun_path, "server.sock");

    ret = connect(connect_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    if (-1 == ret) {
        perror("connect");
        return -1;
    }

    char buf[MAX_BUF_SIZE] = {0};
    static int num = 0;
    // 4.开始通信
    while (1) {
        // 写
        bzero(buf, sizeof(buf));
        sprintf(buf, "hello , i am client , num : %d\n", num++);
        printf("send : %s", buf);
        send(connect_fd, buf, strlen(buf), 0);

        // 读
        bzero(buf, sizeof(buf));
        int len = recv(connect_fd, buf, sizeof(buf) - 1, 0);
        if (-1 == len) {
            perror("recv");
            return -1;
        }
        if (len > 0)
            printf("recv : %s", buf);
        else if (0 == len) {
            printf("server has closed...\n");
            break;
        }

        sleep(1);
    }

    return 0;
}
~~~

#### 代码分析(细节地方不是很明白)

代码中有很多地方值得我们推敲，我们先来看代码的执行结果：

注意，由于我们是通过套接字文件和内核缓冲区进行联系，因此会创建出来一个套接字文件，只能使用Linux的原生目录！

服务端

<img src="https://img-blog.csdnimg.cn/3d4aa523a5034c1390b1bc470d7709a3.png" alt="image-20230823151111152" style="zoom:80%;" />

客户端

![image-20230823151122954](https://img-blog.csdnimg.cn/c785d59985014383a8da975a7823395f.png)

可以看出能够正常跑出来，当我们绑定bind()套接字文件之后我们查看目录下多出了两个文件，这两个文件正是用来与内核中缓冲区直接联系并且用于通信的；可以看出他们并没有大小，是一个伪文件

![image-20230823151222376](https://img-blog.csdnimg.cn/874b16ab2bf14ba3a42fc3c14852e95c.png)

现在我再次运行服务端或者客户端，发现出现了这样的情况：

报错：bind Address already in use；这正是因为我们创建的套接字文件还在这里没有被释放(删除)导致被占据而没有办法bind()成功导致的，我们将其删除即可

![image-20230823151351101](https://img-blog.csdnimg.cn/ec19cfa44a2d46cea45647e73bc8fdec.png)

我们查看代码中的这一部分：

~~~cpp
// server.cpp
...

// 5.开始通信
while (1) {
	...
        
    int len = recv(connect_fd, buf, sizeof(buf) - 1, 0);
    if (-1 == len) {
        if (errno == ECONNRESET)  // 报错处理
            goto CLOSE;
        perror("recv");
        return -1;
    }

	...
        
    else if (0 == len) {
    CLOSE:
        printf("client (socket filename : %s) has closed...\n", client_addr.sun_path);
        break;
    }

	...
}

...
~~~

我们发现进行了一个报错的特殊处理，我们试着将其删除再来跑代码，这次我们强制停掉客户端，结果如下：

客户端

![image-20230823152331909](https://img-blog.csdnimg.cn/310ffa736819439db823ddf4c8d13baf.png)

服务端

![image-20230823152340686](https://img-blog.csdnimg.cn/2d7bdf2f570641c69f636158e6cd7c53.png)

可以看出在读数据的时候报错了，错误信息是 Connection rest by peer，我不知道具体原因，但是我猜测大致应该是强制停掉客户端，客户端结束后会给服务端发送一个信号，然后服务端这个时候也在阻塞读，收到这个信号后就不阻塞了(和之前那个软中断类似)，然后发生了错误，但是其实是客户端断开了连接导致的

上网查询后我们发现错误号是 ECONNRESET ，因此特殊处理即可

还是上面的代码，我不做处理，当我让client正常的结束，这里我让while()加了个条件，发现不报错了，走的是 0==len 写端关闭的这里，并且话也正常打印出来了，如下：

客户端

![image-20230823152830630](https://img-blog.csdnimg.cn/8432b977dee040368d13886a32e514d1.png)

服务端

![image-20230823152839250](https://img-blog.csdnimg.cn/c27e217324d64dec941708725af7b18f.png)

因此这个recv()函数什么时候返回，或者返回什么值，甚至read()的认知都有可能在这里和我的不完全一样，等待后续的进一步研究吧

现在我们在一切代码正确的情况下强制停掉服务端，结果如下：

服务端

![image-20230823153112240](https://img-blog.csdnimg.cn/0b9e16562a5647f5a37c98a205eff04f.png)

客户端

![image-20230823153119822](https://img-blog.csdnimg.cn/da48eaf0e71f43f4a0ea09d08f0b15ec.png)

我们发现客户端直接停止运行了，没有报错也没有正常的输出，肯定是异常退出，但是这里我确实不知道为什么，可见水很深

说了这么多，其实真正的开发能用就行，但是现在在学习的过程还是要尽量考虑完全，每一步都尽量弄明白

