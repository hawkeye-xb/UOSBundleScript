# UOSBundleScript

## Introduction

This project provides a simple, efficient way to build an Electron app into an
executable package for the UOS operating system, with the goal of enriching the
application ecosystem of Chinese domestic operating systems. For the detailed
packaging walkthrough, see the [provided tutorial](how-to-build-a-compliant-uos-package.md).

## What the script does

The script builds an Electron app into a UOS-platform executable package.
(The codebase is small and worth reading when needed: it creates the required
directories and files, runs the series of deb build commands, and patches files.)

## Configuration

### All fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| output | string | Output path |
| appId | string | Application ID |
| svgPath | string | Path to the SVG icon. PNG is not recommended — you would have to manage assets at many sizes |
| unpackedDir | string | Path to the unpacked directory produced by electron-builder |
| DesktopInfo | DesktopInfoType | Desktop info type |
| DesktopEntry | DesktopEntryType | Desktop entry type |
| controlFile | controlFileType | Control file type |
| beforeGenerateTemplateDir | function (optional) | Runs before the template directory is generated |
| afterGenerateTemplateDir | function (optional) | Runs after the template directory is generated; receives the template path |
| beforePack | function (optional) | Runs before packing |
| afterPack | function (optional) | Runs after packing |
| removeTemplateDir | boolean (optional) | Whether to remove the template directory |
| beforeRemoveTemplateDir | function (optional) | Runs before the template directory is removed |
| afterRemoveTemplateDir | function (optional) | Runs after the template directory is removed |

### DesktopInfoType

| Field | Type | Description |
| ----- | ---- | ----------- |
| appId | string | Application ID |
| name | string | Application name |
| version | string | Application version |
| description | string | Application description |
| permissions | DesktopInfoPermissionType (optional) | Application permission info |

### DesktopEntryType

| Field | Type | Description |
| ----- | ---- | ----------- |
| Categories | string | Application category |
| Name | string | Application name |
| GenericName | string | Generic name |
| Type | string | Type |
| Exec | string | Launch command |
| Icon | string | Icon |
| MimeTypes | string (optional) | MIME types |
| Comment | string (optional) | Comment |
| Terminal | string (optional) | Whether to run in a terminal |
| StartupNotify | string (optional) | Whether to notify on startup |
| [key: string] | string or undefined | Any other fields |

### controlFileType

| Field | Type | Description |
| ----- | ---- | ----------- |
| Source | string | Source package info |
| Section | string | Package section |
| Priority | string | Package priority |
| Maintainer | string | Maintainer info |
| StandardsVersion | string | Standards version |
| Homepage | string | Homepage URL |
| VcsBrowser | string | VCS browser URL |
| VcsGit | string | Git VCS URL |
| Package | string | Package name |
| Architecture | string | Architecture |
| Description | string | Package description |
| [key: string] | string or undefined | Any other fields |

## Usage

```js
const appId = 'com.electron.builduos';
const name = 'buildUos';
const execFileName = 'electron-godan';
const version = '1.0.0';
const output = join(currentDir, 'output');

await buildUOS({
  output, appId,
  svgPath: join(currentDir, 'static', 'icon.svg'),
  unpackedDir: join(currentDir, 'static', 'linux-arm64-unpacked'),
  removeTemplateDir: false,
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

```

## Development

1. Clone the project locally
1. Install dependencies: `npm install`
1. Set up the build environment; Ubuntu:latest is currently used (share the project into docker)
1. Build for Linux with Electron and move the resulting unpacked directory into `static` (the current executable is hello world)
1. Adjust the test file's input parameters
1. `npm run test`


## Contributing

Issues and improvement requests are welcome.


## License

This project is licensed under the [MIT License](LICENSE).

----

Part of the project and its documentation references content from the UnionTech UOS
official website and its technical support team.
