---
title: TCP套接字通信
categories:
  - Linux学习
  - 牛客Linux
  - 第4章 Linux网络编程
abbrlink: 3a731014
date: 2023-09-22 02:00:00
updated: 2023-09-22 02:00:00
---

<meta name="referrer" content="no-referrer"/>

`牛客Linux`的`第4章 Linux网络编程`的`TCP套接字通信`部分。

<!-- more -->

`CSDN`：[https://blog.csdn.net/m0_61588837/article/details/132432615](https://blog.csdn.net/m0_61588837/article/details/132432615)

`markdown`文档在：[https://github.com/DavidingPlus/Md_Files/blob/master/Cpp/C%2B%2B%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0/Linux/%E7%89%9B%E5%AE%A2%20Linux.md](https://github.com/DavidingPlus/Md_Files/blob/master/Cpp/C%2B%2B%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0/Linux/%E7%89%9B%E5%AE%A2%20Linux.md)

代码在：[https://github.com/DavidingPlus/Linux_Learning/tree/Newcoder_Linux](https://github.com/DavidingPlus/Linux_Learning/tree/Newcoder_Linux)

## socket介绍

所谓 socket（套接字），就是对网络中不同主机上的应用进程之间进行双向通信的端点的抽象。 一个套接字就是网络上进程通信的一端，提供了应用层进程利用网络协议交换数据的机制。从所处的地位来讲，套接字上联应用进程，下联网络协议栈，是应用程序通过网络协议进行通信的接口， 是应用程序与网络协议根进行交互的接口。 

socket 可以看成是两个网络应用程序进行通信时，各自通信连接中的端点，这是一个逻辑上的概 念。它是网络环境中进程间通信的 API，也是可以被命名和寻址的通信端点，使用中的每一个套接 字都有其类型和一个与之相连进程。通信时其中一个网络应用程序将要传输的一段信息写入它所在主机的 socket 中，该 socket 通过与网络接口卡（NIC）相连的传输介质将这段信息送到另外一台主机的 socket 中，使对方能够接收到这段信息。socket 是由 IP 地址和端口结合的，提供向应用 层进程传送数据包的机制。 

**socket 本身有“插座”的意思，在 Linux 环境下，用于表示进程间网络通信的特殊文件类型。本质为内核借助缓冲区形成的伪文件。既然是文件，那么理所当然的，我们可以使用文件描述符引用套接字。与管道类似的，也存在读写缓冲区，写方向写的缓冲区写入数据，读方接收到数据在读缓冲区中，这就形成了数据的传递，Linux 系统将其封装成文件的目的是为了统一接口，使得读写套接字和读写文件的操作一致。区别是管道主要应用于本地进程间通信，而套接字多应用于网络进程间数据的传递。**

![image-20230817210404237](https://img-blog.csdnimg.cn/a136ec722c564d5bb7c9ffcccab70124.png)

~~~cpp
// 套接字通信分两部分：
- 服务器端：被动接受连接，一般不会主动发起连接
- 客户端：主动向服务器发起连接
socket是一套通信的接口，Linux 和 Windows 都有，但是有一些细微的差别
~~~

##  字节序

### 简介

现代 CPU 的累加器一次都能装载（至少）4 字节（这里考虑 32 位机），即一个整数。那么这 4 字节在内存中排列的顺序将影响它被累加器装载成的整数的值，这就是字节序问题。在各种计算机 体系结构中，对于字节、字等的存储机制有所不同，因而引发了计算机通信领域中一个很重要的问 题，即通信双方交流的信息单元（比特、字节、字、双字等等）应该以什么样的顺序进行传送。如 // 套接字通信分两部分： - 服务器端：被动接受连接，一般不会主动发起连接 - 客户端：主动向服务器发起连接 socket是一套通信的接口，Linux 和 Windows 都有，但是有一些细微的差别。 果不达成一致的规则，通信双方将无法进行正确的编码/译码从而导致通信失败。 

**字节序，顾名思义字节的顺序，就是大于一个字节类型的数据在内存中的存放顺序(一个字节的数据当然就无需谈顺序的问题了)。** 

**字节序分为大端字节序（Big-Endian） 和小端字节序（Little-Endian）。大端字节序是指一个整数的高位字节存储在内存的低地址处，低位字节存储在内存的高地址处；小端字节序则是指整数的高位字节存储在内存的高地址处，而低位字节则存储在内存的低地址处。**

### 字节序举例

**小端字节序是低位字节存储在内存的低地址处，高位字节存储在内存的高地址处；大端字节序则相反!!!**

**图中的0x11就是一个字节，因为他是用16进制表示的，也就是0x11对应的11是8个bit，然后就是一个字节，这个数就是这么存储下来的，因此就有了高位字节和低位字节在内存中的顺序问题**

![image-20230818092738767](https://img-blog.csdnimg.cn/716d54a0f66240328069b385965a5c9c.png)

![image-20230818092744993](https://img-blog.csdnimg.cn/eb2d6292d3a04c92b11f61df2653c358.png)

好，我们了解了这些就可以写一个测试样例来查看我们的主机是小端字节序还是大端字节序(记忆：小端字节序就是内存高位对应数里面的高位)

~~~cpp
#include <iostream>
using namespace std;

/*
字节序：字节在内存中存储的顺序
小端字节序：数据的高位字节存储在内存的高位地址，低位字节存储在内存的低位地址
大端字节序：数据的高位字节存储在内存的低位地址，低位字节存储在内存的高位地址(与前面的相反)
*/

// 通过代码检测当前主机的字节序

// 联合里面的数据地址的起始位置都是从头开始的，因此指向的内存很大概率是有重复的
union Fuck {
    short value;                // 两个字节
    char bytes[sizeof(short)];  // 两个字节的数组，可以查看两个字节分成一半是怎么存储的
} test;

int main() {
    test.value = 0x0102;

    if (test.bytes[0] == 1 && test.bytes[1] == 2)  // 数据的高位对应字节存储的低位，则为大端字节序
        printf("大端字节序\n");
    else
        printf("小端字节序\n");

    return 0;
}a
~~~

当然，这个代码简化一下一行就可以搞定

~~~cpp
cout << (char(0x0102) == 0x02 ? "小端字节序" : "大端字节序") << endl;  // 这么写更加简单
~~~

### 字节序转换函数

**当格式化的数据在两台使用不同字节序的主机之间直接传递时，接收端必然错误的解释之。解决问题的方法是：发送端总是把要发送的数据转换成大端字节序数据后再发送，而接收端知道对方传送过来的数据总是采用大端字节序，所以接收端可以根据自身采用的字节序决定是否对接收到的数据进行转换（小端机转换，大端机不转换）。** 

因此，**在网络中，我们规定都用大端字节序传递数据，称为网络字节序**

**网络字节顺序**是 TCP/IP 中规定好的一种数据表示格式，它与具体的 CPU 类型、操作系统等无关，从而 可以保证数据在不同主机之间传输时能够被正确解释，网络字节顺序采用大端排序方式。 

BSD Socket提供了封装好的转换接口，方便程序员使用。包括从主机字节序到网络字节序的转换函数： htons、htonl；从网络字节序到主机字节序的转换函数：ntohs、ntohl。

~~~cpp
h - host 主机，主机字节序
to - 转换成什么
n - network 网络字节序
s - short unsigned short
l - long unsigned int
~~~

~~~cpp
#include <arpa/inet.h>
// 转换端口 端口号 0-65535，就是16位，因此是 uint16_t
uint16_t htons(uint16_t hostshort); // 主机字节序 - 网络字节序
uint16_t ntohs(uint16_t netshort); // 主机字节序 - 网络字节序
// 转IP IP地址，IPV4是32位，因此是uint32_t
uint32_t htonl(uint32_t hostlong); // 主机字节序 - 网络字节序
uint32_t ntohl(uint32_t netlong); // 主机字节序 - 网络字节序
~~~

我们写一个测试案例来演示一下这几个函数

~~~cpp
#include <iostream>
using namespace std;
#include <arpa/inet.h>

/*
    网络通信时，需要将主机字节序转化为网络字节序(大端)
    另外一端获取到数据以后，根据情况将网络字节序转换为主机字节序

    #include <arpa/inet.h>
    // 转换端口 端口号 0-65535，就是16位，因此是 uint16_t
    uint16_t htons(uint16_t hostshort); // 主机字节序 - 网络字节序
    uint16_t ntohs(uint16_t netshort); // 主机字节序 - 网络字节序
    // 转IP IP地址，IPV4是32位，因此是uint32_t
    uint32_t htonl(uint32_t hostlong); // 主机字节序 - 网络字节序
    uint32_t ntohl(uint32_t netlong); // 主机字节序 - 网络字节序
*/

int main() {
    // htons() 转换端口
    unsigned short a = 0x0102;
    printf("a : %x\n", a);
    unsigned short b = htons(a);
    printf("b : %x\n", b);

    printf("----------------------------------------------\n");

    // htonl() 转换IP
    // 这里用char会报 narrowing conversion 缩窄转换
    // 这是c++11在使用初始化序列时候编译器会自动判断，如果发生缩窄转换就会报错
    unsigned char buf[4] = {192, 168, 1, 100};

    int num = *(int*)buf;
    int ans = htonl(num);

    unsigned char* p = (unsigned char*)&ans;
    printf("%u %u %u %u\n", *p, *(p + 1), *(p + 2), *(p + 3));

    printf("----------------------------------------------\n");

    // ntohl()
    unsigned char buf1[4] = {1, 1, 168, 192};
    int num1 = *(int*)buf1;
    int ans1 = ntohl(num1);
    unsigned char* p1 = (unsigned char*)&ans1;
    printf("%u %u %u %u\n", *p1, *(p1 + 1), *(p1 + 2), *(p1 + 3));

    return 0;
}
~~~

**我们来解释一下里面的一些东西，值得我们深思**

**在c++11当中新增了一个 narrowing convertions，就是缩窄转换；他的规定是c++11之后引入了一个新特性就是列表初始化initializer_list，在用初始化列表初始化值的时候不允许发生类型的缩窄转换**

**比如：**

~~~cpp
vector<int> tmp {1,2.2}; 
//这里不允许将double类型的2.2转化为int类型，在初始化列表中，因为double类型的范围比int类型更宽(这是新规定的)
~~~

**但是**

~~~cpp
int num = double(2.2);
//这行代码显然是合法的，没有用initializer_list，num的值显然为2
~~~

**我们再举一个例子：**

~~~cpp
int a(double(2.2));
int a{double(2.2)};
~~~

**类似的两行代码，第一个使用的是构造函数，第二个调用的是initializer_list，在c++11标准下，第一个是可以通过编译的，第二会报错，原因是narrowing convertions，缩窄变换**

**对应到我们这里，我们看这一行代码：**

~~~cpp
unsigned char buf[4] = {192, 168, 1, 100};
~~~

**为什么我们会选择unsigned char 而不是 char？**

**我们知道，c语言内置的类型都是signed，即有符号的，所以以char为例，是1个字节，表示的范围为-128到127，8位数，第一位拿来表示符号，1为负，0为正，然后-128是用来表示-0，和+0用于区分；然后我们图中传入的是192，168，这两个如果要想转化为char类型的话那就是负数，但是在initializer_list当中就不允许这样的缩窄转换，就是把int类型转化为char类型，因为这里我们可以看出192已经超过了-128到127的范围**

~~~cpp
char(192);
~~~

**虽然我们这么写是没有问题的，存入的数字应该是-64，但是initializer_list中会被认为是缩窄转换，所以不允许这么做**

**但是我们再来看unsigned char，由于网络字节当中的不管是IP还是port端口都是无符号，也就是非负的，所以我们可以选择unsigned，其次，这里的IP地址，一个字节的范围是0-255，而unsigned char的表示范围恰好就是0-255，他们把负数表示为对应的补码，所以范围恰好完美对应，当然如果数在大一点可能会出问题，但是我们对应的是实际的IP情况，所以就能应对了，因此这里的类型我们选择unsigned char**

**而C语言如果我们用char或者低版本的c++，例如c++98这种，就不会报错，因为这是语法定义的对数组初始化，只不过c++11之后引入了一个更加厉害的initializer_list而已**

## socket地址

**主要是用来封装IP和端口号port的信息**

~~~cpp
// socket地址其实是一个结构体，封装端口号和IP等信息。后面的socket相关的api中需要使用到这个socket地址。
// 客户端 -> 服务器（IP, Port）
~~~

### 通用socket地址

socket 网络编程接口中表示 socket 地址的是结构体 sockaddr，这个在一般是通用的，其定义如下：

~~~cpp
#include <bits/socket.h>
struct sockaddr {
    sa_family_t sa_family;
    char sa_data[14]; //存储数据，包括IP和端口号的信息
};
typedef unsigned short int sa_family_t;
~~~

**这个结构体data部分的长度最大是14个字节，然后下面会看出其他两种都可能会超出14个字节，而IPv4就6个字节，可以存放下，因此绝大多数情况下是给IPv4使用的**

**sa_family 成员是地址族类型（sa_family_t）的变量。**地址族类型通常与协议族类型对应。常见的协议族（protocol family，也称 domain）和对应的地址族入下所示：

![image-20230818115634758](https://img-blog.csdnimg.cn/039a7f3aa42c4fd0bac99d10d85b40a2.png)

宏 PF_ * 和 AF_ * 都定义在 bits/socket.h 头文件中，且后者与前者有完全相同的值，所以二者通常混用。

sa_data 成员用于存放 socket 地址值。但是，不同的协议族的地址值具有不同的含义和长度，如下所示：

![image-20230818115654321](https://img-blog.csdnimg.cn/fdfdfc209e3e4390bda1d61957b23fac.png)

由上表可知，14 字节的 sa_data 根本无法容纳多数协议族的地址值。因此，Linux 定义了下面这个新的 通用的 socket 地址结构体，这个结构体不仅提供了足够大的空间用于存放地址值，而且是内存对齐的。

~~~cpp
#include <bits/socket.h>
struct sockaddr_storage
{
    sa_family_t sa_family;
    unsigned long int __ss_align;
    char __ss_padding[ 128 - sizeof(__ss_align) ]; //存储数据
};
typedef unsigned short int sa_family_t;
~~~

### 专用socket地址

**很多网络编程函数诞生早于 IPv4 协议，那时候都使用的是 struct sockaddr 结构体，为了向前兼容，现 在sockaddr 退化成了（void *）的作用，传递一个地址给函数，至于这个函数是 sockaddr_in 还是 sockaddr_in6，由地址族确定，然后函数内部再强制类型转化为所需的地址类型。**

<img src="https://img-blog.csdnimg.cn/29bc05b7ab6044fabf2dda2d33f93ba2.png" alt="image-20230818115728450" style="zoom:80%;" />

UNIX 本地域协议族使用如下专用的 socket 地址结构体：

~~~cpp
#include <sys/un.h>
struct sockaddr_un
{
	sa_family_t sin_family;
	char sun_path[108];
};
~~~

TCP/IP 协议族有 sockaddr_in 和 sockaddr_in6 两个专用的 socket 地址结构体，它们分别用于 IPv4 和 IPv6：

~~~cpp
#include <netinet/in.h>
struct sockaddr_in
{
    sa_family_t sin_family; /* __SOCKADDR_COMMON(sin_) */
    in_port_t sin_port; /* Port number. */
    struct in_addr sin_addr; /* Internet address. */
    /* Pad to size of `struct sockaddr'. */
    unsigned char sin_zero[sizeof (struct sockaddr) - __SOCKADDR_COMMON_SIZE -
    sizeof (in_port_t) - sizeof (struct in_addr)];
};

struct in_addr
{
	in_addr_t s_addr;
};

struct sockaddr_in6
{
    sa_family_t sin6_family;
    in_port_t sin6_port; /* Transport layer port # */
    uint32_t sin6_flowinfo; /* IPv6 flow information */
    struct in6_addr sin6_addr; /* IPv6 address */
    uint32_t sin6_scope_id; /* IPv6 scope-id */
};

typedef unsigned short uint16_t;
typedef unsigned int uint32_t;
typedef uint16_t in_port_t;
typedef uint32_t in_addr_t;
#define __SOCKADDR_COMMON_SIZE (sizeof (unsigned short int))
~~~

**所有专用 socket 地址（以及 sockaddr_storage）类型的变量在实际使用时都需要转化为通用 socket 地 址类型 sockaddr（强制转化即可），因为所有 socket 编程接口使用的地址参数类型都是 sockaddr。需要做到兼容**

## IP地址转换（字符串ip-整数 ，主机、网络字节序的转换）

通常，人们习惯用可读性好的字符串来表示 IP 地址，比如用点分十进制字符串表示 IPv4 地址，以及用 十六进制字符串表示 IPv6 地址。但编程中我们需要先把它们转化为整数（二进制数）方能使用。而记录 日志时则相反，我们要把整数表示的 IP 地址转化为可读的字符串。下面 3 个函数可用于用点分十进制字 符串表示的 IPv4 地址和用网络字节序整数表示的 IPv4 地址之间的转换：

**这个是旧的函数，只能适用于IPv4地址，可以使用但是不建议**

~~~cpp
#include <arpa/inet.h>
// 这个数字转化过来之后是网络字节序，就是大端
in_addr_t inet_addr(const char *cp); 
// 第二个参数是传出参数，保存转换后的结果，返回值 1 成功，0 失败，字符串非法，不设置错误号
int inet_aton(const char *cp, struct in_addr *inp); 
char *inet_ntoa(struct in_addr in);
~~~

**下面这对更新的函数也能完成前面 3 个函数同样的功能，并且它们同时适用 IPv4 地址和 IPv6 地址：(推荐使用这里的新的api)**

~~~cpp
#include <arpa/inet.h>
// p:点分十进制的IP字符串，n:表示network，网络字节序的整数
int inet_pton(int af, const char *src, void *dst);
    // af:地址族： AF_INET AF_INET6
    // src:需要转换的点分十进制的IP字符串
    // dst:转换后的结果保存在这个里面，是一个传出参数
    // 将网络字节序的整数，转换成点分十进制的IP地址字符串
    // 返回值：1 成功 ；失败 0 或者 -1，0表示传入的点分制字符串不合理invalid，不设置errno；-1表示错误(比如地址族内容不合理)，并且设置errno
const char *inet_ntop(int af, const void *src, char *dst, socklen_t size);
    // af:地址族： AF_INET AF_INET6
    // src: 要转换的ip的整数的地址
    // dst: 转换成IP地址字符串保存的地方
    // size：第三个参数的大小（数组的大小）
    // 返回值：返回转换后的数据的地址（字符串），和 dst 是一样的
~~~

我们写代码来巩固：

~~~cpp
#include <iostream>
using namespace std;
#include <arpa/inet.h>

int main() {
    // 创建一个IP字符串
    const char* buf = "192.168.1.4";

    in_addr_t num;
    // 其实这里给包装他的结构体 in_addr 也是可以的，因为函数要求传入的是指针，还是 void* ，脏活系统API帮我们干完了都

    // 将点分十进制的IP字符串转换为网络字节序的整数
    inet_pton(AF_INET, buf, &num);

    unsigned char* p = (unsigned char*)&num;
    // 转化之后的结果应该是数字高位192存放在地址低位，就是大端字节序，所以结果应该是192.168.1.4
    printf("%u %u %u %u\n", *p, *(p + 1), *(p + 2), *(p + 3));

    // 将网络字节序的IP整数转换为字符串形式
    // 字符串形式的IP地址最多多少个字节，一个字符一个字节，然后数字每个最多3位，3个点，加起来就是15，然后\0符，定义16就行
    char ip_str[16] = {0};
    const char* ans = inet_ntop(AF_INET, &num, ip_str, sizeof(ip_str) - 1);

    printf("ans : %s\n", ans);
    printf("ip_str : %s\n", ip_str);
    printf("%d\n", ip_str == ans);

    return 0;
}
~~~

**注意字符串形式的IP地址和数字形式的IP地址的字节数的区别和计算方法，注意不要弄混了!!!**

## TCP通信流程

~~~cpp
// TCP 和 UDP -> 传输层的协议
    UDP:用户数据报协议，面向无连接，可以单播，多播，广播， 面向数据报，不可靠
    TCP:传输控制协议，面向连接的，可靠的，基于字节流，仅支持单播传输(端对端)
    				      UDP 								TCP
    是否创建连接 			 无连接 							面向连接
    是否可靠 			   不可靠 				  			  可靠的
    连接的对象个数 		 一对一、一对多、多对一、多对多       支持一对一
    传输的方式 			  面向数据报 					   面向字节流
    首部开销 		       8个字节 					     最少20个字节
    适用场景 		       实时应用（视频会议，直播） 	  可靠性高的应用（文件传输）
~~~

![image-20230818143501064](https://img-blog.csdnimg.cn/ebc10231c8b5491681c9813c4dccf9f5.png)

~~~cpp
// TCP 通信的流程
// 服务器端 （被动接受连接的角色）
    1. 创建一个用于监听的套接字
        - 监听：监听有客户端的连接
        - 套接字：这个套接字其实就是一个文件描述符
    2. 将这个监听文件描述符和本地的IP和端口绑定（IP和端口就是服务器的地址信息）
    	- 客户端连接服务器的时候使用的就是这个IP和端口
    3. 设置监听，监听的fd开始工作
    4. 阻塞等待，当有客户端发起连接，解除阻塞，接受客户端的连接，会得到一个和客户端通信的套接字(fd)
    5. 通信
        - 接收数据
        - 发送数据
    6. 通信结束，断开连接
~~~

~~~cpp
// 客户端
    1. 创建一个用于通信的套接字（fd）
    2. 连接服务器，需要指定连接的服务器的 IP 和 端口
    3. 连接成功了，客户端可以直接和服务器通信
        - 接收数据
        - 发送数据
    4. 通信结束，断开连接
~~~

## 套接字函数

~~~cpp
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h> // 包含了这个头文件，上面两个就可以省略

int socket(int domain, int type, int protocol);
    - 功能：创建一个套接字
    - 参数：
    - domain: 协议族
        AF_INET : ipv4
        AF_INET6 : ipv6
        AF_UNIX, AF_LOCAL : 本地套接字通信（进程间通信）
	// 第二个参数type和第三个参数protocol一个是协议类型，一个是具体的某个协议，划分的还比较细和周到
    - type: 通信过程中使用的协议类型
        SOCK_STREAM : 流式协议(例如：字节流的TCP，当然不一定只有这一种，可以被第三个参数具体指定)
        SOCK_DGRAM : 报式协议(例如：用户数据报的UDP，当然不一定只有这一种，可以被第三个参数具体指定)
    - protocol : 具体的一个协议。一般写0，可以表示默认的或者当协议类型中只有一个具体类型的时候就是用这个具体的类型
        - SOCK_STREAM : 流式协议默认使用 TCP
        - SOCK_DGRAM : 报式协议默认使用 UDP
    - 返回值：
        - 成功：返回文件描述符，操作的区域是内核缓冲区。
        - 失败：-1，并且设置errno
int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen); // socket命名
    - 功能：绑定，将 fd 和 本地的IP + 端口 port 进行绑定
    - 参数：
        - sockfd : 通过socket函数得到的文件描述符
        - addr : 需要绑定的socket地址，这个地址封装了ip和端口号的信息
        - addrlen : 第二个参数结构体占的内存大小
int listen(int sockfd, int backlog); // /proc/sys/net/core/somaxconn
    - 功能：监听这个socket上的连接
    - 参数：
        - sockfd : 通过socket()函数得到的文件描述符
        - backlog : 连接请求等待队列的长度，表示最多有多少个连接请求排队，并不是服务端最多可以连接通信的个数，因为出队列之后就可以进行通信，这个时候请求队列减一恢复了
int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
    - 功能：接收客户端连接，默认是一个阻塞的函数，阻塞等待客户端连接
    - 参数：
        - sockfd : 用于监听的文件描述符
        - addr : 传出参数，记录了连接成功后客户端的地址信息（ip，port），注意是客户端，这个信息是系统给我的，我获得的
        - addrlen : 指定第二个参数的对应的内存大小
    - 返回值：
        - 成功 ：用于通信的文件描述符
        - -1 ： 失败，设置errno

int connect(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
    - 功能： 客户端连接服务器
    - 参数：
        - sockfd : 用于通信的文件描述符
        - addr : 客户端要连接的服务器的地址信息，这个信息是我给的，表示我要和谁进行连接
        - addrlen : 第二个参数的内存大小
    - 返回值：成功 0， 失败 -1，设置errno
ssize_t write(int fd, const void *buf, size_t count); // 写数据
ssize_t read(int fd, void *buf, size_t count); // 读数据
~~~

### 示例

我们写一个例子，就是客户端可以从键盘读入字符串，发送给服务端，然后服务端原封不动的返回给客户端

~~~cpp
// server.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <unistd.h>

#define IPV4_STRING_MAX 16
#define MAX_SIZE 1024

// 回射服务器，客户端发送什么服务端就返回什么
int main(int argc, char const* argv[]) {
    // 判断命令行参数个数
    if (argc != 3) {
        printf("usage : %s  <ip_address>  <port>\n", argv[0]);
        return -1;
    }

    const char* server_ip = argv[1];
    const short server_port = atoi(argv[2]);  // atoi()函数可以把合理的字符串转化为整数

    // 1.创建socket
    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (-1 == listen_fd) {
        perror("socket");
        return -1;
    }

    // 2.绑定IP和端口号
    struct sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(server_port);  // 注意从主机字节序转换为网络字节序
    inet_pton(AF_INET, server_ip, &server_addr.sin_addr.s_addr);

    int ret = bind(listen_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    if (-1 == ret) {
        perror("bind");
        return -1;
    }

    // 3.开始监听
    ret = listen(listen_fd, 8);
    if (-1 == ret) {
        perror("listen");
        return -1;
    }

    // 4.接受连接请求
    struct sockaddr_in client_addr;
    socklen_t client_addr_len = sizeof(client_addr);
    int connect_fd = accept(listen_fd, (struct sockaddr*)&client_addr, &client_addr_len);
    if (-1 == connect_fd) {
        perror("accept");
        return -1;
    }

    // 打印连接的客户端的信息
    char client_ip[IPV4_STRING_MAX] = {0};
    inet_ntop(AF_INET, &client_addr.sin_addr.s_addr, client_ip, sizeof(client_ip));
    printf("client has connected , ip : %s , port : %d\n", client_ip, ntohs(client_addr.sin_port));

    // 5.开始通信
    // 我们的要求是客户端发送什么，服务端都返回相同的值
    char buf[MAX_SIZE] = {0};
    while (1) {
        bzero(buf, sizeof(buf));
        // 读数据
        int len = read(connect_fd, buf, sizeof(buf) - 1);
        if (-1 == len) {
            perror("read");
            return -1;
        }
        if (len > 0)
            printf("recv data : %s", buf);
        else if (0 == len) {  // 客户端断开连接
            printf("client closed...\n");
            break;
        }

        // 写数据
        write(connect_fd, buf, strlen(buf));
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
#include <unistd.h>

#define MAX_SIZE 1024

static int count = 0;

int main(int argc, char const* argv[]) {
    // 判断命令行参数个数
    if (argc != 3) {
        printf("usage : %s  <ip_address>  <port>\n", argv[0]);
        return -1;
    }

    const char* server_ip = argv[1];
    const short server_port = atoi(argv[2]);  // atoi()函数可以把合理的字符串转化为整数

    // 1.创建socket
    int connect_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (-1 == connect_fd) {
        perror("socket");
        return -1;
    }

    // 2.建立连接
    struct sockaddr_in server_addr;
    // 地址族
    server_addr.sin_family = AF_INET;
    // 端口号
    server_addr.sin_port = htons(server_port);
    // IP地址
    inet_pton(AF_INET, server_ip, &server_addr.sin_addr.s_addr);

    int ret = connect(connect_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    if (-1 == ret) {
        perror("connect");
        return -1;
    }
    // 连接成功，输出信息
    printf("connected successfully , waiting for communication.\n");

    // 3.开始通信
    // 我们要求客户端可以从键盘录入值进行通信
    char buf[MAX_SIZE] = {0};
    while (1) {
        bzero(buf, sizeof(buf));
        // 写数据
        fgets(buf, sizeof(buf), stdin);  
        // 这里有一个问题，服务器在阻塞读的时候服务端如果强制退出比如 ctrl + c，就会出问题，这样客户端不会停止，因为他还在写的部分阻塞，没有在读的部分，但是问题不大，因为实际开发当中我们不会对服务器做这样的操作

        // 增加退出功能
        if (strcmp(buf, "quit\n") == 0 || strcmp(buf, "QUIT\n") == 0)
            return 0;

        printf("send : %s", buf);
        write(connect_fd, buf, strlen(buf));

        // 读数据
        bzero(buf, sizeof(buf));
        int len = read(connect_fd, buf, sizeof(buf) - 1);
        if (-1 == len) {
            perror("len");
            return -1;
        }
        if (len > 0)
            printf("recv : %s", buf);

        else if (0 == len) {
            // 服务端关闭了
            printf("server closed...\n");
            break;
        }
    }

    // 4.关闭连接
    close(connect_fd);

    return 0;
}
~~~

**其中为什么read()的结果为0的时候就表示对方关闭了呢？**

**首先对方是写端，我们是读端，如果对方关闭的话，read()会返回0表示读到文件末尾，也就是表示对方关闭了，和管道的操作非常类似**

**总结：**

- **读管道：**
  - **管道中有数据，读取会返回实际读到的字节数**
  - **管道中无数据：**
    - **写端全部关闭，read返回0(相当于读到文件的末尾)**
    - **写端没有完全关闭，read阻塞等待**
- **写管道：**
  - **管道读端全部关闭，产生信号SIGPIPE，进程异常终止**
  - **管道读端没有全部关闭：**
    - **管道已满，write阻塞**
    - **管道没有满，write将数据写入，并返回实际写入的字节数**

当然上面的代码还有点小问题，如图所示，后续修改

## TCP三次握手

TCP 是一种面向连接的单播协议，在发送数据前，通信双方必须在彼此间建立一条连接。所谓的“连接”，其实是客户端和服务器的内存里保存的一份关于对方的信息，如 IP 地址、端口号等。

TCP 可以看成是一种字节流，它会处理 IP 层或以下的层的丢包、重复以及错误问题。在连接的建立过程中，双方需要交换一些连接的参数。这些参数可以放在 TCP 头部。

TCP 提供了一种可靠、面向连接、字节流、传输层的服务，采用三次握手建立一个连接。采用四次挥手来关闭一个连接。

**三次握手的目的是保证了双方互相之间建立了连接。**

**三次握手发生在客户端连接的时候，当调用connect()的时候，底层会通过TCP协议进行三次握手。**

![image-20230818175354581](https://img-blog.csdnimg.cn/6311234b34424045afe8e302b8ab8222.png)

- 16 位端口号（port number）：告知主机报文段是来自哪里（源端口）以及传给哪个上层协议或 应用程序（目的端口）的。进行 TCP 通信时，客户端通常使用系统自动选择的临时端口号。
- 32 位序号（sequence number）：一次 TCP 通信（从 TCP 连接建立到断开）过程中某一个传输 方向上的字节流的每个字节的编号。假设主机 A 和主机 B 进行 TCP 通信，A 发送给 B 的第一个 TCP 报文段中，序号值被系统初始化为某个随机值 ISN（Initial Sequence Number，初始序号 值）。那么在该传输方向上（从 A 到 B），后续的 TCP 报文段中序号值将被系统设置成 ISN 加上 该报文段所携带数据的第一个字节在整个字节流中的偏移。例如，某个 TCP 报文段传送的数据是字 节流中的第 1025 ~ 2048 字节，那么该报文段的序号值就是 ISN + 1025。另外一个传输方向（从 B 到 A）的 TCP 报文段的序号值也具有相同的含义。 
- 32 位确认号（acknowledgement number）：用作对另一方发送来的 TCP 报文段的响应。其值是 收到的 TCP 报文段的序号值 + 标志位长度（SYN，FIN） + 数据长度 。假设主机 A 和主机 B 进行 TCP 通信，那么 A 发送出的 TCP 报文段不仅携带自己的序号，而且包含对 B 发送来的 TCP 报文段 的确认号。反之，B 发送出的 TCP 报文段也同样携带自己的序号和对 A 发送来的报文段的确认序 号。 
- 4 位头部长度（head length）：标识该 TCP 头部有多少个 32 bit(4 字节)。因为 4 位最大能表示 15，所以 TCP 头部最长是60 字节。
- 6 位标志位包含如下几项：
  - URG 标志，表示紧急指针（urgent pointer）是否有效。 
  - ACK 标志，表示确认号是否有效。我们称携带 ACK 标志的 TCP 报文段为确认报文段。 PSH 标志，提示接收端应用程序应该立即从 TCP 接收缓冲区中读走数据，为接收后续数据腾 出空间（如果应用程序不将接收到的数据读走，它们就会一直停留在 TCP 接收缓冲区中）。 
  - RST 标志，表示要求对方重新建立连接。我们称携带 RST 标志的 TCP 报文段为复位报文段。 
  - SYN 标志，表示请求建立一个连接。我们称携带 SYN 标志的 TCP 报文段为同步报文段。 
  - FIN 标志，表示通知对方本端要关闭连接了。我们称携带 FIN 标志的 TCP 报文段为结束报文 段。 
  - 16 位窗口大小（window size）：是 TCP 流量控制的一个手段。这里说的窗口，指的是接收 通告窗口（Receiver Window，RWND）。它告诉对方本端的 TCP 接收缓冲区还能容纳多少 字节的数据，这样对方就可以控制发送数据的速度。 
  - 16 位校验和（TCP checksum）：由发送端填充，接收端对 TCP 报文段执行 CRC 算法以校验 TCP 报文段在传输过程中是否损坏。注意，这个校验不仅包括 TCP 头部，也包括数据部分。 这也是 TCP 可靠传输的一个重要保障。 
  - 16 位紧急指针（urgent pointer）：是一个正的偏移量。它和序号字段的值相加表示最后一 个紧急数据的下一个字节的序号。因此，确切地说，这个字段是紧急指针相对当前序号的偏移，不妨称之为紧急偏移。TCP 的紧急指针是发送端向接收端发送紧急数据的方法。

![image-20230818175513668](https://img-blog.csdnimg.cn/e313e454b4ee445faaebad2c749c16f8.png)

![image-20230819113154633](https://img-blog.csdnimg.cn/8babe97b873a44b79f57b076d95cfcba.png)

### 类比

我们用男女朋友的例子来进行举例，画图如下：

![image-20230819103736969](https://img-blog.csdnimg.cn/21286cbe7afe4bda86c094e21cdda255.png)

男生向女生说能不能做我女朋友，女生说可以，但是这个时候女生不放心，需要问男生能不能做自己的男朋友，为了进行确认；男生回复可以，双方都表示愿意做男女朋友，也就是双方都要确认对方和自己能够建立连接并且能够发送消息和收到消息，这才能保证整个TCP连接的可靠性，这也是为什么TCP连接需要建立连接

### 为什么需要三次握手而不是两次握手？

**为了能够建立起可靠的连接，客户端和服务端双方都必须各自确认一些信息才能保证整个连接是可靠的，就是确认双方都能接受和发送消息，好，我们一次一次来看**

- **第一次客户端发送SYN=1的请求连接消息，这个时候客户端能够确认自己的发送数据没有问题；服务端收到请求连接消息之后能够确认自己的接收数据没有问题，并且还能够确认客户端的发送数据没有问题**
- **第二次服务端发送ACK=1 SYN=1的确认信息，服务端能够确认自己的发送数据没有问题，客户端收到服务端的消息之后能够确认服务端的发送数据没有问题，并且由于这条消息是因为客户端发送请求，服务端回复的，因此客户端还能确认服务端的收到数据没有问题，至此，客户端已经能够完全确认自己和服务端收发数据都没有问题了**
- **但是我们现在观察服务端，他还没有办法确认客户端接收数据有没有问题，因为服务端还没有收到客户端的回复报文，因此我们需要第三次握手，客户端针对上一条确认报文在发送一条确认报文，这个时候服务端才能完全确认所有都没问题，换句话说，这个连接才是可靠的!!!**

## TCP滑动窗口

滑动窗口（Sliding window）是一种流量控制技术。早期的网络通信中，通信双方不会考虑网络的拥挤情况直接发送数据。由于大家不知道网络拥塞状况，同时发送数据，导致中间节点阻塞掉包， 谁也发不了数据，所以就有了滑动窗口机制来解决此问题。滑动窗口协议是用来改善吞吐量的一种 技术，即容许发送方在接收任何应答之前传送附加的包。接收方告诉发送方在某一时刻能送多少包 （称窗口尺寸）。 

TCP 中采用滑动窗口来进行传输控制，滑动窗口的大小意味着接收方还有多大的缓冲区可以用于 接收数据。发送**方可以通过滑动窗口的大小来确定应该发送多少字节的数据。当滑动窗口为 0 时，发送方一般不能再发送数据报。 

滑动窗口是 TCP 中实现诸如 ACK 确认、流量控制、拥塞控制的承载结构。

窗口理解为缓冲区的大小

滑动窗口的大小会随着发送数据和接收数据而变化

通信的双方都有发送缓冲区和接受缓冲区

- 服务器：
  - 发送缓冲区  (发送缓冲区的窗口)
  - 接受缓冲区  (接受缓冲区的窗口)
- 客户端：
  - 发送缓冲区  (发送缓冲区的窗口)
  - 接受缓冲区  (接受缓冲区的窗口)

![image-20230818175617550](https://img-blog.csdnimg.cn/fbc9abfcc1e846519362531b33624995.png)

~~~cpp
发送方的缓冲区：
    白色格子：空闲的空间
    灰色格子：数据已经被发送出去了，但是还没有被接受
   	紫色格子：还没有发送出去的数据
    
接受方的缓冲区：
    白色格子：空闲的空间
    紫色格子：已经接收到的数据
~~~

![image-20230818175628648](https://img-blog.csdnimg.cn/4c02090435e749748d1d9a0636d517dd.png)

~~~cpp
# mss : Maximum Segment Size(一条数据最大的数据量)
# win : 滑动窗口

1.客户端向服务器发送连接，客户端的滑动窗口是4096，一次发送的最大数据量是1460
2.服务器接受连接请求，告诉客户端服务器的窗口大小是6144，一次发送的最大数据量是1024
3.第三次握手
4.4-9 客户端连续给服务器发送了6k的数据，每次发送1k
5.第10次，服务器告诉客户端：发送的6k数据已经接收到，存储在缓冲区中，缓冲区数据已经处理了2k，窗口大小是2k
6.第10次，服务器告诉客户端：发送的6k数据已经接收到，存储在缓冲区中，缓冲区数据已经处理了4k，窗口大小是4k
7.第12次，客户端给服务器发送了1k的数据
8.第13次，客户端主动请求和服务端断开连接，并且给服务器发送1k的数据
9.第14次，服务器回复ACK 8194，同意客户端断开连接的请求，并且告诉客户端已经接收到刚才的2k的数据，并且指出滑动窗口的大小
10.第15，16次，通知客户端滑动窗口的大小
11.第17次，第三次挥手，服务端给客户端发送FIN，请求断开连接
12.第18次，第四次挥手，客户端同意了服务端的断开连接请求
~~~

## TCP四次挥手

**四次挥手发生在断开连接的时候，在程序中当调用close()会使用TCP协议进行4次挥手。**

**客户端和服务端都可以主动发起断开连接，谁先调用close()谁就先发起**

**因为在TCP连接的时候，采用三次握手建立的连接是双向的，因此在断开的时候也需要双向断开，这就是为什么需要四次挥手**

![image-20230818175657616](https://img-blog.csdnimg.cn/7a807755fa5f4c2cb67f26c6be5f830c.png)

### 类比

还是用男女的例子来举例：

**客户端向服务端发出断开连接请求FIN，服务端接受请求，并返回确认，至此，客户端向服务端方向的数据传输就断开了；但是服务端仍可以向客户端发送数据，当发送数据完毕之后(或者不发)服务端向客户端发送断开连接请求FIN，客户端接受请求，然后返回针对该请求报文的确认，至此服务端向客户端方向的数据传输断开，该TCP连接就此关闭**

![image-20230819150618612](https://img-blog.csdnimg.cn/6c083bd2e2624bae90f70125b6b56c5d.png)

那我们想一下，第二步和第三步能不能合起来呢？也就是：

### 为什么要四次挥手而不是三次挥手？

**我个人的理解是，首先前两步和后两步的工作是不同的，前两步是针对客户端向服务端释放连接的(在这里是客户端先释放连接)，后两步是针对服务端向客户端释放连接，功能不同，针对不同；其次，在第三步服务端发出释放连接请求之前，服务端还可以但单方面的向客户端发送数据，这时客户端虽然不能发送数据，但是仍可以接受服务端发送的数据，服务端很可能还有没有发送完毕的数据想要发送，因为这个释放连接的请求是客户端提出的，这样两个步骤就必须分开了**

## TCP通信并发

### 多进程实现并发服务器

**要实现TCP通信服务器并发的任务，使用多线程或者多进程解决**

**思路：**

- **一个父进程，多个子进程**
- **父进程负责等待并且接受客户端的连接**
- **子进程负责完成通信，接受一个客户端连接，创建一个子进程用于通信**

以下是代码：

完成的功能是，服务端可以接受多个客户端的连接，然后客户端键入数据，服务端返回相同的数据

~~~cpp
// server.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <signal.h>
#include <sys/wait.h>
#include <unistd.h>

#define MAX_IPV4_STRING 16
#define MAXSIZE 1024

void Recycle_Callback(int signum) {
    while (1) {
        // 第二个参数可以用来获取子进程退出的状态
        int ret = waitpid(-1, nullptr, WNOHANG);
        if (-1 == ret)
            //-1表示回收错误，也就是没有子进程了，为了达到这个判断，我们使用非阻塞的，因为阻塞的他会阻塞
            return;
        else if (0 == ret)  // 0在非阻塞的情况下代表还有子进程活着，重开循环把结束的子进程尽可能都回收
            continue;
        else if (ret > 0)
            // 回收了某个子进程
            printf("child process (pid %d) has be recycled.\n", ret);
    }
}

// 接受多个客户端的连接，这个程序用多进程来处理
int main(int argc, char const* argv[]) {
    // 创建出来子进程父进程需要对其进行回收的操作，但是wait()或者waitpid()无论是阻塞还是非阻塞的情况都没办法实现我们想要的操作
    // 所以想到捕捉信号SIGCHID
    struct sigaction sig_child;
    sig_child.sa_flags = 0;
    sigemptyset(&sig_child.sa_mask);  // 不阻塞任何临时的信号
    sig_child.sa_handler = Recycle_Callback;

    sigaction(SIGCHLD, &sig_child, nullptr);

    // 命令行参数
    if (argc != 3) {
        printf("usage : %s  <ip_address>  <port>\n", argv[0]);
        return -1;
    }

    const char* server_ip = argv[1];
    const int server_port = atoi(argv[2]);

    // 1.创建socket套接字
    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (-1 == listen_fd) {
        perror("socket");
        return -1;
    }

    // 2.将套接字绑定IP和端口
    struct sockaddr_in server_addr;
    // 地址族
    server_addr.sin_family = AF_INET;
    // 端口，注意转换字节序
    server_addr.sin_port = htons(server_port);
    // IP
    inet_pton(AF_INET, server_ip, &server_addr.sin_addr.s_addr);

    int ret = bind(listen_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    if (-1 == ret) {
        perror("bind");
        return -1;
    }

    // 3.开始监听
    ret = listen(listen_fd, 5);
    if (-1 == ret) {
        perror("listen");
        return -1;
    }

    // 不断循环等待客户端连接
    while (1) {
        // 4.接受请求
        struct sockaddr_in client_addr;
        socklen_t client_addr_len = sizeof(client_addr);
        int connect_fd = accept(listen_fd, (struct sockaddr*)&client_addr, &client_addr_len);
        if (-1 == connect_fd) {
            if (errno == EINTR)
                // 说明产生了信号发生了软中断，执行回来accept()就不阻塞了，这是预料之内的状态，我们对其进行细微处理
                continue;
            perror("accept");
            return -1;
        }

        // 5.开始通信，在子进程中进程通信
        pid_t pid = fork();
        if (-1 == pid) {
            perror("fork");
            return -1;
        }
        if (0 == pid) {  // 子进程
            //  输出连接的客户端的IP和端口
            char client_ip[MAX_IPV4_STRING] = {0};
            inet_ntop(AF_INET, &client_addr.sin_addr.s_addr, client_ip, sizeof(client_ip));
            in_port_t client_port = ntohs(client_addr.sin_port);
            printf("one client has connected , ip : %s , port : %d\n", client_ip, client_port);

            // 处理数据，接受客户端的数据并且相同返回
            char buf[MAXSIZE] = {0};
            while (1) {
                // 读
                bzero(buf, sizeof(buf));
                int len = read(connect_fd, buf, sizeof(buf) - 1);  // 这里老师提到要注意\0，我这么做也是可以的，我在读的时候留出\0的空间，写的时候我全部写入，这样我的buf最后肯定是有\0的
                if (-1 == len) {
                    perror("read");
                    return -1;
                }
                if (len > 0)
                    printf("recv client (ip : %s , port : %d) data : %s", client_ip, client_port, buf);
                else if (0 == pid) {
                    // 写端断开连接，子进程任务结束，退出
                    printf("client (ip : %s , port : %d) has closed...\n", client_ip, client_port);
                    close(connect_fd);
                    goto FINAL;  // 跳转到程序结束的位置
                }

                // 写
                write(connect_fd, buf, strlen(buf));
            }
        } else if (pid > 0)  // 父进程
            continue;
    }

    // 6.断开连接
FINAL:
    close(listen_fd);

    return 0;
}
~~~

执行结果如下：

直截取了服务端的图片

![image-20230819170952283](https://img-blog.csdnimg.cn/4418a2bfc3a942a48eb1969382f2b1a9.png)

**服务器的代码涉及到两个问题：**

- **为了防止僵尸进程，服务端的父进程必须对所有的子进程进行回收，那么如何有效的对子进程进行回收？**

  **父进程是在不断的阻塞等待客户端的连接，调用accept()函数，在这里如果回收子进程是非常不好的，所以我们结合子进程结束会发出SIGCHID信号，这个信号默认被父进程忽略，但是我们捕捉这个信号，然后开启软中断，就可以对子进程进行回收了**

  **我们可以调用waitpid()函数对所有的子进程进行回收，但是一次只能回收一个所以需要while(1)，然后由于我们需要判断没有子进程可以回收的状态以此来跳出中断，因此我们使用非阻塞的waitpid()，当服务端结束的时候，对应的子进程也结束，我的非阻塞的waitpid()就尽可能的把已经结束的子进程给全部回收掉了，避免僵尸进程的出现**

- **那么这样的话我们执行就会出现第二个问题，如下：**

  **当我一个子进程结束的时候，父进程中断处理之后，应该回到原来accept()的状态，但是这时accept()报错了**

  **![image-20230819172037175](https://img-blog.csdnimg.cn/155eff53539a4f8a9193ed1dcbacf286.png)**

  **是什么原因呢？**

  **因为accpt()这里软中断结束之后，会从阻塞中断变成非阻塞的，然后没有客户端连接，就报错了，程序结束，errno被设置为EINTR**

  **![image-20230819172505207](https://img-blog.csdnimg.cn/448c70833e0343a48a7f199753ad07ff.png)**

  **所以这里我们判断一下errno的值特殊处理就好了**

客户端代码基本没变，所以不用深究

~~~cpp
// client.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <unistd.h>

#define MAX_SIZE 1024

static int count = 0;

int main(int argc, char const* argv[]) {
    // 判断命令行参数个数
    if (argc != 3) {
        printf("usage : %s  <ip_address>  <port>\n", argv[0]);
        return -1;
    }

    const char* server_ip = argv[1];
    const short server_port = atoi(argv[2]);  // atoi()函数可以把合理的字符串转化为整数

    // 1.创建socket
    int connect_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (-1 == connect_fd) {
        perror("socket");
        return -1;
    }

    // 2.建立连接
    struct sockaddr_in server_addr;
    // 地址族
    server_addr.sin_family = AF_INET;
    // 端口号
    server_addr.sin_port = htons(server_port);
    // IP地址
    inet_pton(AF_INET, server_ip, &server_addr.sin_addr.s_addr);

    int ret = connect(connect_fd, (struct sockaddr*)&server_addr, sizeof(server_addr));
    if (-1 == ret) {
        perror("connect");
        return -1;
    }
    // 连接成功，输出信息
    printf("connected successfully , waiting for communication.\n");

    // 3.开始通信
    // 我们要求客户端可以从键盘录入值进行通信
    char buf[MAX_SIZE] = {0};
    while (1) {
        bzero(buf, sizeof(buf));
        // 写数据
        fgets(buf, sizeof(buf), stdin);  // 这里有一个问题，服务器在阻塞读的时候服务端如果强制退出比如 ctrl + c，就会出问题，这样客户端不会停止，因为他还在写的部分阻塞，没有在读的部分，但是问题不大，因为实际开发当中我们不会对服务器做这样的操作

        // 增加退出功能
        if (strcmp(buf, "quit\n") == 0 || strcmp(buf, "QUIT\n") == 0)
            return 0;

        printf("send : %s", buf);
        write(connect_fd, buf, strlen(buf));

        // 读数据
        bzero(buf, sizeof(buf));
        int len = read(connect_fd, buf, sizeof(buf) - 1);
        if (-1 == len) {
            perror("len");
            return -1;
        }
        if (len > 0)
            printf("recv : %s", buf);
        else if (0 == len) {
            // 服务端关闭了
            printf("server has closed...\n");
            break;
        }
    }

    // 4.关闭连接
    close(connect_fd);

    return 0;
}
~~~

### 多线程实现并发服务器

服务端的代码需要注意一些细节：

~~~cpp
// server.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <pthread.h>
#include <unistd.h>

#define MAXSIZE 1024
#define MAX_IPV4_STRING 16
#define MAX_INFO_SIZE 128

// 封装一个结构体来保存需要传给子线程的信息
struct Pthread_Info {
    int _connect_fd;                  // 用于通信的文件描述符
    struct sockaddr_in _client_addr;  // 客户端的socket地址信息
} p_infos[MAX_INFO_SIZE];

// 定义一个这个数组的计数器
int count = 0;

// 线程处理的回调函数
void* Communicate_Callback(void* args) {
    // 接受参数得到通信用到的信息
    int connect_fd = ((Pthread_Info*)args)->_connect_fd;
    struct sockaddr_in client_addr = ((Pthread_Info*)args)->_client_addr;

    in_port_t client_port = ntohs(client_addr.sin_port);

    char client_ip[MAX_IPV4_STRING] = {0};
    inet_ntop(AF_INET, &client_addr.sin_addr.s_addr, client_ip, sizeof(client_ip));
    printf("one client has connected , ip : %s , port : %d\n", client_ip, client_port);

    // 开始通信
    char buf[MAXSIZE] = {0};
    while (1) {
        // 读
        bzero(buf, sizeof(buf));
        int len = read(connect_fd, buf, sizeof(buf) - 1);
        if (-1 == len) {
            perror("read");
            return (void*)-1;
        }
        if (len > 0)
            printf("recv client ( ip : %s , port : %d ) data : %s", client_ip, client_port, buf);
        else if (0 == len) {  // 写端关闭，也就是客户端关闭连接，才会返回0
            printf("client ( ip : %s , port : %d ) has closed...\n", client_ip, client_port);
            close(connect_fd);
            printf("child thread has closed , tid : %ld\n", pthread_self());

            // // 释放堆上的这块内存
            // delete args;

            return nullptr;
        }

        // 写
        write(connect_fd, buf, strlen(buf));
    }

    // // 释放堆上的这块内存
    // delete args;

    return nullptr;
}

// 用多线程实现服务器并发
int main(int argc, char const* argv[]) {
    // 初始化数据
    int size = sizeof(p_infos) / sizeof(p_infos[0]);
    for (int i = 0; i < size; ++i) {
        // 将所有的都初始化为0
        bzero(&p_infos[i], sizeof(p_infos[i]));
        // 文件描述符初始化为-1，不能让他占据正在使用的
        p_infos[i]._connect_fd = -1;
    }

    // 命令行参数
    if (argc != 3) {
        printf("usage : %s  <ip_address>  <port>\n", argv[0]);
        return -1;
    }

    const char* server_ip = argv[1];
    const unsigned short server_port = atoi(argv[2]);

    // 1.创建socket套接字
    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (-1 == listen_fd) {
        perror("socket");
        return -1;
    }

    // 2.绑定IP和端口
    struct sockaddr_in server_addr;
    // 地址族
    server_addr.sin_family = AF_INET;
    // 端口
    server_addr.sin_port = htons(server_port);
    // IP
    inet_pton(AF_INET, server_ip, &server_addr.sin_addr.s_addr);

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

    printf("server has initialized...\n");

    // 4.接受客户端请求
    while (1) {
        // 思路：主线程不断接受客户端请求，然后创建子线程和客户端进行通信
        struct sockaddr_in client_addr;
        socklen_t client_addr_len = sizeof(client_addr);
        int connect_fd = accept(listen_fd, (struct sockaddr*)&client_addr, &client_addr_len);
        if (-1 == connect_fd) {
            perror("accept");
            return -1;
        }

        // 这里是局部变量，为了保证循环一次不会被释放，我们选择其他的方式
        // 我们可以选择用堆来存储，但是一是客户端数量多了没有办法进行限制，而是还要处理释放并且消耗资源大，所以我们可以开一个全局数组

        struct Pthread_Info& p_info = p_infos[count++];  // 创建数组成员的引用别名
        if (count >= MAX_INFO_SIZE) {
            // 超出最大客户端连接数量
            printf("client oversize , closing...\n");
            return 0;
        }
        p_info._connect_fd = connect_fd;
        p_info._client_addr = client_addr;  // 这个系统类实现了copy assignment，实现了深拷贝

        // 5.开始通信
        pthread_t tid;
        pthread_create(&tid, nullptr, Communicate_Callback, &p_info);
        // 将子线程分离，不用手动回收
        pthread_detach(tid);
    }

    // 6.关闭连接
    close(listen_fd);

    // 退出主线程，这里就这么写吧，主线程不可能比子线程早结束，因为主线程要等待
    pthread_exit(nullptr);

    return 0;
}
~~~

客户端的代码基本没变，可以不用深究

~~~cpp
// client.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <unistd.h>

#define MAXSIZE 1024

int main(int argc, char const* argv[]) {
    // 命令行
    if (argc != 3) {
        printf("usage : %s  <ip_address>  <port>\n", argv[0]);
        return -1;
    }

    const char* server_ip = argv[1];
    const unsigned short server_port = atoi(argv[2]);

    // 1.创建socket套接字
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
    server_addr.sin_port = htons(server_port);
    // IP
    inet_pton(AF_INET, server_ip, &server_addr.sin_addr.s_addr);

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
            return 0;

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

    // 4.关闭连接
    close(connect_fd);

    return 0;
}
~~~

## TCP状态转换

![image-20230819153502987](https://img-blog.csdnimg.cn/6e5a8d6fd144457c8b8dd990c9475776.png)

![image-20230819153510357](https://img-blog.csdnimg.cn/4b599e1fa6854c258f3839b2eaedd3bf.png)

### 2MSL（Maximum Segment Lifetime） 

**主动断开连接的一方, 最后进出入一个 TIME_WAIT 状态, 这个状态会持续: 2msl** 

- msl: 官方建议: 2分钟, 实际是30s
  当 TCP 连接主动关闭方接收到被动关闭方发送的 FIN 和最终的 ACK 后，连接的主动关闭方 必须处于TIME_WAIT 状态并持续 2MSL 时间。 
  **这样就能够让 TCP 连接的主动关闭方在它发送的 ACK 丢失的情况下重新发送最终的 ACK。 为了让被动关闭方第三次挥手的FIN应该获得的第四次挥手的ACK能够正确到达，如果最后一次ACK丢失了被动关闭方会及时再次发送第三次的FIN让主动关闭方发送ACK来确认关闭，否则直接关闭就没办法让被动关闭方确认了，也就是关闭的不完整**
  主动关闭方重新发送的最终 ACK 并不是因为被动关闭方重传了 ACK（它们并不消耗序列号， 被动关闭方也不会重传），而是因为被动关闭方重传了它的 FIN。事实上，被动关闭方总是 重传 FIN 直到它收到一个最终的 ACK。 

### 半关闭

**在四次挥手关闭的过程中主动断开连接方收到了两次被动连接方的报文，第一个是第二次挥手的ACK确认，第二个是第三次挥手的FIN请求，为什么叫FIN_WAIT_1和FIN_WAIT_2？就是因为第一次主动断开连接方发送FIN请求后等待ACK确认，然后第二次就主动等待被动连接方的FIN请求，最后就进入TIME_WAIT状态，这么说了理解得更透彻，参照下图理解**

<img src="https://img-blog.csdnimg.cn/7a39d72a3f634f828c6924c18eb27a02.png" alt="image-20230821093427390" style="zoom: 80%;" />

**当 TCP 链接中 A 向 B 发送 FIN 请求关闭，另一端 B 回应 ACK 之后（A 端进入 FIN_WAIT_2 状态），并没有立即发送 FIN 给 A，A 方处于半连接状态（半开关），此时 A 可以接收 B 发 送的数据，但是 A 已经不能再向 B 发送数据。**

#### shutdown()

从程序的角度，可以使用 API 来控制实现半连接状态：

~~~cpp
#include <sys/socket.h>
int shutdown(int sockfd, int how);
    sockfd: 需要关闭的socket的描述符
    how: 允许为shutdown操作选择以下几种方式:
        SHUT_RD(0): 关闭sockfd上的读功能，此选项将不允许sockfd进行读操作。
                    该套接字不再接收数据，任何当前在套接字接受缓冲区的数据将被无声的丢弃掉。
        SHUT_WR(1): 关闭sockfd的写功能，此选项将不允许sockfd进行写操作。进程不能在对此套接字发
                    出写操作。
        SHUT_RDWR(2):关闭sockfd的读写功能。相当于调用shutdown两次：首先是以SHUT_RD,然后以
                    SHUT_WR。
~~~

**使用 close 中止一个连接，但它只是减少描述符的引用计数，并不直接关闭连接，只有当描述符的引用计数为 0 时才关闭连接。**

**shutdown 不考虑描述符的引用计数，直接关闭描述符。也可选择中止一个方向的连接，只中止读或只中止写。** 

注意: 

1. **如果有多个进程共享一个套接字，close 每被调用一次，计数减 1 ，直到计数为 0 时，也就是所用进程都调用了 close，套接字将被释放。当然遇到父子进程的时候注意一下他们内核区是共享的还是独立的，下面会谈到** 

2. **在多进程中如果一个进程调用了 shutdown(sfd, SHUT_RDWR) 后，其它的进程将无法进行通信，因为直接关闭，不看引用计数。 但如果一个进程 close(sfd) 将不会影响到其它进程。**

3. **引申：为什么多进程中的文件描述符的引用计数不为1呢？我们来看我们代码的逻辑：**

   **我们用父进程接受连接，然后用子进程进行处理；文件描述符是内核区的，因此父进程和子进程就共享了这一份文件描述符数据了，父进程当然可以通过这个通信，但是逻辑没有这么干**
   ![image-20230822153655659](https://img-blog.csdnimg.cn/5ecddded39904d828ffee078685999c5.png)

#### 关于文件描述符的引用计数(file_description)

我们先从父子进程看起，就是父子进程对于文件描述符，下面有两段代码：

~~~cpp
// code1
#include <iostream>
using namespace std;
#include <fcntl.h>
#include <sys/wait.h>
#include <unistd.h>

#define MAXSIZE 1024

int main() {
    int fd = open("a.txt", O_RDONLY);
    if (-1 == fd) {
        perror("open");
        return -1;
    }

    char buf[MAXSIZE] = {0};

    pid_t pid = fork();
    if (-1 == pid) {
        perror("fork");
        return -1;
    }

    if (pid == 0) {
        read(fd, buf, 1);  // 我给buf中读进去1个字节内容
        printf("buf = %s\n", buf);
    } else if (pid > 0) {
        sleep(3);          // 保证子进程可以先读文件
        read(fd, buf, 2);  // 父进程中读取2个字节

        printf("buf = %s\n", buf);
        wait(nullptr);
    }

    close(fd);
    return 0;
}

// 执行结果：
// buf = h
// buf = el
~~~

~~~cpp
// code2
#include <assert.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

#define MAXSIZE 1024

int main() {
    pid_t pid = fork();
    if (-1 == pid) {
        perror("fork");
        return -1;
    }

    int fd = open("a.txt", O_RDONLY);
    if (-1 == fd) {
        perror("open");
        return -1;
    }

    char buf[MAXSIZE] = {0};

    if (pid == 0) {
        read(fd, buf, 1);  // 我给buf中读进去1个字节内容
        printf("buf = %s\n", buf);
    } else if (pid > 0) {
        sleep(3);          // 保证子进程可以先读文件
        read(fd, buf, 2);  // 父进程中读取2个字节

        printf("buf = %s\n", buf);
        wait(nullptr);
    }

    close(fd);
    return 0;
}

// 执行结果：
// buff = h
// buff = he
~~~

**我们仔细观察这两个代码，发现第一个代码先open()文件在fork()子进程；第二个代码先fork()子进程在open()文件，第一个代码的执行结果发现父子进程的文件指针好像是公用的，第二个则是独立的，那么这是为什么呢？**

**在Linux系统中父子进程在实际操作的时候具有"读时共享，写时拷贝"的性质，这个是针对用户区的，我们通过open()函数打开的文件描述符fd是属于内核区的，并且内核区还专门设有一个文件描述符表用来存放文件描述符，比如  STDIN_FILENO 0 ， STDOUT_FILENO 1 ， STDERR_FILENO 2 ，由于先打开open()再创建子进程fork()，那么他们内核区的数据是共享的，因此文件描述符也是用的同一个，文件描述符的引用计数为1，虽然close()的机制是引用计数为0才真正关闭，但是这里为1，因此关闭任意一个都相当于关闭了这个文件描述符，因此他们读取的文件指针也是共享的，所以开始读的位置不相同；但是第二个先创建子进程fork()再打开open()，显然这两个的文件描述符是不同的，这就跟匿名管道pipe通信父子进程需要先创建匿名管道pipe再创建子进程fork()一个道理**

**总结：**

- **fork前进行open，子进程无条件继承父进程的文件描述信息，子进程和父进程指向一样文件描述信息**
- **fork后进行open，子进程可以有自己的选择啊，不用继承父进程的所有，比如文件描述信息**

## 端口复用(关于sockopt())

**端口复用最常用的用途是:** 

- **防止服务器重启时之前绑定的端口还未释放** 
- **程序突然退出而系统没有释放端口**

**这两个的本质都是因为某些原因主动连接方程序退出了但是TCP的信息还在TIME_WAIT状态，可能这个时候被动连接方没办法收到LAST ACK，这就会导致一直处在TIME_WAIT状态，然后TIME_WAIT的时间2mss一般是60s，很长，很烦，这就导致端口一直被占用而没办法及时进行后续操作**

~~~cpp
#include <sys/types.h>
#include <sys/socket.h>
// 设置套接字的属性(不仅仅能够设置端口复用)
int setsockopt(int sockfd, int level, int optname, const void *optval, socklen_t optlen);
参数：
    - sockfd：要操作的套接字的文件描述符
    - level：级别 SOL_SOCKET (端口复用的级别)
    - optname：选项的名称
    	- SO_REUSEADDR
    	- SO_REUSEPORT
    - optval：属性的值，可以是int类型，也可以是其他类型，所以用void*接受，这里是整型
    	- 1：可以复用
    	- 0：不可以复用
    - optlen：上一个属性的长度
返回值：
    成功 0
    失败 -1，设置errno
 
端口复用，设置的时机是服务器绑定端口之前，先设置再 bind() ，否则就失效了
~~~

关于level参数，有很多，我们这里选择 SOL_SOCKET，代表是端口复用的级别

<img src="https://img-blog.csdnimg.cn/10ac5b0ecb3a47e9ae9ab51e4c73caa6.png" alt="image-20230820172341423" style="zoom: 80%;" />

查看网络信息相关的命令

~~~bash
netstat
参数：
	-a 显示所有的socket
	-p 显示正在使用socket的程序的名称
	-n 直接使用IP地址，不通过域名服务器
~~~

我们可以使用命令 **netstat -anp** 来查看相关的信息

### 示例

我们现在来看一段代码，是关于TCP通信的：

~~~cpp
// server.cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <arpa/inet.h>
#include <unistd.h>

#define MAX_IPV4_STRING 16
#define MAXSIZE 1024

int main() {
    // 创建socket
    int listen_fd = socket(PF_INET, SOCK_STREAM, 0);

    if (listen_fd == -1) {
        perror("socket");
        return -1;
    }

    struct sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(9999);

    // 设置端口复用(在绑定之前)
    int optval = 1;
    setsockopt(listen_fd, SOL_SOCKET, SO_REUSEPORT, &optval, sizeof(optval));

    // 绑定
    int ret = bind(listen_fd, (struct sockaddr *)&server_addr, sizeof(server_addr));
    if (ret == -1) {
        perror("bind");
        return -1;
    }

    // 监听
    ret = listen(listen_fd, 8);
    if (ret == -1) {
        perror("listen");
        return -1;
    }

    // 接收客户端连接
    struct sockaddr_in client_addr;
    socklen_t client_len = sizeof(client_addr);
    int connect_fd = accept(listen_fd, (struct sockaddr *)&client_addr, &client_len);
    if (connect_fd == -1) {
        perror("accpet");
        return -1;
    }

    // 获取客户端信息
    char client_ip[MAX_IPV4_STRING] = {0};
    inet_ntop(AF_INET, &client_addr.sin_addr.s_addr, client_ip, sizeof(client_ip));
    unsigned short client_port = ntohs(client_addr.sin_port);

    // 输出客户端的信息
    printf("client's ip is %s, and port is %d\n", client_ip, client_port);

    // 接收客户端发来的数据
    char buf[MAXSIZE] = {0};
    while (1) {
        int len = recv(connect_fd, buf, sizeof(buf), 0);
        if (len == -1) {
            perror("recv");
            return -1;
        } else if (0 == len) {
            printf("客户端已经断开连接...\n");
            break;
        } else if (len > 0)
            printf("read buf = %s", buf);

        // 小写转大写
        for (int i = 0; i < len; ++i)
            buf[i] = toupper(buf[i]);

        printf("after buf = %s", buf);

        // 大写字符串发给客户端
        ret = send(connect_fd, buf, strlen(buf) + 1, 0);
        if (ret == -1) {
            perror("send");
            return -1;
        }
    }

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
#include <unistd.h>

#define MAXSIZE 1024

int main() {
    // 创建socket
    int connect_fd = socket(PF_INET, SOCK_STREAM, 0);
    if (connect_fd == -1) {
        perror("socket");
        return -1;
    }

    struct sockaddr_in server_addr;
    inet_pton(AF_INET, "127.0.0.1", &server_addr.sin_addr.s_addr);
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(9999);

    // 连接服务器
    int ret = connect(connect_fd, (struct sockaddr *)&server_addr, sizeof(server_addr));

    if (ret == -1) {
        perror("connect");
        return -1;
    }

    while (1) {
        char buf[MAXSIZE] = {0};
        fgets(buf, sizeof(buf), stdin);

        write(connect_fd, buf, strlen(buf) + 1);

        // 接收
        int len = read(connect_fd, buf, sizeof(buf));
        if (len == -1) {
            perror("read");
            return -1;
        } else if (len > 0)
            printf("read buf = %s", buf);
        else {
            printf("服务器已经断开连接...\n");
            break;
        }
    }

    close(connect_fd);

    return 0;
}
~~~

#### 理解

我们先把TCP通信的图拿过来

<img src="https://img-blog.csdnimg.cn/6e5a8d6fd144457c8b8dd990c9475776.png" alt="image-20230819153502987" style="zoom:67%;" />

这段代码的作用是服务端发送字符串，服务端接受并且返回大写后的版本，代码逻辑我们不谈，前面早就谈过了，我们来看看释放连接时候会发生些什么事情

server.cpp代码当中有一个注释的部分，这个部分是用来设置端口复用的，我们现在先不管

~~~cpp
int optval = 1;
setsockopt(listen_fd, SOL_SOCKET, SO_REUSEPORT, &optval, sizeof(optval));
~~~

在代码中我们指定服务端的端口为9999，IP为任意IP(只要能连接)，然后用网络命令来查看一下状态

通过管道和grep命令通信来过滤剩下9999的信息

~~~bash
netstat -anp | grep 9999
~~~

我们来看下正常状态时候的输出：

服务端有两条信息，一条是用来监听的，因为我们没有关闭监听套接字，理论上它还可以继续accept()客户端，只是我们代码逻辑没有实现这个；另一条和客户端是已经建立连接；客户端就是和服务端建立连接

服务端使用的端口是9999

![image-20230820174841668](https://img-blog.csdnimg.cn/772dafc7511847ef91ab27e311467657.png)

现在我们使用 ctrl + c 发送SIGINT信号是服务端异常终止，输出：

此时，服务端到客户端的单向连接就关闭了，但是客户端还在，服务端处于FIN_WAIT2状态，等待客户端发送FIN的关闭连接报文；客户端处于CLOSE_WAIT状态

![image-20230820175148993](https://img-blog.csdnimg.cn/1276edb1e62642a2a6a28ad6347cd18e.png)

好，现在我们也类似强制关闭客户端，输出：

此时服务端进入TIME_WAIT状态，这个状态服务端接收到了FIN报文然后发送针对该报文的ACK报文，为了避免最后一次报文丢失，所以会有这个阶段，这个阶段的持续时间是2MSL，在Linux上大概是60秒

![image-20230820175507945](https://img-blog.csdnimg.cn/52490827b03e42bfbd2a9d862199c888.png)

如果我们在这段时间重开服务器，就会这样，表示端口被占用，这就是TIME_WAIT惹的祸

![image-20230820175849220](https://img-blog.csdnimg.cn/62498c08b93b41e9bb2f7ec28f9dac41.png)

因此，setsockapt()就是可以设置这个属性，使得端口能够复用，将那行代码恢复后，就可以正常打开服务器，并且网络状态是这样的

可以看出，之前的TIME_WAIT和现在的LISTEN状态共存了，这就是setsockapt()的作用，当然他不只可以设置端口复用，还有其他功能

![image-20230820180107223](https://img-blog.csdnimg.cn/97d1a68860a647ca9ec712fd5b09942b.png)

#### 思考

我现在不让客户端异常退出，当服务端异常退出后，我们代码的逻辑可以让客户端阻塞在输入的位置，所以这时我们输入代码然后就可以正常退出程序，但是正常退出程序之后我们发现TIME_WAIT状态不存在，也就是结束了，换句话说客户端正常收到了最后一次ACK，而我们刚才异常退出的时候客户端没办法收到最后一次ACK，所以端口被占用，需要端口复用，这点要注意

但是再想想，服务端也是异常退出的，他怎么收到了第二次ACK呢？这个问题我不知道准确的答案，但是我推测虽然服务端结束了，但是服务端的TCP信息尚未结束，因为服务端还要收到客户端的主动断开请求，这里是服务端先断开，但是被断开方客户端异常退出时就收不到最后一次ACK，所以会卡在TIME_WAIT状态(不是很理解)

**问题的关键点就在于被断开方最后一次ACK到底能否准确收到，我不知道怎么解释，但是TIME_WAIT会告诉我答案，这就是内核相关的东西了，我目前的水平达不到**

不明白其实没关系，只需要知道TIME_WAIT状态会导致端口占用就可以了，我们自己可以用网络命令查看，然后决定是否需要端口复用

