import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import { BuildUOSType, TemplateDirType, DesktopEntryType, controlFileType } from './types';
import { rules, install } from './replaceFilesInfo';
import { controlFileToString, desktopEntryToString, exec, writeFileBeforeRemoveSync } from './src/utils';

/**
  Create the following tree structure files and directories
  └── opt
    └── apps
        └── com.example.app-1.0.0
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

function generateTemplateDir(options: TemplateDirType): string {
  const { appId, svgPath, desktopEntryFileContent, desktopInfoFileContent, packageName, output } = options;

  const currentDir = output || process.cwd(); // root

  const packageDirName = packageName || `${appId}-1.0.0`;
  const packageDir = path.join(currentDir, packageDirName); // root/${com.example.app-1.0.0}

  const desktopDir = path.join(packageDir, `opt/apps/${appId}`); // root/${com.example.app-1.0.0}/opt/apps/${com.example.app}

  const entriesApplicationsDir = `${desktopDir}/entries/applications`; // root/${com.example.app-1.0.0}/opt/apps/${com.example.app}/entries/applications`;
  const iconsDir = `${entriesApplicationsDir}/icons/hicolor/scalable/apps`; // root/${com.example.app-1.0.0}/opt/apps/${com.example.app}/entries/applications/icons/hicolor/scalable/apps`;
  const filesDir = `${desktopDir}/files`;

  const desktopEntryFile = `${entriesApplicationsDir}/${appId}.desktop`;
  const desktopInfoFile = `${desktopDir}/info`;

  const dirs = [desktopDir, entriesApplicationsDir, iconsDir];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  if (!fs.existsSync(desktopEntryFile)) {
    fs.writeFileSync(desktopEntryFile, desktopEntryFileContent);
  }

  if (!fs.existsSync(desktopInfoFile)) {
    fs.writeFileSync(desktopInfoFile, JSON.stringify(desktopInfoFileContent || {}, null, 2));
  }
  
  // 如果有 svgPath，就复制 svg 文件到 iconsDir，并且重名为 ${appId}.svg，如果没有 svgPath，就创建空的 svg 文件
  const svgFile = `${iconsDir}/${appId}.svg`;
  if (!fs.existsSync(svgFile)) {
    fs.copyFileSync(svgPath, svgFile);
  }

  // unpackedDir 复制并且替换files目录，目录名保留
  if (fs.existsSync(filesDir)) {
    fs.rmSync(filesDir, { recursive: true });
  }
  shell.cp('-R', options.unpackedDir, filesDir);

  // 返回当前模板目录
  return packageDir;
}
function removeTemplateDir(rootDir: string) {
  console.info('Removing directory: ', rootDir);
  if (fs.existsSync(rootDir)) {
    fs.rmSync(rootDir, { recursive: true });
  }
}

export async function buildUOS(options: BuildUOSType) {
  const { svgPath, appId, unpackedDir, DesktopEntry, DesktopInfo, controlFile } = options;

  options?.beforeGenerateTemplateDir?.();

  const rootDir = generateTemplateDir({
    appId,
    svgPath,
    output: path.join(process.cwd(), 'output'),
    unpackedDir,
    desktopEntryFileContent: desktopEntryToString(DesktopEntry),
    desktopInfoFileContent: DesktopInfo,
  });

  options?.afterGenerateTemplateDir?.(rootDir);
  options?.beforePack?.();

  pack(rootDir, controlFile);

  options?.afterPack?.();
  options?.beforeRemoveTemplateDir?.();

  if (options?.removeTemplateDir === undefined) {
    removeTemplateDir(rootDir);
  } else if (options?.removeTemplateDir) {
    removeTemplateDir(rootDir);
  }

  options?.afterRemoveTemplateDir?.();
}

// 打包
function pack(rootDir: string, controlFileInfo: controlFileType) {
  const debianDir = path.join(rootDir, 'debian');
  console.info('start pack, rootDir: ', rootDir, ' debainDir: ', debianDir);
  
  exec(`cd ${rootDir} && USER=root dh_make --createorig -s -n -y`)
  exec(`cd ${debianDir} && ls -al`)
  exec(`cd ${debianDir} && rm -rf *.docs README README.* *.ex *.EX control rules`)

  writeFileBeforeRemoveSync(path.join(debianDir, 'control'), controlFileToString(controlFileInfo));
  writeFileBeforeRemoveSync(path.join(debianDir, 'rules'), rules);
  writeFileBeforeRemoveSync(path.join(debianDir, 'install'), install);

  // fakeroot may not be necessary, it might depend on the environment version
  // https://github.com/frankaemika/franka_ros/issues/101 
  // https://frankaemika.github.io/docs/installation_linux.html
  // https://askubuntu.com/questions/834239/debian-control-doesnt-list-any-binary-package
  writeFileBeforeRemoveSync(path.join(debianDir, 'compat'), '13');
  shell.exec(`cd ${rootDir} && dpkg-buildpackage -b -us -uc`);
}
