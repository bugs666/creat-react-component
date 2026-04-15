#!/usr/bin/env node

const {program} = require('commander');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
import chalk from 'chalk';
import camelCase from 'camelcase';

import {name as packageName, version as localVersion} from './package.json';

const {promises: fsPromises} = fs;
const VALID_COMPONENT_NAME = /^[A-Za-z][A-Za-z0-9_-]*$/;

program
    .name(packageName)
    .version(localVersion)
    .description('A CLI tool to generate React components');

program
    .command('generate <componentName>')
    .alias('g')
    .description('Generate a new React component')
    .option('-p, --page', 'Generate a page component')
    .option('-c, --component', 'Generate a regular component')
    .option('-t, --typescript', 'Generate TypeScript files')
    .option('-j, --javascript', 'Generate JavaScript files')
    .action(async (componentName, options) => {
        try {
            const normalizedComponentName = validateComponentName(componentName);
            const {page, component, typescript, javascript} = options;

            validateOptionConflicts({page, component, typescript, javascript});

            const isPageComponent = page ? true : false;
            const isTypeScript = typescript ? true : false;
            const fileExtension = isTypeScript ? 'tsx' : 'jsx';
            const templateType = isPageComponent ? 'PageComponent' : 'Component';
            const templatePath = path.join(__dirname, 'templates', templateType);
            const generateComponent = isPageComponent ? generatePageComponent : generateRegularComponent;

            const message = await generateComponent({
                componentName: normalizedComponentName,
                templatePath,
                fileExtension
            });

            console.log(message);
        } catch (error) {
            // 统一在 CLI 入口处理异常，避免同步文件错误直接把进程打崩。
            console.error(chalk.red(error.message));
            process.exitCode = 1;
        }
    });

program.parse(process.argv);

async function generateRegularComponent(options) {
    const {componentName, templatePath, fileExtension} = options;
    await ensureComponentPathIsReady(componentName);

    const currentDir = process.cwd();
    const baseDir = path.join(currentDir, componentName);

    await fsPromises.mkdir(baseDir, {recursive: true});
    await generateFileByTemplate({
        filePath: path.join(baseDir, `index.${fileExtension}`),
        templatePath: path.join(templatePath, 'components.hbs'),
        tempName: camelCase(componentName, {pascalCase: true})
    });

    await appendExportToBarrel(currentDir, componentName, fileExtension);

    return chalk.green(`Component ${componentName} created successfully in ${baseDir}.`);
}

async function generatePageComponent(options) {
    const {componentName, templatePath, fileExtension} = options;
    await ensureComponentPathIsReady(componentName);

    const dirs = ['services', 'components'];
    const currentDir = process.cwd();
    const baseDir = path.join(currentDir, componentName);

    await fsPromises.mkdir(baseDir, {recursive: true});
    await generateFileByTemplate({
        filePath: path.join(baseDir, `index.${fileExtension}`),
        templatePath: path.join(templatePath, 'page.hbs'),
        tempName: camelCase(componentName, {pascalCase: true})
    });

    for (const dir of dirs) {
        const createFilePath = path.join(baseDir, dir);
        const templateOption = {
            filePath: path.join(createFilePath, `index.${getModuleFileExtension(fileExtension)}`),
            templatePath: path.join(templatePath, `${dir}.hbs`),
            tempName: camelCase(componentName, {pascalCase: true})
        };

        await fsPromises.mkdir(createFilePath, {recursive: true});

        if (dir === 'services') {
            templateOption.tempOption = {
                serviceName: camelCase(componentName)
            };
        }

        await generateFileByTemplate(templateOption);
    }

    return chalk.green(`Component ${componentName} created successfully in ${baseDir}.`);
}

function validateComponentName(componentName) {
    const normalizedComponentName = componentName.trim();

    // 只接受单段目录名，避免通过 ../ 或路径分隔符把文件写到目标目录之外。
    if (!VALID_COMPONENT_NAME.test(normalizedComponentName)) {
        throw new Error('Component name must start with a letter and only contain letters, numbers, "_" or "-".');
    }

    return normalizedComponentName;
}

function validateOptionConflicts(options) {
    const {page, component, typescript, javascript} = options;

    if (page && component) {
        throw new Error('Choose either --page or --component, not both.');
    }

    if (typescript && javascript) {
        throw new Error('Choose either --typescript or --javascript, not both.');
    }
}

async function ensureComponentPathIsReady(componentName) {
    const componentPath = path.join(process.cwd(), componentName);

    try {
        await fsPromises.access(componentPath);
        throw new Error(`Component ${componentName} already exists.`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return;
        }

        throw error;
    }
}

function getModuleFileExtension(fileExtension) {
    return fileExtension.startsWith('ts') ? 'ts' : 'js';
}

function findBarrelFile(currentDir, fileExtension) {
    // 优先匹配当前语言的常见 barrel 文件，同时兼容 jsx/tsx 项目。
    const preferredFiles = fileExtension.startsWith('ts')
        ? ['index.ts', 'index.tsx', 'index.js', 'index.jsx']
        : ['index.js', 'index.jsx', 'index.ts', 'index.tsx'];

    for (const candidate of preferredFiles) {
        const candidatePath = path.join(currentDir, candidate);

        if (fs.existsSync(candidatePath)) {
            return candidatePath;
        }
    }

    return null;
}

async function appendExportToBarrel(currentDir, componentName, fileExtension) {
    const outsideIndex = findBarrelFile(currentDir, fileExtension);

    if (!outsideIndex) {
        return;
    }

    const exportStatement = `export * from './${componentName}';`;
    const existingContent = await fsPromises.readFile(outsideIndex, 'utf8');

    if (existingContent.includes(exportStatement)) {
        return;
    }

    await fsPromises.appendFile(outsideIndex, `${exportStatement}\n`);
}

async function generateFileByTemplate(option) {
    const {filePath, templatePath, tempName, tempOption = {}} = option;
    const fileContent = await fsPromises.readFile(templatePath, 'utf8');
    const template = handlebars.compile(fileContent);
    const content = template({componentName: tempName, ...tempOption});

    await fsPromises.writeFile(filePath, content);
}
