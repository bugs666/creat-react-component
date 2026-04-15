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
    .option('-s, --scss', 'Generate an scss module stylesheet')
    .option('-l, --less', 'Generate a less module stylesheet')
    .option('-t, --typescript', 'Generate TypeScript files')
    .option('-j, --javascript', 'Generate JavaScript files')
    .action(async (componentName, options) => {
        try {
            const normalizedComponentName = validateComponentName(componentName);
            const {page, component, scss, less, typescript, javascript} = options;

            validateOptionConflicts({page, component, scss, less, typescript, javascript});

            const isPageComponent = page ? true : false;
            const isTypeScript = typescript ? true : false;
            const stylesheetType = resolveStylesheetType({scss, less});
            const fileExtension = isTypeScript ? 'tsx' : 'jsx';
            const templateType = isPageComponent ? 'PageComponent' : 'Component';
            const templatePath = path.join(__dirname, 'templates', templateType);
            const generateComponent = isPageComponent ? generatePageComponent : generateRegularComponent;

            const message = await generateComponent({
                componentName: normalizedComponentName,
                templatePath,
                fileExtension,
                stylesheetType
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
    const {componentName, templatePath, fileExtension, stylesheetType} = options;
    await ensureComponentPathIsReady(componentName);

    const currentDir = process.cwd();
    const baseDir = path.join(currentDir, componentName);
    const templateData = buildTemplateData(componentName, stylesheetType);

    await fsPromises.mkdir(baseDir, {recursive: true});
    await generateFileByTemplate({
        filePath: path.join(baseDir, `index.${fileExtension}`),
        templatePath: path.join(templatePath, 'components.hbs'),
        tempName: templateData.componentName,
        tempOption: templateData
    });
    await generateStylesheetFile(baseDir, stylesheetType);

    await ensureTypeScriptBarrelExport(currentDir, componentName);

    return chalk.green(`Component ${componentName} created successfully in ${baseDir}.`);
}

async function generatePageComponent(options) {
    const {componentName, templatePath, fileExtension, stylesheetType} = options;
    await ensureComponentPathIsReady(componentName);

    const dirs = ['services', 'components'];
    const currentDir = process.cwd();
    const baseDir = path.join(currentDir, componentName);
    const templateData = buildTemplateData(componentName, stylesheetType);

    await fsPromises.mkdir(baseDir, {recursive: true});
    await generateFileByTemplate({
        filePath: path.join(baseDir, `index.${fileExtension}`),
        templatePath: path.join(templatePath, 'page.hbs'),
        tempName: templateData.componentName,
        tempOption: templateData
    });
    await generateStylesheetFile(baseDir, stylesheetType);

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
    const {page, component, scss, less, typescript, javascript} = options;

    if (page && component) {
        throw new Error('Choose either --page or --component, not both.');
    }

    if (scss && less) {
        throw new Error('Choose either --scss or --less, not both.');
    }

    if (typescript && javascript) {
        throw new Error('Choose either --typescript or --javascript, not both.');
    }
}

function resolveStylesheetType(options) {
    const {scss, less} = options;

    if (scss) {
        return 'scss';
    }

    if (less) {
        return 'less';
    }

    return null;
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

async function ensureTypeScriptBarrelExport(currentDir, componentName) {
    // 组件统一导出到 index.ts，不存在时自动补建一个 barrel 文件。
    const outsideIndex = path.join(currentDir, 'index.ts');
    const exportStatement = `export * from './${componentName}';`;
    let existingContent = '';

    try {
        existingContent = await fsPromises.readFile(outsideIndex, 'utf8');
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    if (existingContent.includes(exportStatement)) {
        return;
    }

    await fsPromises.appendFile(outsideIndex, `${exportStatement}\n`);
}

function buildTemplateData(componentName, stylesheetType) {
    const normalizedComponentName = camelCase(componentName, {pascalCase: true});

    return {
        componentName: normalizedComponentName,
        hasStylesheet: Boolean(stylesheetType),
        stylesheetImportPath: stylesheetType ? `./index.module.${stylesheetType}` : '',
        stylesheetContainerProps: stylesheetType ? ' className={styles.container}' : ''
    };
}

async function generateStylesheetFile(baseDir, stylesheetType) {
    if (!stylesheetType) {
        return;
    }

    // 预置一个基础类名，避免模板里引入 styles 后完全未使用。
    const stylesheetFilePath = path.join(baseDir, `index.module.${stylesheetType}`);
    await fsPromises.writeFile(stylesheetFilePath, '.container {\n}\n');
}

async function generateFileByTemplate(option) {
    const {filePath, templatePath, tempName, tempOption = {}} = option;
    const fileContent = await fsPromises.readFile(templatePath, 'utf8');
    const template = handlebars.compile(fileContent);
    const content = template({componentName: tempName, ...tempOption});

    await fsPromises.writeFile(filePath, content);
}
