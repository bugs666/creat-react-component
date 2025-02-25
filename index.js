#!/usr/bin/env node

const {program} = require('commander');
const fs = require('fs');
const path = require('path');
const handlebars = require("handlebars");
import chalk from "chalk";
import camelCase from "camelcase";

import {name as packageName, version as localVersion} from "./package.json";
// 定义命令行工具的名称和版本
program
    .name(packageName)
    .version(localVersion)
    .description('A CLI tool to generate React components');

// 定义生成组件的命令
program
    .command('generate <componentName>')
    .alias('g')
    .description('Generate a new React component')
    .option('-p, --page', 'Generate a page component')
    .option('-c, --component', 'Generate a regular component')
    .option('-t, --typescript', 'Generate TypeScript files')
    .option('-j, --javascript', 'Generate JavaScript files')
    .action((componentName, options) => {
        const {page, component, typescript, javascript} = options;
        // 默认生成普通组件
        const isPageComponent = !!page;
        const isTypeScript = !!typescript;

        // 确定文件扩展名
        const fileExtension = isTypeScript ? 'tsx' : 'jsx';

        // 确定模板路径
        const templateType = isPageComponent ? 'PageComponent' : 'Component';
        const templatePath = path.join(__dirname, 'templates', templateType);

        // 生成组件
        const generateComponent = isPageComponent ? generatePageComponent : generateRegularComponent;
        generateComponent({
            componentName,
            templatePath,
            fileExtension
        }).then(console.log).catch(console.error)
    });

// 解析命令行参数
program.parse(process.argv);

function generateRegularComponent(options) {
    const {componentName, templatePath, fileExtension} = options;
    const isReady = pathIsReady(componentName);
    if (isReady) return Promise.reject(isReady);
    const currentDir = process.cwd();
    const baseDir = path.join(currentDir, componentName);
    fs.mkdirSync(baseDir, {recursive: true});
    generateFileByTemplate({
        filePath: path.join(baseDir, `index.${fileExtension}`),
        templatePath: path.join(templatePath, 'components.hbs'),
        tempName: camelCase(componentName, {pascalCase: true})
    })
    // 将新增的组件在最外层的index文件中导出
    const outsideIndex = path.join(currentDir, `index.${fileExtension.substring(0, 2)}`)
    if (fs.existsSync(outsideIndex)) {
        fs.appendFile(outsideIndex, `export * from './${componentName}';\n`, console.error)
    }
    return Promise.resolve(chalk.green(`Component ${componentName} created successfully in ${baseDir}.`));
}

function generatePageComponent(options) {
    const {componentName, templatePath, fileExtension} = options;
    const isReady = pathIsReady(componentName);
    if (isReady) return Promise.reject(isReady);
    const dirs = ['services', 'components']
    const currentDir = process.cwd();
    const baseDir = path.join(currentDir, componentName)
    fs.mkdirSync(baseDir, {recursive: true});
    generateFileByTemplate({
        filePath: path.join(baseDir, `index.${fileExtension}`),
        templatePath: path.join(templatePath, 'page.hbs'),
        tempName: camelCase(componentName, {pascalCase: true})
    })
    dirs.forEach(dir => {
        // 创建组件目录
        const createFilePath = path.join(baseDir, dir);
        fs.mkdirSync(createFilePath, {recursive: true});
        const templateOption = {
            filePath: path.join(createFilePath, `index.${fileExtension.substring(0, 2)}`),
            templatePath: path.join(templatePath, `${dir}.hbs`),
            tempName: camelCase(componentName, {pascalCase: true})
        };
        if (dir === 'services') {
            templateOption.tempOption = {
                serviceName: camelCase(componentName)
            }
        }
        generateFileByTemplate(templateOption);
    });
    return Promise.resolve(chalk.green(`Component ${componentName} created successfully in ${baseDir}.`));
}

function pathIsReady(componentName) {
    const componentPath = path.join(process.cwd(), componentName);
    // 检查组件是否已经存在
    if (fs.existsSync(componentPath)) {
        return chalk.red(`Component ${componentName} already exists.`);
    }
    return false;
}

function generateFileByTemplate(option) {
    // 读取模板文件
    const {filePath, templatePath, tempName, tempOption = {}} = option;
    const fileContent = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(fileContent);
    const content = template({componentName: tempName, ...tempOption});

    fs.writeFileSync(filePath, content);
}
