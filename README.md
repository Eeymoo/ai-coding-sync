# AI-Coding-Sync

> Last Updated: 2026-04-03 10:58

## Overview

AI-Coding-Sync 是一个基于 Bun.js 的 AI 开发配置同步 CLI 工具，用于将 `.claude`、`.opencode`、`.cursor` 等 AI 工具配置通过 WebDAV 在多设备之间同步，支持 Git / File / Link 三种同步模式、多 profile 配置、并发锁、安全扫描与钩子扩展。

## Requirements Confirmed

> [DONE] Confirmed by user on 2026-04-03 10:59

### Core Features

- 配置初始化向导：支持 `init` 交互式生成配置与首次连接测试。
- 配置管理：支持主配置、profiles、mappings、变量替换与凭证策略。
- WebDAV 同步：支持 `sync` / `push` / `pull` / `status` / `doctor` / `config get` / `config set`。
- 三模式同步：本次按完整规范实现 Git / File / Link 三种模式的核心能力。
- 多设备管理：支持 `syncId`、设备隔离目录、共享目录锁与并发控制。
- 安全能力：支持敏感信息扫描、默认敏感文件忽略、日志脱敏、SSL 校验控制。
- 恢复能力：支持错误码体系、重试、备份与回滚。
- 文档能力：README 持续维护，JSDoc/TypeDoc 配置与文档脚本落地。

### Technical Stack

- Runtime: Bun
- Language: TypeScript
- CLI: Bun-based CLI with a lightweight parser library
- Validation: Zod
- Test Framework: Bun test
- Output: TTY 人类可读输出 + 非 TTY JSON Lines 输出
- Primary Platform: 标准 bash / Unix-like 环境（Linux/macOS/类 Unix），Windows 后续补充

### Uncertainties Resolved

| Question            | Answer             | Notes                                            |
| ------------------- | ------------------ | ------------------------------------------------ |
| 交付范围            | Full spec now      | 一次性交付完整规范能力，而不是仅做 MVP           |
| 运行时约束          | Bun only           | 功能实现以 Bun 为主                              |
| 实现语言            | TypeScript         | 作为主要开发语言                                 |
| 首版平台支持        | Unix-like          | Linux/macOS/标准 bash 环境优先，Windows 后续补充 |
| CLI 参数解析        | Use tiny library   | 允许引入一个轻量 CLI 解析库                      |
| 配置校验            | Use Zod            | 使用 Zod 进行 schema 校验                        |
| 测试框架            | Bun test           | 使用 Bun test 覆盖核心逻辑与 CLI 行为            |
| 输出格式            | TTY+JSON           | TTY 文本 + 非 TTY JSON 行                        |
| 当前目录策略        | Initialize here    | 直接在当前空目录初始化完整项目                   |
| 文档交付            | Full docs          | README + JSDoc/TypeDoc + 文档脚本全部落地        |
| 锁机制              | Implement now      | 本版实现 WebDAV 锁文件、TTL 与心跳机制           |
| Git/Link 模式优先级 | Implement core now | 本版实现 Git 模式与 Link 模式核心流程            |

## Checklist Progress

### Overall Status

- Total: 39 items
- Completed: 39 items
- Progress: 100%

### Checklist Focus Areas

- [x] Project foundations and tooling
- [x] CLI and configuration resolution
- [x] Credentials and security controls
- [x] WebDAV client and distributed locking
- [x] File / Git / Link sync modes
- [x] UX, hooks, diagnostics, and error model
- [x] Tests, docs, and final verification

## Development Log

| Date       | Phase        | Status                     | Notes                                |
| ---------- | ------------ | -------------------------- | ------------------------------------ |
| 2026-04-03 | Requirements | [DONE] Confirmed           | 用户已确认需求范围与技术约束         |
| 2026-04-03 | Checklist    | [DONE] Created             | 已生成 39 项实现与验证清单           |
| 2026-04-03 | Architecture | [DONE] Skeleton            | 已创建目录结构、工具配置与 TODO 骨架 |
| 2026-04-03 | TDD          | [DONE] Core implementation | 已完成核心模块实现、测试与文档生成   |

