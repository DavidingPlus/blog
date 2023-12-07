---
title: Linux多线程开发
categories:
  - Linux学习
  - 牛客Linux
  - 第3章 Linux多线程开发
abbrlink: 610d7d3d
date: 2023-09-21 04:00:00
updated: 2023-09-21 04:00:00
---

<meta name="referrer" content="no-referrer"/>

`牛客Linux`的`第3章 Linux多线程开发`。

<!-- more -->

`CSDN`：[https://blog.csdn.net/m0_61588837/article/details/132688794](https://blog.csdn.net/m0_61588837/article/details/132688794)

`markdown`文档在：[https://github.com/DavidingPlus/Md_Files/blob/master/Cpp/C%2B%2B%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0/Linux/%E7%89%9B%E5%AE%A2%20Linux.md](https://github.com/DavidingPlus/Md_Files/blob/master/Cpp/C%2B%2B%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0/Linux/%E7%89%9B%E5%AE%A2%20Linux.md)

代码在：[https://github.com/DavidingPlus/Linux_Learning/tree/Newcoder_Linux](https://github.com/DavidingPlus/Linux_Learning/tree/Newcoder_Linux)

# 第三章 Linux多线程开发

## 概述

### 概念

**同一个程序的所有线程均会执行相同程序，并且会共享同一份全局内存区域**

**进程是资源持有的最小单位，线程是操作系统分配和调度的最小单位**

**线程是轻量级的进程(LWP)，在Linux下线程的本质仍是进程**

![image-20230725162732120](https://img-blog.csdnimg.cn/29ac3f7497f64160a45d76e7007a641e.png)

查看指定进程的LWP号

例如这里打开firefox进程，它的内部是多线程实现的

![image-20230725163508676](https://img-blog.csdnimg.cn/3f11ad12b32e408bb1925eb6800b0e69.png)

我们用命令查看，图中进程号是105266

~~~shell
ps -LF 105266
~~~

结果：

可以看出，firefox进程的这么多线程，虽然进程号都是一样的，但是线程号是不一样的

![image-20230725163632242](https://img-blog.csdnimg.cn/092292276b82459a894148f5311091b7.png)

### 进程和线程区别

**进程之间的信息难以共享，想要共享需要采取进程间通信的方式；并且fork()代价比较高**

**线程之间能够方便，快速的共享信息，只需要将数据复制到共享(全局或堆)变量中即可**

**创建线程的速率比进程通常快很多，10倍甚至更多；线程之间共享虚拟地址空间，无序采取写时复制的方式复制内存，也无须复制页表**

![image-20230725164029090](https://img-blog.csdnimg.cn/b97f07addee3480b8739faeb48a56ba3.png)

我们画个图来理解一下

**虽然线程是共享虚拟地址空间的，但不代表空间中所有的区域都是共享的，比如下面的栈空间和.text代码段就不共享**

**.text是代码段，这个线程是不共享的，而是划分出自己的一块区域**

**栈空间也是不共享的，各个线程将这一块栈空间划分出自己的一块区域**

![image-20230725203244279](https://img-blog.csdnimg.cn/659477be7be04625b7c6e726b5fab581.png)

### 线程的共享和非共享资源

- **用户区中，虚拟地址空间除了栈和代码段不共享，其他共享；剩余的都是内核区的数据，这些是共享的，没有复制操作**
- **非共享资源：线程ID，信号掩码(阻塞信号集)，线程特有的数据，errno变量，实时调度策略和优先级；栈，本地变量和函数调用链接信息**

![image-20230725201723897](https://img-blog.csdnimg.cn/c1fbc9f02b8d4cbfbabb2e9a36531a26.png)

## 线程操作

![image-20230726174153972](https://img-blog.csdnimg.cn/8339e9b5cef4451383c2279266d6586c.png)

### 创建线程 pthead_create()

注意返回值与进程那一套有区别，还有错误号也有区别了

~~~cpp
//	   一般情况下，main函数所在的线程称为主线程(main线程)，其余创建的线程称为子线程
//     程序中默认只有一个进程，fork()函数调用，变为2个进程
//     程序中默认只有一个线程，pthread_create()调用，变为2个线程

    #include <pthread.h>

    int pthread_create(pthread_t *restrict thread,
                     const pthread_attr_t *restrict attr,
                     void *(*start_routine)(void *),
                     void *restrict arg);
// 作用：创建一个子线程
// 参数：
//     thread：类型是pthread_t指针，传出参数，线程创建成功后，子线程的线程ID被写到在变量中
//     attr：设置线程的属性，一般使用默认值，传递nullptr
//     start_routine：函数指针，这个函数是子线程需要处理的逻辑代码
//     arg：给第三个参数使用，传参
// 返回值：
//     成功 0
//     失败 返回一个错误号，这个错误号和之前的errno不太一样(实现方式一样，但是含义不同)
//         不能通过perror()去获取错误号信息
//         如何获取？ char* strerror(int errnum);
~~~

代码

**这个代码只需要注意一点，就是主线程和子线程执行的区域是不一样的，主线程执行main函数里面的内容，然后创建出了子线程，子线程的代码段当中执行call_back()回调函数里面的逻辑，他的范围就局限于这个回调函数，参数可以通过主线程传递给他，这就是也是为什么线程之间代码段和栈空间的内容不是共享的，因为这样设计下来就没法共享了**

~~~cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <pthread.h>
#include <unistd.h>

// 主线程和子线程执行的代码段是不一样的，这个回调函数里面是子线程执行的代码逻辑
void* call_back(void* args) {
    printf("child thread...\n");
    printf("arg value : %d\n", *(int*)args);

    return nullptr;
}

// main函数里面是主线程执行的逻辑
int main() {
    // 创建一个子线程
    pthread_t tid;

    int num = 10;

    int ret = pthread_create(&tid, nullptr, call_back, (void*)&num);
    if (0 != ret) {
        const char* _error = strerror(ret);
        printf("error : %s\n", _error);
        return -1;
    }

    for (int i = 0; i < 5; ++i)
        printf("%d\n", i);

    sleep(1);  // 保证子线程万一没有创建好主线程就执行完了

    return 0;
}
~~~

执行结果：

**注意编译要链接上pthread动态库，文件名是libpthread.so，库名字是pthread，用 -l 参数链接**

![image-20230725212001708](https://img-blog.csdnimg.cn/9aeb9eee0cd44f048594bddb9cbcc569.png)

当然，由于主线程和子线程是并发的关系，很有可能执行结果不一样

![image-20230725212124179](https://img-blog.csdnimg.cn/75ee1524643f4089bd83a5598e90226d.png)

### 终止线程 pthread_exit()

~~~cpp
	#include <pthread.h>

	void pthread_exit(void *retval);
// 作用：终止一个线程，在哪个线程中调用，就表示终止哪个线程
// 参数：
//     retval：需要传递一个指针，作为一个返回值，可以在pthread_join()中获取到

	pthread_t pthread_self(void);
// 作用：获取当前线程的线程id(unsigned long int 无符号长整形)

	int pthread_equal(pthread_t t1.pthread_t t1);
// 作用：比较两个线程id是否相等
//     不同的操作系统对于 pthread_t 的实现不一样，有的是无符号的长整型，有的是用结构体去实现的，不能简单的用 == 号判断
~~~

代码：

~~~cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <pthread.h>
#include <unistd.h>

void* call_back(void* arg) {
    // 为了测试pthread_exit()会不会影响其他线程的正常运行，这里睡三秒，让主线程跑完
    sleep(3);
    printf("child thread id : %ld\n", pthread_self());

    // 这里两个对等是因为子线程结束并不决定整个进程的结束，主线程 return 0 就代表进程结束退出，子线程则不一样
    return nullptr;  // pthread_exit(nullptr)
}

int main() {
    // 创建一个子线程
    pthread_t tid;

    int ret = pthread_create(&tid, nullptr, call_back, nullptr);
    if (0 != ret) {
        const char* str = strerror(ret);
        printf("error : %s\n", str);
        return -1;
    }

    // 主线程
    for (int i = 0; i < 5; ++i)
        printf("%d\n", i);

    printf("tid : %ld , parent thread id : %ld\n", tid, pthread_self());

    // 让主线程退出，当主线程退出的时候不会影响其他正常运行的线程
    pthread_exit(nullptr);

    // 这一行代码没有执行，说明主线程退出后执行return 0结束掉整个进程；而是当所有线程跑完进程才结束，因此不会对其他的线程产生影响
    printf("main thread exit.\n");

    return 0;
}
~~~

**注意对pthread_exit()的理解：**

- **线程退出和线程结束的含义是不同的，线程退出不会影响其他的线程，特别是主线程，线程结束对于主线程而言就会导致整个进程结束了，程序结束，而主线程退出则不会**
- **主线程调用这个函数，意思是主线程退出，但是不走后面的代码，比如图中后面一句的打印就不走，也不会 return 0，因为在主线程中 return 0 就会导致整个进程的结束，所以这时进程不会结束，子线程可以尽情的运行，知道均运行完毕，然后整个进程结束**
- **子线程的执行函数逻辑当中，最后返回，例如 return nullptr，也相当于pthread_exit()，因为子线程退出不会对整个进程造成退出的影响，所以没有什么区别；所以子线程退出和子线程结束基本没有区别**

### 连接已终止的线程 pthread_join()

~~~cpp
	#include <pthread.h>

	int pthread_join(pthread_t thread, void **retval);
// 作用：和一个已经终止的线程进行连接
//     说白了就是回收子线程的资源，防止产生僵尸线程
//     这个函数是阻塞函数，调用一次只能回收一个子线程
//     一般在主线程中去使用(父线程回收子线程的资源)
// 参数：
//     thread：需要回收的子线程id
//     retval：接受子线程退出时的返回值，是个二级指针；如果不需要则传递nullptr
// 返回值：
//     成功 0
//     失败 返回错误号(用strerror())
~~~

~~~cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <pthread.h>
#include <unistd.h>

int value = 10;

void* call_back(void* arg) {
    // 为了测试pthread_exit()会不会影响其他线程的正常运行，这里睡三秒，让主线程跑完
    printf("child thread id : %ld\n", pthread_self());
    sleep(3);

    // 这里两个对等是因为子线程结束并不决定整个进程的结束，主线程 return 0 就代表进程结束退出，子线程则不一样
    // 这里给一个返回值
    // int value = 10;               // 局部变量，这是存在于自己的栈空间当中，子线程结束之后就被释放，所以主线程无法接收到；一般用全局变量或者堆空间的数据
    pthread_exit((void*)&value);  // return (void*)&value;
}

int main() {
    // 创建一个子线程
    pthread_t tid;

    int ret = pthread_create(&tid, nullptr, call_back, nullptr);
    if (0 != ret) {
        const char* str = strerror(ret);
        printf("error : %s\n", str);
        return -1;
    }

    // 主线程
    for (int i = 0; i < 5; ++i)
        printf("%d\n", i);

    printf("tid : %ld , parent thread id : %ld\n", tid, pthread_self());

    // 主线程调用pthread_join()去回收子线程资源
    // 这里可以选择接受子线程执行的返回值也可以选择不要，不要就传递nullptr
    // 为什么是二级指针？返回值是一级指针，我要传递他的指针做传出参数才能接受到!!!
    int* thread_retval;
    // ret = pthread_join(tid, nullptr);
    ret = pthread_join(tid, (void**)&thread_retval);
    if (0 != ret) {
        const char* str = strerror(ret);
        printf("error : %s\n", str);
        return -1;
    }

    printf("exit data : %d\n", *thread_retval);

    printf("回收子线程资源成功\n");  // 这一行代码会在回收子线程之后结束

    // 由于子线程已经结束，主线程已经回收完了所有的资源，所以不用担心主线程结束会导致进程结束子线程没跑完的问题了
    // 所以这一行有无没有区别，有下面一行执行不了，没有下面一行会执行
    pthread_exit(nullptr);

    printf("main thread exit.\n");

    return 0;
}
~~~

注意几点：

- pthread_join(pthread_t thread, void **retval)，第一个参数是需要回收的线程id，第二个参数可以选择接受该子线程的执行的回调函数的返回值，注意类型是二级指针，不需要接受则传递nullptr

  那为什么要传递二级指针呢？就是传出参数的含义了，因为回调函数返回的是void*一级指针类型，我们要想通过传入的参数让系统帮我们修改不能return by value，只能return by pointer或者return by reference，这样才能正确修改，所以需要传入的是二级指针

- ![image-20230727111343535](https://img-blog.csdnimg.cn/ed6a80c46893431dbced4e7364dc5cc1.png)

call_back()函数里面的返回的变量不能是局部变量，也就是放在栈上面的，因为线程之间非常重要的两个不共享的东西就是栈空间和.text代码段，栈空间里面的变量在子线程结束后就会释放掉，所以如果要传递的话最好选择全局变量。堆空间虽然也是共享的，但是可能有问题(不管是全局堆还是局部堆)，虽然空间是公用的，但是好像其他线程一是没有办法free()这个数据，二是我测试过好像不行，我也不知道为什么。所以建议就用全局变量

### 线程的分离 pthread_detach()

~~~cpp
	#include <pthread.h>

	int pthread_detach(pthread_t thread);
// 作用：分离一个线程，被分离的线程在终止的时候会自动释放资源返回给系统
//     - 不能多次分离，会产生不可预期的结果
//     - 不能去连接(join)一个已经分离的线程，如果操作了会报错(会自动释放资源)
// 参数：需要分离的线程id
// 返回值：
//     成功 0
//     失败 错误号
~~~

~~~cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <pthread.h>

void* call_back(void* arg) {
    printf("child thread id : %ld\n", pthread_self());

    return nullptr;
}

int main() {
    // 创建一个线程
    pthread_t tid;
    int ret = pthread_create(&tid, nullptr, call_back, nullptr);
    if (0 != ret) {
        const char* errstr = strerror(ret);
        printf("error pthread_create : %s\n", errstr);
        return -1;
    }

    // 输出主线程和子线程的id
    printf("tid : %ld , main thread id : %ld\n", tid, pthread_self());

    // 设置子线程分离，子线程分离后，结束时候对应的资源就不需要主线程手动回收了
    ret = pthread_detach(tid);
    if (0 != ret) {
        const char* errstr = strerror(ret);
        printf("error pthread_detach : %s\n", errstr);
        return -1;
    }

    // 设置分离后，对分离的子线程进行连接，我偏要手动释放，程序执行结果就会报错
    // ret = pthread_join(tid, nullptr);
    // if (0 != ret) {
    //     const char* errstr = strerror(ret);
    //     printf("error pthread_join : %s\n", errstr);
    //     return -1;
    // }

    // 退出主线程防止主线程结束导致进程结束导致程序结束
    pthread_exit(nullptr);

    return 0;
}
~~~

设置子线程分离后就不能再去连接子线程手动释放他的资源了，因为系统会自动将他的资源给释放掉，不用我们操心

如果强行加上的话pthread_join()的返回值就会是个错误号了，但是Linux本身并未对他进行处理，没有发出信号说错误什么什么的，这就需要我们自己进行严谨的判断了，加上的话ret是个错误号，然后就会获取到错误信息，如下：

![image-20230727114257371](https://img-blog.csdnimg.cn/6b62b775c31e47f69f7529d52fe2d924.png)

因此不能手动释放(连接 join)已经分离的线程

### 线程取消 pthread_cancel()

**执行线程取消后，子进程不是立马退出的，而是执行到了某个取消点，线程才会终止**

**取消点就是系统设置好的一些系统调用(比如printf()就是之一)，可以粗略的理解为从用户区到内核区的切换**

~~~cpp
	#include <pthread.h>

    int pthread_cancel(pthread_t thread);
// 作用：取消线程，让线程终止；底层的执行是发送一个取消的请求给线程(有可能是信号)，取消(终止)线程是要执行到某个条件点才能终止
// 取消某个线程可以终止某个线程的运行，但是并不是立马终止，而是执行到了一个取消点，线程才会终止
// 取消点：系统规定好的一些系统调用(比如就有printf())，我们可以粗略的理解为从用户区到内核区的切换，这个位置称之为取消点
~~~

~~~cpp
#include <pthread.h>
#include <unistd.h>
using namespace std;
#include <cstring>
#include <iostream>

void* call_back(void* arg) {
    printf("child thread id : %ld\n", pthread_self());

    for (int i = 0; i < 5; ++i)
        printf("child : %d\n", i);

    return nullptr;
}

int main() {
    // 创建一个线程
    pthread_t tid;
    int ret = pthread_create(&tid, nullptr, call_back, nullptr);
    if (0 != ret) {
        const char* errstr = strerror(ret);
        printf("error pthread_create : %s\n", errstr);
        return -1;
    }

    // 取消线程
    pthread_cancel(tid);

    for (int i = 0; i < 5; ++i)
        printf("%d\n", i);

    // 输出主线程和子线程的id
    printf("tid : %ld , main thread id : %ld\n", tid, pthread_self());

    pthread_exit(nullptr);

    return 0;
}
~~~

输出的结果每次可能都是不一样的，因为主线程和子线程运行的顺序可能不同，所以执行到的取消点位置也可能不同，所以很可能输出的结果是不一样的，比如下面：

![image-20230731101134205](https://img-blog.csdnimg.cn/ebb01b7c09bb4144ad85e17dbc0291b8.png)

## 线程属性

![image-20230731101232100](https://img-blog.csdnimg.cn/a889c39dc1d242109cce649c9f445ce3.png)

注意：线程的属性不只这一个，还有很多其他的，如下，都可以由我们自己去设置：

![image-20230731103140397](https://img-blog.csdnimg.cn/aa9325b50a1e4f0aa57dd519aea92f76.png)

~~~cpp
    #include <pthread.h>

    int pthread_attr_init(pthread_attr_t *attr);
// 作用：初始化线程属性变量

    int pthread_attr_destroy(pthread_attr_t *attr);
// 作用：释放线程属性资源

    int pthread_attr_setdetachstate(pthread_attr_t *attr, int detachstate);
// 作用：获取线程分离的状态属性

    int pthread_attr_getdetachstate(const pthread_attr_t *attr, int *detachstate);
// 作用：设置线程分离的状态属性
~~~

~~~cpp
#include <cstring>
#include <iostream>
using namespace std;
#include <pthread.h>
#include <unistd.h>

void* call_back(void* arg) {
    printf("child thread id : %ld\n", pthread_self());

    return nullptr;
}

int main() {
    // 创建一个线程属性变量
    pthread_attr_t attr;
    // 初始化属性变量
    pthread_attr_init(&attr);
    // 设置属性
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);  // 表示设置了线程分离

    // 获取线程栈的大小
    size_t _size;

    pthread_attr_getstacksize(&attr, &_size);
    printf("thread stack size : %ld\n", _size);

    // 创建一个线程
    pthread_t tid;
    int ret = pthread_create(&tid, &attr, call_back, nullptr);  // 这里第二个参数，表示线程属性就需要传递进来了
    if (0 != ret) {
        const char* errstr = strerror(ret);
        printf("error pthread_create : %s\n", errstr);
        return -1;
    }

    // 输出主线程和子线程的id
    printf("tid : %ld , main thread id : %ld\n", tid, pthread_self());

    // 释放线程属性资源，初始化了必要释放!!!
    pthread_attr_destroy(&attr);

    // 退出主线程防止主线程结束导致进程结束导致程序结束
    pthread_exit(nullptr);

    return 0;
}
~~~

在代码中注意两点：

- **线程属性结构体初始化(init)之后就必须要释放(destroy)**
- **一般来说主线程和子线程的释放可以有两种方法来写：一是主线程调用pthread_join()手动阻塞回收子线程资源，这个时候就不用考虑子线程结束了主线程还没结束没办法回收资源的问题，当然我们不能让pthread_join()前面的逻辑执行太久，这样僵尸线程的存在时间可能会太长，和没有处理几乎是一样的；二是主线程将子线程分离pthread_detach()，这样主线程就不用去管子线程的释放问题了，但是这样最好在末尾加上pthread_exit()让主线程退出，否则很可能主线程执行完了导致进程结束然后子线程跑不完，主线程退出恰好就解决了这个问题**

## 线程同步

### 示例引入

写一个主线程，创建三个子线程，三个子线程的任务是共同售卖100张门票

~~~cpp
#include <iostream>
using namespace std;
#include <pthread.h>
#include <unistd.h>

// 使用多线程去实现卖票的案例
// 有3个窗口，一共100张票

// 全局变量，但是还是有问题
int tickets = 100;

void* CALLBACK_sell(void* arg) {
    while (tickets > 0) {
        usleep(8000);
        printf("pthread tid %ld is selling ticket %d\n", pthread_self(), tickets);
        --tickets;
    }

    return nullptr;
}

int main() {
    // 创建子线程
    pthread_t tid1, tid2, tid3;

    pthread_create(&tid1, nullptr, CALLBACK_sell, nullptr);
    pthread_create(&tid2, nullptr, CALLBACK_sell, nullptr);
    pthread_create(&tid3, nullptr, CALLBACK_sell, nullptr);

    // 分离线程
    pthread_detach(tid1);
    pthread_detach(tid2);
    pthread_detach(tid3);

    // 主线程退出
    pthread_exit(nullptr);

    return 0;
}
~~~

在代码当中我使用了全局变量tickets，来让三个线程进行共享对他进行处理，但是想法是很美好的，现实却不美好

![image-20230731143537103](https://img-blog.csdnimg.cn/91ef2197e48c4624ba1b422c60368dc4.png)

图中有两个问题，一是7号票三个线程卖了三次；二是线程卖了0号和-1号票，这如果对于实际的问题将会是毁灭性的打击

- **我们先来看为什么会卖三次？**

**谁想如下情形：三个线程ABC，线程A这时候抢占到了CPU，然后睡眠；在睡眠的时候线程B和C进来抢占了CPU，然后睡眠，如果这个时候B先拿到CPU打印这一句，但是还没来得及 --ticket ，就被C抢占了，C也打印同样的ticket，然后来不及--又被A抢占了，所以这个时候就会出现三个线程卖同一张票的情况**

- **那么用类似的思路我们去看为什么会卖出0和-1**

**图样的事情，三个线程同时在 ticket == 1 的时候进来然后睡眠，然后A线程进来执行打印和 --ticket 两句，这个时候ticket变成0，B线程同样执行这两句，但是这个时候打印的ticket是0，C线程同理，只不过这个时候打印的是-1**

**总结一下，这就是没有加访问互斥锁的原因，对共享数据的处理没有加锁导致几个线程同时对数据进行处理，这样数据的更新时机和读取时间一旦不恰当，就很有可能出现数据不同步的问题，这对于要求精确的项目是毁灭性的打击**

### 概述

**临界区是访问一个共享资源的代码片段，并且对该代码进行原子操作，原子操作在执行的过程中不能被中断，必须要执行完毕才能被其他线程占用访问临界区资源**

线程同步就是让一个线程在内存进行操作的时候，其他线程都不允许对这个内存资源进行访问，只有该线程完成操作，其他线程才能对该内存地址进行操作，在执行的过程中其他线程位于阻塞等待状态

![image-20230731154000837](https://img-blog.csdnimg.cn/b88a86483a7a48108d38ee672adeec15.png)

### 互斥锁

所以访问共享资源的时候，为了避免线程更新共享变量的时候出现问题，需要使用互斥锁mutex来对访问进行限制，访问的时候线程给这个共享资源加上互斥锁，其他线程不能试图在加锁的时候对该资源进行访问或者尝试解锁，只有所有者才能给互斥量解锁

![image-20230731161340736](https://img-blog.csdnimg.cn/480ddf475f90441abec0ab58fa0f15db.png)

加了互斥锁之后，现在的访问过程就是这样了：

![image-20230801145448245](https://img-blog.csdnimg.cn/9a871473090c4d4d9889f04a1011b29a.png)

#### 相关函数

![image-20230801145628830](https://img-blog.csdnimg.cn/1559a69b8d204f799ff3b0edb8c71729.png)

#### 示例修改(!!!)

回到之前哪个卖票的例子，现在我加上互斥锁，如下：

互斥量必须是全局的，如果是局部的，线程之间没有办法共享这个互斥量，则会导致有问题

~~~cpp
#include <iostream>
using namespace std;
#include <pthread.h>
#include <unistd.h>

// 全局变量，但是还是有问题
int tickets = 100;
// 全局互斥量
pthread_mutex_t mutex;

void* CALLBACK_sell(void* arg) {
    // 加锁
    pthread_mutex_lock(&mutex);

    // 临界区
    while (tickets > 0) {
        usleep(8000);
        printf("pthread tid %ld is selling ticket %d\n", pthread_self(), tickets);
        --tickets;
    }

    // 解锁
    pthread_mutex_unlock(&mutex);

    return nullptr;
}

int main() {
    // 初始化互斥量，必须是全局的
    pthread_mutex_init(&mutex, nullptr);

    // 创建子线程
    pthread_t tid1, tid2, tid3;

    pthread_create(&tid1, nullptr, CALLBACK_sell, nullptr);
    pthread_create(&tid2, nullptr, CALLBACK_sell, nullptr);
    pthread_create(&tid3, nullptr, CALLBACK_sell, nullptr);

    // 阻塞等待回收线程
    pthread_join(tid1, nullptr);
    pthread_join(tid2, nullptr);
    pthread_join(tid3, nullptr);

    // 释放互斥量资源
    pthread_mutex_destroy(&mutex);

    return 0;
}
~~~

这段代码实际上还是有问题的，我们来看输出结果：

我们发现所有的票都是由一个线程卖出的，我们从代码中查看是为什么

![image-20230802144136067](https://img-blog.csdnimg.cn/e5a2f834bd3243afbb5b746b10b22557.png)

来看我们进行加锁的这段逻辑：

我们发现如果A线程上了锁，那么他就进入了while()循环，在这个while()循环结束之前是没有办法被其他线程加锁访问的，所以就导致了所有的票都是由一个线程去卖的，这显然不符合我们的预期

~~~cpp
void* CALLBACK_sell(void* arg) {
    // 加锁
    pthread_mutex_lock(&mutex);

    // 临界区
    while (tickets > 0) {
        usleep(8000);
        printf("pthread tid %ld is selling ticket %d\n", pthread_self(), tickets);
        --tickets;
    }

    // 解锁
    pthread_mutex_unlock(&mutex);

    return nullptr;
}
~~~

所以我们这里得到一个启发，就是加锁要加在while()循环里面

所以我们的代码这么修改：

在while(1)循环里面要开始访问临界区的时候，然后跳出循环的条件是卖完了，其他线程可以在上一张票卖完准备跳到下一张票中间没有互斥锁保护的循环过渡期进行抢占 或者 时间片用完进行抢占

~~~cpp
void* CALLBACK_sell(void* arg) {
    // 临界区
    while (1) {
        // 加锁
        pthread_mutex_lock(&mutex);

        if (tickets > 0) {
            usleep(5000);
            printf("pthread tid %ld is selling ticket %d\n", pthread_self(), tickets);
            --tickets;
        } else {
            // 卖完了
            pthread_mutex_unlock(&mutex);
            break;
        }
        // 解锁
        pthread_mutex_unlock(&mutex);
    }

    return nullptr;
}
~~~

但是我们的输出结果是：

还是只有一个人在卖，为什么呢？

我们观察发现，我们卖完票睡眠了一段时间，这段时间肯定是比CPU的时间片要大的，并且线程A在休眠的过程中还是被加锁保护了的，除非这段时间小于时间片，系统才会把CPU给他，但是没有，所以往返而来就是一个线程在卖

![image-20230802145837448](https://img-blog.csdnimg.cn/6db0dad81bfb4a05888989b218aab76b.png)

所以我们可以把睡眠去掉再来看

~~~cpp
void* CALLBACK_sell(void* arg) {
    // 临界区
    while (1) {
        // 加锁
        pthread_mutex_lock(&mutex);

        if (tickets > 0) {
            // usleep(5000);
            printf("pthread tid %ld is selling ticket %d\n", pthread_self(), tickets);
            --tickets;
        } else {
            // 卖完了
            pthread_mutex_unlock(&mutex);
            break;
        }
        // 解锁
        pthread_mutex_unlock(&mutex);
    }

    return nullptr;
}
~~~

执行结果为：

可以看出的确线程是交替来卖票的，只不过时间片完了被其他线程进行抢占，然后交替卖票

并且由于我们的设计是while(1)死循环，跳出的点是票卖完了，所以我们的线程可以进行第二轮的卖票，而不是卖了一轮就结束

<img src="https://img-blog.csdnimg.cn/ceca7c0940404544b460baa8062739f5.png" alt="image-20230802150151733" style="zoom:67%;" />

<img src="https://img-blog.csdnimg.cn/a26fa20269c7439e9d0de9c69bac961e.png" alt="image-20230802150219200" style="zoom:67%;" />

### 死锁

死锁可能产生的几种场景：

- **忘记释放锁**
- **重复加锁**
- **多线程多锁，抢占锁资源**

死锁产生的四个必要条件(缺一不可):

- **互斥**
- **非剥夺**
- **请求和保持**
- **环路等待**

![image-20230803135330646](https://img-blog.csdnimg.cn/c112dbde10af41be87944709348ba3af.png)

我们来看死锁产生的几种情景：

- 忘记释放锁：很显然，一个线程访问临界区的时候加上锁，访问完毕走的时候忘了解锁，这样其他的线程没办法加锁，更没办法访问了，自己第二次过来想继续加锁访问也是不可以的，因为上一把锁还没解开

  ~~~cpp
  void* CALLBACK_sell(void* arg) {
      // 临界区
      while (1) {
          // 加锁
          pthread_mutex_lock(&mutex);
  
          if (tickets > 0) {
              // usleep(5000);
              printf("pthread tid %ld is selling ticket %d\n", pthread_self(), tickets);
              --tickets;
          } else {
              // 卖完了
              pthread_mutex_unlock(&mutex);
              break;
          }
          // 解锁
          // pthread_mutex_unlock(&mutex);
      }
  
      return nullptr;
  }
  ~~~

  ![image-20230803143045431](https://img-blog.csdnimg.cn/39fc734ba53142c4967e51b9ccada133.png)

- 重复加相同的锁：设想一个我们写代码的时候应该不会犯的错误，就是在我要加锁的时候，我加了两次，第一把锁能够加上，但是第二把是加不上的，因为第一把锁还没加开，所以自己没办法访问，显然其他的线程更没办法访问了；但是我们一般不会犯这么傻的错误，我们可能加了锁之后去调用其他的函数，然后其他的函数当中存在加锁，这样显然就出现了上面的情况，然而这样的话我们不易察觉

  ~~~cpp
  void* CALLBACK_sell(void* arg) {
      // 临界区
      while (1) {
          // 加锁
          // 这里对同一把锁加了两次
          pthread_mutex_lock(&mutex);
          pthread_mutex_lock(&mutex);
  
          if (tickets > 0) {
              // usleep(5000);
              printf("pthread tid %ld is selling ticket %d\n", pthread_self(), tickets);
              --tickets;
          } else {
              // 卖完了
              pthread_mutex_unlock(&mutex);
              break;
          }
          // 解锁
          pthread_mutex_unlock(&mutex);
          pthread_mutex_unlock(&mutex);
      }
  
      return nullptr;
  }
  ~~~

  ![image-20230803143334595](https://img-blog.csdnimg.cn/8ed91cd3df0248eca19f2a510ee83fbb.png)

- 多线程多锁，抢占锁资源：看图中，线程A和线程B分别给资源1和资源2加锁，但是线程的执行依赖于这两个资源的共同访问，所以谁都没办法进行，这就导致了环路等待，产生了死锁

  下面是一个示例：

  假设我们这里的代码不睡1秒，那么线程会先后执行，因为线程执行的时间太短了，导致在时间片内就完成了，这样其他线程没有抢占然后去加锁的过程，因此这种情况是不会产生死锁的

  但是如果我们死循环的去执行，就有可能产生死锁，死循环执行，时间片完了我们也不知道线程执行到哪一步，然后被抢占了万一刚好给第一个加锁，另外一个也给第一个加锁，这不就死锁了嘛

  这里我在加锁了之后睡1秒，我让第二个线程去抢占加锁，让他成为死锁，从执行结果来看必然是死锁

  ~~~cpp
  #include <iostream>
  using namespace std;
  #include <pthread.h>
  #include <unistd.h>
  
  pthread_mutex_t mutex1, mutex2;
  
  void* CALLBACK_A(void* arg) {
      pthread_mutex_lock(&mutex1);
      sleep(1);  // 这里睡一秒，让线程B得到抢占权
      pthread_mutex_lock(&mutex2);
  
      printf("thread A , tid : %ld is working.\n", pthread_self());
  
      // 释放锁的时候最好反着来，因为加锁是有顺序的
      pthread_mutex_unlock(&mutex2);
      pthread_mutex_unlock(&mutex1);
  
      return nullptr;
  }
  
  void* CALLBACK_B(void* arg) {
      pthread_mutex_lock(&mutex2);
      sleep(1);  // 这里睡一秒，让线程A得到抢占权
      pthread_mutex_lock(&mutex1);
  
      printf("thread B , tid : %ld is working.\n", pthread_self());
  
      pthread_mutex_unlock(&mutex1);
      pthread_mutex_unlock(&mutex2);
  
      return nullptr;
  }
  
  int main() {
      // 初始化互斥信号量
      pthread_mutex_init(&mutex1, nullptr);
      pthread_mutex_init(&mutex2, nullptr);
  
      pthread_t tid1, tid2;
  
      // 创建子线程
      pthread_create(&tid1, nullptr, &CALLBACK_A, nullptr);
      pthread_create(&tid2, nullptr, &CALLBACK_B, nullptr);
  
      // 回收子线程
      pthread_join(tid1, nullptr);
      pthread_join(tid2, nullptr);
  
      // 释放信号量
      pthread_mutex_destroy(&mutex1);
      pthread_mutex_destroy(&mutex2);
  
      return 0;
  }
  ~~~

  ![image-20230803151736722](https://img-blog.csdnimg.cn/f4dc3cddfb9e4a9782b84848375db8e5.png)

### 读写锁

在实际的开发过程中，存在读和写的两种情况，我们发现如果读写都是独占加锁的话，读是可以多个线程同时进行的呀，因为没有修改数据的大小，所以加锁就造成了资源和效率上的浪费；所以我们可以让多个线程可以同时读数据，然后写数据需要加互斥锁，只能一个线程写数据，并且在写的时候其他线程不能读数据

特点：

- **如果有线程在读数据，其他线程只允许读数据而不允许写数据**
- **如果有线程在写数据，其他线程都不允许进行读写操作**
- **写数据是独占的，他的优先级更高**

![image-20230804134719753](https://img-blog.csdnimg.cn/e8c4c611d0654525b4c367b80c52d5f4.png)

#### 相关函数

![image-20230816104436489](https://img-blog.csdnimg.cn/9aa13fe74c3a40059c1711daa16c7a87.png)

示例代码：(8个线程，3个写线程，5个读线程)

~~~cpp
#include <iostream>
using namespace std;
#include <pthread.h>
#include <unistd.h>

/*
    读写锁的类型 pthread_rwlock_t

    int pthread_rwlock_init(pthread_rwlock_t *restrict rwlock, const pthread_rwlockattr_t *restrict attr);

    int pthread_rwlock_destroy(pthread_rwlock_t *rwlock);

    int pthread_rwlock_rdlock(pthread_rwlock_t *rwlock);

    int pthread_rwlock_tryrdlock(pthread_rwlock_t *rwlock);

    int pthread_rwlock_wrlock(pthread_rwlock_t *rwlock);

    int pthread_rwlock_trywrlock(pthread_rwlock_t *rwlock);

    int pthread_rwlock_unlock(pthread_rwlock_t *rwlock);
*/

// 定义全局变量
int num = 1;

// 定义读写互斥量
pthread_rwlock_t _rwlock;

void* WRITE_CALLBACK(void* arg) {
    while (1) {
        pthread_rwlock_wrlock(&_rwlock);

        printf("++write, tid : %ld , num : %d\n", pthread_self(), ++num);

        pthread_rwlock_unlock(&_rwlock); //这行代码要在usleep上面，因为需要睡眠让其他线程进行抢占，如果在下面就不好说了

        usleep(1000);
    }

    return nullptr;
}

void* READ_CALLBACK(void* arg) {
    while (1) {
        pthread_rwlock_rdlock(&_rwlock);

        printf("===read, tid : %ld , num : %d\n", pthread_self(), num);

        pthread_rwlock_unlock(&_rwlock);

        usleep(1000);
    }

    return nullptr;
}

// 案例：创建8个线程，操作同一个全局变量
// 3个线程不定时的写一个全局变量，5个线程不定时的读这个全局变量
int main() {
    // 初始化读写互斥量
    pthread_rwlock_init(&_rwlock, nullptr);

    // 创建3个写线程，5个读线程
    pthread_t wr_tids[3], rd_tids[5];

    for (int i = 0; i < 3; ++i)
        pthread_create(&wr_tids[i], nullptr, WRITE_CALLBACK, nullptr);

    for (int i = 0; i < 5; ++i)
        pthread_create(&rd_tids[i], nullptr, READ_CALLBACK, nullptr);

    // 分离线程
    for (int i = 0; i < 3; ++i)
        pthread_detach(wr_tids[i]);

    for (int i = 0; i < 5; ++i)
        pthread_detach(rd_tids[i]);

    // 退出主线程
    pthread_exit(nullptr);

    // 释放读写互斥量
    pthread_rwlock_destroy(&_rwlock);

    return 0;
}
~~~

执行结果：

![image-20230816112647486](https://img-blog.csdnimg.cn/b7ab0ba3e91a4355b6f6c6d93e75e357.png)

### 生产者消费者模型

![image-20230816150325060](https://img-blog.csdnimg.cn/c1250dbbbe0742b380471ae2507f5e67.png)

我们现在用一个简陋的实现来模拟这个过程

~~~cpp
#include <ctime>
#include <iostream>
using namespace std;
#include <pthread.h>
#include <unistd.h>

/*
    生产者消费者模型(粗略的版本)
*/

// 定义一个链表
struct Node {
    int val;
    struct Node* next;
};

// 定义头结点
struct Node* head = nullptr;

void* PRO_CALLBACK(void*) {
    // 不断生成新节点，插入到链表当中(头插)
    while (1) {
        struct Node* newNode = new struct Node;
        newNode->next = head;
        head = newNode;

        newNode->val = rand() % 1000;

        printf("add node , val : %d , tid : %ld\n", newNode->val, pthread_self());

        usleep(1000);
    }

    return nullptr;
}

void* CUS_CALLBACK(void*) {
    // 不断从头部释放头结点
    while (1) {
        struct Node* tmp = head;
        head = head->next;
        printf("delete node , val : %d , tid : %ld\n", tmp->val, pthread_self());

        delete tmp;
        tmp = nullptr;

        usleep(1000);
    }

    return nullptr;
}

int main() {
    // 创建5个生产者线程，和5个消费者线程
    pthread_t ptids[5], ctids[5];

    for (int i = 0; i < 5; ++i) {
        pthread_create(&ptids[i], nullptr, PRO_CALLBACK, nullptr);
        pthread_create(&ctids[i], nullptr, CUS_CALLBACK, nullptr);
    }

    // 线程分离
    for (int i = 0; i < 5; ++i) {
        pthread_detach(ptids[i]);
        pthread_detach(ctids[i]);
    }

    while (1) {
        sleep(10);
    }

    // 线程退出
    pthread_exit(nullptr);

    return 0;
}
~~~

这个程序没有对多线程进行数据处理的同步操作，会导致一系列问题，比如链表没有数据就进行释放，这样就会导致内存的访问错误，也就是会报段错误，多次执行，每次执行的结果可能都是不一样的

![image-20230817102529078](https://img-blog.csdnimg.cn/7af776fc6c2d4629880af4903581ec70.png)

#### 自己的思路

我们自己先尝试着解决这两个问题，一个是数据不同步的问题，一个是非法访问内存导致段错误的问题，我们的代码如下：

- **数据同步：由于我们在生产和消费的时候都是处理的是头结点，这一块区域就是临界区，我们可以给这个区域加上互斥锁，也就是定义pthread_mutex_t类型互斥锁来处理**
- **段错误，这个问题的出现在于我们在链表为空的时候进行了消费者行为，移出数据，这个时候会导致内存的非法访问，因此我们可以加上一个条件判断，当没有数据的时候就循环直到有数据**
  **但是这么做的坏处就是如果消费者线程一直拿到CPU执行一直没有数据，那就一直空转等待，会消耗性能和降低效率，我们希望消费者在没有数据的时候能够题型生产者去生产数据，而生产者相反的可以在满了的时候提醒消费者消费数据，当然我们这个设计链表可以无限延申，这里不需要考虑，这才是我们想要的，所以下面就有条件变量和信号量两种操作**

~~~cpp
#include <ctime>
#include <iostream>
using namespace std;
#include <pthread.h>
#include <unistd.h>

/*
    生产者消费者模型(粗略的版本)
*/

// 创建互斥量来解决数据同步的问题
pthread_mutex_t mutex;

// 定义一个链表
struct Node {
    int val;
    struct Node* next;
};

// 定义头结点
struct Node* head = nullptr;

void* PRO_CALLBACK(void*) {
    // 不断生成新节点，插入到链表当中(头插)
    while (1) {
        pthread_mutex_lock(&mutex);

        struct Node* newNode = new struct Node;
        newNode->next = head;
        head = newNode;

        newNode->val = rand() % 1000;

        printf("add node , val : %d , tid : %ld\n", newNode->val, pthread_self());

        pthread_mutex_unlock(&mutex);

        usleep(1000);
    }

    return nullptr;
}

void* CUS_CALLBACK(void*) {
    // 不断从头部释放头结点
    while (1) {
        pthread_mutex_lock(&mutex);

        struct Node* tmp = head;

        // 这里如果没有数据head就为nullptr就会报错这一行，非法访问内存
        // 需要进行判断
        if (head == nullptr) {
            delete tmp;
            tmp = nullptr;

            pthread_mutex_unlock(&mutex);

            usleep(1000);
            continue;
        }

        head = head->next;
        printf("delete node , val : %d , tid : %ld\n", tmp->val, pthread_self());

        delete tmp;
        tmp = nullptr;

        pthread_mutex_unlock(&mutex);

        usleep(1000);
    }

    return nullptr;
}

int main() {
    // 初始化互斥锁
    pthread_mutex_init(&mutex, nullptr);

    // 创建5个生产者线程，和5个消费者线程
    pthread_t ptids[5], ctids[5];

    for (int i = 0; i < 5; ++i) {
        pthread_create(&ptids[i], nullptr, PRO_CALLBACK, nullptr);
        pthread_create(&ctids[i], nullptr, CUS_CALLBACK, nullptr);
    }

    // 回收线程
    for (int i = 0; i < 5; ++i) {
        pthread_detach(ptids[i]);
        pthread_detach(ctids[i]);
    }

    // 用死循环来保证主线程不会结束，如果用 pthread_exit() 会导致互斥锁释放的位置问题
    while (1)
        ;

    // 释放互斥锁
    pthread_mutex_destroy(&mutex);

    // 主线程退出(这里其实没什么用了)
    pthread_exit(nullptr);

    return 0;
}
~~~

#### 条件变量

**条件变量可以有两个行为，满足某个条件线程阻塞，或者满足条件线程解除阻塞**

**他不能保证数据混乱的问题，数据混乱需要加互斥锁，需要使用 pthread_mutex_t 类型的互斥锁解决**

**我们发现阻塞和解除阻塞，还要满足某个条件，这不就是我想要的嘛？所以head为空就阻塞，head不为空就解除阻塞，这就是基本的思路**

![image-20230817104711611](https://img-blog.csdnimg.cn/fc9fd315ecf64e9c94e2e5025b400d28.png)

将我们的代码进行改进：

**其实就改了两个地方，就是生产者生产了之后的动作和消费者没有数据时候的处理**

- **生产者：生产者在生产了数据之后会调用条件变量的信号函数 pthread_cond_signal() 函数来提醒消费者有数据了，至于是怎么提醒的呢？这就依赖于消费者里面的函数 pthread_cond_wait()**
- **消费者：调用阻塞函数 pthread_cond_wait() 进行阻塞等待(没有数据的时候)，然后当有数据的时候就解除阻塞**
  **这里会出现一个问题，为什么 pthread_cond_wait() 函数中会需要传入mutex互斥锁的信息呢？**
  **肯定是操作了互斥锁，我们来看，假设不操作，那么我阻塞，然后我还拿着临界区的访问互斥锁，那么就出问题了，其他的线程不管是消费者还是生产者都没有办法拿到这把锁，那么就肯定会导致死锁，所以肯定对这个锁进行了处理**
  **其实，当调用阻塞的时候，会释放掉这把锁，让其他线程进行争抢，当生产者拿到锁，生产了数据，调用pthread_cond_signal()函数告诉消费者可以解除阻塞了，那么这个时候就会解除阻塞并且重新给这个线程上锁，因此解除阻塞的时候锁还在我身上，刚才阻塞的过程中不在了，所以后面需要跟上一句释放这个锁，因为根据我们的逻辑会重新循环拿锁，我们需要避免死锁**

~~~cpp
#include <ctime>
#include <iostream>
using namespace std;
#include <pthread.h>
#include <unistd.h>

/*
    生产者消费者模型(粗略的版本)
*/

// 创建互斥量来解决数据同步的问题
pthread_mutex_t mutex;
// 定义条件变量
pthread_cond_t cond;

// 定义一个链表
struct Node {
    int val;
    struct Node* next;
}* head = nullptr;  // 定义头结点

void* PRO_CALLBACK(void* args) {
    // 不断生成新节点，插入到链表当中(头插)
    while (1) {
        pthread_mutex_lock(&mutex);

        struct Node* newNode = new struct Node;
        newNode->next = head;
        head = newNode;

        newNode->val = rand() % 1000;

        printf("add node , val : %d , tid : %ld\n", newNode->val, pthread_self());

        pthread_mutex_unlock(&mutex);
        
        pthread_cond_signal(&cond);

        usleep(1000);
    }

    return nullptr;
}

void* CUS_CALLBACK(void* args) {
    // 不断从头部释放头结点
    while (1) {
        pthread_mutex_lock(&mutex);

        struct Node* tmp = head;

        // 这里如果没有数据head就为nullptr就会报错这一行，非法访问内存
        // 需要进行判断
        if (head != nullptr) {
            head = head->next;
            printf("delete node , val : %d , tid : %ld\n", tmp->val, pthread_self());

            delete tmp;
            tmp = nullptr;

            pthread_mutex_unlock(&mutex);

            usleep(1000);
        } else {
            // 没有数据，需要阻塞等待
            // 当这个函数调用阻塞的时候，会解锁，当不阻塞的时候继续向下执行，会重新加锁
            pthread_cond_wait(&cond, &mutex);
            // 当有数据唤醒之后，我们的代码逻辑是重新进入循环加锁，因此必须提前释放锁
            pthread_mutex_unlock(&mutex);
        }
    }

    return nullptr;
}

int main() {
    // 初始化互斥锁
    pthread_mutex_init(&mutex, nullptr);
    // 初始化条件变量
    pthread_cond_init(&cond, nullptr);

    // 创建5个生产者线程，和5个消费者线程
    pthread_t ptids[5], ctids[5];

    for (int i = 0; i < 5; ++i) {
        pthread_create(&ptids[i], nullptr, PRO_CALLBACK, nullptr);
        pthread_create(&ctids[i], nullptr, CUS_CALLBACK, nullptr);
    }

    // 回收线程
    for (int i = 0; i < 5; ++i) {
        pthread_detach(ptids[i]);
        pthread_detach(ctids[i]);
    }

    // 用死循环来保证主线程不会结束，如果用 pthread_exit() 会导致互斥锁释放的位置问题
    while (1)
        ;

    // 释放条件变量
    pthread_cond_destroy(&cond);
    // 释放互斥锁
    pthread_mutex_destroy(&mutex);

    // 主线程退出(这里其实没什么用了)
    pthread_exit(nullptr);

    return 0;
}
~~~

#### 信号量

看到 sem_wait() 和 sem_post() 函数就想到操作系统中学到的PV问题了

![image-20230817114724983](https://img-blog.csdnimg.cn/0ea55f60e3674e2ea1e3c05330d6c412.png)

~~~cpp
    #include <semaphore.h>

    int sem_init(sem_t *sem, int pshared, unsigned int value);
//作用：初始化信号量
//参数：
    //sem：信号量变量的地址
    //pshared：0 用在线程； 非0 用在进程
    //value：信号量的值

    int sem_destroy(sem_t *sem);
//作用：释放资源

    int sem_wait(sem_t *sem);
//作用：对信号量加锁，调用一次，对信号量的值减1，如果值为0，就阻塞

    int sem_trywait(sem_t *sem);
//作用：尝试wait

    int sem_timedwait(sem_t *restrict sem, const struct timespec *restrict abs_timeout);
//作用：等待一段时间

    int sem_post(sem_t *sem);
//作用：解锁一个信号量，调用一次，对信号量的值加1

    int sem_getvalue(sem_t *restrict sem, int *restrict sval);
//作用：获取信号量的值
~~~

实际代码：

~~~cpp
#include <ctime>
#include <iostream>
using namespace std;
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

// 创建互斥量来解决数据同步的问题
pthread_mutex_t mutex;
// 创建两个信号量
sem_t psem, csem;

// 定义一个链表
struct Node {
    int val;
    struct Node* next;
}* head = nullptr;  // 定义头结点

void* PRO_CALLBACK(void* args) {
    // 不断生成新节点，插入到链表当中(头插)
    while (1) {
        sem_wait(&psem);

        pthread_mutex_lock(&mutex);

        struct Node* newNode = new struct Node;
        newNode->next = head;
        head = newNode;

        newNode->val = rand() % 1000;

        printf("add node , val : %d , tid : %ld\n", newNode->val, pthread_self());

        pthread_mutex_unlock(&mutex);

        sem_post(&csem);  // 将消费者的信号量加1表示可以进行消费

        usleep(1000);
    }

    return nullptr;
}

void* CUS_CALLBACK(void* args) {
    // 不断从头部释放头结点
    // 这就是操作系统当中学的经典的PV问题了，巩固一下
    while (1) {
        sem_wait(&csem);

        pthread_mutex_lock(&mutex);

        struct Node* tmp = head;

        head = head->next;
        printf("delete node , val : %d , tid : %ld\n", tmp->val, pthread_self());

        delete tmp;
        tmp = nullptr;

        pthread_mutex_unlock(&mutex);

        sem_post(&psem);  // 将生产者的信号量加1表示可以生产

        usleep(1000);
    }

    return nullptr;
}

int main() {
    // 初始化互斥锁
    pthread_mutex_init(&mutex, nullptr);
    // 初始化信号量
    sem_init(&psem, 0, 8);
    sem_init(&csem, 0, 0);

    // 创建5个生产者线程，和5个消费者线程
    pthread_t ptids[5],
        ctids[5];

    for (int i = 0; i < 5; ++i) {
        pthread_create(&ptids[i], nullptr, PRO_CALLBACK, nullptr);
        pthread_create(&ctids[i], nullptr, CUS_CALLBACK, nullptr);
    }

    // 回收线程
    for (int i = 0; i < 5; ++i) {
        pthread_detach(ptids[i]);
        pthread_detach(ctids[i]);
    }

    // 用死循环来保证主线程不会结束，如果用 pthread_exit() 会导致互斥锁释放的位置问题
    while (1)
        ;

    // 释放互斥锁
    pthread_mutex_destroy(&mutex);

    // 主线程退出(这里其实没什么用了)
    pthread_exit(nullptr);

    return 0;
}
~~~

