# A6 · DFS 与 BFS

> 热度:🔥🔥

## 一句话考点

**DFS**(深度优先)一条路走到底再回溯,用递归/栈,适合路径、连通性、排列组合;**BFS**(广度优先)逐层扩展,用队列,适合**最短路径**、层级遍历。

## 原理精讲

### 1. DFS vs BFS

| | DFS | BFS |
|--|-----|-----|
| 策略 | 深入到底再回溯 | 逐层向外扩展 |
| 数据结构 | 栈 / 递归 | 队列 |
| 空间 | O(深度) | O(宽度) |
| 最短路径 | 不保证(需遍历所有) | ✅ 无权图最短路径 |
| 适用 | 路径枚举、连通块、回溯 | 最短步数、层级关系 |

### 2. 通用套路

**DFS**:访问当前节点 → 标记已访问 → 递归访问相邻未访问节点。
**BFS**:起点入队 → 循环取队首、访问、把未访问邻居入队并标记。

关键:**用 visited 标记防止重复访问**(尤其图中有环时)。

## 代码示例

### 岛屿数量(DFS 淹没,经典)

```js
function numIslands(grid) {
  let count = 0;
  const rows = grid.length, cols = grid[0].length;

  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') return;
    grid[r][c] = '0';                    // 标记已访问(淹没)
    dfs(r + 1, c); dfs(r - 1, c);        // 上下左右扩展
    dfs(r, c + 1); dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;                          // 发现新岛
        dfs(r, c);                        // 淹没整块
      }
    }
  }
  return count;
}
```

### BFS 求最短路径(网格)

```js
function shortestPath(grid, start, end) {
  const rows = grid.length, cols = grid[0].length;
  const queue = [[...start, 0]];          // [r, c, 步数]
  const visited = new Set([start.join(',')]);
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];

  while (queue.length) {
    const [r, c, dist] = queue.shift();
    if (r === end[0] && c === end[1]) return dist;   // 首次到达即最短
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc, key = `${nr},${nc}`;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
          grid[nr][nc] === 0 && !visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc, dist + 1]);
      }
    }
  }
  return -1;                              // 不可达
}
```

## 高频追问

**Q:DFS 和 BFS 区别?各自适用场景?**
A:DFS 深入到底再回溯(栈/递归),适合路径枚举、连通块、排列组合、回溯;BFS 逐层扩展(队列),适合求无权图最短路径、层级关系、最少步数。

**Q:为什么 BFS 能求最短路径?**
A:BFS 按距离逐层扩展,第一次到达目标时经过的层数就是最少步数(每层代表走一步)。DFS 会先深入一条路径,不保证第一次到达是最短。

**Q:DFS 和 BFS 的空间复杂度?**
A:DFS 是 O(最大深度)(递归栈);BFS 是 O(最大宽度)(队列可能存一整层)。树/图很宽时 BFS 占内存多,很深时 DFS 占内存多。

**Q:遍历图时如何避免死循环?**
A:用 visited 集合标记已访问节点,访问前判断是否已访问。图可能有环,不标记会无限循环;树没有环则可省略。

**Q:岛屿问题为什么用 DFS/BFS?**
A:每块相连的陆地是一个连通分量。遍历网格,遇到未访问的陆地就从它出发 DFS/BFS 把整块标记(淹没),计数加一,直到遍历完所有格子。

## 一句话背诵版

**DFS 深入到底再回溯(栈/递归,O(深度),适合路径/连通块/回溯);BFS 逐层扩展(队列,O(宽度),第一次到达即最短,适合无权图最短路径);都用 visited 防重复;经典:岛屿数量(DFS 淹没)、网格最短路径(BFS)。**
