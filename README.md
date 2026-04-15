# Create React Component

一个用于快速生成 React 组件的命令行工具。当前版本支持：

- 生成普通组件和页面组件
- 生成 `jsx` / `tsx` 入口文件
- 生成 `scss` / `less` 模块化样式文件
- 在普通组件创建时自动补全外层 `index.ts` 导出

## 安装

全局安装：

```bash
npm install -g @zxx_npm/create-react-component
```

临时执行：

```bash
npx @zxx_npm/create-react-component generate MyComponent
```

安装后会注册命令：

```bash
rcc
```

## 命令

### `rcc generate <componentName>`

生成一个新的 React 组件目录。

别名：

```bash
rcc g <componentName>
```

## 选项

| 选项 | 说明 |
| --- | --- |
| `-p, --page` | 生成页面组件 |
| `-c, --component` | 生成普通组件，默认行为 |
| `-t, --typescript` | 生成 `tsx` / `ts` 文件 |
| `-j, --javascript` | 生成 `jsx` / `js` 文件，默认行为 |
| `-s, --scss` | 生成 `index.module.scss` |
| `-l, --less` | 生成 `index.module.less` |

互斥规则：

- `--page` 和 `--component` 不能同时传
- `--typescript` 和 `--javascript` 不能同时传
- `--scss` 和 `--less` 不能同时传

组件名规则：

- 只能以字母开头
- 只能包含字母、数字、`_`、`-`

## 用法示例

生成普通组件：

```bash
rcc generate MyComponent
```

生成 TypeScript 普通组件：

```bash
rcc generate MyComponent --typescript
```

生成带 `scss` 模块样式的普通组件：

```bash
rcc generate MyComponent --scss
```

生成带 `less` 模块样式的 TypeScript 页面组件：

```bash
rcc generate MyPage --page --typescript --less
```

## 生成结果

### 普通组件

命令：

```bash
rcc generate MyComponent --scss
```

生成目录：

```text
MyComponent/
├── index.jsx
└── index.module.scss
```

生成的 `index.jsx` 会包含样式导入：

```jsx
import React from 'react';
import styles from './index.module.scss';

export const MyComponent = () => {
    return (
        <div className={styles.container}>
            <h1>MyComponent</h1>
        </div>
    );
};
```

如果当前目录不存在 `index.ts`，工具会自动创建；存在则追加导出：

```ts
export * from './MyComponent';
```

### 页面组件

命令：

```bash
rcc generate MyPage --page --typescript --less
```

生成目录：

```text
MyPage/
├── components/
│   └── index.ts
├── index.module.less
├── index.tsx
└── services/
    └── index.ts
```

其中页面入口会自动引入样式文件：

```tsx
import React from 'react';
import styles from './index.module.less';

const MyPage = () => {
    return (
        <div className={styles.container}>
            <h1>MyPage</h1>
        </div>
    );
};

export default MyPage;
```

## 开发

构建命令：

```bash
npm run build
```

本地联调：

```bash
npm link
rcc --version
```
