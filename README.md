# AI-Coding-Sync

![Runtime](https://img.shields.io/badge/runtime-Bun-black)
![Language](https://img.shields.io/badge/language-TypeScript-3178c6)
![Lines](https://img.shields.io/badge/lines-93.35%25-brightgreen)
![Functions](https://img.shields.io/badge/functions-98.26%25-brightgreen)
![Docs](https://img.shields.io/badge/docs-TypeDoc-blue)
![License](https://img.shields.io/badge/license-MIT-green)

基于 **Bun + TypeScript** 的命令行工具，用于通过 **WebDAV** 在多台设备之间同步 AI 编码工具配置与工作目录。

它面向 `.claude`、`.cursor`、`.opencode` 等 AI 开发工具场景，支持多 profile、三种同步模式（Git / File / Link）、远程锁、安全扫描、钩子扩展与配置校验。

## 为什么需要它

如果你会在多台设备之间切换开发环境，通常会遇到这些问题：

- Claude / Cursor / OpenCode 配置分散在不同机器
- 提示词、agents、skills、插件配置难以统一
- 手工复制容易遗漏，且不安全
- 同步过程中缺少冲突控制与审计能力

`ai-coding-sync` 旨在提供一个统一的 CLI，同步这些 AI coding 配置，并尽量保持：

- 可配置
- 可审计
- 可扩展
- 对多设备友好

## 核心特性

- **WebDAV 同步后端**
  - 使用 WebDAV 作为远程存储
  - 适合自建 NAS、坚果云、Nextcloud 等场景

- **三种同步模式**
  - `file`：直接按文件清单同步
  - `git`：适合以 Git 仓库为主的配置同步
  - `link`：适合以链接或引用关系组织本地内容

- **多 profile 配置**
  - 支持不同设备、不同工作环境使用不同配置
  - 可覆盖 mode、strategy、conflict、webdav 等选项

- **多 mapping 管理**
  - 可同时同步多个本地目录到远端不同路径
  - 每个 mapping 可独立配置 profile / mode / ignore / hooks

- **安全与诊断**
  - 敏感信息扫描
  - 日志脱敏
  - 默认敏感文件忽略
  - `doctor` 环境诊断
  - 配置 schema 校验

- **并发控制**
  - 基于 WebDAV 锁文件的分布式锁
  - 支持 TTL 与重试机制
  - 降低多设备同时写入冲突风险

- **可扩展自动化**
  - 支持 pre-sync / post-sync / on-conflict hooks
  - 便于接入自定义脚本流程

## 技术栈

- **Runtime**: Bun
- **Language**: TypeScript
- **Validation**: Zod
- **Test**: Bun test
- **Docs**: TypeDoc
- **Lint / Format**: ESLint + Prettier

## 安装

### 前置要求

- Bun
- 一个可用的 WebDAV 服务端
- macOS / Linux / 其他类 Unix 环境优先

### 安装依赖

```bash
bun install
```

### 本地开发运行

```bash
bun run dev -- --help
```

### 作为 CLI 使用

项目已在 `package.json` 中声明 bin：

```json
{
  "bin": {
    "ai-coding-sync": "./src/index.ts"
  }
}
```

如需全局或本地链接，可按 Bun/包管理器常规方式处理。

## 快速开始

### 1. 初始化配置

```bash
bun run dev -- init
```

### 2. 查看状态

```bash
bun run dev -- status
```

### 3. 执行同步

```bash
bun run dev -- sync
```

### 4. 推送或拉取

```bash
bun run dev -- push
bun run dev -- pull
```

## 配置说明

项目使用统一配置文件描述 WebDAV、profiles、mappings、hooks 等内容。

### 配置能力概览

- `syncId`：标识当前设备
- `webdav`：远端地址、认证与请求选项
- `profiles`：按场景覆盖主配置
- `mappings`：定义本地目录与远端目录的同步关系
- `ignoreGlobal`：全局忽略规则
- `hooks`：同步生命周期钩子

### 示例配置

```json
{
  "version": "1",
  "syncId": "macbook-pro",
  "webdav": {
    "endpoint": "https://dav.example.com",
    "auth": {
      "type": "env",
      "username": "your-name",
      "password": null
    },
    "remoteRoot": "/ai-coding-sync",
    "options": {
      "depth": "infinity",
      "verifySsl": true,
      "timeout": 10000,
      "maxRetries": 2,
      "concurrency": 4
    }
  },
  "profiles": {
    "work": {
      "mode": "git",
      "strategy": "two-way",
      "conflict": "backup"
    },
    "personal": {
      "mode": "file",
      "strategy": "push-only"
    }
  },
  "mappings": [
    {
      "name": "claude",
      "local": "~/.claude",
      "remotePath": "/configs/claude",
      "profile": "work",
      "respectGitignore": true
    },
    {
      "name": "cursor",
      "local": "~/.cursor",
      "remotePath": "/configs/cursor",
      "mode": "file",
      "ignore": [
        "*.log",
        "*.tmp"
      ]
    }
  ],
  "ignoreGlobal": [
    ".DS_Store",
    "*.swp",
    "*.tmp"
  ],
  "hooks": {
    "pre-sync": null,
    "post-sync": null,
    "on-conflict": null
  }
}
```

## 同步模式

### `file`

直接扫描本地目录，生成文件清单并进行同步。

适合：
- 普通配置目录
- 不依赖 Git 历史的内容
- 想快速稳定同步文件结构的场景

### `git`

以 Git 工作流为核心的同步模式。

适合：
- 配置本身就是仓库内容
- 希望保留版本上下文
- 更偏开发者工作流的同步场景

### `link`

用于处理链接型或引用型目录结构。

适合：
- 本地目录通过链接组织
- 需要保留轻量引用关系
- 特殊工作区布局

## CLI 命令

### 基本命令

| Command | Description |
|---|---|
| `init` | 初始化配置并测试首轮连接 |
| `sync` | 执行默认双向同步流程 |
| `push` | 将本地内容推送到远端 |
| `pull` | 将远端内容拉取到本地 |
| `status` | 查看同步状态与映射信息 |
| `doctor` | 诊断环境、配置与依赖问题 |
| `config get <key>` | 读取配置项 |
| `config set <key> <value>` | 修改配置项 |

### 全局选项

| Option | Description |
|---|---|
| `--profile <name>` | 使用指定 profile |
| `--dry-run` | 预览操作，不执行真实写入 |
| `--force` | 跳过部分保护性确认 |
| `--yes` | 自动确认提示 |
| `--verbose` | 输出更详细日志 |

### 示例

```bash
bun run dev -- status
bun run dev -- sync --profile work
bun run dev -- push --dry-run
bun run dev -- doctor --verbose
bun run dev -- config get webdav.endpoint
bun run dev -- config set syncId macbook-pro
```

## 常见使用场景

### 同步 Claude Code 配置

```bash
bun run dev -- sync --profile work
```

### 只预览变更，不真正上传

```bash
bun run dev -- push --dry-run
```

### 多设备使用不同 profile

```bash
bun run dev -- sync --profile personal
bun run dev -- sync --profile work
```

## 项目结构

```text
src/
├── cli/          # CLI 路由与命令解析
├── config/       # 配置加载、schema 校验、变量插值
├── credentials/  # 凭证来源与解析
├── hooks/        # 生命周期钩子
├── output/       # 输出与进度展示
├── security/     # 敏感信息扫描与脱敏
├── sync/         # File / Git / Link 三种同步模式
├── utils/        # 通用工具与错误模型
├── webdav/       # WebDAV 客户端与锁管理
├── index.ts      # CLI 入口
└── types.ts      # 核心类型定义

test/
├── cli.test.ts
├── config-*.test.ts
├── credentials*.test.ts
├── security.test.ts
├── sync*.test.ts
├── webdav*.test.ts
└── docs-ci.test.ts
```

## 开发

### 常用命令

```bash
bun run typecheck
bun run lint
bun run lint:fix
bun run format
bun run format:check
bun test
bun run test:coverage
bun run docs
bun run docs:check
bun run check
```

### 一次性完整检查

```bash
bun run check
```

该命令会依次执行：

- TypeScript 类型检查
- ESLint 检查
- Prettier 格式检查
- TypeDoc 文档校验
- Bun test 测试

## 文档

### 生成 API 文档

```bash
bun run docs
```

### 校验文档生成是否正常

```bash
bun run docs:check
```

生成结果位于：

```bash
docs/
```

项目已包含 GitHub Pages 发布流程，可将 TypeDoc 输出直接发布为文档站点。

## 测试覆盖率

当前项目测试覆盖率目标为 **90%+**。

当前已记录覆盖率：

- Functions: 98.26%
- Lines: 93.35%

如需更新，请运行：

```bash
bun run test:coverage
```

## 当前状态

当前版本已经具备：

- CLI 基础命令
- 配置 schema 与加载能力
- WebDAV 客户端与锁机制
- File / Git / Link 三种同步模式
- 安全扫描与日志脱敏
- 文档与测试基础设施

后续可以继续增强：

- Windows 支持
- 更完整的 init 向导体验
- 更细粒度的冲突解决策略
- 更丰富的远程状态对比与预览输出

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## Notes

This project was primarily created and iterated with AI-assisted development workflows.
