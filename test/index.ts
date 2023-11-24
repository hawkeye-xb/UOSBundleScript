import { join } from "path";
import { buildUOS } from "..";

async function run(){
  const currentDir = process.cwd();

  const appId = 'com.electron.builduos';
  const name = 'buildUos';
  const execFileName = 'electron-godan';

  await buildUOS({
    svgPath: join(currentDir, 'src', 'icon.svg'),
    appId,
    unpackedDir: join(currentDir, 'src', 'linux-arm64-unpacked'),
    DesktopInfo: {
      appId,
      name,
      version: '1.0.0',
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
}

run();
