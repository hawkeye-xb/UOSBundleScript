import fs from "fs";
import { DesktopEntryType, controlFileType } from "../types";
import { ShellString } from "shelljs";
import shell from 'shelljs';

export function controlFileToString(options: controlFileType) {
  const { Source, Section, Priority, Maintainer, StandardsVersion, Homepage, Package, Architecture, VcsBrowser, VcsGit, Description } = options;
  let result = `Source: ${Source}
Section: ${Section}
Priority: ${Priority}
Maintainer: ${Maintainer}
Standards-Version: ${StandardsVersion}
Homepage: ${Homepage}
#Vcs-Browser: ${VcsBrowser}
#Vcs-Git: ${VcsGit}

Package: ${Package}
Architecture: ${Architecture}
Description: ${Description}
`;

  for (const [key, value] of Object.entries(options)) {
    if (!['Source', 'Section', 'Priority', 'Maintainer', 'StandardsVersion', 'Homepage', 'Package', 'Architecture', 'VcsBrowser', 'VcsGit', 'Description'].includes(key)) {
      result += `${key}: ${value}\n`;
    }
  }

  return result;
}

export function desktopEntryToString(options: DesktopEntryType) {
  let result = '[Desktop Entry]\n';
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      result += `${key}=${value}\n`;
    }
  }
  return result;
}

export function writeFileBeforeRemoveSync(file: string, data: string | NodeJS.ArrayBufferView, options?: fs.WriteFileOptions | undefined): void {
  if (fs.existsSync(file)) {
    fs.rmSync(file);
  }
  fs.writeFileSync(file, data, options);
}

export function exec(command: string): ShellString {
  const res = shell.exec(command)
  // if (res.code !== 0) {
  //   throw new Error('shell failed' + res?.stderr);
  // }

  return res;
}