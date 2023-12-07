---
title: C++标准库 体系结构与内存分析
categories:
  - C++学习
  - 侯捷老师C++课程
abbrlink: 9775b30e
date: 2023-09-20 02:00:00
updated: 2023-09-20 02:00:00
---

<meta name="referrer" content="no-referrer"/>

`侯捷老师C++课程`的`C++标准库 体系结构与内存分析`部分。

<!-- more -->

`CSDN`：[https://blog.csdn.net/m0_61588837/article/details/132737074](https://blog.csdn.net/m0_61588837/article/details/132737074)

`markdown`文档在：[https://github.com/DavidingPlus/Md_Files/blob/master/Cpp/C%2B%2B%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0/C%2B%2B%E8%AF%AD%E8%A8%80/%E4%BE%AF%E6%8D%B7%E8%80%81%E5%B8%88c%2B%2B%E8%AF%BE%E7%A8%8B.md](https://github.com/DavidingPlus/Md_Files/blob/master/Cpp/C%2B%2B%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0/C%2B%2B%E8%AF%AD%E8%A8%80/%E4%BE%AF%E6%8D%B7%E8%80%81%E5%B8%88c%2B%2B%E8%AF%BE%E7%A8%8B.md)

代码在：[https://github.com/DavidingPlus/Cpp_Learning/tree/HouJie](https://github.com/DavidingPlus/Cpp_Learning/tree/HouJie)

# 第一讲：STL标准库和泛型编程

## STL 体系结构

六大部件: 容器 分配器 算法 迭代器 适配器 仿函数

容器：各种数据结构

算法：algorithm

迭代器：泛型指针，重载了 * -> ++ --操作的类

仿函数：从实现的角度看是重载了 operator() 的类

适配器：一种修饰容器，仿函数或者迭代器接口的东西

分配器：负责空间的配置和管理

![image-20230414100854356](https://img-blog.csdnimg.cn/dd1b24a7bed640e18a3fe5f1c795f815.png)

 以下有一个程序的例子几乎包含了所有的元素：

<img src="https://img-blog.csdnimg.cn/cdf555a7fd67418cbf1aaf619b0c60e1.png" alt="image-20230414114802698" style="zoom: 67%;" />

```c++
#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>
using namespace std;

int main()
{
    int ia[6] = {27, 210, 12, 47, 109, 83};
    vector<int, allocator<int>> vi(ia, ia + 6);

    cout << count_if(vi.begin(), vi.end(), not1(bind2nd(less<int>(), 40))) << endl;
    return 0;
}
```

下面来解释这里面所用到的东西:

1. vector是容器，这里的用法和一般的使用方法不同，这里给出了分配器模板的指定参数

2. count_if第三个参数，本意是想比较迭代器 * iter 和40 的大小，然后使用的仿函数，但是less<int>()这个系统自带的仿函数的实现是这样的

   ```c++
     template<typename _Tp>
       struct less : public binary_function<_Tp, _Tp, bool>
       {
         _GLIBCXX14_CONSTEXPR
         bool
         //从这里可以看出他需要两个参数
         operator()(const _Tp& __x, const _Tp& __y) const
         { return __x < __y; }
       };
   ```

   一般仿函数的用法:

   ```c++
   vector<int>v{5,3,4,6,8};
   sort(v.begin(),v.end(),less<int>());//仿函数作谓词
   ```

   所以这里用 **bind2nd** 将迭代器和40绑定在一起，也叫 function adapter(binder)。

   然后最外面 **not1** 一样的，将条件取反，所以求的就是大于等于40的元素个数了,function adapter(negator)

## 基于范围的 for 语句

个人感觉有点像python里面的 for i in range()

```c++
#include <iostream>
using namespace std;
#include <vector>

// 遍历vector容器
template <typename Type>
void print(vector<Type> container)
{
    for (auto elem : container)
        cout << elem << ' ';
    cout << endl;
}

int main()
{
    print(vector<int>{1, 5, 6, 9, 7, 5, 3, 10});

    vector<double> nums{1.1, 2.5, 6.33, 15.66, 1.44, 2.52};
    print(nums);

    // 稍微修改一下
    // 注意传入引用才能修改实参!!!!!
    for (auto &elem : nums)
        elem -= 1; // 减一
    print(nums);

    return 0;
}
```

## 容器的结构和分类

总体来讲分为两类:

序列容器 Sequence Containers

关联式容器 Associate Containers 关联式容器采用键值对的方式存储数据，因此这一种容器查找元素的效率最高，最方便

无序容器 Unordered Containers 是关联式容器的一种，c++11新出的

相比于关联式容器的特点：

- 无序容器内部存储的**键值对是无序**的，各键值对的存储位置取决于该键值对中的键
- 和关联式容器相比，无序容器擅长**通过指定键查找对应的值**（平均时间复杂度为 O(1)）；
- 但对于使用迭代器遍历容器中存储的元素，无序容器的执行效率则不如关联式容器。

![image-20230414161555294](https://img-blog.csdnimg.cn/bdbcaaf47337400b80136a6284e67b60.png)

## HashTable Separate Chaining

![image-20230414171828137](https://img-blog.csdnimg.cn/a9e45283a98641a1873cfa245f989735.png)

## Sequence Containers 序列容器

### array(c++11)

array是STL自带的数组类，其本质就是一个固定大小的数组，里面存放的元素类型由用户指定

```c++
void test()
    {
        srand(time(NULL));

        const size_t _size = 100;
        array<int, _size> arr;

        for (int i = 0; i < _size; ++i)
            // 随机数 0-100
            arr[i] = rand() % 101;
        // 打印一些信息
        cout << "arr.size()= " << arr.size() << endl;
        cout << "arr.front()= " << arr.front() << endl;
        cout << "arr.back()= " << arr.back() << endl;
        cout << "arr.data()= " << arr.data() << endl;
    	cout<< " &arr[0]= " << &arr[0] << endl;//第四行和第五行得到的结果是一样的
    }
```

array封装了固定长度数组的一些函数接口，其中data()函数是得到这个数组的首元素地址，也就是第五行，所以四五行结果相同

### vector

```c++
void test(int length)
    {
        srand(time(NULL));

        vector<int> v;
        for (int i = 0; i < length; ++i)
            v.push_back(rand() % 101);
        // 打印
        cout << "v.size()= " << v.size() << endl;
    	cout << "v.max_size()= " << v.max_size() << endl;//这里的max_size()是指vector容器能装下的最大的大小
        cout << "v.front()= " << v.front() << endl;
        cout << "v.back()= " << v.back() << endl;
        cout << "v.data()= " << v.data() << endl;
        cout << "&v[0]=" << &v[0] << endl;
        cout << "v.capacity()= " << v.capacity() << endl;
    }
```

这里得到我指定size是10000的时候，capacity是16384，恰好是2的14次方，那么为什么是这样呢？

vector当空间不够的时候如何开辟空间：**2倍开辟**!!!

比如现在有2个元素，想要放入第三个，空间不够会新开辟，那么新开辟之后vector的空间大小是4

即:

```c++
// v.size() == 3
// v.capacity() == 4
```

所以当 size==10000的时候，capacity为16384也不奇怪了

并且**内存开辟成长机制**：

当空间不够的时候，vector容器会去内存中找另一块空间是现在2倍的空间，重新开辟内存，并且把现在的内存释放掉，把现在的数据迁移到新的2倍内存当中去!!!!

### list

![image-20230415143355398](https://img-blog.csdnimg.cn/add3c884b83b4affb385396603fd5bfc.png)

list是个双端循环链表，注意不仅是双向链表，还是循环的!!!!

```c++
    void test(int length)
    {
        srand(time(NULL));

        list<int> l;
        for (int i = 0; i < length; ++i)
            l.push_back(rand() % 101);//list 提供了back和front两种插入方法,因为有begin()和end()迭代器
        cout << "l.size()= " << l.size() << endl;
        cout << "l.max_size()= " << l.max_size() << endl;
        //注意 front和back的三种得到方式
        cout << "l.front()= " << l.front() << endl;
        cout << "l.front()= " << *l.begin() << endl;
        cout << "l.front()= " << *(++l.end()) << endl;

        cout << "l.back()= " << l.back() << endl;
        cout << "l.back()= " << *(--l.end()) << endl;
        auto iter = --l.begin();
        cout << "l.back()= " << *(--iter) << endl;
    }
```

得到首部和尾部的方式:

1.内置函数 front()和back()

2.使用迭代器 begin() 和 end()

注意这里的迭代器是首闭尾开的形式,就是begin() 指向的第一个元素，end() 指向的最后一个元素的下一个没有值的内存空间,所以上一个区域就是最后一个元素的值 --end()

由于这个双端链表在内存中最后一个元素的末尾还多了一块未分配值的空间，考虑到是循环的，所以++end()就代表第一块元素的空间

但是，由于**大部分的迭代器没有重载 + 和 - 运算符(vector容器有)**，那么在求的时候不能直接用这两个符号，而得使用重载的++ 和 -- 运算符!!!!!!!

### forward_list(c++11)

![image-20230415143409298](https://img-blog.csdnimg.cn/c50fd6e05ad44156a85033955ed94be0.png)

本质就是一个单向链表，非循环链表

```c++
    void test(int length)
    {
        srand(time(NULL));

        forward_list<int> fl;
        for (int i = 0; i < length; ++i)
            fl.push_front(rand() % 101); // 只提供头插法,因为尾插法太慢了
        cout << "fl.max_size()= " << fl.max_size() << endl;
        cout << "fl.front()= " << fl.front() << endl;
        cout << "fl.front()= " << *(fl.begin()) << endl;
        // cout << "fl.back()= " << *(--fl.end()) << endl; // error 没有重载 -- 运算符 只重载++运算符
        // 不存在 fl.back() 接口
        // 也不存在fl.size()接口
    }
```

注意这个单向链表只有头插法，原因是尾插法每次都要遍历到最后，太慢了，头插法效率更高,所以这个容器也**不存在back()函数接口**

这个单向链表begin()和end()迭代器都存在，但是大部分的时候遍历是使用begin()迭代器，因为**只重载了 ++ 运算符，未重载 -- 运算符!!!**

还有一点与list不同,这个容器**没有 size() 接口**!!!我也不知道为什么，标准库没有提供这个接口

### slist

这个容器的实现和 forward_list 相同，只不过这个容器是c++之前就有了，而 forward_list 是c++11新提出的

```c++
//头文件
#include <ext\slist>
```

### deque

双端开口队列

![image-20230415145105415](https://img-blog.csdnimg.cn/d1eec4f566cb4dc3aad529ae378d34dc.png)

但是在实现的时候采用的是**分段连续**的机制：

它真实的结构如下：

<img src="https://img-blog.csdnimg.cn/32da6385c9554cbeb33a18ff856cb8ee.png" alt="image-20230415145711652" style="zoom:67%;" />

到99的时候，迭代器进行++的操作，需要进行判断走到了这一块内存的末尾，需要移步到下一个buffer的起始位置，也就是0，这就需要对++和--操作符进行重载!!!

```c++
    void test(int length)
    {
        srand(time(NULL));
        deque<int> d;
        for (int i = 0; i < length; ++i)
            d.push_back(rand() % 101);
        cout << "d.size()= " << d.size() << endl;
        cout << "d.max_size()= " << d.max_size() << endl;
        cout << "d.front()= " << d.front() << endl;
        cout << "d.back()= " << d.back() << endl;
    }
```

和前面的使用没有大区别,只是**deque不是循环的，而是两端延升的**

###  stack

deque的功能可以实现stack的所有功能，可以用复合composition的方式来实现stack类

<img src="https://img-blog.csdnimg.cn/b6856e9625a7484896e454b0e17212ad.png" alt="image-20230415150557574" style="zoom: 67%;" />

### queue

同stack，略

<img src="https://img-blog.csdnimg.cn/77285d8183ce4e0f801b6e99452c5514.png" alt="image-20230415150706680" style="zoom:67%;" />

##  Associate Containers 关联式容器

关联式容器每个元素都存在 key 和 value，这样才能使得查询效率大大提高

### 红黑树

### Multiset 和 set

<img src="https://img-blog.csdnimg.cn/4454d84396d24c16b135ada642cd897a.png" alt="image-20230415154938692" style="zoom:67%;" />

这种容器的 **key 和 value 值相同!**!!!!

这两个容器的底层都是用**二叉树**(红黑树)实现的，元素在插入的时候都会被**进行自动排序(从小到大)**，唯一的不同点是，Multiset允许插入重复的元素，而set不允许出现重复的元素

```c++
    void test(int length)
    {
        srand(time(NULL));
        set<int> s;
        for (int i = 0; i < length; ++i)
            s.insert(rand());//注意插入的接口是insert()
        cout << "s.size()= " << s.size() << endl;
        cout << "s.max_size()= " << s.max_size() << endl;
        // s.begin() s.end() 存在接口
        // 迭代器存在，因为底层是用二叉树实现的，并且进行了自动排序，所以肯定可以遍历，这个就是学底层的时候该考虑的问题
    }
```

**注意：Multiset 和 set 不能使用 [ ] 来做下标访问!!!!!** 

第一，底层是红黑树，第二，标准库未重载 [ ] 符号!!!



### Multimap 和 map

这种容器就有分别的 **key 和 value** 了，两者不一定相同，每个元素都是有两个元素!!!底层是用**红黑树**实现的!!!!!

插入元素的时候会**按照key进行排序(从小到大)**

<img src="https://img-blog.csdnimg.cn/24d953a507c444d6aeda26bf10c8cfda.png" alt="image-20230415154949602" style="zoom:67%;" />

```c++
    void test(int length)
    {
        srand(time(NULL));
        map<int, int> m;
        for (int i = 0; i < length; ++i)
            m.insert(pair<int, int>(i, rand()));

        cout << "m.size()= " << m.size() << endl;
        cout << "m.max_size()= " << m.max_size() << endl;
        // m.begin() m.end() 存在
    }
```

同set一样，由于底层是用红黑树实现的，所以查询的时候也有迭代器接口，并且效率很高

map不能有重复的，这里的**重复判断是看 key** !!!!!! 两个value相同但是key不同是合法的!!! Multimap 就可以有相同的key!!!

**注意：Multimap不能使用 [ ] 来做下标访问!!!! Map可以，类似于python字典的用法!!!**

原因类似见上



### 哈希表(其实原本名字前缀是hash,现在改名叫unordered)

### unordered_multiset 和 unorder_set

**key和value值相同**，与上面不同的是这个本质是用**哈希表**实现的!

<img src="https://img-blog.csdnimg.cn/667e78800df044ffa0ad8cbca52fd08c.png" alt="image-20230415160759007" style="zoom:67%;" />

```c++
void test(int length)
    {
        srand(time(NULL));
        unordered_set<int> us;
        for (int i = 0; i < length; ++i)
            us.insert(rand());

        cout << "us.size()= " << us.size() << endl;
        cout << "us.max_size()= " << us.max_size() << endl;
        cout << "us.bucket_count()= " << us.bucket_count() << endl;//篮子的大小
        cout << "us.load_factor()= " << us.load_factor() << endl;//装载因子=元素个数/篮子个数
        cout << "us.max_load_factor()= " << us.max_load_factor() << endl;
        cout << "us.max_bucket_count()= " << us.max_bucket_count() << endl;//最大的篮子个数,和最大元素个数相同
    }
```

unordered_set 通过一个**哈希函数**，将对象的值映射到一个数组下标，这个数组下标对应的是unordered_set中的一个“桶”，表示所有可以映射到这个下标的元素的集合，通常用链表表示。

这个vector数组我一般形象的称其为**篮子**。

篮子扩充机制：**当元素个数size()不断增加，达到篮子个数bucket_count()的时候，vector容器进行近似2倍的扩充**，具体略

所以，**篮子个数一定大于元素个数**!!!!



### unordered_multimap 和 unordered_map

与上面的大概相同，不同的是，传入的数据类型是一个**键值对 pair<keyType,valueType>**

其他略，具体实现后面再谈

## 使用分配器 allocator

这部分先了解怎么使用分配器，后面会有专题来讲解分配器的原理

![image-20230415165550803](https://img-blog.csdnimg.cn/228a056a69764061b92a70ecafdf6183.png)

**虽然分配器有申请内存空间并且归还内存空间的接口，但是不建议直接使用分配器，因为这样分配器的负担太重了。而应该去使用容器，让分配器给容器分配空间，这样的效率会高很多!!!**

# 第二讲：分配器 迭代器

##  OOP(面向对象编程)和GP(泛型编程)

OOP将 data 和 methods 结合在一起,GP却将他们两个分开来

采用GP:

1.容器Containers和算法Algorithms可以各自闭门造车，通过迭代器Iterator连接起来即可

2.算法ALgorithms通过迭代器Iterator确定操作范围，并通过Iterator取用Container元素

## 随机访问迭代器

随机访问迭代器 RandomAccessIterator：能够随机访问容器中的任一元素，例如vector单端数组

这样的迭代器可以进行+ -号的运算，例如:

```c++
auto mid=(v.begin()+v.end())/2 //随访访问迭代器才可以这么操作
```

提到这里，就不得不提一下算法库里的全局函数 sort() 了

**sort()函数内部实现的机制调用了随机访问迭代器，进行了+-的运算，所以能调用的前提只能是随机访问迭代器，比如vector,deque**

**所以由于list不满足这个迭代器，所以他不能调用全局sort函数，只能用自己类实现的sort函数，即 l.sort()**

```c++
#include <iostream>
using namespace std;
#include <list>
#include <algorithm>

template <typename Type>
void print(list<Type> &l)
{
    for_each(l.begin(), l.end(), [&](auto val)
             { cout << val << ' '; });
    cout << endl;
}

int main()
{
    list<int> l;
    for (int i = 0; i < 10; ++i)
        l.push_back(9 - i);
    print(l);
    // sort(l.begin(), l.end(), less_equal<int>());//用不了 因为他不是RandomAccessIterator Error!!!
    l.sort(less_equal<int>());
    print(l);

    return 0;
}
```

## GP 泛型编程举一个例子

```c++
#include <iostream>
using namespace std;

namespace fuck
{
    template <typename Type>
    inline const Type &max(const Type &a, const Type &b)
    {
        return a < b ? b : a;
    }

    template <typename Type, class functor>
    inline const Type &max(const Type &a, const Type &b, functor &cmp)
    {
        return cmp(a, b) ? b : a;
    }
}

bool strCmp(const string &s1, const string &s2)
{
    return s1.size() < s2.size();
}

void test()
{
    cout << "max of zoo and hello: " << fuck::max(string("zoo"), string("hello")) << endl;         // zoo
    cout << "max of zoo and hello: " << fuck::max(string("zoo"), string("hello"), strCmp) << endl; // hello
}

int main()
{
    test();
    return 0;
}
```

这个例子很简单，就不多做解释了

## 重载new运算符 operator new

![image-20230416094923459](https://img-blog.csdnimg.cn/12ca7e1551944f158637eb34da0d0176.png)

可以看到，在c++当中，new关键字在调用之后都会走到c语言的malloc函数来分配内存，然后malloc函数分配内存的机制就是上面那个内存块所示

<img src="https://img-blog.csdnimg.cn/29031472997a4fa5bf1dcb0b33d656ec.png" alt="image-20230416095052581" style="zoom: 67%;" />

size所包含的内容才是我想要的存放数据的内容部分，但是malloc会给我们开辟比size更大的空间，这些在另一门课里面会具体谈到。

## 分配器 allocators

### VC6 allocator

VC6里面的分配器具体实现如下图：

![image-20230416095559995](https://img-blog.csdnimg.cn/f5e9964a770c44d3a0ec18eadac41495.png)

分配器当中最重要的就是 **allocate 函数 和 deallocate 函数**

从上图中可以看出，VC提供的分配器在分配的时候，allocate函数在调用的时候会调用 new 关键字，也就是会调用 malloc 函数

在释放内存的时候调用deallocate 函数，也就是调用delete关键字，最终就是调用free 函数

结论：

![image-20230416095953933](https://img-blog.csdnimg.cn/33635f77e4ed4f42af97687ace97077e.png)

对于这个allocator，如果硬要用的话可以这么使用

```c++
    // 建立分配器
    int *p = allocator<int>().allocate(512, (int *)0);
    // 归还
    allocator<int>().deallocate(p, 512);//在归还的时候还需要之前的大小，所以非常不好用!!!
```

### BC++ allocator

BC5 STL中对分配器的设计和VC6一样，没有特殊设计

![image-20230416101021861](https://img-blog.csdnimg.cn/a83f9db6fa7a4c13adaa16e7a0328787.png)

操作略

### GCC2.9 allocator

和前面两个一样，也没有特殊设计，就是简单的调用malloc 和 free分配和释放内存

![image-20230416101451151](https://img-blog.csdnimg.cn/d432fd9d76ff4ba8bc82f020e6e49fcb.png)

右边这一段注释的意思就是虽然这里实现了符合标准的allocator，但是他自己的容器从来不去用这些分配器，这些分配器都有一个致命的缺点，就是因为本质是在调用mallloc和free函数，根据前面的内存分配机制很容易看出会产生很多的其他空间，从而被浪费，所以开销相对比较大，一般不用

### GCC2.9 自己使用的分配器：alloc(不是allocator!!!)

这个分配器想必比allocator要好用的多

![image-20230416102010067](https://img-blog.csdnimg.cn/0075112b867240cea2ca1103f64f9f45.png)

其具体实现如下：

![image-20230416102442772](https://img-blog.csdnimg.cn/1168aed9f8d54f0885c0cf99b3f66a71.png)

**怎么实现的呢？设计了16个链表，每个链表管理特定大小的区块，#0管理8个字节，#1管理16，以此类推，最后#15管理168个字节。所有使用这个分配器的元素的大小会被调整到8的倍数，比如50的大小会被调整到56。如果该链表下面没有挂内存块，那么会向操作系统用malloc函数申请一大块内存块，然后做切割，之后分出一块给该容器，用单项链表存储。这样的好处是避免了cookie的额外开销，减少了内存浪费。**

这个东西的缺陷到内存管理里面去讲。

### GCC4.9 使用的分配器：allocator(不是alloc!!!)

![image-20230416105043344](https://img-blog.csdnimg.cn/27646ca0eeaa47998fec09c963c69b3c.png)

发现 allocator 是继承的父类 new_allocator

![image-20230416105348361](https://img-blog.csdnimg.cn/dcd2073d25404097bc3a5a7319de4b1a.png)

**发现GCC4.9使用的分配器和之前的分配器没什么区别，没有特殊设计，就是调用的malloc函数和free函数，不知道为什么(这个团队没解释)**

**但是但是！GCC4.9里面的__pool_alloc就是GCC2.9里面的alloc,非常好用的那个**

![image-20230416110401962](https://img-blog.csdnimg.cn/8e03c20dc47a4a99907ac34eeec16164.png)

## 容器之间的关系

容器与容器之间的关系基本上都是复合的关系，比如set/multiset和map/multimap底层都是由rbtree红黑树实现的等等，具体见下图

![image-20230416154815162](https://img-blog.csdnimg.cn/7c406272023143348189d5ce984d639e.png)

## 区别size()和sizeof()

以容器list为例，list.size()和sizeof(list)是没有直接的大小联系的（单项链表forward_list不存在size()方法）

```c++
//在vscode+linux g++编译器中
    list<char> l;
    for (int i = 0; i < 26; ++i)
        l.push_back('a' + i);

    cout << l.size() << endl;  // 26
    cout << sizeof(l) << endl; // 24
```

l.size()指的是容器中存放的元素个数；sizeof(l)指的是需要形成list这个容器需要这个类所占的内存有多大，list类里面不仅存放了链表的指针，还有其他的成员属性来配合控制这个容器的运行.所以sizeof(l)和这个元素的个数一般没有关系。

## 深入探索 list

GCC2.9是这样写的

![image-20230416160403390](https://img-blog.csdnimg.cn/efbc05fb82dd4bc9bf242df11f1e6110.png)

可以看出，list里面非常重要的一点设计就是**委托**设计，**即list本身的类并不是实际的双向链表，用户所能操作的这个类其实可以看作双向链表的管理类，里面有成员函数，迭代器，还有一根指向双向链表的指针，实际的双向链表结构就如上面所示,__list_node，这个才是真正的存储结构**，这也是为什么sizeof()和size()是不一样的，因为设计者很好的把二者分开了，使得用户和写代码的人都能很好的管理自己的部分。

由于list的存储是不连续的，所以相应的他的迭代器也需要是智能指针，需要重载++和--运算符，(注意list的迭代器不是随机访问迭代器，所以不能使用+ -号运算符，也不能使用算法库的函数sort()，而需要使用自带的函数sort() )那么就应该是一个类了。**进而推得所有的容器(除了vector和array)的迭代器，最好都写成一个类来实现。**

### list的迭代器

这个迭代器最重要的就是重载 ++ 运算符，也就是前置++和后置++

![image-20230416163304200](https://img-blog.csdnimg.cn/e307ff6f7cc442b2b249814599bede17.png)

前置++和后置++的区别就是后置++的参数列表里面会有一个占位符int来表示他是后置++

```c++
//前置++
self& operator++(){
    node=(link_type)((*node).next);
    return *this;
}
//这里的self是指迭代器这个类，是个别名。这个实现还是比较容器理解的
//注意返回的是迭代器新的位置所以可以返回引用类型
```

```c++
//拷贝构造
__list_iterator(const iterator& x):node(x.node){}
```

```c++
//重载*
reference operator*()const{return (*node).data;}
```

```c++
//后置++
self operator++(int){
	self tmp=*this;
    //这一步仔细看看，可能会调用拷贝构造(=)，可能也会调用*重载，但是*重载明显不符合要求
    //再加上 = 在前面，所以调用的是拷贝构造，*this已经被看作拷贝构造的参数，拷贝出来了一个新的原位置迭代器!!!!
	++*this;
    //前置++
	return tmp;
}
//注意由于需要返回原位置的迭代器，而现在的迭代器已经改变了，所以最好新创建一个，return by value
```

### 关于为什么后置++不能返回引用，比较有说服力的还有如下的原因：

```c++
int i=2,j=2;
cout<< ++++i << j++++ << endl;
```

**我们尝试将i和j分别进行前置和后置++分别加两次，c++的编译器允许前置++连续加，但是不允许后置++连续加，我们知道想要连续加的条件就是要返回引用继续修改原本的值，所以既然不允许连续后置++，那么就return by value，直接创建一个新对象**

然后类在重载这两个运算符的时候也会向编译器自带的规则看起，也不允许后置++连续加，所以就只能return by value

### 关于 * 和 & 运算符的重载

```c++
#include <iostream>
using namespace std;
#include <list>

class fuck
{
public:
    void print() { cout << "hello" << endl; }
    fuck(int data = 0) : _data(data) {}//构造函数，可以将int类型转化为类对象

    int getData() { return this->_data; }

private:
    int _data;
};

int main()
{
    list<fuck> l{1, 2, 3, 6, 5, 8, 8, 9};
    auto iter = l.begin();//取得首个元素迭代器
    //*iter取得的是 fuck 对象,iter->取得的是 fuck对象指针
    //对于简单的类型 iter->没什么作用，比如int，这时候*iter就代表了value，但是对于类对象那就不一样了
    cout << (*iter).getData() << endl;
    iter->print();

    return 0;
}
```

*和->的具体实现,Type是类的类型

```c++
typedef Type& reference;
typedef Type* pointer;
//* 返回的是类对象
reference operator*(){
    return *(this->node);//node是迭代器当中存放的链表指针对象
}
//-> 返回的是类对象指针
pointer operator->(){
    return &(operator*());
}
```

### G4.9 和 G2.9的区别

具体区别就如下图所示：

![image-20230416171855901](https://img-blog.csdnimg.cn/fc471ec11cb144898cbc8ef6c8edfdac.png)

在4.9版本当中

![image-20230416174305071](https://img-blog.csdnimg.cn/6b8a40985fa04207a275f3bf65e8520e.png)

**刻意在list尾端加上一段空白的区域来复合STL迭代器前闭后开的特征!!!但是相应的这个设计的复杂度又大大增加了。**

## 迭代器的设计原则

Iterator需要遵循的原则：在调用算法的时候，iterator作为中间桥梁连接容器和算法，所以算法需要知道Iterator的很多东西

**算法需要知道迭代器的必要信息，进而决定采取最优化的动作**

![](https://img-blog.csdnimg.cn/f145ebf353074e06bf746e4b4110bcf1.png)

在C++标准库当中设计出五种标准类型:

```c++
iterator_category;
//迭代器的分类：只读，只写，允许写入型算法在迭代器区间上进行读写操作(Forward Iterator)，可双向移动，Random Access Iterator
difference_type;//用来表示迭代器之间的距离，也可以用来表示一个容器的最大容量
value_type;//迭代器所指对象的类型

reference;
pointer;//最后两个基本没用到
```

这五种类型被称作 **associated type 相关类型**；迭代器本身必须定义出来，以便回答算法

![image-20230419170815213](https://img-blog.csdnimg.cn/99b506a63aec444db5fab002bfa5f7e9.png)

比如我自己写一下链表list的五个相关类型

```c++
//GCC4.9版本
template <class _Type>
struct List_Iterator
{
    typedef std::bidirectional_iterator_tag _iterator_category;
    typedef ptrdiff_t _difference_type;
    typedef _Type _value_type;
    typedef _Type& _reference;
    typedef _Type* _pointer;
};
```

**引出问题：算法调用的时候传进去的可能不是个迭代器，可能是个指针，这个时候该怎么办呢？**

当然，指针是个**退化**的迭代器!!!

## Traits 萃取机

![image-20230419190233258](https://img-blog.csdnimg.cn/3be2212e189a43b589a2b1335df9e045.png)

**Iterator Traits用于区分是 class Iterators (也就是一般的迭代器)还是 non-class Iterators(即 native pointer)；两种情况对应不同的的处理!!**

在算法和迭代器之间加一层中间层Iterator traits来进行判断，好针对性的进行设计!!!

具体怎么做呢？

这时候算法里面就不能直接问迭代器的五个类型了，因为 native pointer 里面没有这五个参数,所以需要间接通过Traits去问!!!

下面的例子先回答了一个问题 value_type

```c++
template <typename I,...>
void algorithm(...){
    typename iterator_traits<I>::value_type v1;//通过traits去问
}

//如果是class Iterator在这里
template <class I>
struct iterator_traits{
    typedef typename I::value_type value_type;
}

//两个模板偏特化 pointer to T
template <class T>
struct iterator_traits<T*>{
    typedef T value_type;
}

//pointer to const T
template <class T>
struct iterator_traits<const T*>{
    typedef T value_type; //注意是T而不是const T
    //为什么是 T 而不是 const T？因为 value_type主要目的是去声明变量，const T没办法声明变量!!!
}
```

下面把指针的全回答完毕

```c++
//pointer to T
template <class T>
struct iterator_traits<T*>{
    typedef random_access_iterator_tag iterator_category;
    typedef T value_type;
    typedef T* pointer;
    typedef T& reference;
    typedef ptrdiff_t difference_type;
}
//pointer to const T
template <class T>
struct iterator_traits<const T*>{
    typedef random_access_iterator_tag iterator_category;
    typedef T value_type;
    typedef const T* pointer;
    typedef const T& reference;
    typedef ptrdiff_t difference_type;
}
```

# 第三讲：容器

## 深入探索vector

其实自己都可以封装一个vector，当然所有的功能是不现实的，但是基本的功能还是可以

### GCC2.9的设计

直观感受就是简洁明了

![image-20230419192921703](https://img-blog.csdnimg.cn/a5dac4bc8cfa4cae8a31e65329bacb1a.png)

这里面有三根泛型指针，start，finish和end_of_storage

**下面就是比较重要的push_back()查数据，引出后面的二倍扩展空间!!!**

![image-20230419195537174](https://img-blog.csdnimg.cn/76e442f274f54bc8b61b4ac4e5153cd1.png)

**else这里，调用insert_aux之后为什么还要进行一次判断呢？**

**这是因为由于insert_aux是一个辅助函数，那么在实际操作过程中可能会被其他类函数调用，比如insert，在这些函数的实现逻辑当中是需要进行判断的。**

![image-20230419195610102](https://img-blog.csdnimg.cn/63ef66f9e93f47a589320906ec8573bb.png)

**这段源码的大致意思就是：capacity不够了就在内存中找另一块2倍大小的内存用于存放新的vector，把原来的元素拷贝过去然后把原来的vector杀掉，各种值迁移到新内存这边去!!!**

**至于拷贝安插点后的原内容是因为这里可能会被insert函数给调用，这个部分是insert函数的逻辑!!!**

**Vector容器的迭代器**

既然vector是一个连续空间，那么iterator就不必要设置成为class了，只需要设置为pointer就可以

```c++
//所以如上所示，vector的迭代器是一根指针
typedef value_type* iterator; // T*
```

### GCC4.9的设计

复杂，依托答辩

![image-20230419201320469](https://img-blog.csdnimg.cn/64b96409cca04e5f843e01eb979b6fec.png)

## 深入探索 deque 和 queue , stack

### deque

deque 双端队列的实现结构：

![image-20230420164335846](https://img-blog.csdnimg.cn/8e31dfc641ad40a294bf275846da5439.png)

**具体实现：将deque的存储划分为若干个等大的区域，每个区域的首元素用一个指针存放在一个vector容器中(就是图中的map数组)，当缓冲区buffer的左端或者右端不够的时候，就新开一个缓冲区放在左边和右边，存入元素，并且把该buffer的首指针存入map数组的左边或者右边。因此deque的迭代器的就分为：**

**first 该缓冲区的首地址；last 该缓冲区的末尾(首闭尾开)；cur 元素的位置；node 存入map数组的指针!!!**

下面看一下deque的具体源代码设计：

**GCC2.9:**

![image-20230420170120084](https://img-blog.csdnimg.cn/da7418b22f364b1c8403360c44e1c4a5.png)

其中第三个参数 Bufsiz 是可以人为指定缓冲区的大小

![image-20230420170739434](https://img-blog.csdnimg.cn/49e58679a3574a6e828b4ddbd099fa63.png)

从这里可以看出，上面调用了一个函数，如果 BufSiz 不为0，那么就设置大小为人为指定；如果为0，则表示设置为预设的值，需要查看要存放的类型的大小，大于512就指定一个缓冲区只放这一个元素，个数设置为1；小于的话就计算出个数，计算出个数之后就可以知道缓冲区的大小了

![image-20230420170150250](https://img-blog.csdnimg.cn/28de25482e864b7391229faf7f363af2.png)

这个迭代器里面也包含了五个必要类型，写的非常严谨，也有了四个需要的参数!!!

**Insert函数:**

![image-20230420172205138](https://img-blog.csdnimg.cn/acbd0cbd5a5346468865c270b48b7b32.png)

如果是在头部和尾部插入，那么和push_front()和push_back()没有区别

如果在中间插入就调用赋值函数 insert_aux()

![image-20230420172617688](https://img-blog.csdnimg.cn/f3e4504739814ecf864f2bbc370e436f.png)

由于在中间插入必然会导致元素的拷贝过程，为了减少开销，提高效率，我们需要判断元素在deque靠近start和finish哪一端的位置，这样可以更好的去选择操作的方向

**deque如何模拟连续空间操作？(操作符重载)**

![image-20230420173341877](https://img-blog.csdnimg.cn/a9a2d44653b9436fab670d37924a5b15.png)

**deque 的 - 号操作符重载**

由于 deque 存储的缓冲区buffer机制，我们必须判断两个迭代器之间有多少个缓冲区buffer，然后再根据计算公式来进行计算得出两个迭代器之间元素的个数

具体就是这样!

**根据两个迭代器的node指针找到map数组里面两个指针距离的位置就可以知道两个中间差了多少个缓冲区buffer了，再加上本缓冲区内的距离就是两个迭代器之间的元素个数!!!**

![image-20230420173832550](https://img-blog.csdnimg.cn/32fd40fd7b654e0bb5991c7f920130f4.png)

**++ 和 -- 操作符重载**

注意需要判断迭代器移动过程中是否超越了本缓冲区的界限移入另一个缓冲区!!!

一个比较好的编码习惯就是后++调用前++；后--调用前--

![image-20230420174307662](https://img-blog.csdnimg.cn/300b4593c357466699763d1856c13678.png)

**+= + 号操作符重载**

在 += 运算符重载中，需要注意判断迭代器位置移动之后有没有超越边界，如果超越了边界，需要进行相应的边界修改

![image-20230420193008988](https://img-blog.csdnimg.cn/37fe8dc4daba4488b90cc1da471422bd.png)

+= 如果没有正确的缓冲区需要切换到正确的缓冲区；如果是正确的缓冲区那就很简单了

**-= - 号运算符重载**

用的是+=和+号的重载

![image-20230420193316669](https://img-blog.csdnimg.cn/e4b05f6e0809486992d8d8522efb7836.png)

**GCC 4.9:** 依托答辩

![image-20230420193754702](https://img-blog.csdnimg.cn/ae7a341af3844108a306b17cd904618d.png)

### queue

**内部存了一个 deque 容器，二者形成了复合 composition 关系**

queue内部的函数，deque能完全满足它，所以调用 deque 的成员函数就可以了!!!

![image-20230421103130501](https://img-blog.csdnimg.cn/4fef1798f99444538b0aadd6d60d19b5.png)

**queue和stack，关于其iterator和底层容器**

**stack和queue不允许遍历，也不提供iterator!!!!**

因为他们的模式是先进后出和先进先出，这样的模式不允许能访问到任意位置的元素

![image-20230421104600566](https://img-blog.csdnimg.cn/9e3ea9bf8e9f4caba6554b433a4a6ff6.png)

**关于stack和queue的内部支撑容器，上面讲的是deque，其实也可以用list**

默认提供的是deque，这个效率比较快一点

![image-20230421104609426](https://img-blog.csdnimg.cn/71e30175991649f6aa61a2866c6e3a8f.png)

**stack可以用vector做底部支撑；queue不可以用vector!!!**

因为vector没有 pop_front() 函数!!!

![image-20230421104723249](https://img-blog.csdnimg.cn/f847695429c449719b6680c9fa11af86.png)

**关于其他的底部容器支撑，stack和queue都不可以选用set或者map做底部容器支撑，因为他们两个也没有相应的函数提供!!!**

![image-20230421105352734](https://img-blog.csdnimg.cn/d32ade5e9060471badfd66ded19e8d71.png)

关于这些底部容器支撑，如果你没有调用它不存在的函数，那其实调用还是可以的，但是总体来看是不行的!!!

## 自己手写了一个简单的二叉树(创建二叉树函数不会)

```c++
//TreeNode.h
#ifndef __TREENODE__
#define __TREENODE__

enum Left_Right
{
    Left,
    Right
};

// 定义结点类
#include <iostream>
template <class Type>
struct TreeNode
{
    typedef Type __ValueType;
    typedef TreeNode<__ValueType> __NodeType;
    typedef __NodeType *__pointer;

    __ValueType val;
    __pointer left;
    __pointer right;

    void __init__();
    void insert(__ValueType val, bool is_left = Left); // 1为左 0为右 默认为做左

    void PreOrder();
    void InOrder();
    void PostOrder();
    void visit();
};

// 虽然不给节点写构造函数但是写一个初始化没问题的
template <class Type>
inline void TreeNode<Type>::__init__()
{
    this->left = nullptr;
    this->right = nullptr;
}

// 插入子树
template <class Type>
inline void TreeNode<Type>::insert(__ValueType val, bool is_left)
{
    if (is_left == Left)
    {
        if (this->left)
        {
            cout << "leftnode has already be used." << endl;
            return;
        }
        __pointer newNode = new TreeNode<__ValueType>;
        newNode->__init__();
        newNode->val = val;
        this->left = newNode;
    }
    else
    {
        if (this->right)
        {
            cout << "rightnode has already be used." << endl;
            return;
        }
        __pointer newNode = new TreeNode<__ValueType>;
        newNode->__init__();
        newNode->val = val;
        this->right = newNode;
    }
}

// visit
template <class Type>
inline void TreeNode<Type>::visit()
{
    cout << this->val << endl;
}

// 遍历
template <class Type>
inline void TreeNode<Type>::PreOrder()
{
    if (!this)
        return;
    visit();
    left->PreOrder();
    right->PreOrder();
}

template <class Type>
inline void TreeNode<Type>::InOrder()
{
    if (!this)
        return;
    left->InOrder();
    visit();
    right->InOrder();
}

template <class Type>
inline void TreeNode<Type>::PostOrder()
{
    if (!this)
        return;
    left->PostOrder();
    right->PostOrder();
    visit();
}

#endif
```

```c++
//BinaryTree.h
#ifndef __BINARTTREE__
#define __BINARTTREE__
#include "TreeNode.h"

enum Order
{
    pre,
    in,
    post
};

// 写一个全局函数来删除二叉树
template <typename Type>
inline void deleteNodes(TreeNode<Type> *node)
{
    if (node->left)
        deleteNodes(node->left);
    if (node->right)
        deleteNodes(node->right);
    delete node;
}

// 定义整颗二叉树类
template <class Type>
class BinaryTree
{
    typedef Type __ValueType;
    typedef TreeNode<__ValueType> __NodeType;
    typedef __NodeType &__reference;
    typedef __NodeType *__pointer;

public:
    // BinaryTree();
    explicit BinaryTree(__ValueType val = NULL); // 不给默认值就是NULL
    ~BinaryTree() { deleteTree(); }
    void deleteTree();
    void printTree(Order ord);
    __reference getroot() const { return *root; }

private:
    __pointer root;
};

// 构造函数
template <class Type>
inline BinaryTree<Type>::BinaryTree(__ValueType val)
{
    root = new TreeNode<Type>;
    root->val = val;
    root->left = nullptr;
    root->right = nullptr;
}

// 整棵树的析构函数
template <class Type>
inline void BinaryTree<Type>::deleteTree()
{
    deleteNodes(root);
}

// 前序遍历
template <class Type>
inline void BinaryTree<Type>::printTree(Order ord)
{
    switch (ord)
    {
    case pre:
        root->PreOrder();
        break;
    case in:
        root->InOrder();
        break;
    case post:
        root->PostOrder();
        break;
    }
}

#endif
```

```c++
//main.cpp
#include <iostream>
using namespace std;
#include "BinaryTree.h"

/*
       1
   3         2
4    6    8
    7        0
*/
namespace test
{
    BinaryTree<int> sample()
    {
        BinaryTree<int> tree(1);
        tree.getroot().insert(3, Left);
        // left
        auto leftNode = tree.getroot().left;
        leftNode->insert(4, Left);
        leftNode->insert(6, Right);
        auto leftNode2 = leftNode->right;
        leftNode2->insert(7, Left);
        // right
        tree.getroot().insert(2, Right);
        auto rightNode = tree.getroot().right;
        rightNode->insert(8, Left);
        auto rightNode2 = rightNode->left;
        rightNode2->insert(0, Right);

        return tree;
    }
}

int main()
{
    auto tree = test::sample();

    tree.printTree(pre); // 1 3 4 6 7 2 8 0
    cout << endl;
    tree.printTree(in); // 4 3 7 6 1 8 0 2
    cout << endl;
    tree.printTree(post); // 4 7 6 3 0 8 2 1

    return 0;
}
```

## rb_Tree 红黑树

红黑树是一种高度平衡的二叉搜寻树；由于它保持尽量的平衡，非常有利于search和insert的操作，并且在改变了元素的操作之后会继续保持树状态的平衡

### 红黑树 rb_Tree 与二叉平衡树 AVL 的对比：

![image-20230421175541816](https://img-blog.csdnimg.cn/01d129349b5d4632a304b96aec5aa704.png)

**为什么要有红黑树？**

大多数二叉排序树 BST 的操作（查找、最大值、最小值、插入、删除等等）都是 O(h)O(h)O(h) 的时间复杂度，h 为树的高度。但是对于斜树而言（BST极端情况下出现），BST的这些操作的时间复杂度将达到  O(n) 。为了保证BST的所有操作的时间复杂度的上限为  O(logn)，就要想办法把一颗[BST树](https://www.zhihu.com/search?q=BST树&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra={"sourceType"%3A"answer"%2C"sourceId"%3A1246106121})的高度一直维持在logn，而红黑树就做到了这一点，红黑树的高度始终都维持在logn，n 为树中的顶点数目。

rb_Tree和AVL相比，虽然AVL更加平衡，但是条件更加苛刻，**红黑树追求的是大致平衡。** AVL 树比红黑树更加平衡，但AVL树在插入和删除的时候也会存在大量的旋转操作。**所以涉及到频繁的插入和删除操作，切记放弃AVL树，选择性能更好的红黑树；当然，如果你的应用中涉及的插入和删除操作并不频繁，而是查找操作相对更频繁，那么就优先选择 AVL 树进行实现**

![](https://img-blog.csdnimg.cn/9be31e905da34e9ebfef00fc021cdc3b.png)

红黑树**提供遍历操作以及迭代器iterator**，但是这个迭代器是**只读迭代器**，因为**不能修改节点上元素的值**，如果修改了元素的值，那么会导致大小关系发生变化，整个红黑树的平衡性就发生变化了

图中第三段，按理来说红黑树的元素是不能通过迭代器修改元素值的，但是这个红黑树后面是用于set和map容器的，set的key和value相等不能修改；但是map的key和value没有必然联系，排序和查找都是基于key来进行的，value可以任意修改，所以可以通过迭代器修改value，这么做做是正确的

红黑树的设计当中存在两种设计 **insert_unique() 和 insert_equal()** ，表示key可以重复或者不重复，这样就可以引申出 set和 multiset，mal和 multimap

### 标准库对红黑树的实现:

![image-20230421182526116](https://img-blog.csdnimg.cn/a19515ed9e4743569c89aef058aeec85.png)

**这里标准库里面的value不是指我们理解的value值，这里的value是key和data合起来叫做value，也就是一整个节点的类型；第三个参数是说我们怎么样从这个节点value当中把重要的key拿出来!!!第四个参数是说如何根据key来进行比较，因为后续要进行排序操作!!!**

在rb_tree类当中，它的设计和我的设计差不多，都是把树和节点分开的来设计，所以在树rb_tree当中只用了三个参数来向外表现

```c++
size_type node_count;//节点的数量
link_type header;//头节点(类型是指针)
Compare key_compare;//比较key的函数指针或者仿函数
```

**在红黑树的结构里有一个 header 节点，他的元素值为空，跟list的设计一样，前闭后开的区间!!!**

这样的设计会使后面的实现方便很多

![image-20230421182650170](https://img-blog.csdnimg.cn/2f7f55edc44e4c098d60bc10f7cc39d7.png)

虽然红黑树不推荐直接使用，因为更好的做法是使用上层容器；但是可以简单的使用一下来测试我们对其的理解

```c++
rb_tree<int,int,identity<int>,less<int>,alloc>;
//key和value类型相同，说明key和data是一个东西(否则返回的value不可 能是int类型而应该是个类)，这样的话从value中取出key就可以使用写好的identity函数对象，即你传什么给我我就给你返回什么
```

使用红黑树的测试程序:(新版本的名称有些变化)

```c++
#include <iostream>
using namespace std;
#include <bits/stl_tree.h>

int main()
{
    _Rb_tree<int, int, _Identity<int>, less<int>, allocator<int>> rbtree;
    cout << rbtree.size() << endl;  // 0
    cout << sizeof(rbtree) << endl; // 48 跟插不插元素没关系，因为里面存的是节点指针d
    cout << rbtree.empty() << endl; // 1

    rbtree._M_insert_unique(3);
    rbtree._M_insert_unique(8);
    rbtree._M_insert_unique(5);
    rbtree._M_insert_unique(9);
    rbtree._M_insert_unique(13);
    rbtree._M_insert_unique(3);      // unique 所以3插不进去
    cout << rbtree.size() << endl;   // 5
    cout << rbtree.empty() << endl;  // 0
    cout << rbtree.count(3) << endl; // 1

    rbtree._M_insert_equal(3); // equal 所以3能插进去
    rbtree._M_insert_equal(3);
    cout << rbtree.size() << endl;   // 7
    cout << rbtree.empty() << endl;  // 0
    cout << rbtree.count(3) << endl; // 3

    return 0;
}
```

## 基于红黑树的set和map

### set/multiset

由于set/multiset的key和value相同，所以没有办法通过迭代器修改元素的值，也就是修改key，error

set插入元素使用 insert_unique()；multiset可以重复，使用 insert_equal()

![image-20230421192116968](https://img-blog.csdnimg.cn/aec757f7efba46db9a9854b68208bf05.png)

注意不能修改迭代器的值，const_iterator，以下是示例代码：

```c++
#include <iostream>
using namespace std;
#include <set>
#include <vector>

int main()
{
    vector<int> v{1, 3, 5, 4, 6, 8, 8, 9};
    for (int &val : v)
        ++val;
    for (int &val : v)
        cout << val << ' ';
    cout << endl;

    //会自动排序
    set<int, less<int>> s{3, 1, 5, 4, 6, 8, 8, 9};
    // for (int &val : s) // 这里就会报错,因为这个的迭代器是不可以更改值的
    //     ++val;
    for (int val : s)
        cout << val << ' ';
    cout << endl;

    return 0;
}
```

### map/multimap

**map没有办法通过迭代器修改key的值，但是可以用过迭代器修改value的值!!!!!**

map插入元素使用 insert_unique()；multimap 可以重复，使用 insert_equal()

![image-20230421194843419](https://img-blog.csdnimg.cn/1f8d202f1c664900bdaec10fd093f0b4.png)

**key_type和data_type被包装成为一个pair<const Key,T>；注意这里const修饰代表key无法修改，然后value_type是真正的存放类型，然后select1st代表拿取pair里面的第一个元素!!!!**

使用红黑树测试map：

```c++
#include <iostream>
using namespace std;
#include <bits/stl_tree.h>

// 源代码这么写的，我没看懂
template <class T>
struct SelectFirst
{
    template <class Pair>
    typename Pair::first_type &
    operator()(Pair &x) const
    {
        return x.first;
    }

    // typename T::first_type &
    // operator()(T &x) const
    // {
    //     return x.first;
    // }
};

int main()
{
    typedef int Key_Type;
    typedef pair<const int, char> Value_Type;

    // _Rb_tree<Key_Type, Value_Type, _Select1st<Value_Type>, less<int>> rbtree;
    _Rb_tree<Key_Type, Value_Type, SelectFirst<Value_Type>, less<int>> rbtree; // error
    // select1st怎么写不知道
    cout << rbtree.size() << endl;  // 0
    cout << sizeof(rbtree) << endl; // 48 跟插不插元素没关系，因为里面存的是节点指针d
    cout << rbtree.empty() << endl; // 1

    rbtree._M_insert_unique(make_pair(3, 'a'));
    rbtree._M_insert_unique(make_pair(8, 'b'));
    rbtree._M_insert_unique(make_pair(5, 'c'));
    rbtree._M_insert_unique(make_pair(9, 'd'));
    rbtree._M_insert_unique(make_pair(13, 'e'));
    rbtree._M_insert_unique(make_pair(3, 'f')); // unique 所以3插不进去
    cout << rbtree.size() << endl;              // 5
    cout << rbtree.empty() << endl;             // 0
    cout << rbtree.count(3) << endl;            // 1

    rbtree._M_insert_equal(make_pair(3, 'a')); // equal 所以3能插进去
    rbtree._M_insert_equal(make_pair(3, 'a'));
    cout << rbtree.size() << endl;   // 7
    cout << rbtree.empty() << endl;  // 0
    cout << rbtree.count(3) << endl; // 3

    return 0;
}
```

其他都没什么，其中第三个模板参数SelectFirst<>(我自己写的)不是很理解为什么这么写

```c++
template <class T>//不明白这里为什么要用两次模板并且第一次的模板参数没啥用
struct SelectFirst
{
    template <class Pair>
    typename Pair::first_type &
    operator()(Pair &x) const
    {
        return x.first;
    }
};
```

使用map的示例代码:

```c++
#include <iostream>
using namespace std;
#include <map>

int main()
{
    // 第一个参数是key(不可修改,所以进去后红黑树会自动转为const类型),第二个参数是data
    //元素会按照key自动排序!!!
    map<int, char, less<int>> m{make_pair(9, 'a'),
                                make_pair(5, 'b'),
                                make_pair(6, 'c'),
                                make_pair(4, 'd'),
                                make_pair(8, 'c'),
                                make_pair(9, 'b'),
                                make_pair(6, 'd'),
                                make_pair(1, 'a')};
    m[0] = 'f';
    for (auto &val : m)
    {
        //key不可修改，但是data可以修改
        cout << val.first << ' ' << m[val.first] << endl;//类似于py的字典
        val.second++;
        cout << val.first << ' ' << val.second << endl;
    }

    return 0;
}
```

## map独特的 operator [ ]!!!

**作用：根据key传回data。注意只有map有，因为key不为data并且key是独一无二的!!!**

**如果key不存在的话，就会创建这个key并且data使用默认值!!!**(和py的字典差不多)

![image-20230422140640649](https://img-blog.csdnimg.cn/290235d1e8134f4d942fb306a144e8fd.png)

使用二分查找在有序的key当中查找目标key，如果找不到的话就进行insert操作创建一个新的key！！！

## hashtable 散列表

哈希表的设计

![image-20230422143136762](https://img-blog.csdnimg.cn/fa14c611c6d542f5bd79f31cb542edca.png)

**在有限的空间之下根据哈希函数将元素(分为key和data)的key映射成为hashcode放到对应的位置下面，key下面用一个链表将key和data串起来!!!!**

**由于bucket数组存的是链表指针，这个链表如果串的元素太多了之后那么搜索效率会大大降低，这个状态就是非安全状态。程序员的经验告诉我们当所有的链表下面串的元素个数大于buckets数组的大小的时候就比较危险了。**

**这个时候需要打散hashtable，增大buckets数组的size，一般是两倍左右，并且数组的size最好是质数，并且将元素按照新的hash规则重新插入链表中!!!!**

总结就是：不能让hashtable下面串的链表太长，太长了需要增加buckets的size来打散哈希表重新回到安全状态。

GCC下面的buckets数组的size是这么确定的：**大致都是2倍附近的质数**

![image-20230422144338234](https://img-blog.csdnimg.cn/e4d612fbe557453782c06610c83f2305.png)

来看看hashtable的实现：

![image-20230422145128498](https://img-blog.csdnimg.cn/8f66ab31379f4cc1b2139950f65b31e0.png)

Value代表key和data集合，key就是键值，HashFcn代表哈希函数，就是如何把key映射为编号hashcode，ExtractKey代表如何从value里面取出key；EqualKey代表如何判断两个key相同!!!

至于是单向链表还是双向链表，这个就看不同的版本了。

**参数模板里面最难的一点就是决定hashtable的hash函数，怎么样将hash的key值映射为hashcode!!!**

参考系统提供的hash模板函数

**注意：hash函数(一般是个仿函数)返回的值应该是一个编号，也就是 size_t**

![image-20230422154019414](https://img-blog.csdnimg.cn/8a9f4d5dcc974f6fbd60da37a21fddc9.png)

定义了hash函数，然后什么也不做，后面进行一些特化的处理!!!

![image-20230422154054412](https://img-blog.csdnimg.cn/35ac538dde19487586637003dd87480c.png)

注意这里的hash函数设计，我们在将key转化为hashcode的过程中，可以任意设计hash函数使得转化成为的hashcode**尽量不重复，尽量够乱!!!**

**在算出hashcode之后还要放入篮子，这个时候就很简单了，就把hashcode求篮子的size的余数就可以知道放在哪里了!!!!**(现在基本都是这么做的)

![image-20230422155807393](https://img-blog.csdnimg.cn/cbe7ab1e20ad4b1fa001d60f1861983d.png)

使用hashtable的例子：

```c++
#include <iostream>
using namespace std;
#include <hashtable.h>
#include <cstring>

struct eqstr
{
    bool operator()(const char *str1, const char *str2) const
    {
        return strcmp(str1, str2) == 0;
    }
};

// 如果是自己设计就可以这么设计
inline size_t _hash_string(const char *s)
{
    size_t ret = 0;
    for (; *s != '\n'; ++s)
        ret = 10 * ret + *s;
    return ret;
}
struct fuck
{
    size_t operator()(const char *s) const { return _hash_string(s); }
};


int main()
{
    __gnu_cxx::hashtable<const char *, const char *,
                         hash<const char *>, // 标准库没有提供 hash<std::string>!!!!
                         _Identity<const char *>,
                         eqstr> 
                 // 不能直接放入strcmp，因为我们需要判断是否相同，返回的是true和false;而strcmp返回的是1 0 -1，接口不太一致
        ht(50, hash<const char *>(), eqstr());// 这个东西没有默认空的构造函数，需要提供一些东西
    // 从这里可以看出直接使用hashtable非常难用

    ht.insert_unique("kiwi");
    ht.insert_unique("plum");
    ht.insert_unique("apple");
    for_each(ht.begin(), ht.end(), [&](auto data)
             { cout << data << endl; });

    // cout << hash<int>()(32) << endl;
    return 0;
}
```

# 第四讲：算法

## 算法概述

![image-20230422162235208](https://img-blog.csdnimg.cn/1ddc3f47f97744a2b887c22491f9dc0d.png)

算法没有办法直接面对容器，他需要借助中间商迭代器才可以，换句话说，算法不关系容器是怎么样的，只关心容器提供给我的迭代器是怎么样的，而迭代器的设计的符号重载是普适的，这样就可以适用于大多数容器了。

## 迭代器的五种分类：注意这五种都是类!!!

![image-20230422162614061](https://img-blog.csdnimg.cn/8cdfadd3dde640149ede096e1ad7b402.png)

random_access_iterator_tag 随机访问迭代器：可以跳着访问，任意一个都可以访问(重载了+ - += -= ++ -- 运算符)

bidirectional_iterator_tag 双向访问迭代器：可以往前走或者往后走，但是一次只能走一格(重载了 ++ -- 运算符)

farward_iterator_tag 单向访问迭代器：只能向一个方向走，inin一次只能走一格

打印一下各种容器的iterator_category

![image-20230422163446874](https://img-blog.csdnimg.cn/446586ab59cf4d4896de30f25670300e.png)

```c++
#include <iostream>
using namespace std;
#include <array>
#include <vector>
#include <map>
#include <list>
#include <forward_list>
#include <deque>
#include <set>
#include <unordered_set>
#include <unordered_map>
#include <bits/stream_iterator.h>

// 可以只指定值不给参数
void __display_category(random_access_iterator_tag)
{
    cout << "random_access_iterator" << endl;
}
void __display_category(bidirectional_iterator_tag)
{
    cout << "bidirectional_iterator" << endl;
}
void __display_category(forward_iterator_tag)
{
    cout << "forward_iterator" << endl;
}
void __display_category(output_iterator_tag)
{
    cout << "output_iterator" << endl;
}
void __display_category(input_iterator_tag)
{
    cout << "input_iterator" << endl;
}

template <typename I>
void display_category(I iter)
{
    // 加上typename是为了是 I 就是迭代器类型(目前这么理解)
    typename iterator_traits<I>::iterator_category cagy; // 去问萃取剂这个迭代器是什么类型
    __display_category(cagy);
}

int main()
{
    display_category(array<int, 10>::iterator());
    display_category(vector<int>::iterator());
    display_category(list<int>::iterator());
    display_category(forward_list<int>::iterator());
    display_category(deque<int>::iterator());

    display_category(set<int>::iterator());
    display_category(map<int, int>::iterator());
    display_category(multiset<int>::iterator());
    display_category(multimap<int, int>::iterator());
    display_category(unordered_set<int>::iterator());
    display_category(unordered_map<int, int>::iterator());
    display_category(unordered_multiset<int>::iterator());
    display_category(unordered_multimap<int, int>::iterator());

    // 这两个不太一样，是从适配器adapter产生的
    display_category(istream_iterator<int>());
    display_category(ostream_iterator<int>(cout, ""));

    return 0;
}
```

## iterator_category对算法的效率影响

不同的迭代器类型会导致在访问的过程中效率有区别

![image-20230422171334117](https://img-blog.csdnimg.cn/af077be12a5543d0ad3fbd29074b19ff.png)

**注意对右边代码的解读，这个distance函数是找两个迭代器之间的距离(ptrdiff_t 类型)，然后就问萃取机迭代器的类型是什么？然后针对函数调不同的重载函数就可以了!!!**

```c++
#include <iostream>
using namespace std;
#include <vector>
#include <list>

template <typename Iterator, typename Distance>
inline Iterator &_advance(Iterator &iter, Distance n, std::random_access_iterator_tag)
    {
        iter += n;
        return iter;
    }

template <typename Iterator, typename Distance>
inline Iterator &_advance(Iterator &iter, Distance n, std::bidirectional_iterator_tag)
    {
        if (n >= 0)
            while (n--)
                ++iter;
        else
            while (n++)
                --iter;
        return iter;
    }

template <typename Iterator, typename Distance>
inline Iterator &_advance(Iterator &iter, Distance n, std::input_iterator_tag)
    {
        while (n--)
            ++iter;
        return iter;
    }

template <typename Iterator, typename Distance>
inline Iterator Advance(Iterator iter, Distance n)
    // 这里最好不传入引用类型，因为第一下面没有更改iter的值，不用担心实参形参的问题；
    // 第二，外部可能传入的是begin()和end()这类没有办法直接修改的迭代器
    // 我们在使用的时候都是声明了一个运动迭代器，他的初值是begin(),这样来操作的
    // 所以传入引用会出问题，最好传值，但是后面就可以传入引用了，因为我们是创建了一个新的迭代器对象
    {
        typedef typename std::iterator_traits<Iterator>::iterator_category Iterator_Category;
        return _advance(iter, n, Iterator_Category());
    }

int main()
{
    vector<int> v{3, 5, 6, 7};
    cout << *myadvance().Advance(v.begin() + 2, -1) << endl; // 5
    list<int> l{3, 5, 6, 7, 12};
    cout << *myadvance().Advance(l.begin(), 4) << endl; // 12

    return 0;
}
```

注意注释的内容，为什么这里该传引用，这里不该传引用!!!

**从这里我们可以看出，迭代器类型的不同会导致算法效率的不同，但是我们不是通过模板特化来实现的，是通过函数重载来实现的!!!**

**算法源码对 iterator_category 的暗示:**

![image-20230422183037284](https://img-blog.csdnimg.cn/56c7a36ab0d544a5af54be08e6d36fb4.png)

因为上面的迭代器都是模板，但是有些算法在实现的过程中只对某种类型的迭代器有效，所以设计者会暗示迭代器的类型来方便阅读和修改!!!

## 算法源代码剖析

C++ STL 库里面的标准算法格式

```c++
template <typename Iterator>
std::Algorithm(Iterator iter1,Iterator iter2){
    ...
}

//带比较的参数 一般是仿函数
template <typename Iterator,typename Cmp>
std::Algorithm(Iterator iter1,Iterator iter2,Cmp cmp){
    ...
}
```

### accumulate

遍历整个容器对每个元素进行操作(可以是累加)然后返回值

![image-20230423113446373](https://img-blog.csdnimg.cn/5711ee771262481bb7f81f5a7ffc3433.png)

测试accumulate：

```c++
int myfunc(int x, int y)
{
    return x + 2 * y;
}

struct myclass
{
    int operator()(int x, int y) const { return x + 3 * y; }
} myobj;

void test_accumulate()
{
    cout << "test_accumulate().........." << endl;
    int init = 100;
    int nums[] = {10, 20, 30};

    cout << "using default accumulate: ";
    cout << accumulate(nums, nums + 3, init); // 160
    cout << '\n';

    cout << "using functional's minus: ";
    // minus 减法 仿函数
    cout << accumulate(nums, nums + 3, init, minus<int>()); // 40
    cout << '\n';

    cout << "using custom function: ";
    cout << accumulate(nums, nums + 3, init, myfunc); // 220
    cout << '\n';

    cout << "using custom object: ";
    cout << accumulate(nums, nums + 3, init, myobj); // 280
    cout << '\n';
}
```

自己实现以下accumulate:

```c++
#include <iostream>
using namespace std;
#include <vector>
#include <list>
#include <bits/stl_numeric.h> //accumulate
#include <string>

struct Sum_Square
{
    template <class Value_Int>
    inline Value_Int &operator()(Value_Int &val, Value_Int val_iter)
    {
        val += val_iter * val_iter;
        return val;
    }
};

struct String_Append
{
    template <class Value_String>
    inline Value_String &operator()(Value_String &val, Value_String val_iter)
    {
        val_iter.append(" ");
        val.append(val_iter);
        return val;
    }
};

struct Algorithm
{
    template <class Iterator, class Value_Type>
    inline static Value_Type Accumulate(Iterator begin, Iterator end, Value_Type val)
    {
        for (; begin != end; ++begin)
            val += *begin;
        return val;
    }

    template <class Iterator, class Value_Type, class Binary_Operation>
    inline static Value_Type Accumulate(Iterator begin, Iterator end, Value_Type val, Binary_Operation binary_op)
    {
        for (; begin != end; ++begin)
            val = binary_op(val, *begin);
        return val;
    }
};

int main()
{
    vector<int> v{5, 3, 6, 9, 10};
    cout << Algorithm::Accumulate(v.begin(), v.end(), 0 << endl; // 33
    cout << Algorithm::Accumulate(v.begin(), v.end(), 0, Sum_Square()) << endl; // 251
    list<string> l{"hello", "I", "want", "to", "fuck", "you", "my", "friend."};
    cout << Algorithm::Accumulate(l.begin(), l.end(), string(), String_Append()) << endl;

    return 0;
}
```

### for_each

容器的遍历算法

![image-20230423171745364](https://img-blog.csdnimg.cn/61e908d2d4984e939f4ad728d2519a2f.png)

自己实现一下for_each

```c++
#include <iostream>
using namespace std;
#include <vector>
#include <algorithm>

struct Algorithm
{
    template <class Iterator, class Function>
    //为什么要返回 Function 仿函数呢?(或者函数指针)
    inline static Function For_each(Iterator first, Iterator last, Function f)
    {
        for (; first != last; ++first)
            f(*first); // 注意是直接把数据传递给函数 f
        return f;
    }
};

int main()
{
    vector<int> v1{2, 5, 3, 6, 9};
    vector<int> v2;

    // 不修改v1的值
    Algorithm::For_each(v1.begin(), v1.end(), [&](int val)
                        { val*=2;v2.push_back(val); });

    for_each(v1.begin(), v1.end(), [&](auto val)
             { cout << val << ' '; });
    cout << endl;

    for (auto val : v2)
        cout << val << ' ';
    cout << endl;

    return 0;
}
```

看到for_each的返回值，我不得不思考为什么要返回Function仿函数呢？(很少情况下函数指针)

**原因是：可以监视仿函数对象在经过这个for_each操作之后的状态**

```c++
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

/*
    for_each()它可以返回其仿函数(返回所传入的函数对象的最终状态).
    这样我们就可以通过for_each()的返回值来获取仿函数的状态.
*/

/* 仿函数 */
class CSum
{
public:
    CSum() { m_sum = 0; }

    void operator()(int n) { m_sum += n; }

    int GetSum() const { return m_sum; }

private:
    int m_sum;
} cs;

int main()
{
    vector<int> vi;
    for (int i = 1; i <= 100; i++)
        vi.push_back(i);
    // 通过for_each返回值访问其最终状态(返回所传入的函数对象的最终状态).
    cs = for_each(vi.begin(), vi.end(), cs); // 返回的是一个新创建的对象，未返回引用，不会修改实参
    cout << cs.GetSum() << endl;

    return 0;
}
```

### replace,replace_if,replace_copy,replace_copy_if

```c++
#include <iostream>
using namespace std;
#include <vector>
#include <algorithm>

template <typename Container>
void print(Container con)
{
    for (auto val : con)
        cout << val << ' ';
    cout << endl;
}

struct Algorithm
{
    template <class Iterator, class Value_Type>
    inline static void Replace(Iterator first, Iterator last, const Value_Type oldval, const Value_Type newval)
    {
        for (; first != last; ++first)
            if (*first == oldval)
                *first = newval;
    }

    template <class Iterator, class Value_Type, class Predicate>
    // 给一个谓词来判断条件是否更改
    inline static void Replace_if(Iterator first, Iterator last, Predicate pred, const Value_Type newval)
    {
        for (; first != last; ++first)
            if (pred(*first))//这里谓词传递的参数只有一个值
                *first = newval;
    }

    // 上面的算法当中传入的参数只有一个值，没传入如果需要比较的基准值
    template <class Value_Type>
    bool operator()(const Value_Type &val)
    {
        return val > 5;//我们肯定不想在内部手动更改这个5，而是想在外面写代码的时候把5写进去
    }
    // 为了解决这个问题需要引用仿函数适配器 functor adapter
    // 标准库提供的 bind2nd() 用法 bind2nd(greater<int>,val)
};

int main()
{
    vector<int> v{1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    print(v);

    Algorithm::Replace(v.begin(), v.end(), 1, 66);
    print(v);

    vector<int> v2{1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    Algorithm::Replace_if(v2.begin(), v2.end(), bind2nd(greater<int>(), 5), 666);
    print(v2);

    vector<int> v3;
    v3.resize(v.size()); // 注意这里要给v3预分配空间，不然会段错误
    replace_copy(v.begin(), v.end(), v3.begin(), 10, 50);
    print(v3);

    return 0;
}
```

### count,count_if

这个差不多就不写了

![image-20230423175336384](https://img-blog.csdnimg.cn/75467813dc704d1f96b7c2e1a3b8da72.png)

为什么要返回difference_type呢？

算法通过萃取机询问迭代器，迭代器之间的间距类型怎么表示，这个类型就是difference_type

标准库的定义是 ptrdiff_t，也就是 long long，这下就可以理解了

有些容器自带的成员函数，比如图中的，这些函数的执行效率肯定比全局的执行效率更高!!!

### find,find_if

循序式查找，效率并不是很高，找不到返回last迭代器

![image-20230423202430305](https://img-blog.csdnimg.cn/857e370620b947d8812210e721a3aecc.png)

### sort

```c++
#include <iostream>
using namespace std;
#include <vector>
#include <array>
#include <algorithm>

template <typename Container>
void print(Container con)
{
    for (auto val : con)
        cout << val << ' ';
    cout << endl;
}

bool myfunc(int i, int j)
{
    return i < j;
}

struct myclass
{
    bool operator()(int i, int j) { return i < j; }
} myobj;

int main()
{
    array<int, 8> arr = {32, 71, 12, 45, 26, 80, 53, 33};
    vector<int> v(arr.begin(), arr.end());
    print(v);

    // using default comparison (operator <)
    sort(v.begin(), v.begin() + 4); // 排序前四个 12 32 45 71 26 80 53 33
    print(v);

    // using function as comp
    sort(v.begin() + 4, v.end(), myfunc); // 12 32 45 71 26 33 53 80
    print(v);

    // using object as comp
    sort(v.begin(), v.end(), myobj); // 12 26 32 33 45 53 71 80
    print(v);

    // reverse iterators
    sort(v.rbegin(), v.rend(), less<int>()); // 80 71 53 45 33 32 26 12
    print(v);

    return 0;
}
```

![image-20230423203719337](https://img-blog.csdnimg.cn/7fc5b83f116548df9a0a2f9dd5a6c768.png)

**注意一点的是stl标准库里面的 sort 函数要求的是 random_access_iterator_tag!!!!!**

**所以list和forward_list没办法调用，只能调用他们自己的类函数sort!!!**

### binary_search(通过二分查找确定元素在不在容器当中)

**二分查找一定只能适用于一个有序序列!!!!并且在库函数当中只能用于升序序列!!!!**

![image-20230423210411376](https://img-blog.csdnimg.cn/62a96e31a4544932a7484988f124e50b.png)

使用例子：

```c++
#include <iostream>
using namespace std;
#include <algorithm>
#include <vector>

template <typename Container>
void Sort(Container &con) // 传引用，不然不改变实参
{
    sort(con.begin(), con.end());
}

template <typename Container>
void rSort(Container &con) // 传引用，不然不改变实参
{
    sort(con.rbegin(), con.rend());
}

template <typename Container>
void print(Container &con) // 传引用，不然不改变实参
{
    for (auto val : con)
        cout << val << ' ';
    cout << endl;
}

namespace Fuck
{
    template <typename Random_Iterator, typename Value_Type>
    bool __Binary_Search(Random_Iterator first, Random_Iterator last, const Value_Type &val,
                         random_access_iterator_tag)
    {
        // 先做一个检查 val比 *first大 那么找不到
        if (val < *first)
            return false;

        while (first != last)
        {
            Random_Iterator mid = first + (last - first) / 2; // 没有两个迭代器相加的重载版本!!!!
            if (*mid > val)
                last = mid; // 注意last要满足前闭后开
            else if (*mid < val)
                first = ++mid;
            else
                return true;
        }
        return false;
    }

    template <typename Random_Iterator, typename Value_Type>
    bool __Binary_Search(Random_Iterator first, Random_Iterator last, const Value_Type &val,
                         random_access_iterator_tag, int) // 多一个int代表降序
    {
        // 先做一个检查 val比 *first大 那么找不到
        if (val > *first)
            return false;

        while (first != last)
        {
            Random_Iterator mid = first + (last - first) / 2; // 没有两个迭代器相加的重载版本!!!!
            if (*mid > val)
                first = ++mid;
            else if (*mid < val)
                last = mid; // 注意last要满足前闭后开
            else
                return true;
        }
        return false;
    }

    template <typename Iterator, typename Value_Type>
    // 写了一个random_access_iterator的重载
    bool Binary_Search(Iterator first, Iterator last, const Value_Type &val)
    {
        // 想办法让其可以适用于降序序列
        typedef typename iterator_traits<Iterator>::iterator_category Iterator_Category;
        if (*first < *(last - 1)) // 升序 保持前闭后开的规则!!!
            return __Binary_Search(first, last, val, Iterator_Category());
        else
            return __Binary_Search(first, last, val, Iterator_Category(), true);
    }
}

int main()
{
    vector<int> v{1, 3, 6, 8, 7, 9, 2, 0};

    Sort(v); // 0 1 2 3 6 7 8 9
    print(v);
    cout << Fuck::Binary_Search(v.begin(), v.end(), 2) << endl;
    // cout << binary_search(v.begin(), v.end(), 5) << endl;
    rSort(v);
    print(v);
    cout << Fuck::Binary_Search(v.begin(), v.end(), 2) << endl;

    return 0;
}
```

# 第五讲：仿函数 适配器

## 仿函数 functors(注意要继承)

标准库提供的三大类型的仿函数：算术类 逻辑运算类 相对运算类

![image-20230424161751257](https://img-blog.csdnimg.cn/51b38b9b4c77474385fcb102205edb7e.png)

还有之前提到过的几个仿函数：

![image-20230424162149742](https://img-blog.csdnimg.cn/d384f2c6adc34553a6d187910229062d.png)

标准库的示范：

![image-20230424162843434](https://img-blog.csdnimg.cn/d97c1dfc098440ff9cf757ff18e3ede2.png)

**注意到一点：标准库提供的functors都存在继承关系!!!!只有这样才算是真正融入了STL体系，这样才能更好的运作。**

**仿函数的 adaptable可适配 条件**

![image-20230424163242826](https://img-blog.csdnimg.cn/3a37fc2d242e48938fdd4b274aba09e0.png)

**STL规定，每个Functor都应该挑选适当的类来继承，因为适配器adapter会提出一些问题!!!!**

**什么叫adaptable?如果你希望自己的仿函数是可以被适配器调整的话，那么就继承一个适当的类，这样可以完成更多的操作!!!为什么要继承呢？因为可能在被adapter改造的时候可能会问这些问题。这也和算法问迭代器的五个问题一样，那里是通过迭代器的萃取机 Iterator Traits (也叫迭代器适配器 Iterator Adapters )去问的，这里同理通过继承的关系去回答adapter的问题!!!**

## 适配器 Adapter

存在多种 Adapters ，还是那张图，注意关系

<img src="https://img-blog.csdnimg.cn/680f331c02bf443ab9d6e5658cf4a5b5.png" alt="image-20230424170726596" style="zoom:67%;" />

Adapter的关键是：

**这个Adapter要去改造某个东西(比如图中的container，functor，iterator)，这里就有两种解决方式，第一种是继承的方式，就是Adapter继承这个东西，拥有这个东西的属性来进行改造；第二种是内含的方式，Adapter内部有这个东西来进行改造!!!!**

**在标准库里面的实现绝大多数都是内含的方式!!!**

一下就是一些适配器的例子：

### 容器适配器：stack,queue

![image-20230424172134280](https://img-blog.csdnimg.cn/7bfd3aab335b456c80b15a9ff5ad831e.png)

这个之前用过很多次了，就是把默认的容器拿进来进行改造，比如这里给的默认值是 deque ，改造之后能够以一种全新的面貌展现给用户，能够更加准确的针对用户的需要来进行相应的操作。

### 函数适配器：binder2nd

![image-20230425185823723](https://img-blog.csdnimg.cn/53710d3057cc452cadca94c46263fa2c.png)

```c++
#include <iostream>
using namespace std;
#include <vector>
#include <algorithm>

namespace fuck
{
    // 自己写一个bind2nd和binder2nd
    // 仔细敲打一下这段代码
    // 这里暗示了需要传入的是一个二元运算符 然后下面的类型名称是继承里面写好的类型名称
    template <class Binary_Op>
    class _BinderSecond
    // 不继承这一行也可以运作，但是没办法进行后续的改造
    // 这里就不继承了!!!
    // : public unary_function<typename Binary_Op::first_argument_type, typename Binary_Op::second_argument_type>
    {
    protected:
        Binary_Op op;
        typename Binary_Op::second_argument_type value; // 第二参数 需要设定的固定值
    public:
        // ctor
        _BinderSecond(const Binary_Op &x, const typename Binary_Op::second_argument_type &y)
            : op(x), value(y) {}

        typename Binary_Op::result_type
        operator()(const typename Binary_Op::first_argument_type &x)
        {
            return op(x, value);
        }
    };

    template <class Binary_Op, class Value_Type>
    inline _BinderSecond<Binary_Op> _BindSecond(const Binary_Op &op, const Value_Type &val)
    {
        typedef typename Binary_Op::second_argument_type second_type;//这句话就是adapter在问问题
        return _BinderSecond(op, second_type(val));
    };
}

int main()
{

    vector<int> v{1, 3, 2, 5, 9, 8, 7, 6, 4, 10};
    cout << count_if(v.begin(), v.end(),
                     fuck::_BindSecond(less<int>(), 5)) // 绑定第二参数
         << endl;

    return 0;
}
```

注意其中的一些代码：

```c++
typename Binary_Op::second_argument_type value;
```

**为什么要加上 typename ，是为了通过编译，因为这个时候我们不知道Binary_Op是什么类型，然后如果他是我们想要的，也就是其中含有这个类型定义，那么就能通过编译，否则在这里就会报错!!!!**

**仿函数functors的可适配(adaptable)条件**

继承(因为adapter会问问题，提问类型)，是一个functor

![image-20230425191652925](https://img-blog.csdnimg.cn/07d92104067c4e728fc1972a27e00492.png)

### 函数适配器：not1

![image-20230425194548756](https://img-blog.csdnimg.cn/e07128cad30243599b15663c52c62051.png)

```c++
#include <iostream>
using namespace std;
#include <vector>
#include <algorithm>

namespace fuck
{
    // 对谓词做否定
    template <class Predicate>
    class _unary_negate
        // 继承为了后续的改造
        : public unary_function<typename Predicate::argument_type, bool>
    {
    protected:
        Predicate pred;

    public:
        // ctor
        _unary_negate(const Predicate &x) : pred(x) {}
        
        bool operator()(const typename Predicate::argument_type &x) const
        {
            return !pred(x);
        }
    };

    template <class Predicate>
    inline _unary_negate<Predicate> _Not1(const Predicate &pred)
    {
        return _unary_negate<Predicate>(pred);
    }
}

int main()
{
    vector<int> v{1, 3, 2, 5, 9, 8, 7, 6, 4, 10};
    cout << count_if(v.begin(), v.end(),
                     fuck::_Not1(bind2nd(less<int>(), 5))) // 绑定第二参数
         << endl;

    return 0;
}
```

**观察发现这些adapter的实现方法基本都是一个模板辅助函数，调用一个模板类，这个类里面有构造函数和小括号重载!!!!**

### 新型适配器：bind(since c++11)

右边是老版本，左边是新版本!!!

![image-20230425194051698](https://img-blog.csdnimg.cn/bb8e42b30a5d465a955f2bddcf032515.png)

可见bind的实现是非常复杂的!!!!

下面是对bind的一些测试：

![image-20230425200558918](https://img-blog.csdnimg.cn/9bda751beefe44d89774fe1d9a3f7183.png)

**bind 可以绑定：**

**functions函数；function objects 函数对象(仿函数)；**

**member functions 成员函数；data members 成员属性**

前两个比较好理解，其中第三个和第四个的绑定规则是：

**注意第一个参数传入的是传的是地址!!!!**

**member functions, _1;**

**data members,_1**

**必须有第二个参数，第二个参数必须是必须是某个object的地址，可以是一个占位符，在调用的时候被外界指定!!!**

**第一个参数可以理解为调用类里面的什么接口，第二个参数可以理解为谁来调用!!!!**

使用例子：

```c++
#include <iostream>
using namespace std;
#include <functional>
using namespace std::placeholders; // 使用占位符 _1 _2 _3这些
#include <vector>
#include <algorithm>

double my_divide(double x, double y)
{
    return x / y;
}

struct MyPair
{
    double a, b;
    double multiply() { return a * b; }
};

void Bind_Functions()
{
    // binding functions
    auto fn_five = bind(my_divide, 10, 2); // return 10.0/2.0
    cout << fn_five() << endl;             // 5

    auto fn_half = bind(my_divide, _1, 2); // return x/2.0
    cout << fn_half(10) << endl;           // 5

    auto fn_rounding = bind(my_divide, _2, _1); // 第一参数为除数，第二参数为被除数 return y/x
    cout << fn_rounding(10, 2) << endl;         // 0.2

    auto fn_invert = bind<int>(my_divide, _1, _2); // int 代表希望返回的类型 return int(x/y)
    cout << fn_invert(10, 3) << endl;              // 3
}

void Bind_Members()
{
    MyPair ten_two{10, 2};

    auto bound_memfn = bind(&MyPair::multiply, _1); // return x.multiply()
    cout << bound_memfn(ten_two) << endl;           // 20

    auto bound_memdata = bind(&MyPair::a, ten_two); // return tentwo.a
    cout << bound_memdata() << endl;                // 10

    auto bound_memdata2 = bind(&MyPair::b, _1); // return x.b
    cout << bound_memdata2(ten_two) << endl;    // 2

    vector<int> v{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    auto _fn = bind(less<int>(), _1, 5);
    cout << count_if(v.cbegin(), v.cend(), _fn) << endl;
    cout << count_if(v.begin(), v.end(), bind(less<int>(), _1, 5)) << endl;
}

int main()
{
    Bind_Functions();
    Bind_Members();

    return 0;
}
```

### 迭代器适配器：rbegin，rend

![image-20230425203641882](https://img-blog.csdnimg.cn/c94cb4e542ee4e95b97fadb6e3f4d05d.png)

这个迭代器就是在正向迭代器的基础之上进行改造的迭代器!!!

### 迭代器适配器：inserter(没弄懂)

![image-20230425205345712](https://img-blog.csdnimg.cn/a5a8c50291fe49f89f2bd7af05646e07.png)

注意copy是已经写死的函数，那么如何才能改变他的行为呢？

**答案是借助操作符重载，本例子就是重载了 = 号运算符就是实现了由赋值操作变为插入操作了!!!!**

# 第六讲：STL周围的细碎知识点

## 一个万用的 hash function

![image-20230426151146418](https://img-blog.csdnimg.cn/d9826d8118df4ac78c503a5aadb272f7.png)

**系统提供了一个非常不错的hashcode生成函数 hash_val() ，括号里面把元素的所有参数全部放进去就好！**

### hash_val(参数包)

```c++
    // 1
	template <typename... Types> // ... 的含义 接受任意数量的模板参数
    inline size_t hash_val(const Types &...args)
	//创建一个种子，将种子和参数包绑定在一起
    {
        size_t seed = 0;
        hash_val(seed, args...);//调用2号重载 修改seed
        return seed;//最后返回seed就是最终的hashcode
    }

	// 2
    template <typename Type, typename... Types>
    inline void hash_val(size_t &seed, const Type &val, const Types &...args)
    {
        //注意这个函数接受的参数，有一个val,本来传入的是n个元素的参数包，出现val之后，就将其分开，分为1和n-1来处理
        hash_combine(seed, val);//取出一个参数来对seed进行修改!!!!
        hash_val(seed, args...);//处理剩余 n-1 个参数包 递归操作
    }

	// 3
    template <typename Type>
    inline void hash_val(size_t &seed, const Type &val)
	//最终当只剩下一个参数的时候就最后更改一次就行了
    {
        hash_combine(seed, val);
    }

    template <typename Type>
    inline void hash_combine(size_t &seed, const Type &val)
    {
        seed ^= std::hash<Type>()(val) + 0x9e3779b9 + (seed << 6) + (seed >> 2);
        //前面第一个参数是调用系统提供的哈希函数，后面这些加和左移右移是为了让其更加混乱，没有规律可言
    }
```

上面的例子不是很好理解，这里写一个打印string的例子方便加深理解：

```c++
#include <iostream>
using namespace std;
#include <string>

class StringPrint
{
public:
    inline void myprint(const string &str)
    {
        _myprint(str);
        cout << endl;
    }

    template <typename... Types>
    inline void myprint(const string &str, const Types &...args)
    {
        _myprint(str, args...);
        cout << endl;
    }

    template <typename... Types>
    void foo(const Types &...args)
    {
        //当我们想要知道包中有多少元素时，可以使用sizeof...运算符，该运算符返回一个常量表达式，并且不会对其实参求值
        cout << sizeof...(Types) << endl; // 类型参数数目
        cout << sizeof...(args) << endl;  // 函数参数数目
    }

private:
    inline void _myprint(const string &str)
    {
        cout << str;
    }

    // 接受参数包，参数包是占位符的替换
    template <typename Type, typename... Types>
    inline void _myprint(const string &str, const Type &val, const Types &...args)
    {
        // 一个字符一个字符的读，直到碰到占位符 %
        for (auto iter = str.begin(); iter != str.end(); ++iter)
        {
            if (*iter != '%')
                cout << *iter;
            else
            {
                // 是占位符
                cout << val;
                string newstr = string(++iter, str.end());
                _myprint(newstr, args...);//创建新的字符串并且传进去进行递归，注意不要忘了 return 递归出口
                return;
            }
        }
    }
} myPrint;

int main()
{
    myPrint.myprint("Hello , I'm % , % years old.", "David", 20);
    myPrint.foo("Hello , I'm % , % years old.", "David", 20);
    myPrint.myprint("fuck you!");
    myPrint.foo("fuck you!");

    return 0;
}
```

### Hash函数的三种形式

1.仿函数 functor

2.函数指针

```c++
//仿函数
class CustomerHash
{
public:
    size_t operator()(const Customer &c) const
    {
        return HashFunction().hash_val(c.fname, c.lname, c.no);
    }
};

//函数指针
size_t customer_hash_func(const Customer &c)
{
    // 第一种思路就是这个类里面简单类型的hashcode全部相加
    // 但是这么做的话设计者认为比较天真，没办法达到非常乱的结构
    return HashFunction().hash_val(c.fname, c.lname, c.no);
}

//注意在main函数创建的时候传入参数的时候需要注意
int main(){
    unordered_set<Customer, CustomerHash> custset;

    using function_pointer = size_t (*)(const Customer &); // 定义函数指针
    unordered_set<Customer, function_pointer> custset2; //传入的是函数指针的形式!!!
    
    return 0;
}
```

3.特化的版本

对于 unorder_set or unorder_map，如果不给hash函数，那么默认会使用系统的 hash<value_type>，这个时候可以通过这个对其进行特化处理

```c++
// 放在std内表示在标准库std里面进行操作修改
namespace std
{
    template <>
    class hash<Customer>
    {
        size_t operator()(const Customer &c)
        {
            return HashFunction().hash_val(c.fname, c.lname, c.no);
        }
    };
}
```

可以在我们的代码中对std里面的系统提供的hash函数进行特化版本的处理来实现

## tuple

tuple是c++11新引入的一个好东西，他可以传入一个参数包，参数包里面可以放入任意大小，任意类型

![image-20230427111200767](https://img-blog.csdnimg.cn/c5f0fb733f174cbaa1252c8a2f97de20.png)

示例代码:

```c++
#include <iostream>
using namespace std;
#include <string>
#include <tuple>
#include <complex>
#include <typeinfo>
#include "29_tuple_print.h"

void test()
{
    cout << "string,sizeof = " << sizeof(string) << endl;                   // 32
    cout << "double,sizeof = " << sizeof(double) << endl;                   // 8
    cout << "float,sizeof = " << sizeof(float) << endl;                     // 4
    cout << "int,sizeof = " << sizeof(int) << endl;                         // 4
    cout << "complex<double>,sizeof = " << sizeof(complex<double>) << endl; // 16

    tuple<string, int, int, complex<double>> t;
    cout << "tuple<string,int,int,complex<double>,sizeof = " << sizeof(t) << endl; // 56

    tuple<int, float, string> t1(41, 6.3, "nico");
    cout << "tuple<int,float,string>,sizeof = " << sizeof(t1) << endl;              // 40
    cout << "t1: " << get<0>(t1) << ' ' << get<1>(t1) << ' ' << get<2>(t1) << endl; // 取出其中的元素用法

    auto t2 = make_tuple(22, 44.0, "stacy");
    get<1>(t1) = get<1>(t2);
    cout << "t1: " << get<0>(t1) << ' ' << get<1>(t1) << ' ' << get<2>(t1) << endl;
    cout << "t2: " << get<0>(t2) << ' ' << get<1>(t2) << ' ' << get<2>(t2) << endl;

    // 比较大小
    if (t1 < t2)
        cout << "t1 < t2" << endl;
    else if (t1 > t2)
        cout << "t1 > t2" << endl;
    else
        cout << "t1 == t2" << endl;
    t1 = t2; // 赋值操作
    cout << t2 << endl;

    typedef tuple<int, float, string> TupleType;
    cout << tuple_size<TupleType>::value << endl; // 3

    typedef tuple_element<1, TupleType>::type Type1; // float
    cout << typeid(Type1).name() << endl;            // f

    tuple<int, float, string> t3(77, 1.1, "more light");
    int i1;
    float f1;
    string s1;
    tie(i1, f1, s1) = t3; // 将这t3的三个属性绑定到这三个变量上面
    cout << "i1 = " << i1 << " f1 = " << f1 << " s1= " << s1 << endl;
}

int main()
{
    test();

    return 0;
}
```

**这里面就有学问了，重载 这个参数包的 左移运算符(代码建议重复看!!!!)**

```c++
#ifndef __TUPLEPRINT__
#define __TUPLEPRINT__

#include <iostream>
using namespace std;

// get<> 尖括号里面不能放入变量，只能放入一个常量!!!!
template <typename Tuple, size_t N>
struct tuple_print
{
    inline static void print(const Tuple &t, ostream &out)
    {
        tuple_print<Tuple, N - 1>::print(t, out);
        out << ' ' << get<N - 1>(t);
        // 为什么要反着写？
        // 因为递归出来打印的顺序是从0 到 n-1!!!!
    }
};

// 递归出口
template <typename Tuple>
struct tuple_print<Tuple, 1>
{
    inline static void print(const Tuple &t, ostream &out)
    {
        out << get<0>(t);
    }
};

// 重载 左移运算符
#include <tuple>
template <typename... Types>
inline ostream &
operator<<(ostream &out, const tuple<Types...> &t)
{
    // decltype 可以得出变量的类型
    // 模板参数里面可以放入一个常量，根据常量不同的大小可以调用不同的重载或者特化版本
    tuple_print<decltype(t), sizeof...(Types)>::print(t, out);
    return out;
}

#endif
```

那么这个这么好用的tuple是怎么实现的呢？

![image-20230427112849536](https://img-blog.csdnimg.cn/bf057314662147fda8055a57fa818fea.png)

**他的大概意思就是接受参数包，然后将参数包分为1和n-1，本类继承上一级(n-1)的类，以此往上继承；由于本类当中的成员是head，就是这个1对应的元素，所以继承过后本类会获得所有的元素，可以通过head和tail接口进行调用!!!!!!**

注意图中右上角的继承关系!!!

tuple里面有两个head和tail函数，这两个在现在的c++里面不太好用，因为新加了很多东西，接口也变了，所以就不用了

