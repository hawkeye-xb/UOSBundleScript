# 项目名称

## 介绍

本项目旨在提供一种简便、高效的方式，将 Electron 应用构建为适用于 UOS 系统的可执行文件。目标是丰富和优化国产操作系统的应用生态。详细的打包方法，参考[提供的教程](https://github.com/hawkeye-xb/UOSBundleScript/blob/main/%E5%A6%82%E4%BD%95%E6%9E%84%E5%BB%BA%E7%AC%A6%E5%90%88%E8%A6%81%E6%B1%82%E7%9A%84%20UOS%20%E8%BD%AF%E4%BB%B6%E5%AE%89%E8%A3%85%E5%8C%85.md)。

## 脚本说明

该脚本用于将 Electron 应用构建为 UOS 平台可执行文件。
（代码量很少，有必要时候可以查看，创建对应需要的目录和文件，执行deb构建的系列指令，对文件修改。）

## 配置说明:
### ALL Field
| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| output | string | 输出路径 |
| appId | string | 应用ID |
| svgPath | string | SVG图标路径，不建议使用png，需要管理各种尺寸的资源 |
| unpackedDir | string | 未打包目录路径，electron builder 构建deb的unpacked目录 |
| DesktopInfo | DesktopInfoType | 桌面信息类型 |
| DesktopEntry | DesktopEntryType | 桌面条目类型 |
| controlFile | controlFileType | 控制文件类型 |
| beforeGenerateTemplateDir | 函数 (可选) | 在生成模板目录之前执行的函数 |
| afterGenerateTemplateDir | 函数 (可选) | 在生成模板目录之后执行的函数，参数为模板路径 |
| beforePack | 函数 (可选) | 在打包之前执行的函数 |
| afterPack | 函数 (可选) | 在打包之后执行的函数 |
| removeTemplateDir | boolean (可选) | 是否移除模板目录 |
| beforeRemoveTemplateDir | 函数 (可选) | 在移除模板目录之前执行的函数 |
| afterRemoveTemplateDir | 函数 (可选) | 在移除模板目录之后执行的函数 |

### DesktopInfoType
| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| appId | string | 应用ID |
| name | string | 应用名称 |
| version | string | 应用版本 |
| description | string | 应用描述 |
| permissions | DesktopInfoPermissionType (可选) | 应用权限信息 |

### DesktopEntryType
| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| Categories | string | 应用分类 |
| Name | string | 应用名称 |
| GenericName | string | 通用名称 |
| Type | string | 类型 |
| Exec | string | 执行命令 |
| Icon | string | 图标 |
| MimeTypes | string (可选) | MIME 类型 |
| Comment | string (可选) | 注释 |
| Terminal | string (可选) | 是否在终端中运行 |
| StartupNotify | string (可选) | 是否在启动时通知 |
| [key: string] | string 或 undefined | 其他任意字段 |

### controlFileType
| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| Source | string | 源代码信息 |
| Section | string | 包的分类 |
| Priority | string | 包的优先级 |
| Maintainer | string | 维护者信息 |
| StandardsVersion | string | 标准版本 |
| Homepage | string | 主页链接 |
| VcsBrowser | string | 版本控制系统浏览器链接 |
| VcsGit | string | Git 版本控制系统链接 |
| Package | string | 包名 |
| Architecture | string | 架构信息 |
| Description | string | 包的描述 |
| [key: string] | string 或 undefined | 其他任意字段 |

## 使用方式
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

## 项目开发

1. 克隆项目到本地
1. 安装依赖：`npm install`
1. 搭建构建环境，目前使用 Ubuntu:latest（docker 启动将当前项目共享既可）
1. 使用 electron 构建 Linux，产出的 unpacked 移动到 static 下（当前执行文件是hello world）
1. 修改 test 文件的入参
1. `npm run test`


## 贡献

欢迎提交问题和改进的请求。


## 许可证

该项目基于 [MIT 许可证](LICENSE)。

---- 

项目和文档中使用了部分统信UOS官网、技术支持人员提供的内容。
