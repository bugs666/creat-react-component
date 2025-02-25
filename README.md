# Creat-React-Component

一个用于快速生成 React 组件的命令行工具，支持生成普通组件和页面组件，并可以选择生成 TypeScript 或 JavaScript 文件。

## 安装

全局安装该工具：

```bash
npm install -g your-package-name
```

或者使用 `npx` 直接运行：

```bash
npx your-package-name generate MyComponent
```

## 使用

### 生成普通组件

生成一个普通的 React 组件：

```bash
rcc generate MyComponent
```

### 生成页面组件

生成一个页面组件：

```bash
rcc generate MyPage --page
```

### 生成 TypeScript 组件

生成一个 TypeScript 组件：

```bash
rcc generate MyComponent --typescript
```

### 生成 JavaScript 组件

生成一个 JavaScript 组件：

```bash
rcc generate MyComponent --javascript
```

## 选项

| 选项              | 描述                          |
|-------------------|-------------------------------|
| `-p, --page`      | 生成页面组件                  |
| `-c, --component` | 生成普通组件（默认）          |
| `-t, --typescript`| 生成 TypeScript 文件          |
| `-j, --javascript`| 生成 JavaScript 文件          |

## 示例

### 生成一个 TypeScript 页面组件

```bash
rcc generate MyPage --page --typescript
```

### 生成一个 JavaScript 普通组件

```bash
rcc generate MyComponent --javascript
```

## 项目结构

生成的组件结构如下：

### 普通组件

```
MyComponent/
├── index.jsx
└── index.js
```

### 页面组件

```
MyPage/
├── components/
│   └── index.js
├── services/
│   └── index.js
└── index.jsx
```

[//]: # (## 模板文件)

[//]: # ()
[//]: # (工具使用 Handlebars 模板引擎生成文件。你可以在 `templates/` 目录下自定义模板文件。)

[//]: # ()
[//]: # (### 普通组件模板 &#40;`templates/Component/components.hbs`&#41;)

[//]: # ()
[//]: # (```handlebars)

[//]: # (import React from 'react';)

[//]: # ()
[//]: # (const {{componentName}} = &#40;&#41; => {)

[//]: # (return &#40;)

[//]: # (<div>)

[//]: # (<h1>{{componentName}}</h1>)

[//]: # (</div>)

[//]: # (&#41;;)

[//]: # (};)

[//]: # ()
[//]: # (export default {{componentName}};)

[//]: # (```)

[//]: # ()
[//]: # (### 页面组件模板 &#40;`templates/PageComponent/page.hbs`&#41;)

[//]: # ()
[//]: # (```handlebars)

[//]: # (import React from 'react';)

[//]: # ()
[//]: # (const {{componentName}} = &#40;&#41; => {)

[//]: # (return &#40;)

[//]: # (<div>)

[//]: # (<h1>{{componentName}} Page</h1>)

[//]: # (</div>)

[//]: # (&#41;;)

[//]: # (};)

[//]: # ()
[//]: # (export default {{componentName}};)

[//]: # (```)

[//]: # ()
[//]: # (## 贡献)

[//]: # ()
[//]: # (欢迎提交 Issue 和 PR！如果你有任何问题或建议，请随时联系。)

[//]: # ()
[//]: # (## 许可证)

[//]: # ()
[//]: # (MIT)
