
type DesktopInfoPermissionType = {
  autostart: boolean;
  notification: boolean;
  trayicon: boolean;
  clipboard: boolean;
  account: boolean;
  bluetooth: boolean;
  camera: boolean;
  audio_record: boolean;
  installed_apps: boolean;
}

type DesktopInfoType = {
  appId: string;
  name: string;
  version: string;
  description: string;
  permissions?: DesktopInfoPermissionType;
  [key: string]: string | undefined;
}

export type TemplateDirType = {
  appId: string;
  version: string;
  packageName?: string;
  output?: string;
  svgPath: string;
  desktopEntryFileContent: string;
  desktopInfoFileContent?: DesktopInfoType;
  unpackedDir: string;
}

export type DesktopEntryType = {
  Categories: string;
  Name: string;
  GenericName: string;
  Type: string;
  Exec: string;
  Icon: string;
  MimeTypes?: string;
  Comment?: string;
  Terminal?: string;
  StartupNotify?: string;
  [key: string]: string | undefined;
}

export type BuildUOSType = {
  version: string; // version number
  output?: string; // output directory
  svgPath: string; // path to the SVG file (app icon)
  appId: string; // app id
  unpackedDir: string; // path to the unpacked directory
  DesktopInfo: DesktopInfoType;
  DesktopEntry: DesktopEntryType;
  controlFile: controlFileType;
  // lifecycle
  beforeGenerateTemplateDir?: () => void;
  afterGenerateTemplateDir?: (templatePath: string) => void;
  beforePack?: () => void;
  afterPack?: () => void;
  removeTemplateDir?: boolean;
  beforeRemoveTemplateDir?: () => void;
  afterRemoveTemplateDir?: () => void;
}

export type controlFileType = {
  Source: string;
  Section: string;
  Priority: string;
  Maintainer: string;
  // BuildDepends: string;
  StandardsVersion: string;
  Homepage: string;
  VcsBrowser: string;
  VcsGit: string; 
  Package: string;
  Architecture: string;
  // Depends: string;
  Description: string;
  [key: string]: string | undefined;
}
