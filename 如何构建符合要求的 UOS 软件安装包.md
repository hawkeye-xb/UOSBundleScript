# 如何构建符合要求的 UOS 软件安装包

本文旨在为 UOS 或 Deepin（均为 Debian 的衍生发行版）构建软件安装包，本文使用新版的 UOS 打包规范针对 UOS 系统进行打包演示，经过实际测试 Deepin 也是可以使用的。


<!--more-->


因系统经过高度定制，因此 UOS 支持自有打包方案，相比官方安装器可以实现更多自动功能。

## 规范

本文以最常见的二进制打包方式为例进行说明。

一般而言，软件制作商会在对应架构上编译出软件的可执行文件版本后再进行打包，二进制方式可以直接使用编译出的二进制文件构建出可以使用的软件包（需要注意的是，程序内部的读取/写入路径在打包后可能需要针对性调整）。

本文用 [UOS](https://www.chinauos.com/) 的软件包打包规范为例进行说明，本文参照的是《**UOS 打包规范 v1.2 **》。

### 命名

AppID （应用标识/包名）是应用的唯一标识，UOS 采用和 Android 系统类似的规范，应用商店只接受使用**域名倒置规则**命名的应用。请务必使用厂商的倒置域名+产品名作为应用包名，如 `com.example.demo`，前半部分为厂商域名倒置，后半部分为产品名，如果使用非拥有者的域名作为前缀，可能会引起该域名拥有者进行申诉，导致软件被申诉下架或者删除。

> 注意：此处的包名就是后续生成的 control 文件的 Package 字段，这个必须为全小写，仅支持小写字母。

### 目录结构

- 应用的全部安装文件必须在如下目录：`/opt/apps/${appid}/` 中，非特殊情况下不允许向其他系统目录写入或者修改文件。

  > 注意事项：禁止使用 deb 的 postinst 等钩子对**系统进行修改**，包含这些脚本的软件包都无法上架！

  > 例外：如果程序涉及 systemd 服务、或者程序初始化、卸载前 kill 服务等需求可以正常使用钩子脚本进行实现，但是仅限于针对实现程序自身需求，不允许对系统文件进行修改。

- 与常规的 Debian / Ubuntu 打包目录不同，UOS 系统的软件包目录规范如下

  ```
  .
  ├── debian
  │   ├── control
  │   └── md5sums
  └── opt
      └── apps        
          └── com.example.demo
              ├── entries            
              │   ├── applications
              │   │   └── com.example.demo.desktop
              │   ├── icons
              │   │   └── hicolor
              │   │       └── scalable
              │   │           └── apps
              │   │               └── com.example.demo.svg
              │   ├── mime
              │   │   └── packages
              │   │       └── com.example.demo.xml
              │   ├── plugins
              │   │   ├── fcitx
              │   │       └── libuosinput.so
              │   │   └── browser
              │   │       └── libuosbrowser.so
              │   └── services
              │   │   └── com.example.demo.xml
              ├── files
              │   ├── bin
              │   │   └── com.example.demo
              │   ├── doc
              │   │   ├── changelog.gz
              │   │   └── copyright
              │   └── lib
              │       └── com.demo.app.so.5.2.1
              └── info
  20 directories, 13 files
  ```

  应用根目录下面应包含 `entries` `files` 两个目录和一个 `info` 文件。

| 目录/文件 | 用途 | 说明 |
| :---: | --- | --- |
| DEBIAN/ | 构建过程文件夹 | 包含软件包构建过程相关的控制文件 |
| control | 构建控制文件 | 此文件完全遵照 Debian 官方规范，control 文件中字段和参数说明详见 [Debian policy control fields](https://www.debian.org/doc/debian-policy/ch-controlfields.html) |
| md5sums | MD5 校验文件 | 为软件包内的全部文件提供 MD5 值校验，防篡改（打包时自动生成） |

#### info

info 文件是应用的描述文件，使用 JSON 格式，内容一般如下：

```
{
    "appid": "com.example.demo",
    "name": "Demo",
    "version": "5.0.0.0",
    "arch": ["amd64", "mips64el"],
    "permissions": {
        "autostart": false,
        "notification": false,
        "trayicon": false,
        "clipboard": false,
        "account": false,
        "bluetooth": false,
        "camera": false,
        "audio_record": false,
        "installed_apps": false
    },
    "support-plugins": [
        "plugins/demo"
    ],
    "plugins": [
        "plugins/browser",
        "plugins/fcitx"
    ]
}
```

在 `permissions` 中字段说明（此部分只限制通过 Dbus 调用，其他方式调用则无影响）

| 字段 | 作用 | 可选值 |
| :---: | --- | :---: |
| autostart | # 是否允许自启动 | true/false |
| notification | # 是否允许使用通知 | true/false |
| trayicon | # 是否运行显示托盘图标 | true/false |
| clipboard | # 是否允许使用剪切板 | true/false |
| account | # 是否允许读取登录用户信息 | true/false |
| bluetooth | # 是否允许使用蓝牙设备 | true/false |
| camera | # 是否允许使用视频设备 | true/false |
| audio_record | # 是否允许进行录音 | true/false |
| installed_apps | # 是否允许读取安装软件列表 | true/false |

文件必须申明软件 AppID 、软件名称、架构及权限，支持的插件及插件信息如果不支持可去除。

详细字段说明

| 字段 | 作用 | 可选值/规范 |
| :---: | --- | --- |
| appid | 应用唯一标识 | / |
| name | 应用名称（无唯一检测） | / |
| version | 应用版本号 | 采用 {MAJOR}.{MINOR}.{PATCH}.{BUILD} 格式（[主线版本].[次要版本].[补丁版本].[构建版本]）仅支持纯数字版本 |
| arch | 应用架构 | 目前商店支持以下几种架构 `amd64`, `mips64el`, `arm64`, `sw_64`, `loongarch64` |
| permissions | 应用权限 | 见注释，开发者需要注意，应用只允许使用**普通用户权限**启动，禁止应用以任何形式 root 提权 |
| support-plugins | 支持的插件类型 | / |
| plugins | 实现的的插件类型 | 在对应的 plugins 目录下，按照实现的插件类型放置文件 |

#### entries

存放程序的各种入口文件，开发者请按规范将对应的文件放到指定的目录进行打包，安装完成之后系统会自动链接到对应的系统目录。

| 文件夹 | 说明 | 软链地址 |
| :---: | :---: | --- |
| applications | 应用图标 | -> `/usr/share/applications/` |
| autostart | 自启动 | -> `/etc/xdg/autostart/` |
| services | 服务 | -> `/usr/share/dbus-1/service/` |
| plugins | 插件 | -> `/usr/lib/` |
| icons | 图标 | -> `/usr/share/icons/hicolor/` |
| polkit | 工具集 | -> `/usr/share/polkit-1/actions/` |
| mime | 扩展类型 | -> `/usr/share/mime/packages/` |
| fonts | 字体集 | -> `/usr/share/fonts/truetype/` | 

##### applications

程序启动文件放置的位置，一般会有一个以 AppID 命名的 *.desktop 文件放置在这个目录中。目前使用标准的 desktop 格式，相关标准可以参考官方文档 [Desktop Entry Specification](https://specifications.freedesktop.org/desktop-entry-spec/desktop-entry-spec-1.1.html) 。

举个栗子，某软件 com.example.demo.desktop 内容如下：

```
[Desktop Entry]
Categories=Audio;AudioVideo;Qt;
Name=Deepin Demo
GenericName=Demo
Type=Application
Exec=/opt/apps/com.example.demo/files/bin/demo.sh %F
Icon=com.example.demo
MimeType=audio/musepack;application/musepack;application/x-ape;audio/ape;audio/x-ape;audio/x-musepack;application/x-musepack;audio/x-mp3;application/x-id3;audio/mpeg;audio/x-mpeg;audio/x-mpeg-3;audio/mpeg3;audio/mp3;audio/x-m4a;audio/mpc;audio/x-mpc;audio/mp;audio/x-mp;application/ogg;application/x-ogg;audio/vorbis;audio/x-vorbis;audio/ogg;audio/x-ogg;audio/x-flac;application/x-flac;audio/flac;audio/3gp;audio/imy;audio/midi;audio/x-mpeg-4;audio/mpeg4;audio/mp4;audio/xmf;audio/x-wav;application/x-wav;audio/x-ms-wma;application/x-ms-wma;audio/aac;application/aac;
Comment[zh_CN]=为您播放本地及网络音频流
GenericName[zh_CN]=音乐
Name[zh_CN]=音乐
```

> 注意：需要关注的字段为：Exec 为程序的入口，后期会被沙箱启动；MimeType 为程序支持的关联类型。启动程序文件请指向应用私有目录的 /opt/apps/com.example.demo/files 目录下的文件。

- 附加说明：

  1). 对于特殊的应用，有多个入口的 desktop 文件，表示功能不同的程序（比如 WPS 会创建 文档、表格、幻灯片等多个程序入口）。对于这种需要有多个入口的程序，采用严格限制的**白名单方式**进行申请。
  2). Icon 值必须使用包名来进行命名，不允许使用绝对路径方式，后续此部分会不进行兼容。

##### autostart

程序自启动入口文件。注意此权限与 info 文件中权限申明有关，如果需要程序自启动，请在 `info` 文件中配置 `autostart` 项为 `true`。自启动权限为高风险权限，用户可以在不告知应用的情况下关闭应用的自启动权限。

将 .desktop 复制到本文件夹一份即可实现开启开机自启动功能。

##### services

程序注册的 dbus 服务目录，例如：

```
[D-BUS Service]
Name=com.example.demo
Exec=/opt/apps/com.example.demo/files/bin/com.example.demo --dbus
```

> 注意：目前一个应用只允许配置一个服务，service 请指向应用私有目录的 /opt/apps/com.example.demo/files 目录下的文件。

##### plugins

放置共享给其他应用使用的内容（库文件），plugins 目录下面可以有多个子目录。

插件目录的目的是为了其他应用提供一种插件机制，使得其他应用程序可以**访问本应用提供的内容**。

- 在 plugins 目录中，必须以目标的插件类型（plugin-mimetype）对子目录进行命名，在对应的插件类型子目录中放置需要共享给宿主应用的内容。
- 一个应用可以给多个应用提供插件，需要对每一个插件类型创建对应的子目录，并在里面放置共享的内容。
- 需要在描述文件中列出需要注入宿主应用的插件类型。技术上，安装器将会根据 info 文件描述的 plugins 列表，将对应插件 link 到相关程序的 `/opt/apps/${target_appid}/plugins/${plugin-mimetype}` 目录中，同时在宿主应用程序启动时设置一个`APP_PLUGIN_DIR` 环境变量，使得宿主程序可以获取注入的内容。

注意事项：插件采用沙箱机制，插件目录下的<font color="red">每一个子目录以及主程序目录均是无法相互访问</font>的，在开发过程中请尤其注意这一点。

示例：

| 打包路径 | 安装路径 |
| :---: | :---: |
| entries/plugins/fcitx/libuosinput.so | /usr/lib/x86_64-linux-gnu/fcitx/libuosinput.so |
| entries/plugins/browser/libuosbrowser.so | /usr/lib/mozilla/plugins/libuosbrowser.so |

##### icons

应用图标，目录结构与系统 icons 目录结构保持一致即可，强烈建议使用矢量图标 SVG 图标，矢量图标可自行无损缩放至要求分辨率。

如果使用矢量图标，按以下路径放置：

```
icons/hicolor/scalable/apps/com.example.demo.svg
```

如果使用非矢量格式，请按照分辨率来放置图标：

```
icons/hicolor/16x16/apps/com.example.demo.png
icons/hicolor/24x24/apps/com.example.demo.png
```

> <font color="red">注意：非矢量图标只支持 PNG 格式，请勿使用 JPG 等格式伪装（将图片修改后缀）要使用工具进行转换！！！</font>

- 支持的分辨率包括: 16/24/32/48/128/256/512 ，不同分辨率的图标会被用在不同的地方，比如桌面、通知栏、任务栏、应用抽屉中，如果没有全部包括则会自动进行缩放，影响最终效果。
- 强烈建议遵循分辨率放置目录，尽量不要在 128x128 文件夹内放置其他分辨率的图标。
- 如果实在没有其他分辨率资源，只有一个分辨率图标，放置在 128x128 文件夹即可。

##### polkit

polkit 是一个应用程序级别的工具集，通过定义和审核权限规则，实现不同优先级进程间的通讯：控制决策集中在统一的框架之中，决定低优先级进程是否有权访问高优先级进程。该目录用于存放 polkit 配置文件，文件是 XML 格式，以 `.policy` 结尾，目录结构与系统 polkit 目录结构保持一致即可。

示例：

| 打包路径 | 安装路径|
| --- | --- |
| polkit/actions/com.example.demo.policy | /usr/share/polkit-1/actions/com.example.demo.policy |

##### mime

[MIME](https://en.wikipedia.org/wiki/MIME) (Multipurpose Internet Mail Extensions) 多用途互联网邮件扩展类型。该目录用于存放 MIME 配置文件，目录结构与系统 MIME 目录结构保持一致即可，文件是 XML 格式，以 `.xml` 结尾。

示例：

| 打包路径 | 安装路径|
| --- | --- |
| mime/packages/com.example.demo.xml | /usr/share/mime/packages/com.example.demo.xml |

##### fonts

存放字体和配置文件，包含 files 和 conf 两个子目录。

- files 目录用来保存字体文件
- conf 目录用来存放字体配置

示例：

| 打包路径 | 安装路径|
| --- | --- |
| fonts/files/truetype/wenquanyi.ttf | /usr/share/fonts/truetype/wenquanyi.ttf | 
| fonts/conf.d/57-wenquanyi.conf | /etc/fonts/conf.d/57-wenquanyi.conf |

##### locale

locale 是国际化与本土化过程中的一个非常重要的概念，目录结构与系统locale目录结构保持一致即可

示例：

| 打包路径 | 安装路径|
| --- | --- |
| locale/zh_CN/kf5_entry.desktop | /usr/share/locale/zh_CN/kf5_entry.desktop |

##### fcitx

fcitx是一个以 GPL 方式发布的输入法平台,可以通过安装引擎支持多种输入法，支持简入繁出，是在 Linux 操作系统中常用的中文输入法，用于保存皮肤、自定义标点、码表等信息。目录结构与系统fcitx目录结构保持一致即可，需要跟entries/plugins/fcitx下的输入法插件库配合使用。

示例：

| 打包路径 | 安装路径|
| --- | --- |
| fcitx/skin/dark/pinyin.png | /usr/share/fcitx/skin/dark/pinyin.png |

#### files

存放应用程序需要的各种文件，对于该目录放置文件并无限制，但是建议将可执行程序放置到 `files/bin` 子目录。

应用程序或者插件依赖的第三方库请放置在 `/opt/apps/${appid}/files/lib` 目录，启动时建议使用脚本添加环境变量启动，不允许安装到系统目录。

> 注意：lib 目录下的库请不要相互依赖，否则可能会导致应用插件库加载不正常。


### 文件系统权限

系统目录系统分区为只读状态，主要用于为应用提供基本的运行依赖库。请不要依据系统目录内容来做任何特性，后期系统将会将应用运行在沙箱中，只对程序暴露部分限定文件夹，系统目录中的内容将会都不可信。

如果程序需要写入文件来实现配置修改、临时缓存等，建议使用如下环境变量（系统内置变量）写入数据和配置：

- `$XDG_DATA_HOME`
- `$XDG_CONFIG_HOME`
- `$XDG_CACHE_HOME`

| 变量名 | 说明 |
| :---: | :---: |
| `$XDG_DATA_HOME` | 软件数据存储目录 |
| `$XDG_CONFIG_HOME` | 软件配置存储目录 |
| `$XDG_CACHE_HOME` | 软件缓存存储目录 |

用户的软件包**不允许**直接向 `$HOME` 目录直接写入文件，后期系统将会使用沙箱技术重新定向 `$HOME`，任何依赖该特性的行为都**可能失效**。

以下目录可能需要用户同意才能进行写入

- `XDG_DESKTOP_DIR="$HOME/Desktop"`
- `XDG_DOCUMENTS_DIR="$HOME/Documents"`
- `XDG_DOWNLOAD_DIR="$HOME/Downloads"`
- `XDG_MUSIC_DIR="$HOME/Music"`
- `XDG_PICTURES_DIR="$HOME/Pictures"`
- `XDG_PUBLICSHARE_DIR="$HOME/Public"`
- `XDG_TEMPLATES_DIR="$HOME/Templates"`
- `XDG_VIDEOS_DIR="$HOME/Videos"`

关于目录的定义，可以参考：[XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/basedir-spec-0.6.html)

## 常见问题

如果遇到下述类似报错

```
/lib/debug/.build-id/ec/9ca8d4ed92023b4d9342056db7261cb975cbd1.debug debian/com.jetbrains.phpstorm/apps/com.jetbrains.phpstorm/files/jbr/lib/jli/libjli.so
objcopy: debian/com.jetbrains.phpstorm/apps/com.jetbrains.phpstorm/files/jbr/lib/jli/stwqlQCK: debuglink section already exists
        objcopy --only-keep-debug --compress-debug-sections debian/com.jetbrains.phpstorm/apps/com.jetbrains.phpstorm/files/lib/pty4j-native/linux/mips64el/libpty.so debian/.debhelper/com.jetbrains.phpstorm/dbgsym-root/usr/lib/debug/.build-id/94/eac3e4a21dfe2d38a444ea56b9bfac51004647.debug
objcopy: Unable to recognise the format of the input file `debian/com.jetbrains.phpstorm/apps/com.jetbrains.phpstorm/files/lib/pty4j-native/linux/mips64el/libpty.so'
dh_strip: objcopy --only-keep-debug --compress-debug-sections debian/com.jetbrains.phpstorm/apps/com.jetbrains.phpstorm/files/lib/pty4j-native/linux/mips64el/libpty.so debian/.debhelper/com.jetbrains.phpstorm/dbgsym-root/usr/lib/debug/.build-id/94/eac3e4a21dfe2d38a444ea56b9bfac51004647.debug returned exit code 1
dh_strip: Aborting due to earlier error
make: *** [debian/rules:18: binary] Error 2
dpkg-buildpackage: error: debian/rules binary subprocess returned exit status 2
```

> 这是因为打包工具会遍历全部文件，对二进制文件、库文件等可执行文件进行 `strip` 操作（从可执行文件中剥掉一些编译过程中生成的**符号信息**和**调试信息**，使文件变小，节约安装包空间），而交叉编译后的文件对应不同架构，无法使用当前架构的 `strip` 工具进行处理，因此需要默认关闭此操作。相同问题可参阅 [编译报错 Unable to recognise the format of the input file `./libs/x86_64/libxxx.so'的解决](https://blog.csdn.net/darwinlong/article/details/48178131)
> > <font color="red">解决方式</font>：在 `debian/rules` 中添加 `override_dh_strip:` 参数即可；更多详细信息请参阅
> > ```
> > man dh_strip_nondeterminism
> > ```


如果出现大量下述类似提示，且打包过程耗时过久

```
        Normalizing debian/com.jetbrains.phpstorm/apps/com.jetbrains.phpstorm/files/lib/jsch.agentproxy.usocket-nc-0.0.9.jar using File::StripNondeterminism::handlers::jar
```

>  这是因此没有关闭 `strip_nondeterminism` 功能导致的，打包工具会检查全部文件的无用信息并对其进行删减，为了节约处理时间（主要是没有必要）可关闭此功能。
>  > <font color="red">解决方式</font>：在 `debian/rules` 中添加 `override_dh_strip_nondeterminism:` 参数即可；更多详细信息请参阅
> > ```
> > man dh_strip
> > ```


如果出现此类提示，打包过程终止

```
dpkg-buildpackage: info: source package cn.com.example.demo
dpkg-buildpackage: info: source version 2.16.2200
dpkg-buildpackage: info: source distribution unstable
dpkg-buildpackage: info: source changed by root <root@unknown>
dpkg-architecture: error: unknown Debian architecture loongarch64, you must specify GNU system type, too
dpkg-buildpackage: error: dpkg-architecture subprocess returned exit status 255
```

是因为旧版本的 UOS 系统发布时还未支持 loongarch64 架构，可以手动修改 `/usr/share/dpkg/cputable` 文件，加入以下一行即可。

```
# <Debian name> <GNU name>      <config.guess regex>    <Bits>  <Endianness>
...
...
...
loongarch64     loongarch64     loongarch64             64      little
```


----------


## 打包示例

接下来以 Jetbrains 的 PhpStorm 产品为例进行 UOS 打包示范。

> 注意！本教程只为展示二进制产品的打包方式，切勿照搬照抄，将 PhpStorm 打包进厂商的程序中！

### 环境配置

配置包发行者信息

```bash
cat >> ~/.bashrc <<EOF
DEBEMAIL="example@debian.org"
DEBFULLNAME="Kane"
export DEBEMAIL DEBFULLNAME
EOF
```

执行上述命令（分别为「**维护者全名**」、「**维护者邮箱**」）

### 补全依赖

构建软件包需要安装依赖

```bash
sudo apt install dh-make fakeroot build-essential
```

> 小贴士：一般来说 `dh-make` 包会包含后两个工具，为保险起见一并安装。

### 获取二进制包

这是「示例程序」，仅仅为了**体现打包的过程**！厂商直接用已经编译好的二进制包进行下面的步骤就可以。

```bash
cd ~/Desktop
wget https://download-cf.jetbrains.com/webide/PhpStorm-2020.3.1.tar.gz
```

解压后获得文件夹一个

```bash
tar xf PhpStorm-2020.3.1.tar.gz
```

### 结构创建


本步骤可使用本文提供的脚本一键创建，【参数1】和【参数2】必传，分别为【软件包名】【版本号（不含V或v）】

例如：

```bash
cd ~/Desktop
curl https://wave.md/init.sh | bash -s com.jetbrains.phpstorm 2020.3.1
```

> 小贴士：使用上述命令时需要自行替换软件包名、版本号。版本号可以是**非日期格式**，本例只是采用 Jetbrains 官方的版本命名方式，仅供参考。

以上脚本实现的功能也可以手动进行创建，需要先创建打包项目文件夹，文件夹名称必须为 `<package>-<version>` 格式。

```bash
cd ~/Desktop
mkdir com.jetbrains.phpstorm-2020.3.1
```

按 UOS 规范进行创建目录结构，**复制**原项目的 SVG PNG 图标到 icons 目录，创建图标文件到 applications 目录，下述结构中的 `.` 目录为上文创建的打包项目文件夹，即 `com.jetbrains.phpstorm-2020.3.1` 。

> 小贴士：图标文件请复制，不要移动，因原始项目的源码无法修改，若软件内部调用可能出现问题，仅复制让 UOS 可以正确显示图标即可，PNG 格式图标需要确认图片实际分辨率，然后按分辨率进行放置不同路径下，否则会引发系统缩放，导致图片失真。

```bash
.
└── opt
    └── apps
        └── com.jetbrains.phpstorm
            ├── entries
            │   ├── applications
            │   │   └── com.jetbrains.phpstorm.desktop
            │   ├── icons
            │   │   └── hicolor
            │   │       ├── 128x128
            │   │       │   └── apps
            │   │       │       └── com.jetbrains.phpstorm.png
            │   │       └── scalable
            │   │           └── apps
            │   │               └── com.jetbrains.phpstorm.svg
            │   ├── mime
            │   ├── plugins
            │   └── services
            ├── files
            └── info
```

写入 desktop 文件内容

```
[Desktop Entry]
Name=PhpStorm
Comment=The Lightning-Smart PHP IDE
Comment[zh_CN]=极速智能的 PHP 开发工具
Exec=/opt/apps/com.jetbrains.phpstorm/files/bin/phpstorm.sh
Icon=com.jetbrains.phpstorm
Categories=Development
Type=Application
```

写入 info 文件内容（因本程序无插件，因此去掉冗余字段）

```json
{
    "appid": "com.jetbrains.phpstorm",
    "name": "PhpStorm",
    "version": "2020.3.1",
    "arch": ["amd64"],
    "permissions": {
        "autostart": false,
        "notification": false,
        "trayicon": false,
        "clipboard": false,
        "account": false,
        "bluetooth": false,
        "camera": false,
        "audio_record": false,
        "installed_apps": false
        }
}
```

然后将原官方二进制解包的内容全部移动至 `opt/apps/com.jetbrains.clion/files/` 即可，保证原可执行文件存于 `opt/apps/com.jetbrains.phpstorm/files/bin` 下。

```bash
cd ~/Desktop/com.jetbrains.phpstorm-2020.3.1/opt/apps/com.jetbrains.phpstorm/
cp -a ~/Desktop/PhpStorm-203.6682.180 ./files/
```

files 目录机构如下：

```bash
kane@debian:~/Desktop/com.jetbrains.clion-2020.3.1/opt/apps/com.jetbrains.clion/files$ ll
total 8056
drwxr-xr-x  7 kane kane    4096 Jan 25 17:28 bin
-rw-r--r--  1 kane kane      15 Dec 31 03:01 build.txt
drwxr-xr-x  2 kane kane    4096 Jan 25 17:27 help
-rw-r--r--  1 kane kane 8196096 Dec 31 03:01 icons.db
-rw-r--r--  1 kane kane    1784 Dec 31 03:01 Install-Linux-tar.txt
drwxr-xr-x  7 kane kane    4096 Jan 25 17:28 jbr
drwxr-xr-x  4 kane kane   20480 Jan 25 17:28 lib
drwxr-xr-x  2 kane kane    4096 Jan 25 17:27 license
drwxr-xr-x 59 kane kane    4096 Jan 25 17:28 plugins
-rw-r--r--  1 kane kane     428 Dec 31 03:02 product-info.json
```

### 打包构建

创建打包规则（创建 DEBIAN 目录）在 `com.jetbrains.phpstorm-2020.3.1` 目录内执行 `dh_make --createorig -s -n`

```bash
kane@debian:~/Desktop/com.jetbrains.phpstorm-2020.3.1$ dh_make --createorig -s -n
Maintainer Name     : kane
Email-Address       : kane@example.com
Date                : Mon, 18 Jan 2021 10:23:30 +0800
Package Name        : com.jetbrains.phpstorm
Version             : 2020.3.1
License             : gpl3
Package Type        : single
Are the details correct? [Y/n/q]
Please respond with "yes", "no" or "quit" (or "y", "n" or "q")
Currently there is not top level Makefile. This may require additional tuning
Done. Please edit the files in the debian/ subdirectory now.
```

> 小贴士：如果不想用环境变量进行指定维护者，可以使用 `-e` 参数直接指定维护者邮箱，例如 `-e kane@example.com` 。

修正打包规则

因系统生成的打包示例文件（debian 目录下）并不完全适用，因此需要手动修正其内容

```bash
total 92
-rw-r--r-- 1 kane kane   139 Jan 18 10:23 changelog
-rw-r--r-- 1 kane kane   176 Jan 18 10:23 com.jetbrains.phpstorm.cron.d.ex
-rw-r--r-- 1 kane kane   680 Jan 18 10:23 com.jetbrains.phpstorm.doc-base.EX
-rw-r--r-- 1 kane kane    35 Jan 18 10:23 com.jetbrains.phpstorm-docs.docs
-rw-r--r-- 1 kane kane     3 Jan 18 10:23 compat
-rw-r--r-- 1 kane kane   537 Jan 18 10:23 control
-rw-r--r-- 1 kane kane  1408 Jan 18 10:23 copyright
-rw-r--r-- 1 kane kane  1695 Jan 18 10:23 manpage.1.ex
-rw-r--r-- 1 kane kane  4670 Jan 18 10:23 manpage.sgml.ex
-rw-r--r-- 1 kane kane 11041 Jan 18 10:23 manpage.xml.ex
-rw-r--r-- 1 kane kane   171 Jan 18 10:23 menu.ex
-rw-r--r-- 1 kane kane   973 Jan 18 10:23 postinst.ex
-rw-r--r-- 1 kane kane   946 Jan 18 10:23 postrm.ex
-rw-r--r-- 1 kane kane   706 Jan 18 10:23 preinst.ex
-rw-r--r-- 1 kane kane   893 Jan 18 10:23 prerm.ex
-rw-r--r-- 1 kane kane   161 Jan 18 10:23 README
-rw-r--r-- 1 kane kane   194 Jan 18 10:23 README.Debian
-rw-r--r-- 1 kane kane   279 Jan 18 10:23 README.source
-rwxr-xr-x 1 kane kane   677 Jan 18 10:23 rules
drwxr-xr-x 2 kane kane  4096 Jan 18 10:23 source
```

可以看到在 debian 目录下生成一堆示例文件 （.ex/.EX），删除即可。

```bash
rm *.ex *.EX
```

修改打包控制文件 control

```
Source: com.jetbrains.phpstorm
Section: utils
Priority: optional
Maintainer: Kane <kaneyou@example.com>
Build-Depends: debhelper (>= 11)
Standards-Version: 4.1.3
Homepage: https://www.jetbrains.com/phpstorm/
#Vcs-Browser: https://salsa.debian.org/debian/com.jetbrains.phpstorm
#Vcs-Git: https://salsa.debian.org/debian/com.jetbrains.phpstorm.git

Package: com.jetbrains.phpstorm
Architecture: any
Description: The Lightning-Smart PHP IDE
```

> 小贴士：关于 `Section` 字段，详细可参考 Debian 官方文档 [2.4. Sections](https://www.debian.org/doc/debian-policy/ch-archive.html#s-subsections) 。
> 常用可选类别：admin, cli-mono, comm, database, debug, devel, doc, editors, education, electronics, embedded, fonts, games, gnome, gnu-r, gnustep, graphics, hamradio, haskell, httpd, interpreters, introspection, java, javascript, kde, kernel, libdevel, libs, lisp, localization, mail, math, metapackages, misc, net, news, ocaml, oldlibs, otherosfs, perl, php, python, ruby, rust, science, shells, sound, tasks, tex, text, utils, vcs, video, web, x11, xfce, zope.
> 可根据软件的类别进行选择。

修改打包规则文件 rules

```
#!/usr/bin/make -f
# See debhelper(7) (uncomment to enable)
# output every command that modifies files on the build system.
export DH_VERBOSE = 1              # 输出完整的打包调试日志


# see FEATURE AREAS in dpkg-buildflags(1)
#export DEB_BUILD_MAINT_OPTIONS = hardening=+all

# see ENVIRONMENT in dpkg-buildflags(1)
# package maintainers to append CFLAGS
#export DEB_CFLAGS_MAINT_APPEND  = -Wall -pedantic
# package maintainers to append LDFLAGS
#export DEB_LDFLAGS_MAINT_APPEND = -Wl,--as-needed


%:
        dh $@

override_dh_auto_build:

override_dh_shlibdeps:

override_dh_strip:                 # 不去除符号文件和调试信息 （strip 操作）

override_dh_strip_nondeterminism:  # 不去除多余文本信息

override_dh_installchangelogs:     # 不包含安装修改日志

override_dh_installdocs:           # 不包含安装文档

override_dh_md5sums:               # 不生成 MD5 校验文件

# dh_make generated override targets
# This is example for Cmake (See https://bugs.debian.org/641051 )
#override_dh_auto_configure:
#       dh_auto_configure -- #  -DCMAKE_LIBRARY_PATH=$(DEB_HOST_MULTIARCH)
```

因为 UOS 系统的规范安装目录与原生 Debian 系列规则不符，因此需要创建安装规则文件 install

```bash
echo "opt/ /" > ./install
```

> 小贴士：此段意思将安装包内的 `opt/` 目录安装至系统的 `/` 根目录，这样就无需修改工程文件的目录结构。

删除多余的文档和说明文件

```bash
rm -rf *.docs README README.*
```

操作完成后，debian 目录下应该有以下**六个**文件和**一个**文件夹

```bash
total 28
-rw-r--r-- 1 kane kane  139 Jan 18 10:23 changelog
-rw-r--r-- 1 kane kane    3 Jan 18 10:23 compat
-rw-r--r-- 1 kane kane  434 Jan 18 11:02 control
-rw-r--r-- 1 kane kane 1408 Jan 18 10:23 copyright
-rw-r--r-- 1 kane kane    7 Jan 18 11:02 install
-rwxr-xr-x 1 kane kane  934 Jan 18 11:02 rules
drwxr-xr-x 2 kane kane 4096 Jan 18 11:02 source
```

> 小贴士：如果厂商的软件需要使用钩子脚本来完成安装器无法完成的工作，可以在此步骤时将钩子脚本移动至 `debian` 目录。

| 名称 | 用途 |
| :---: | --- |
| `preinst` | 包解压前执行，一般为正在被升级的包停止相关服务，直至升级或安装完成。（成功后执行 `postinst` 脚本）；|
| `postinst` | 包解压后执行，一般为程序所需的配置工作，比如移动相关的配置文件、启动或停止服务等功能； |
| `prerm` | 包卸载前执行。一般用于停止一个软件包的相关进程； |
| `postrm` | 包卸载后执行。一般用于删除程序产生的相关残余文件或链接等。 |

确认无误后返回**项目根目录**打包构建即可，根据包内容的不同，打包时间可能有差异（必须在 `<package>-<version>` 文件夹内执行构建命令）

```bash
cd ..
fakeroot dpkg-buildpackage -us -uc -b -tc
```

> 补充一下：如果想“交叉构建”（比如在 amd64 上构建 loongarch64 架构的包），仅针对已经编译出相应架构的可执行文件，只需要进行打包操作的情况下，可以加上 `--host-arch loongarch64` 参数即可（loongarch64 仅为示例）。

返回上一级目录检查

```bash
total 371864
drwxr-xr-x 4 kane kane      4096 Jan 18 10:23 com.jetbrains.phpstorm-2020.3.1
-rw-r--r-- 1 kane kane      4449 Jan 18 11:12 com.jetbrains.phpstorm_2020.3.1_amd64.buildinfo
-rw-r--r-- 1 kane kane      1086 Jan 18 11:12 com.jetbrains.phpstorm_2020.3.1_amd64.changes
-rw-r--r-- 1 kane kane 380767800 Jan 18 11:12 com.jetbrains.phpstorm_2020.3.1_amd64.deb
```

构建完成，撒花！


----------


## 附录

### 本文链接

* [如何构建符合要求的 UOS 软件安装包 - VVavE](https://www.vvave.net/archives/how-to-build-a-debian-series-distros-installation-package.html)

### 参考链接

* [Debian 维护者指南 - 青木](https://lx.atzlinux.com:24359/debmake-doc/index.zh-cn.html)
* [Debian control fields - Debian Docs](https://www.debian.org/doc/debian-policy/ch-controlfields.html)
* [编译报错 Unable to recognise the format of the input file `./libs/x86_64/libxxx.so'的解决 - CSDN](https://blog.csdn.net/darwinlong/article/details/48178131)
* [第 4 章 debian 目录中的必需内容 - Debian 官方手册](https://www.debian.org/doc/manuals/maint-guide/dreq.zh-cn.html#rules)
* [第 6 章 构建软件包 - Debian 官方手册](https://www.debian.org/doc/manuals/maint-guide/build.zh-cn.html)