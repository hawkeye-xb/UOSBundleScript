import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import { BuildUOSType, TemplateDirType, DesktopEntryType, controlFileType } from './types';
import { rules, install } from './replaceFilesInfo';

/**
 * Create the following tree structure files and directories
 * └── opt
    └── apps
        └── com.example.app
            ├── entries
            │   └── applications
            │       ├── com.example.app.desktop // Desktop Entry File
            │       └── icons
            │           └── hicolor
            │               └── scalable
            │                   └── apps
            │                       └── com.example.app.svg
            ├── files // directory for files
            └── info // Desktop Info File
 */

const TemplateDirTypeDefault: TemplateDirType = {
  appId: 'com.example.app',
  svgPath: '',
  desktopEntryFileContent: `[Desktop Entry]`,
  unpackedDir: '',
  // desktopInfoFileContent: `{}`,
}

function generateTemplateDir(options: TemplateDirType = TemplateDirTypeDefault): string {
  const { appId, svgPath, desktopEntryFileContent, desktopInfoFileContent } = options;

  const currentDir = process.cwd();
  // todo: template 要换成最后包的名称
  const rootDir = path.join(currentDir, 'template', `opt/apps/${appId}`);
  const entriesDir = `${rootDir}/entries/applications`;
  const iconsDir = `${entriesDir}/icons/hicolor/scalable/apps`;
  const filesDir = `${rootDir}/files`;

  const desktopEntryFile = `${entriesDir}/${appId}.desktop`;
  const desktopInfoFile = `${rootDir}/info`;

  const dirs = [rootDir, entriesDir, iconsDir, filesDir];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      console.info('Creating directory: ', dir);
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  if (!fs.existsSync(desktopEntryFile)) {
    console.info('Creating file: ', desktopEntryFile);
    fs.writeFileSync(desktopEntryFile, desktopEntryFileContent);
  }

  if (!fs.existsSync(desktopInfoFile)) {
    console.info('Creating file: ', desktopInfoFile);
    fs.writeFileSync(desktopInfoFile, JSON.stringify(desktopInfoFileContent || {}, null, 2));
  }
  
  // 如果有 svgPath，就复制 svg 文件到 iconsDir，并且重名为 ${appId}.svg，如果没有 svgPath，就创建空的 svg 文件
  const svgFile = `${iconsDir}/${appId}.svg`;
  if (!fs.existsSync(svgFile)) {
    console.info('Creating file: ', svgFile);
    if (svgPath) {
      fs.copyFileSync(svgPath, svgFile);
    } else {
      fs.writeFileSync(svgFile, '');
    }
  }

  // unpackedDir 复制并且替换files目录，目录名保留
  if (fs.existsSync(filesDir)) {
    fs.rmSync(filesDir, { recursive: true });
  }
  
  console.info('Copying directory: ', filesDir);
  shell.cp('-R', options.unpackedDir, filesDir);

  // 返回当前模板目录
  return rootDir;
}
function removeTemplateDir(rootDir: string) {
  // const currentDir = process.cwd();
  // const rootDir = path.join(currentDir, 'template');
  if (fs.existsSync(rootDir)) {
    fs.rmSync(rootDir, { recursive: true });
  }
}

function desktopEntryToString(options: DesktopEntryType) {
  const { Categories, Name, GenericName, Type, Exec, Icon, MimeTypes } = options;
  return `[Desktop Entry]
Categories=${Categories}
Name=${Name}
GenericName=${GenericName}
Type=${Type}
Exec=${Exec}
Icon=${Icon}
MimeTypes=${MimeTypes}
`;
}

export async function buildUOS(options: BuildUOSType) {
  const { svgPath, appId, unpackedDir, DesktopEntry, DesktopInfo, controlFile } = options;
  
  // 1. 创建模板目录
  if (options.beforeGenerateTemplateDir) {
    options.beforeGenerateTemplateDir();
  }

  const rootDir = generateTemplateDir({
    appId,
    svgPath,
    unpackedDir,
    desktopEntryFileContent: desktopEntryToString(DesktopEntry),
    desktopInfoFileContent: DesktopInfo,
  });

  if (options.afterGenerateTemplateDir) {
    options.afterGenerateTemplateDir(rootDir);
  }

  // 2. 打包
  if (options.beforePack) {
    options.beforePack();
  }

  try {
    pack(rootDir, controlFile);
  } catch (error) {
    console.warn('Pack error: ', error);
  }

  if (options.afterPack) {
    options.afterPack();
  }

  // 3. 删除模板目录
  if (options.beforeRemoveTemplateDir) {
    options.beforeRemoveTemplateDir();
  }

  // console.info('removeTemplateDir: ', rootDir);
  // removeTemplateDir(rootDir);

  if (options.afterRemoveTemplateDir) {
    options.afterRemoveTemplateDir();
  }
}

// 打包
function pack(rootDir: string, controlFileInfo: controlFileType) {
  console.info('start pack');
  shell.exec(`cd ${rootDir} && USER=root dh_make --createorig -s -n -y`)
  
  const debianDir = path.join(rootDir, 'debian');
  console.info('debianDir: ', debianDir);

  shell.exec(`cd ${debianDir} && rm *.ex *.EX`)
	shell.exec(`cd ${debianDir} && rm -rf *.docs README README.* `)
	shell.exec(`cd ${debianDir} && rm control rules`)
	// shell.exec(`cd ${debianDir} && ls -al`)

  // 3. 替换文件
  // 3.1 替换 control 文件
  const controlFile = path.join(debianDir, 'control');
  console.info('controlFile: ', controlFile);
  if (fs.existsSync(controlFile)) {
    fs.rmSync(controlFile);
  }
  fs.writeFileSync(controlFile, controlFileToString(controlFileInfo));

  // 3.2 替换 rules 文件
  const rulesFile = path.join(debianDir, 'rules');
  console.info('rulesFile: ', rulesFile);
  if (fs.existsSync(rulesFile)) {
    fs.rmSync(rulesFile);
  }
  fs.writeFileSync(rulesFile, rules);

  // 3.3 替换 install 文件
  const installFile = path.join(debianDir, 'install');
  console.info('installFile: ', installFile);
  if (fs.existsSync(installFile)) {
    fs.rmSync(installFile);
  }
  fs.writeFileSync(installFile, install);

  // 4. 打包
  shell.exec(`cd ${rootDir} && fakeroot dpkg-buildpackage -b -us -uc`);
}

function controlFileToString(options: controlFileType) {
  const { Source, Section, Priority, Maintainer, BuildDepends, StandardsVersion, Homepage, Package, Architecture } = options;
  return `Source: ${Source}
Section: ${Section}
Priority: ${Priority}
Maintainer: ${Maintainer}
Build-Depends: ${BuildDepends}
Standards-Version: ${StandardsVersion}
Homepage: ${Homepage}
Package: ${Package}
Architecture: ${Architecture}
Description: ${Package}
`;
}
