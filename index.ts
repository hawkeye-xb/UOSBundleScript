import fs from 'fs';
import path from 'path';

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

type TemplateDirType = {
  appleId: string;
  svgPath?: string;
  desktopEntryFileContent: string;
  desktopInfoFileContent: string;
}

const TemplateDirTypeDefault: TemplateDirType = {
  appleId: 'com.example.app',
  svgPath: '',
  desktopEntryFileContent: `[Desktop Entry]`,
  desktopInfoFileContent: `{}`,
}

function generateTemplateDir(options: TemplateDirType = TemplateDirTypeDefault) {
  const { appleId, svgPath, desktopEntryFileContent, desktopInfoFileContent } = options;

  const currentDir = process.cwd();
  const rootDir = path.join(currentDir, 'template', `opt/apps/${appleId}`);
  const entriesDir = `${rootDir}/entries/applications`;
  const iconsDir = `${entriesDir}/icons/hicolor/scalable/apps`;
  const filesDir = `${rootDir}/files`;

  const desktopEntryFile = `${entriesDir}/${appleId}.desktop`;
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
    fs.writeFileSync(desktopInfoFile, desktopInfoFileContent);
  }
  
  // 如果有 svgPath，就复制 svg 文件到 iconsDir，并且重名为 ${appleId}.svg，如果没有 svgPath，就创建空的 svg 文件
  const svgFile = `${iconsDir}/${appleId}.svg`;
  if (!fs.existsSync(svgFile)) {
    console.info('Creating file: ', svgFile);
    if (svgPath) {
      fs.copyFileSync(svgPath, svgFile);
    } else {
      fs.writeFileSync(svgFile, '');
    }
  }
}
function removeTemplateDir() {
  const currentDir = process.cwd();
  const rootDir = path.join(currentDir, 'template');
  if (fs.existsSync(rootDir)) {
    fs.rmSync(rootDir, { recursive: true });
  }
}

removeTemplateDir();
generateTemplateDir();
// setTimeout(() => {
//   removeTemplateDir();
// }, 2000);
