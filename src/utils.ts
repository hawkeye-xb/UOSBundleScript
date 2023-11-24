import fs from "fs";
import { DesktopEntryType, controlFileType } from "../types";
import { ShellString } from "shelljs";
import shell from 'shelljs';

export function controlFileToString(options: controlFileType) {
  const { Source, Section, Priority, Maintainer, StandardsVersion, Homepage, Package, Architecture, VcsBrowser, VcsGit } = options;
  return `Source: ${Source}
Section: ${Section}
Priority: ${Priority}
Maintainer: ${Maintainer}
Standards-Version: ${StandardsVersion}
Homepage: ${Homepage}
#Vcs-Browser: ${VcsBrowser}
#Vcs-Git: ${VcsGit}

Package: ${Package}
Architecture: ${Architecture}
Description: ${Package}
`;
}

export function desktopEntryToString(options: DesktopEntryType) {
  const { Categories, Name, GenericName, Type, Exec, Icon, MimeTypes } = options;
  return `[Desktop Entry]
Categories=${Categories}
Name=${Name}
GenericName=${GenericName}
Type=${Type}
Exec=${Exec}
Icon=${Icon}
${MimeTypes ? `MimeType=${MimeTypes}` : ''}
`;
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