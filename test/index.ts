import fs from 'fs';
import { join } from "path";
import shell from 'shelljs';
import { buildUOS } from "..";

async function run(){
  const currentDir = process.cwd();

  const appId = 'com.electron.builduos';
  const name = 'buildUos';
  const execFileName = 'electron-godan';
  const version = '1.0.0';
  const output = join(currentDir, 'output');

  await buildUOS({
    output, appId,
    svgPath: join(currentDir, 'static', 'icon.svg'),
    unpackedDir: join(currentDir, 'static', 'linux-arm64-unpacked'),
    DesktopInfo: {
      appId, name, version,
      description: 'desc',
    },
    DesktopEntry: {
      Categories: 'dev', //
      Name: name,
      GenericName: name,
      Type: 'Application',
      Exec: `/opt/apps/${appId}/files/${execFileName} %U --no-sandbox`,
      Icon: `${appId}`,
    // MimeType=x-scheme-handler/[URL Scheme];x-scheme-handler/[URL Scheme];
    },
    controlFile: {
      Source: appId,
      Section: 'dev',
      Priority: 'optional',
      Maintainer: 'godaner<690591397@qq.com>',
      // BuildDepends: 'debhelper (>= 11)',
      StandardsVersion: '4.1.3',
      Homepage: 'https://github.com/690591397',
      VcsBrowser: 'https://salsa.debian.org/debian/com.electron.builduos',
      VcsGit: 'https://salsa.debian.org/debian/com.electron.builduos.git',
      Package: appId,
      Architecture: 'any',
      Description: 'desc',
    }
  });

  shell.exec('ls -al ./output');
  checkDebFileExists(output, appId, version, 'arm64');  
}

run();

function checkDebFileExists(output: string, appId: string, version: string, arch: string): void {
  const debFilePath = `${output}/${appId}_${version}_${arch}.deb`;

  if (fs.existsSync(debFilePath)) {
    console.log(`File ${debFilePath} exists.`);
  } else {
    console.error(`File ${debFilePath} does not exist.`);
    process.exit(1);
  }
}