## Technical Decisions

| Decision          | Choice           | Reason                                     |
| ----------------- | ---------------- | ------------------------------------------ |
| Runtime baseline  | Bun              | 满足零依赖运行时方向与高性能文件/网络 API  |
| Type safety       | TypeScript + Zod | 提升配置与同步逻辑可维护性                 |
| Test tool         | Bun test         | 与运行时统一，降低工具链复杂度             |
| Platform priority | Unix-like first  | 与标准 bash 场景更匹配，便于先完成稳定版本 |

## Project Structure

```text
src/
├── cli/          # CLI routing and command handlers
├── config/       # Config loading, schema validation, interpolation
├── credentials/  # Credential providers and secret lookup
├── hooks/        # Lifecycle hook execution
├── output/       # Progress and output formatting
├── security/     # Secret scanning and redaction
├── sync/         # File / Git / Link sync modes
├── utils/        # Shared utilities and errors
├── webdav/       # WebDAV client and locking
├── index.ts      # CLI entrypoint
└── types.ts      # Shared type definitions

test/
└── smoke.test.ts # Initial Bun test wiring
```

## API Documentation

- Generated API docs: `docs/`
- GitHub Actions workflow: `.github/workflows/publish-docs.yml`

### Publish Pipeline

The repository now includes an automated GitHub Pages publishing workflow that:

1. Installs dependencies with Bun
2. Runs `bun run check`
3. Runs `bun test --coverage`
4. Builds TypeDoc output
5. Publishes the generated TypeDoc site from `docs/` directly to GitHub Pages, including API references and project documentation.

### Commands

```bash
bun run docs          # Generate TypeDoc API docs
```

## CLI Usage

### Basic Usage

```bash
bun run dev -- <command> [options]
ai-coding-sync <command> [options]
```

### Supported Commands

| Command                    | Description                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| `init`                     | Initialize configuration interactively and validate the first connection |
| `sync`                     | Run the default bidirectional synchronization flow                       |
| `push`                     | Push local changes to the remote WebDAV target                           |
| `pull`                     | Pull remote changes into the local workspace                             |
| `status`                   | Show sync status, mapping state, and pending diagnostics                 |
| `doctor`                   | Run environment and configuration diagnostics                            |
| `config get <key>`         | Read a configuration value                                               |
| `config set <key> <value>` | Update a configuration value                                             |

### Global Options

These options are documented by the CLI parser and shared through the `GlobalCliOptions` type in the generated API docs.

| Option             | Description                                                      |
| ------------------ | ---------------------------------------------------------------- |
| `--profile <name>` | Use a named profile override for the current command             |
| `--dry-run`        | Preview actions without changing remote or local files           |
| `--force`          | Continue even when a command would normally require confirmation |
| `--yes`            | Auto-confirm prompts when supported                              |
| `--verbose`        | Emit more detailed CLI output for debugging                      |

### Examples

```bash
bun run dev -- status
bun run dev -- sync --profile work
bun run dev -- push --dry-run
bun run dev -- doctor --verbose
bun run dev -- config get webdav.endpoint
bun run dev -- config set syncId macbook-pro
```

### CLI Documentation Coverage

- CLI entrypoint: `src/index.ts`
- CLI parser and dispatcher: `src/cli/run-cli.ts`
- Shared CLI option types: `src/types.ts` (`CliCommandName`, `GlobalCliOptions`)
- CLI behavior tests: `test/cli.test.ts` and `test/cli-remaining.test.ts`

This means both the CLI API JSDoc and the human-readable CLI usage guide are included in the generated documentation set.

## Test Coverage

| Metric    | Coverage | Target |
| --------- | -------- | ------ |
| Functions | 98.26%   | 90%+   |
| Lines     | 93.35%   | 90%+   |

## Running the Project

```bash
bun install
bun run dev -- --help
bun run typecheck
bun run lint
bun run format:check
bun run docs:check
bun test
```
