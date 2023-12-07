---
title: Linux系统编程入门
categories:
  - Linux学习
  - 牛客Linux
  - 第1章 Linux系统编程入门
abbrlink: ff5b4faf
date: 2023-09-21 01:00:00
updated: 2023-09-21 01:00:00
---

<meta name="referrer" content="no-referrer"/>

`牛客Linux`的`第1章 Linux系统编程入门`。

<!-- more -->

`CSDN`：[https://blog.csdn.net/m0_61588837/article/details/132433416](https://blog.csdn.net/m0_61588837/article/details/132433416)

`markdown`文档在：[https://github.com/DavidingPlus/Md_Files/blob/master/Cpp/C%2B%2B%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0/Linux/%E7%89%9B%E5%AE%A2%20Linux.md](https://github.com/DavidingPlus/Md_Files/blob/master/Cpp/C%2B%2B%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0/Linux/%E7%89%9B%E5%AE%A2%20Linux.md)

代码在：[https://github.com/DavidingPlus/Linux_Learning/tree/Newcoder_Linux](https://github.com/DavidingPlus/Linux_Learning/tree/Newcoder_Linux)

# 第一章 Linux系统编程入门

## GCC

### 什么是GCC

![image-20230712154631108](https://img-blog.csdnimg.cn/eef3f6d24396407783456347cb91d08b.png)

### GCC工作流程

![image-20230712162031153](https://img-blog.csdnimg.cn/635fdd6a0725454d89589b6192faeb9c.png)

预处理命令 **-E**

![image-20230712162645602](https://img-blog.csdnimg.cn/fb62d39c50e5483b8bf451c05c4bd73a.png)

得到的结果：

![image-20230712162728058](https://img-blog.csdnimg.cn/d711885ee18f4bc596f65e29811dc86d.png)

得到汇编代码命令 **-S**

![image-20230712163010950](https://img-blog.csdnimg.cn/6841d02827954bfca698dd056c1be2c5.png)

得到的结果：

![image-20230712163038321](https://img-blog.csdnimg.cn/0ba4d185722049478228d3ecc7e00a97.png)

### 常用参数选项

![image-20230712163407827](https://img-blog.csdnimg.cn/f82a923c7d674387ac7c2e5e60425161.png)

![image-20230712163412996](https://img-blog.csdnimg.cn/9eb6958cbaf34915a8e0b11ea4eb1d64.png)

关于-D：**用于在编译的时候指定一个宏**

```c++
#include <iostream>
using namespace std;

int main() {
    int a = 10;

    // 用 -D 来表示在编译的时候指定一个宏，从而可以输出这句话!!! -DDEBUG
    // 一个用途是：可以在用于调试的时候输出一些信息来检测程序，对程序整体的运行没有太大作用
#ifdef DEBUG
    cout << "FUCK" << endl;
#endif

    cout << "you" << endl;

    return 0;
}

```

关于-On：进行优化

```c++
#include <iostream>
using namespace std;

int main() {
    int b, c, d, e;
    b = 10;
    c = b;
    d = c;
    e = d;

    // 使用 -On 进行优化,比如可以优化成如下
    // int b, c, d, e;
    // b = 10;
    // c = 10;
    // d = 10;
    // e = 10;

    return 0;
}
```

### gcc和g++区别

![image-20230712170016696](https://img-blog.csdnimg.cn/d53dcb933f6344ccbe340321547c0362.png)

![image-20230712170241165](https://img-blog.csdnimg.cn/9276ba915e9942fc9039958c829fc2dc.png)

## 静态库

关于库：

![image-20230712192929996](https://img-blog.csdnimg.cn/290948d435b54861992708b667546872.png)

### 命名规则

<img src="https://img-blog.csdnimg.cn/a38a339b2a374f3899e2eb2e4ad7260b.png" alt="image-20230712193256400" style="zoom:80%;" />

### 制作

![image-20230712193344515](https://img-blog.csdnimg.cn/2d5879b349d74c5c8037ab71b9f80331.png)

制作示例：

现在我想把四则运算的代码打成一个静态库供别人使用

![image-20230712194227453](https://img-blog.csdnimg.cn/3aebc655b00a41b781ea89928e7681d1.png)

**按照上面的操作，先通过gcc生成 .o 文件，也就是 -c 到编译汇编，但是不链接的状态，这就得到了各个文件的.o**

![image-20230712194715642](https://img-blog.csdnimg.cn/0ff0b7ee50c248bb9e4147fe57a63efd.png)

### 使用

在实际的开发环境中，代码的结构往往是这样的

![image-20230712200023339](https://img-blog.csdnimg.cn/fe0d970bd18441a6866acf5c3c678ebb.png)

**include文件夹包含相应库当中实现的头文件，lib就存放对应的库，src存放源码，这个对程序的运行没有影响，可以理解为就是工作目录**

**在实际编译运行程序的过程中，不仅需要提供include下的头文件，也需要提供lib下相对应实现的库**

这就需要在g++或者gcc编译的过程中加入参数了

![image-20230712200254526](https://img-blog.csdnimg.cn/8b9608825f674a11a3c8fe9d1136f829.png)

直接编译会导致找不到头文件，因为这个时候head.h和main.c不在同一目录，所以需要用 -I 来包含头文件搜索的目录

![image-20230712200359114](https://img-blog.csdnimg.cn/82e075647b814e69896ff02e05481b8d.png)

在包含了头文件之后，发现里面的函数进行了声明但是没有实现，这个时候就需要引用库文件了

![image-20230712200507667](https://img-blog.csdnimg.cn/1cbf441a2a73417eb870e5f0a7ade039.png)

**calc是库的名称，libcalc.a是我们认为要求的库文件的名称**

![image-20230712200537940](https://img-blog.csdnimg.cn/7dda5ca7d675471487fd3f4316ae5fa2.png)

## 动态库

### 命名规则

![image-20230712202308744](https://img-blog.csdnimg.cn/b8823ef300404e27985d012cd6c93286.png)

### 制作

**得到与位置无关的代码 -fpic/-fPIC (这个 / 是或者的意思，就是两个任选一个写都可以)**

![image-20230712202505969](https://img-blog.csdnimg.cn/a15d2c9d9d77439593e2f84d092f7de3.png)

![image-20230712204636658](https://img-blog.csdnimg.cn/ce5b7e3631644c5994bc89bf1d7ba362.png)

### 使用

和静态库的使用方法一致，但是这里会出现动态库加载失败的问题

![image-20230712204703427](https://img-blog.csdnimg.cn/609390f6cfec4a98ba31e7d7c15fd56a.png)

![image-20230712204335700](https://img-blog.csdnimg.cn/24f43f022049421392ceba95dbb8d6ae.png)

### 加载失败及其解决

![image-20230712205553942](https://img-blog.csdnimg.cn/00a02b33a76647ec9a6f30926559f328.png)

**ldd命令(找到动态库的依赖关系)**

可以看出libcalc.so，我们自己写的动态库找不到依赖，显然无法执行

![image-20230712210027653](https://img-blog.csdnimg.cn/ef39db6d45584c3ea251968eec16b97c.png)

**/lib64/ld-linux-x86-64.so.2 这个是系统提供的动态载入器，用来获取依赖库的绝对路径并且装入到内存当中，这样程序就不会报错了**

#### **如何解决**

##### DT_RPATH段无法修改

##### 通过在环境变量 LD_LIBRARY_PATH 中进行添加

```bash
export LD_LIBRARY_PATH = $LD_LIBRARY_PATH:/mnt/d/Code/Code-C++/深入学习/Linux方向/牛客网课程/第一章-Linux开发环境搭建/04/library/lib
```

export就是修改环境变量的意思，$获取原先的环境变量，:表示在后面添加新的绝对路径，这里把我们的路径添加进去就好了

添加完之后就可以正常运行了

![image-20230712212247869](https://img-blog.csdnimg.cn/dc3dc137792c464c82a8ca7102b288e3.png)

**但是注意：这个环境变量的配置只是暂时的，当终端关闭环境变量也就消失了，每次需要重新配置**

所以需要永久级别的配置

- 用户级别

**通过 .bashrc 来进行配置**

![image-20230712212541900](https://img-blog.csdnimg.cn/7bb4330ad3c1484799cce31b49a074a7.png)

vim .bashrc 进入并修改

![image-20230712212710023](https://img-blog.csdnimg.cn/ba1eb0c53a9a481a8ff72cbf7f63aa4a.png)

在里面添加一行表示配置好了

**完事之后进行更新，以使其应用生效**

![image-20230712212817883](https://img-blog.csdnimg.cn/7270199f5fe44c32af92e84f4b3c7a56.png)

之后也能正常运行

- 系统级别

 在这个文件( /etc/profile )当中进行添加，需要sudo权限

![image-20230712213659601](https://img-blog.csdnimg.cn/93a3212cddb546f794542fd6b2849517.png)

同样加上这句话

![image-20230712213823973](https://img-blog.csdnimg.cn/c6fe37872a4e4be99b326770601a982a.png)

然后保存更新

![image-20230712213917346](https://img-blog.csdnimg.cn/50eef56246584bb19ed950a86fe39a4f.png)

然后同样能正常执行

##### 修改 /etc/ld.so.cathe 文件列表

通过这个文件进行配置 /etc/ld.so.conf

![image-20230712214441428](https://img-blog.csdnimg.cn/cd48e6a7374a4420afc5e6f9f9aa2f81.png)

然后把路径放到这个文件里面就好了

![image-20230712214549726](https://img-blog.csdnimg.cn/2fb8e2cfb2ac4b6398caa39e584338c4.png)

然后进行更新

![image-20230712215334405](https://img-blog.csdnimg.cn/b0e55ec196484620b5865ba16b2960cd.png)

也能正常运行

##### 将动态库文件放到 /lib 或者 /usr/lib 目录下

不建议使用，因为这两个目录中已经放了很多文件，再放入我们自己的文件不利于管理，并且由于可能我们自己的文件和系统文件重名，有可能造成替换然后造成出错

## 静态库和动态库的对比

### 程序编译成可执行程序的过程

**静态库和动态库都是在链接阶段起作用**

![image-20230713095340490](https://img-blog.csdnimg.cn/5834f9a862b44b7fa40c807ec6a5adff.png)

### 静态库制作过程

![image-20230713095639181](https://img-blog.csdnimg.cn/8638c1bbd52f4b7b958eec3250232b03.png)

### 动态库制作过程

![image-20230713100533853](https://img-blog.csdnimg.cn/888348041b7140fb8700decae7c8e0f4.png)

### 静态库的优缺点

![image-20230713100855560](https://img-blog.csdnimg.cn/6737d4307dd54af5894f6a4d7afb3638.png)

### 动态库的优缺点

![image-20230713101528981](https://img-blog.csdnimg.cn/da47622c4c5f4ac0aae40403cfb6cdb5.png)

## makefile

### 什么是makefile

**主要是为了方便进行自动化编译，因为实际的开发过程中代码的存放位置是有规定的，不一定都在同一个目录，这样就导致可能文件依赖出问题，找不到这种，还有就是某个文件依赖于另一个文件，这就需要要求哪些文件需要先编译，哪些文件后编译，这样就需要一个makefile文件来全自动化编译**

![image-20230713102059928](https://img-blog.csdnimg.cn/591b005d2f3542cca00362ecad560748.png)

### 命名规则

提供一个或者多个规则

![image-20230713103610886](https://img-blog.csdnimg.cn/b6d84aa8c85a48348da0e0697a716d1b.png)

### 简单案例

创建Makefile文件

![image-20230713103811609](https://img-blog.csdnimg.cn/7c1dd0ac8a7144a9ad0106a79fe85ead.png)

编写

![image-20230713104023510](https://img-blog.csdnimg.cn/570dd7bfdc69479fb55200ff20638ba4.png)

**第一行app：生成的目标，: 后面是生成目标所需要的依赖文件**

**第二行(需要Tab缩进)：通过执行该命令生成目标**

![image-20230713104408213](https://img-blog.csdnimg.cn/26776604c6264e6881a30534dc7c10a0.png)

### 工作原理

![image-20230713105602304](https://img-blog.csdnimg.cn/5de61aa07fe74283a949cf17b67b1204.png)

**makefile可以检测更新，就是我执行命令的时候，会看上次目标的生成时间和现在的依赖文件的时候是否匹配，不匹配则更新了，于是重新执行相对应的代码然后更新目标文件**

举个例子来说明：

![image-20230713105556164](https://img-blog.csdnimg.cn/1746b7b0fc704a10ab4adb12a3bc2411.png)

**现在我的目标是app文件，然后我写的依赖是这些 .o 文件，也就是编译了但未链接的可执行文件**

**然后这些文件按理来说是找不到的，所以需要在下面作为目标文件被已有的依赖来进行命令生成**

**最下面的clean是makefile文件最好都有的，清理编译过程中生成的 *.o 和 app 文件**

**这样做的好处是：当某个源文件进行修改之后，在执行make命令的时候，其他的文件不用重新编译，提高了效率**

### 变量

**自动变量只能在规则的命令当中使用!!!**

![image-20230713113345866](https://img-blog.csdnimg.cn/f693d7999b0449d2bcf7964350727cc8.png)

### 模式匹配

**把一些格式差不多的规则用通式写出来**!

![image-20230713113808672](https://img-blog.csdnimg.cn/f7ed660e900e4fa08b5a0422ee4531dd.png)

### 函数

**wildcard这个函数只能用来获取 .c 文件**

![image-20230713132533052](https://img-blog.csdnimg.cn/26ad23b0aef84a97acc0252c04682099.png)

**用patsubst 来将 .c 文件替换为 .o文件**

![image-20230713132756923](https://img-blog.csdnimg.cn/1297dc9c4bf04160ba88e56c543d26e1.png)

举例：这样就可以把上面的例子优化成这样

<img src="https://img-blog.csdnimg.cn/74b6e8d237dd402db2d346a8b87045e1.png" alt="image-20230713133926048" style="zoom:80%;" />

遇到c++可以这么写：

<img src="https://img-blog.csdnimg.cn/6fe4fb6e71db4ea9a3e62c4c9da4057c.png" alt="image-20230713140259470" style="zoom:80%;" />

**注意：patsubst里面几个逗号之间不能用空格!!!!(否则出错)**

## GDB调试

### 什么是GDB

![image-20230713140857081](https://img-blog.csdnimg.cn/787966f3de1b46afa416b45df36dffe6.png)

### 准备工作

**gdb是调试可执行程序的，所以我们需要先编译文件成为一个可执行程序**

![image-20230713141622040](https://img-blog.csdnimg.cn/6a86d47c75964c6f8dd3d823ee332772.png)

示例

**-g 保证了gdb能找到源文件**

![image-20230713143121240](https://img-blog.csdnimg.cn/22d5a35849f846538b949cf2070280a1.png)

### GDB命令

**gdb 启动的是可执行程序!!!**

![image-20230713142329930](https://img-blog.csdnimg.cn/158817cf28304218b5be55b871187cb6.png)

示例：

![image-20230713143240623](https://img-blog.csdnimg.cn/a545facc80ac470a862f7ca28a5e1d50.png)

#### 查看 list

**list命令**

![image-20230713143813271](https://img-blog.csdnimg.cn/7d7758c91b214dac974c55a41f8a46fd.png)

**查看别的文件**

先把这三个cpp文件编译连接成为一个可执行文件，加上-g -Wall

![image-20230713144716128](https://img-blog.csdnimg.cn/7fe35b0ed2704502adcdf87a5297035d.png)

进入gdb，默认查看的是main.cpp，现在我看bubble.cpp

![image-20230713144828842](https://img-blog.csdnimg.cn/603e156247d4459a87ecda722acc3b91.png)

#### 断点操作 break

![image-20230713150206430](https://img-blog.csdnimg.cn/d8d6acf8da2f49bf9244aaf445317a16.png)

**示例：**

![image-20230713150556682](https://img-blog.csdnimg.cn/f4ff475d192342708e4d01cc45766e67.png)

**在其他文件打断点**

![image-20230713150932690](https://img-blog.csdnimg.cn/e89264f750014dffa0674976bbc18f90.png)

**设置断点无效或者有效**

![image-20230713151406288](https://img-blog.csdnimg.cn/b7dbf0a4388f45b198a4d26d1e2df0e2.png)

**设置条件断点(一般用在循环的位置)**

![image-20230713151623439](https://img-blog.csdnimg.cn/8add970e212d430aa52dc2b6542b6f17.png)

#### 调试命令

![image-20230713152020106](https://img-blog.csdnimg.cn/d82d4fbea15744fa8aaddbbdd01c9771.png)

示例：

start

![image-20230713152439462](https://img-blog.csdnimg.cn/867f92ab39594fcfbe197348bcc5e0b1.png)

run，next，step

![image-20230713153024581](https://img-blog.csdnimg.cn/3aa7d5acf6a745bf8805e27a45ff40fe.png)

![image-20230713153323313](https://img-blog.csdnimg.cn/758e800265c54fb78d7bfd67653ba59b.png)

**next不会进入函数体，step会进入函数体**

![image-20230713153540431](https://img-blog.csdnimg.cn/d2aea7d459a74f0bb70d46a9cebef5e9.png)

**自动变量操作**

**这样每次执行代码都可以打印变量的值**

![image-20230713154539740](https://img-blog.csdnimg.cn/02e27106283d4b8ca6d510478abb2b7a.png)

## 文件IO

### 标准C库IO函数

**使用标准C库的IO函数开发的程序在任意平台上都可以运行**

**标准C库的IO函数的效率更高，因为当中带有缓冲区(设置在内存当中)**

![image-20230714100055222](https://img-blog.csdnimg.cn/cbed27855863488ba716f7a57d9f23c0.png)

标准C库的IO和Linux系统IO的关系

**调用这两个标准C库IO函数的时候，会让数据进入设置在内存当中的缓冲区IO buffer，然后通过系统提供的API例如write和read来进行内存到磁盘的读写操作；如果直接使用Linux系统IO函数，则不会经过内存中的缓冲区**

![image-20230714101445015](https://img-blog.csdnimg.cn/07ba3e1cc3084b848bf30cdf1fb53905.png)

### 虚拟地址空间

**堆空间是从下往上存，也就是低地址到高地址；**

**栈空间是从上往下村，也就是高地址到低地址**

![image-20230714102646385](https://img-blog.csdnimg.cn/842df24d5a0348f497cd10d7aec446b2.png)

### 文件描述符

![image-20230714105536343](https://img-blog.csdnimg.cn/c46fc363a96e454ea5eb9ca93b562a17.png)

### Linux系统IO函数

![image-20230714110840838](https://img-blog.csdnimg.cn/137e5ab52aab4940971c197c9356b5db.png)

### open函数

两种形式

```c++
// 打开一个已经存在的文件
int open(const char *pathname, int flags);

// 创建一个新的文件
int open(const char *pathname, int flags, mode_t mode);
```

#### open函数打开文件

```c++
int open(const char* pathname, int flags);
```

参数解释

- pathname：文件路径
- flags：对文件的操作权限设置，还有其他的设置，例如：O_RDONLY，O_WRONLY，O_RDWR 这三个设置是互斥的
- 返回值：返回一个新的文件描述符(int类型，类似于编号)，如果失败，返回-1

关于错误errno

**当打开文件错误的时候，系统会自动将错误号赋值给errno**

errno属于linux系统函数库，库里面一个全局变量，记录错误号，记录的是最近的错误号

比如这里open函数失败了，系统会自动把错误号赋值给errno

如何打印错误信息？perror()

```c++
 void perror(const char *s);
```

打印error对应的错误描述

s参数：用户描述，比如hello，最终输出的内容是 hello:xxx(实际的错误描述)

![image-20230714113744182](https://img-blog.csdnimg.cn/40f38a8bc7bc41d9a3d492ef8ec2533d.png)

代码：

```c++
#include <iostream>
using namespace std;

// 使用linux系统IO open()函数的头文件
#include <fcntl.h>  //函数的声明文件
#include <sys/stat.h>
#include <sys/types.h>

// 使用 close()函数头文件
#include <unistd.h>

int main() {
    // 打开
    int fd = open("a.txt", O_RDONLY);

    if (fd == -1)  // 调用错误
        perror("open");

    // 关闭
    close(fd);

    return 0;
}
```

关闭函数

```c++
int close(int fd);//  fd：文件描述符 fd
```

#### open函数创建新文件

```c++
int open(const char *pathname, int flags, mode_t mode);
```

参数解释：

- pathname：创建的文件路径

- flags：对文件的操作权限和其他的设置 
  **必选项：O_RDONLY, O_WRONLY, or O_RDWR 这三个之间是互斥的**
  **可选项：O_CREAT 文件不存在创建新文件；O_APPEND 可以进行文件的追加**
  **flags参数是一个int类型的数据，占4个字节，32位，每一位就是一个标志位，1表示有，0表示没有，所以用按位或**

- mode：八进制的数，表示用户对创建出的新的文件的操作权限，比如：0777
  **3个7分别表示对不同的用户(所有者，组成员，其他用户的权限)的权限，每一个都是3位 ，第一位表示读R，第二位表示写W，第三位 表示可执行X，7对应就是111全有!!!**

  **最终的权限是：mode & ~umask**
  umask可以通过shell命令 umask 查看
  umask的作用是为了抹去某些权限，让我们创建的权限更加合理一些
  例子：0777 & ~0022

```c++
#include <iostream>
using namespace std;

#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

int main() {
    // 创建一个新的文件
    int fd = open("1.txt", O_RDWR | O_CREAT, 0777);  // 标签之间要用按位或

    if (fd == -1)
        perror("create");

    close(fd);

    return 0;
}
```

**用shell命令 ll 来查看文件的权限**

![image-20230714134141808](https://img-blog.csdnimg.cn/98c112fa731b4bafa1c10f26ed2f75ab.png)

![image-20230714134158964](https://img-blog.csdnimg.cn/2c733f9e6e164485805c8ab72505d0d8.png)

### read,write函数

头文件：

```c++
#include <unistd.h>
```

两个函数：

```c++
ssize_t read(int fd, void *buf, size_t count);
```

- 参数：

  - fd：文件描述符，通过open得到的，通过文件描述符操作某个文件
  - buf：缓冲区，需要读取数据存放的地方，数组的地方(传出参数)
  - count：指定的数组的大小

- 返回值：

  - 成功 >0 返回实际读取到的字节数

    	**==0 文件已经读取完了(注意是在调用read函数之前文件指针就在末尾了才会返回0，一次性从头读完是会返回读取的字节数的)**

  - 失败 -1 并且修改errno

```c++
ssize_t write(int fd, const void *buf, size_t count);
```

- 参数：
  - fd：文件描述符，通过open得到，通过文件描述符操作某个文件
  - buf：要往磁盘写入的数据
  - count：要写入的实际的大小

- 返回值：
  - 成功 >0 返回实际写入的字节数
    ==0 文件已经写入完了
  - 失败 -1 并且修改errno

代码：

```c++
#include <iostream>
using namespace std;
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

#define SIZE 1024

int main() {
    // 通过open打开english.txt文件
    int fd_src = open("english.txt", O_RDONLY);
    if (fd_src == -1) {
        perror("open");
        return -1;
    }

    // 创建新的文件
    int fd_dest = open("cpy.txt", O_WRONLY | O_CREAT | O_APPEND, 0777);
    if (fd_dest == -1) {
        perror("create");
        return -1;
    }

    // 频繁的读写操作
    char buf[SIZE] = {0};
    int len = 0;
    while ((len = read(fd_src, buf, sizeof(buf))) > 0)
        // 在循环的条件中进行读操作，在循环体中进行写入
        write(fd_dest, buf, len);

    // 关闭文件
    close(fd_src);
    close(fd_dest);

    return 0;
}
```

### lseek函数

在标准C库里面也有一个非常相似的函数fseek()，我甚至怀疑在linux平台下他的底层是不是调用的是fseek()

```c++
//标准C库的函数
#include <stdio.h>

int fseek(FILE *stream, long offset, int whence);

//Linux系统函数
#include <sys/types.h>
#include <unistd.h>

off_t lseek(int fd, off_t offset, int whence);
```

- 参数：

  - fd：文件描述符，通过open得到，通过这个fd操作某个文件

  - offset：off_t(long别名) 偏移量

  - whence：

     \- SEEK_SET 设置文件指针的偏移量，从头开始

      			- SEEK_CUR 设置偏移量：当前位置 + 第二参数offset的值
      	
      		 - SEEK_END 设置偏移量：文件大小 + 第二参数offset的值

- 返回值：返回文件指针设置之后的位置

- 作用：

  	1.移动文件指针到头部 lseek(fd,0,SEEK_SET);
  	
  	2.获取当前文件指针的位置 lseek(fd,0,SEEK_CUR);
  	
  	3.获取文件长度 lseek(fd,0,SEEK_END);
  	
  	4.拓展文件的长度，当前文件10B，增加100B，增加了100个字节 lseek(fd,100,SEEK_END);
  	
  	**为什么能扩展？**
  	
  	 **因为我们把文件指针移动到了本来不属于文件的位置上去，系统就进行了扩展，**
  	
  		**不过一定要一次写的操作。迅雷等下载工具在下载文件时候先扩展一个空间，然后再下载的。**

代码：

```c++
#include <iostream>
using namespace std;
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

int main() {
    int fd = open("hello.txt", O_RDWR);
    if (fd == -1) {
        perror("open");
        return -1;
    }

    int ret = lseek(fd, 100, SEEK_END);
    if (ret == -1) {
        perror("lseek");
        return -1;
    }

    // 写入一个空数据
    write(fd, " ", 1);

    close(fd);

    return 0;
}
```

### stat,lstat函数

```c++
    #include <sys/stat.h>
    #include <sys/types.h>
    #include <unistd.h>

    int stat(const char *pathname, struct stat *statbuf);
//作用：获取一个文件的相关的信息
//参数：
    //pathname：操作的文件路径
    //statbuf：结构体变量，传出参数，用于保存获取到的文件信息
//返回值：
    //成功 0
    //失败 -1，并且修改errno

    int lstat(const char *pathname, struct stat *statbuf);
//参数，返回值同上
```

里面有一个stat结构体变量，他的结构如下：

#### stat结构体(!!!)

![image-20230714152755154](https://img-blog.csdnimg.cn/c153a5adb208413183b065b43bdb0580.png)

比较重要的是mode_t类型的 st_mode变量：**就是下面的16位数(01)**

**之前创建文件open函数的第三个参数也是这个类型，只不过里面只用了User,Group,Others这三个**

![image-20230714153204023](https://img-blog.csdnimg.cn/029d299ee6be4dd7ac220ccb1e41f3b5.png)

**判断后面某一位是否为1，也就是比如User是否具有r权限，就用st_mode变量(他就是这16位数)与其相与**

**判断文件类型：由于文件类型在前四位当中可能不止一位为1，那么联系计网，与掩码相与看是不是和这个标识相同就知道了!!!**

#### 区别

软链接文件

![image-20230714154550861](https://img-blog.csdnimg.cn/82764aa7f37f43939311be3eb5ba41f9.png)

**就是说 2.txt 是指向 1.txt 文件的!!!但是它本身的大小是5个字节**

**lstat()就是用来获取该软链接文件本身的信息的，而不是获取他指向的文件的信息，如果用stat()函数就会获得指向的文件，这里就是1.txt的信息**

代码：

```c++
#include <iostream>
using namespace std;
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

int main() {
    struct stat statbuf;

    int ret = stat("1.txt", &statbuf);
    if (ret == -1) {
        perror("stat");
        return -1;
    }

    cout << "size: " << statbuf.st_size << endl;

    ret = stat("2.txt", &statbuf);
    if (ret == -1) {
        perror("stat");
        return -1;
    }

    cout << "size: " << statbuf.st_size << endl;

    ret = lstat("2.txt", &statbuf);
    if (ret == -1) {
        perror("stat");
        return -1;
    }

    cout << "size: " << statbuf.st_size << endl;

    return 0;
}
```

**在shell终端中可以用 stat 命令来获取文件的信息，这里的文件信息就是本文件了，就不是软链接文件的指向文件**

<img src="https://img-blog.csdnimg.cn/bc205610c7b8443abcb1c4193344b918.png" alt="image-20230714154900243"  />

### 模拟实现ls -l 命令

**里面有很多库函数的调用，这些大概知道就行，开发的时候去查文档就好了**

![image-20230715104004715](https://img-blog.csdnimg.cn/d86092f52a414673901be09c3962b250.png)

第一个字符( ’-‘ )是文件类型，后面一堆rwx是读写权限

后面 1 是硬连接数量

在后面两个是文件所有者和文件所在组

然后是文件大小

然后是上一次的修改时间

最后就跟着文件的名称

代码：

~~~cpp
#include <ctime>
#include <iostream>
#include <string>
using namespace std;
#include <grp.h>
#include <pwd.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

#define MAXSIZE 1024

// 模拟实现 ls -l 这个指令
// -rwxrwxrwx 1 lzx0626 lzx0626 107 Jul 15 09:40 ls-l.cpp

int main(int argc, char const *argv[]) {
    if (argc < 2) {
        cout << "usage: " << argv[0] << " <filename>" << endl;
        return -1;
    }

    struct stat statbuf;

    // 通过stat()函数获取文件的信息
    int ret = stat(argv[1], &statbuf);
    if (ret == -1) {
        perror("stat");
        return -1;
    }

    // 获取文件类型和文件权限 st_mode变量
    string perms;  // 保存文件类型和权限的字符串
    mode_t _mode = statbuf.st_mode;
    // 获得文件类型和掩码 -S_IFMT 相与
    switch (_mode & S_IFMT) {
    case S_IFSOCK:
        perms.append("s");
        break;
    case S_IFLNK:
        perms.append("1");
        break;
    case S_IFREG:
        perms.append("-");
        break;
    case S_IFBLK:
        perms.append("b");
        break;
    case S_IFDIR:
        perms.append("d");
        break;
    case S_IFCHR:
        perms.append("c");
        break;
    case S_IFIFO:
        perms.append("p");
        break;
    default:
        perms.append("?");
        break;
    }

    // 判断文件访问权限 Users Group Others
    // Users
    perms.append((_mode & S_IRUSR) ? "r" : "-");
    perms.append((_mode & S_IWUSR) ? "w" : "-");
    perms.append((_mode & S_IXUSR) ? "x" : "-");
    // Group
    perms.append((_mode & S_IRGRP) ? "r" : "-");
    perms.append((_mode & S_IWGRP) ? "w" : "-");
    perms.append((_mode & S_IXGRP) ? "x" : "-");
    // Others
    perms.append((_mode & S_IROTH) ? "r" : "-");
    perms.append((_mode & S_IWOTH) ? "w" : "-");
    perms.append((_mode & S_IXOTH) ? "x" : "-");

    // 获取硬连接数
    nlink_t link_num = statbuf.st_nlink;

    // 文件所有者
    // 这个函数可以通过用户uid获得用户名称
    string _User = getpwuid(statbuf.st_uid)->pw_name;

    // 文件所在组
    // 这个函数通过组gid获得名称
    string _Group = getgrgid(statbuf.st_gid)->gr_name;

    // 文件大小
    off_t _size = statbuf.st_size;

    // 获取修改时间
    // ctime()函数可以将时间差值转化为本地时间
    string _mtime = string(ctime(&statbuf.st_mtime));
    // 这个时间格式化之后回车换行了，将其去掉
    _mtime.pop_back();

    // 输出
    char ret_buf[MAXSIZE];
    // 这个函数可以往字符串中填充
    sprintf(ret_buf, "%s %ld %s %s %ld %s %s", perms.c_str(), link_num, _User.c_str(), _Group.c_str(),
            _size, _mtime.c_str(), argv[1]);

    cout << ret_buf << endl;

    return 0;
}
~~~

里面有一个系统函数对应的功能已经列出了，下面罗列他们的头文件

~~~cpp
#include <pwd.h>
struct passwd *getpwuid(uid_t uid);
~~~

~~~cpp
#include <grp.h>
struct group *getgrgid(gid_t gid);
~~~

~~~cpp
#include <time.h>
char *ctime(const time_t *timep);
~~~

### 文件属性操作函数

四个函数

![image-20230715110918357](https://img-blog.csdnimg.cn/f2fccb0195ad4c5c986e78e727b197ec.png)

#### access函数

```cpp
#include <unistd.h>
int access(const char *pathname, int mode);
// 作用：用来判断某个文件是否有某个权限，或者判断文件是否存在
// 参数：
// pathname：文件路径
// mode：
    // R_OK 是否有读权限
    // W_OK 是否有写权限
    // X_OK 是否有执行权限
    // F_OK 文件是否存在
// 返回值：
// 成功 返回0
// 失败(没有这个权限) 返回-1，并且修改errno
```

~~~cpp
#include <iostream>
using namespace std;
#include <unistd.h>

int main() {
    int ret = access("1.txt", F_OK);
    if (ret == -1) {
        perror("access");
        return -1;
    }

    cout << "file exists." << endl;

    return 0;
}
~~~

#### chmod函数

~~~cpp
#include <sys/stat.h>
int chmod(const char *pathname, mode_t mode);
// 作用：修改文件权限
// 参数：
//     pathname：文件路径
//     mode：需要修改的权限值，八进制的数
// 返回值：
//     成功返回0
//     失败返回-1
~~~

```cpp
#include <iostream>
using namespace std;
#include <sys/stat.h>

int main() {
    int ret = chmod("1.txt", 0777);
    if (ret == -1) {
        perror("chmod");
        return -1;
    }

    return 0;
}
```

#### chown函数(了解)

```cpp
#include <unistd.h>

int chown(const char *pathname, uid_t owner, gid_t group);
int fchown(int fd, uid_t owner, gid_t group);
int lchown(const char *pathname, uid_t owner, gid_t group);
```

#### truncate函数

~~~cpp
#include <sys/types.h>
#include <unistd.h>

int truncate(const char *path, off_t length);
// 作用：缩减或者扩展文件尺寸到达指定的大小
// 参数:
    // path：文件路径
    // length：需要最终文件变成的大小
// 返回值：
    // 成功 0
    // 失败 -1
~~~

~~~cpp
#include <iostream>
using namespace std;
#include <sys/types.h>
#include <unistd.h>

int main() {
    int ret = truncate("b.txt", 5);
    if (ret == -1) {
        perror("truncate");
        return -1;
    }

    return 0;
}
~~~

### 文件目录操作函数

![image-20230715113517243](https://img-blog.csdnimg.cn/ab7b2f9ec0244f8394378f614c113a24.png)

#### mkdir函数

~~~cpp
    #include <sys/stat.h>
    #include <sys/types.h>

    int mkdir(const char *pathname, mode_t mode);
// 作用：去创建一个目录
// 参数：
//     pathname：目录名称
//     mode：权限，八进制数
// 返回值：
//     成功 0
//     失败 -1
~~~

~~~cpp
#include <iostream>
using namespace std;
#include <sys/stat.h>
#include <sys/types.h>

int main() {
    int ret = mkdir("fuck", 0777);
    if (ret == -1) {
        perror("mkdir");
        return -1;
    }

    return 0;
}
~~~

#### rmdir函数

~~~cpp
#include <unistd.h>
int rmdir(const char *pathname);
~~~

删除目录，略

**这个函数只能删除空目录，如果里面有文件需要先把文件清空，才能进行删除!!!**

#### rename函数

~~~cpp
#include <stdio.h>
int rename(const char *oldpath, const char *newpath);
//一看就懂了
~~~

~~~cpp
#include <iostream>
using namespace std;

int main() {
    int ret = rename("fuck", "fuckyou");
    if (ret == -1) {
        perror("rename");
        return -1;
    }

    return 0;
}
~~~

#### chdir函数和getcwd函数

~~~cpp
#include <unistd.h>
int chdir(const char *path);
//作用：修改进程的工作目录
    //比如在 /home/newcoder 启动了一个可执行程序 a.out，进程的工作目录 /home/newcoder
//参数：
    //path：需要修改到的工作目录


#include <unistd.h>
char *getcwd(char *buf, size_t size);
//作用：获取当前工作目录
//参数：
    //buf：往数组里存，传出参数
    //size：数组的大小
//返回值：返回的是指向的一块内存，这个数据就是第一个参数buf
~~~

代码：

~~~cpp
#include <iostream>
using namespace std;
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

#include <cstring>

int main() {
    // 获取当前工作目录
    char buf[1024] = {0};

    getcwd(buf, sizeof(buf));
    cout << buf << endl;

    // 修改工作目录
    int ret = chdir("./fuckyou");
    if (ret == -1) {
        perror("chdir");
        return -1;
    }

    // 代码执行到这里把工作目录修改之后在该目录之下进行下一步操作
    // 只在程序运行的时候生效，程序结束后终端当中的工作目录不会改变!
    
    // 创建新的文件
    int fd = open("1.txt", O_RDWR | O_CREAT, 0664);
    if (fd == -1) {
        perror("open");
        return -1;
    }

    close(fd);

    char Null_buf[1024] = {0};
    strncpy(buf, Null_buf, sizeof(buf));

    getcwd(buf, sizeof(buf));
    cout << buf << endl;

    return 0;
}
~~~

### 文件目录遍历函数

![image-20230715125019218](https://img-blog.csdnimg.cn/68baea5562d14e739d8168448a3d14ab.png)

#### opendir函数

~~~cpp
#include <dirent.h>
#include <sys/types.h>
DIR *opendir(const char *name);
//参数：
    //name：需要打开的目录的名称
//返回值：
    //DIR * 类型，理解为目录流
    //错误 返回nullptr
~~~

#### readdir函数

#### dirent结构体和d_type(!!!)

![image-20230715130311932](https://img-blog.csdnimg.cn/97556f847fac458d822040eaf02202ef.png)

**这个dirent存储的也是文件的信息，前面也有个stat结构体也有存储，但是这两个存储的东西不太一样**

~~~cpp
//打开目录
#include <dirent.h>
#include <sys/types.h>
DIR *opendir(const char *name);
//参数：
    //name：需要打开的目录的名称
//返回值：
    //DIR * 类型，理解为目录流
    //错误 返回nullptr

//读取目录中的数据
#include <dirent.h>
struct dirent *readdir(DIR *dirp);
//参数：
    //dirp是通过opendir返回的结果
//返回值：
    //struct dirent 代表读取到的文件的信息
    //读取到了文件末尾或者失败了，返回Null，区别是读到文件末尾不会修改errno，失败会修改

//关闭目录
#include <dirent.h>
int closedir(DIR *dirp);
~~~

代码：

~~~cpp
#include <iostream>
#include <string>
using namespace std;
#include <dirent.h>
#include <sys/types.h>

// 递归函数，用于获取目录下所有普通文件的个数
void getFileNum(string path, int& num) {
    // 打开目录
    DIR* _dir = opendir(path.c_str());
    if (_dir == nullptr) {
        perror("opendir");
        exit(0);
    }

    // 读取目录数据
    // 循环读取，因为// 注意这个16的由来dir是一个一个读取的，读到末尾返回Null
    struct dirent* _ptr;

    while ((_ptr = readdir(_dir)) != nullptr) {
        // 获取名称
        // Shell终端中有当前目录 ./ 和 上级目录 ../，这两个不能拿来递归，需要忽略
        string _dname = _ptr->d_name;
        if (_dname == "." || _dname == "..")
            continue;

        // 判断是普通文件还是目录
        if (_ptr->d_type == DT_DIR)
            // 目录需要拼接一下
            getFileNum(path + "/" + _dname, num);
        else if (_ptr->d_type == DT_REG)
            ++num;
    }

    // 关闭目录
    closedir(_dir);
}

int main(int argc, char* const argv[]) {
    // 读取某个目录下所有普通文件的个数
    if (argc < 2) {
        cout << "usage: " << argv[0] << " <path>" << endl;
        return -1;
    }

    int num = 0;
    getFileNum(argv[1], num);
    cout << num << endl;

    return 0;
}
~~~

### dup,dup2函数(与文件描述符相关)

![image-20230715141246853](https://img-blog.csdnimg.cn/1304264d2ffd444a9b7a9489951c5c62.png)

#### dup()

~~~cpp
#include <unistd.h>
int dup(int oldfd);
// 作用：复制一个新的文件描述符，他们是指向同一个文件的，只是用了两个文件描述符
// 新的文件描述符会使用空闲的文件描述符表中最小的那个!!!
~~~

~~~cpp
#include <iostream>
#include <string>
using namespace std;
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

int main() {
    int fd = open("1.txt", O_RDWR | O_CREAT, 0664);
    if (fd == -1) {
        perror("open");
        return -1;
    }

    int fd1 = dup(fd);
    if (fd1 == -1) {
        perror("dup");
        return -1;
    }

    printf("fd : %d , fd1 : %d\n", fd, fd1);

    // 关闭fd，现在只有fd1指向文件
    close(fd);

    // 通过fd1来写该文件
    string fuck = "hello world";
    int ret = write(fd1, fuck.c_str(), fuck.size());
    if (ret == -1) {
        perror("write");
        return -1;
    }

    return 0;
}
~~~

#### dup2()

~~~cpp
#include <unistd.h>

int dup2(int fd1, int fd2);
// 作用：重定向文件描述符
    // fd1指向a.txt，fd2指向b.txt
    // 调用函数成功后，fd2和b.txt的连接做close(fd1仍指向a.txt)，fd2指向a.txt
    // fd1必须是一个有效的文件描述符
    // 如果相同则相当于什么都没做
// 返回值：
    // fd2，他们都指向的是fd1之前指向的文件
~~~

~~~cpp
#include <iostream>
#include <string>
using namespace std;
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

int main() {
    int fd = open("2.txt", O_RDWR | O_CREAT, 0664);
    if (fd == -1) {
        perror("open");
        return -1;
    }

    int fd1 = open("3.txt", O_RDWR | O_CREAT, 0664);
    if (fd1 == -1) {
        perror("open");
        return -1;
    }

    printf("fd : %d , fd1 : %d\n", fd, fd1);

    int fd2 = dup2(fd, fd1);
    // 现在fd本来指向 2.txt ，现在fd仍指向2.txt
    // fd1本来 3.txt，现在指向到了 2.txt
    if (fd2 == -1) {
        perror("dup2");
        return -1;
    }

    // 通过fd1去写数据，实际操作的是2.txt
    // 通过fd一样指向2.txt
    string fuck = "hello world";
    int ret = write(fd1, fuck.c_str(), fuck.size());
    if (ret == -1) {
        perror("write");
        return -1;
    }

    printf("fd : %d , fd1 : %d , fd2: %d\n", fd, fd1, fd2);

    return 0;
}
~~~

### fcntl()

两个作用：

**复制文件描述符**

**设置或者获取文件的状态标志**

![image-20230715145100478](https://img-blog.csdnimg.cn/530146ebbb03403cbd72ef421761015b.png)

~~~cpp
#include <fcntl.h>
#include <unistd.h>

int fcntl(int fd, int cmd, ...); ...当中是可变参数
// 参数：
//     fd：需要操作的文件描述符
//     cmd：表示对文件描述符进行如何操作
//         F_DUPFD 复制文件描述符，复制的是第一个参数，得到一个新的文件描述符(返回值)
//             int ret = fcntl(fd,F_DUPFD);
//         F_GETFL 获取指定文件描述符的文件状态flag
//             获取的flag和我们通过open函数传递的flag是一个东西
//         F_SETFL 设置文件描述符的文件状态flag
//             必选项：O_RDONLY O_WRONLY O_RDWR 不可以被修改
//             可选项：O_APPEND O_NONBLOCK
//                 O_APPEND 表示追加数据
//                 O_NONBLOCK 设置成非阻塞
//                     阻塞和非阻塞：描述的是函数调用的行为
~~~

~~~cpp
#include <iostream>
using namespace std;
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

int main() {
    // 1.复制文件描述符，得到两个文件描述符(int值不同)指向同一个文件，可以进行的操作相同
    // int fd = open("1.txt", O_RDONLY);
    // if (fd == -1) {
    //     perror("open");
    //     return -1;
    // }

    // int ret = fcntl(fd, F_DUPFD);
    // if (ret == -1) {
    //     perror("fcntl");
    //     return -1;
    // }

    // 2.修改或者获取文件描述符的文件状态flag
    // 这里必须读写权限都要有才行
    int fd = open("1.txt", O_RDWR, 0664);
    if (fd == -1) {
        perror("open");
        return -1;
    }

    // 修改文件描述符的flag，加入O_APPEND这个标记
    // 首先获得
    int _flag = fcntl(fd, F_GETFL);
    if (_flag == -1) {
        perror("fcntl");
        return -1;
    }

    // 然后修改
    int ret = fcntl(fd, F_SETFL, _flag | O_APPEND);
    if (ret == -1) {
        perror("fcntl");
        return -1;
    }

    // 然后进行追加
    string fuck = "你好";
    ret = write(fd, fuck.c_str(), fuck.size());
    if (ret == -1) {
        perror("write");
        return -1;
    }

    close(fd);

    return 0;
}
~~~

### 文件删除函数

#### unlink()和remove()

~~~cpp
#include <unistd.h>
int unlink(const char *pathname); // linux系统的函数
~~~

~~~cpp
#include <stdio.h>
int remove(const char *pathname); // 标准C库的函数
~~~

