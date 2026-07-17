# ND3 · Stream 与 Buffer

> Node.js 专题 · Buffer → Stream 四类 → 背压 → 考点

## 一句话考点

**Buffer** 是 Node 处理二进制数据的容器;**Stream(流)** 分块处理数据,不必一次读进内存,适合大文件/网络传输;流分四类(可读/可写/双工/转换),用 `pipe` 连接并自动处理**背压(backpressure)**。

## 原理

### 1. Buffer

Node 中表示固定长度二进制数据的对象(在 V8 堆外分配内存)。用于处理文件、网络、加密等二进制场景:

```js
const buf = Buffer.from('hello', 'utf-8');
buf.toString('utf-8');       // 'hello'
buf.length;                  // 字节数(注意:一个中文 utf-8 占 3 字节)
Buffer.concat([buf1, buf2]); // 拼接
```

### 2. Stream(流)—— 核心

**为什么用流**:读一个 2G 文件,`fs.readFile` 会把整个文件读进内存(可能爆内存);流**分块**读取处理,内存占用恒定。

**四种流**:

| 类型 | 说明 | 例子 |
|------|------|------|
| **Readable** | 可读流(数据源) | fs.createReadStream、HTTP 请求 |
| **Writable** | 可写流(目的地) | fs.createWriteStream、HTTP 响应 |
| **Duplex** | 双工(可读可写) | TCP socket |
| **Transform** | 转换流(边读边改) | zlib 压缩、加密 |

### 3. pipe 与背压(重点)

`pipe` 把可读流的输出连到可写流的输入,并**自动处理背压**:

**背压(Backpressure)**:如果读得快、写得慢(如读文件快、网络发送慢),数据会在内存堆积。pipe 会在写端跟不上时**暂停读**,写端消化后再**恢复读**,防止内存爆掉。

```js
// ✅ 用 pipe:自动分块 + 自动背压
const fs = require('fs');
fs.createReadStream('big.mp4')
  .pipe(fs.createWriteStream('copy.mp4'));

// HTTP 场景:边读文件边发响应,不占大内存
http.createServer((req, res) => {
  fs.createReadStream('big.mp4').pipe(res);
}).listen(3000);
```

### 4. 手动监听(理解背压)

```js
const rs = fs.createReadStream('big.file');
const ws = fs.createWriteStream('out.file');

rs.on('data', (chunk) => {
  const ok = ws.write(chunk);        // write 返回 false 表示缓冲已满
  if (!ok) {
    rs.pause();                      // 背压:暂停读
    ws.once('drain', () => rs.resume());  // 写端排空后恢复读
  }
});
```

## 考点

**Q:为什么用 Stream?和 readFile 区别?**
A:readFile 把整个文件读进内存,大文件会爆内存、且要等全部读完才能处理;Stream 分块读取处理,内存占用恒定、可以边读边处理(如边读边发送、边压缩),适合大文件和网络传输。

**Q:Stream 有哪几种?**
A:四种——Readable(可读,数据源)、Writable(可写,目的地)、Duplex(双工,如 TCP socket)、Transform(转换流,边读边改,如压缩/加密)。

**Q:什么是背压(backpressure)?怎么处理?**
A:数据生产速度 > 消费速度时,数据在内存堆积的现象(如读文件快、网络发送慢)。用 pipe 会自动处理:写端缓冲满时暂停读、排空后恢复;手动处理则看 write 返回值(false 时 pause,监听 drain 事件后 resume)。

**Q:Buffer 是什么?**
A:Node 处理二进制数据的容器,在 V8 堆外分配固定长度内存。用于文件、网络、加密等二进制场景。注意字符编码——一个 UTF-8 中文占 3 字节,截断 Buffer 可能切坏多字节字符。

**Q:pipe 的好处?**
A:一行连接可读流和可写流,自动分块传输 + 自动背压控制 + 自动错误传播(部分),代码简洁且内存安全,是流处理的推荐方式。

## 一句话总结

**Buffer 是二进制数据容器(堆外内存,注意多字节编码);Stream 分块处理数据、内存恒定,适合大文件/网络,分四类(Readable/Writable/Duplex/Transform);pipe 连接流并自动处理背压(生产快于消费时暂停读、drain 后恢复),避免内存堆积;比 readFile 更省内存、可边读边处理。**
