# How to Build a Compliant UOS Software Package

This article explains how to build software installation packages for UOS or Deepin (both Debian-derived distributions). It demonstrates packaging for UOS using the new UOS packaging specification, and it has been verified to work on Deepin as well.


<!--more-->


Because the system is heavily customized, UOS supports its own packaging scheme, which enables more automation than the official installer.

## The specification

We use the most common binary packaging approach as our example.

In general, a software vendor compiles executables for the target architecture first and then packages them. The binary approach can build a usable package directly from the compiled binaries (note that the program's internal read/write paths may need to be adjusted after packaging).

This article follows the packaging specification of [UOS](https://www.chinauos.com/) — specifically the **UOS Packaging Specification v1.2**.

### Naming

The AppID (application identifier / package name) uniquely identifies an app. UOS uses rules similar to Android: the app store only accepts names that follow the **reverse-domain-name convention**. Always use the vendor's reversed domain plus the product name as the package name, e.g. `com.example.demo` — the first part is the vendor's reversed domain, the second part is the product name. If you use a domain you don't own as the prefix, the domain owner may file a complaint and your software could be taken down or deleted.

> Note: this package name becomes the `Package` field of the control file generated later. It must be all lowercase — only lowercase letters are supported.

### Directory structure

- All of an app's installation files must live under `/opt/apps/${appid}/`. Unless there is a special reason, writing to or modifying files in other system directories is not allowed.

  > Important: using deb hooks such as postinst to **modify the system** is forbidden — packages containing such scripts cannot be published to the store!

  > Exception: if the program involves a systemd service, or needs initialization, or needs to kill a service before uninstall, hook scripts may be used — but only for the program's own needs. Modifying system files is not allowed.

- Unlike conventional Debian / Ubuntu packaging layouts, the UOS package directory specification is as follows:

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

  The app root directory should contain two directories — `entries` and `files` — plus an `info` file.

| Directory/File | Purpose | Notes |
| :---: | --- | --- |
| DEBIAN/ | Build-time folder | Contains control files related to the package build process |
| control | Build control file | Fully follows the official Debian specification; see [Debian policy control fields](https://www.debian.org/doc/debian-policy/ch-controlfields.html) for field descriptions |
| md5sums | MD5 checksum file | Provides MD5 verification for every file in the package, preventing tampering (generated automatically at build time) |

#### info

The info file describes the app, in JSON format. Typical content:

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

Field descriptions for `permissions` (these restrictions only apply to calls made via D-Bus; calls made other ways are unaffected):

| Field | Effect | Allowed values |
| :---: | --- | :---: |
| autostart | # whether auto-start is allowed | true/false |
| notification | # whether notifications are allowed | true/false |
| trayicon | # whether showing a tray icon is allowed | true/false |
| clipboard | # whether clipboard access is allowed | true/false |
| account | # whether reading logged-in user info is allowed | true/false |
| bluetooth | # whether using Bluetooth devices is allowed | true/false |
| camera | # whether using video devices is allowed | true/false |
| audio_record | # whether audio recording is allowed | true/false |
| installed_apps | # whether reading the installed-app list is allowed | true/false |

The file must declare the app's AppID, name, architecture, and permissions. The supported-plugins and plugin fields can be removed if unused.

Detailed field descriptions:

| Field | Effect | Allowed values / rules |
| :---: | --- | --- |
| appid | Unique app identifier | / |
| name | App name (uniqueness is not checked) | / |
| version | App version | Format {MAJOR}.{MINOR}.{PATCH}.{BUILD} — numbers only |
| arch | App architecture | The store currently supports `amd64`, `mips64el`, `arm64`, `sw_64`, `loongarch64` |
| permissions | App permissions | See above. Note: apps may only run with **normal user privileges**; elevating to root in any form is forbidden |
| support-plugins | Supported plugin types | / |
| plugins | Implemented plugin types | Place files under the plugins directory by plugin type |

#### entries

Stores the program's various entry files. Developers should place files into the specified directories per the specification; after installation the system automatically links them to the corresponding system directories.

| Folder | Description | Symlink target |
| :---: | :---: | --- |
| applications | Application entries | -> `/usr/share/applications/` |
| autostart | Auto-start | -> `/etc/xdg/autostart/` |
| services | Services | -> `/usr/share/dbus-1/service/` |
| plugins | Plugins | -> `/usr/lib/` |
| icons | Icons | -> `/usr/share/icons/hicolor/` |
| polkit | Policy toolkit | -> `/usr/share/polkit-1/actions/` |
| mime | Extended types | -> `/usr/share/mime/packages/` |
| fonts | Font sets | -> `/usr/share/fonts/truetype/` | 

##### applications

Where the program's launcher files go. Typically a *.desktop file named after the AppID is placed in this directory. The standard desktop format is used; see the official [Desktop Entry Specification](https://specifications.freedesktop.org/desktop-entry-spec/desktop-entry-spec-1.1.html).

For example, the contents of com.example.demo.desktop:

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

> Note: the fields to pay attention to are `Exec`, the program entry point (it will later be launched inside the sandbox), and `MimeType`, the file associations the program supports. Launcher files should point to files under the app's private directory /opt/apps/com.example.demo/files.

- Additional notes:

  1). Special apps with multiple entry desktop files represent different programs (for example, WPS creates separate entries for Writer, Spreadsheets, and Presentation). Programs needing multiple entries must apply through a strictly controlled **whitelist process**.
  2). The Icon value must be named after the package name; absolute paths are not allowed, and this will no longer be supported in the future.

##### autostart

The program's auto-start entry file. Note that this permission relates to the permission declarations in the info file: if the program needs auto-start, set `autostart` to `true` in the `info` file. Auto-start is a high-risk permission — users can revoke it without notifying the app.

Copying the .desktop file into this folder enables start-on-boot.

##### services

The directory for dbus services the program registers, for example:

```
[D-BUS Service]
Name=com.example.demo
Exec=/opt/apps/com.example.demo/files/bin/com.example.demo --dbus
```

> Note: currently an app may only register one service, and the service should point to files under the app's private directory /opt/apps/com.example.demo/files.

##### plugins

Holds content (library files) shared with other apps. The plugins directory may contain multiple subdirectories.

The plugin directory provides a plugin mechanism that lets other applications **access content provided by this app**.

- Inside the plugins directory, subdirectories must be named after the target plugin type (plugin-mimetype); place the content shared with the host app into the corresponding plugin-type subdirectory.
- One app can provide plugins to multiple apps: create a subdirectory for each plugin type and put the shared content inside.
- The plugin types to be injected into host apps must be listed in the description file. Technically, the installer links the plugins listed in the info file into the related program's `/opt/apps/${target_appid}/plugins/${plugin-mimetype}` directory, and sets an `APP_PLUGIN_DIR` environment variable when the host app starts so it can pick up the injected content.

Important: plugins use a sandbox mechanism — <font color="red">each subdirectory under the plugin directory and the main program directory cannot access one another</font>. Keep this in mind during development.

Example:

| Package path | Installed path |
| :---: | :---: |
| entries/plugins/fcitx/libuosinput.so | /usr/lib/x86_64-linux-gnu/fcitx/libuosinput.so |
| entries/plugins/browser/libuosbrowser.so | /usr/lib/mozilla/plugins/libuosbrowser.so |

##### icons

App icons. Keep the directory structure consistent with the system icons directory. SVG vector icons are strongly recommended, since vectors scale losslessly to any required resolution.

If using a vector icon, place it at:

```
icons/hicolor/scalable/apps/com.example.demo.svg
```

If using a non-vector format, place icons by resolution:

```
icons/hicolor/16x16/apps/com.example.demo.png
icons/hicolor/24x24/apps/com.example.demo.png
```

> <font color="red">Note: non-vector icons must be PNG. Do not disguise other formats like JPG by renaming the extension — use a proper conversion tool!</font>

- Supported resolutions: 16/24/32/48/128/256/512. Icons at different resolutions are used in different places (desktop, notification area, taskbar, app drawer). Missing resolutions are scaled automatically, which hurts the final result.
- Follow the resolution-based directory layout; avoid putting icons of other resolutions into the 128x128 folder.
- If you really only have one resolution, placing it in the 128x128 folder is fine.

##### polkit

polkit is an application-level toolkit that enables communication between processes of different privilege levels by defining and auditing permission rules: decisions are centralized in a unified framework that decides whether a low-privilege process may access a high-privilege one. This directory holds polkit configuration files in XML format ending in `.policy`; keep the directory structure consistent with the system polkit directory.

Example:

| Package path | Installed path |
| --- | --- |
| polkit/actions/com.example.demo.policy | /usr/share/polkit-1/actions/com.example.demo.policy |

##### mime

[MIME](https://en.wikipedia.org/wiki/MIME) (Multipurpose Internet Mail Extensions). This directory holds MIME configuration files in XML format ending in `.xml`; keep the directory structure consistent with the system MIME directory.

Example:

| Package path | Installed path |
| --- | --- |
| mime/packages/com.example.demo.xml | /usr/share/mime/packages/com.example.demo.xml |

##### fonts

Holds fonts and configuration files, with two subdirectories: files and conf.

- The files directory stores font files
- The conf directory stores font configuration

Example:

| Package path | Installed path |
| --- | --- |
| fonts/files/truetype/wenquanyi.ttf | /usr/share/fonts/truetype/wenquanyi.ttf | 
| fonts/conf.d/57-wenquanyi.conf | /etc/fonts/conf.d/57-wenquanyi.conf |

##### locale

locale is a key concept in internationalization and localization. Keep the directory structure consistent with the system locale directory.

Example:

| Package path | Installed path |
| --- | --- |
| locale/zh_CN/kf5_entry.desktop | /usr/share/locale/zh_CN/kf5_entry.desktop |

##### fcitx

fcitx is a GPL-licensed input method platform that supports multiple input methods via installable engines — including simplified-in/traditional-out — and is a commonly used Chinese input method on Linux. It stores skins, custom punctuation, code tables, and so on. Keep the directory structure consistent with the system fcitx directory; it works together with the input method plugin library under entries/plugins/fcitx.

Example:

| Package path | Installed path |
| --- | --- |
| fcitx/skin/dark/pinyin.png | /usr/share/fcitx/skin/dark/pinyin.png |

#### files

Holds the various files the application needs. There are no restrictions on what goes here, but executables should be placed in the `files/bin` subdirectory.

Third-party libraries the application or plugins depend on should go into `/opt/apps/${appid}/files/lib`. At startup, prefer launching via a script that sets the environment variables; installing libraries into system directories is not allowed.

> Note: libraries under the lib directory should not depend on each other, or the app's plugin libraries may fail to load.


### Filesystem permissions

The system directories / system partition are read-only and mainly provide the basic runtime libraries for apps. Do not build any feature around the contents of system directories: the system will later run apps in a sandbox that only exposes certain designated folders, and everything in the system directories will be untrusted.

If the program needs to write files for configuration changes, temporary caches, etc., use the following (built-in) environment variables for data and configuration:

- `$XDG_DATA_HOME`
- `$XDG_CONFIG_HOME`
- `$XDG_CACHE_HOME`

| Variable | Description |
| :---: | :---: |
| `$XDG_DATA_HOME` | App data storage directory |
| `$XDG_CONFIG_HOME` | App configuration storage directory |
| `$XDG_CACHE_HOME` | App cache storage directory |

User packages are **not allowed** to write files directly into `$HOME`. The system will later redirect `$HOME` using sandboxing, and any behavior depending on direct writes **may break**.

Writing to the following directories may require user consent:

- `XDG_DESKTOP_DIR="$HOME/Desktop"`
- `XDG_DOCUMENTS_DIR="$HOME/Documents"`
- `XDG_DOWNLOAD_DIR="$HOME/Downloads"`
- `XDG_MUSIC_DIR="$HOME/Music"`
- `XDG_PICTURES_DIR="$HOME/Pictures"`
- `XDG_PUBLICSHARE_DIR="$HOME/Public"`
- `XDG_TEMPLATES_DIR="$HOME/Templates"`
- `XDG_VIDEOS_DIR="$HOME/Videos"`

For the directory definitions, see the [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/basedir-spec-0.6.html).

## FAQ

If you hit an error like the following:

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

> This happens because the packaging tool walks every file and runs `strip` on binaries, libraries, and other executables (removing **symbol information** and **debug information** generated during compilation, shrinking files and saving package space). Cross-compiled files target a different architecture and cannot be processed by the current architecture's `strip`, so this step needs to be disabled by default. For the same issue, see [the fix for "Unable to recognise the format of the input file `./libs/x86_64/libxxx.so'"](https://blog.csdn.net/darwinlong/article/details/48178131)
> > <font color="red">Fix</font>: add an `override_dh_strip:` target to `debian/rules`; for details see
> > ```
> > man dh_strip_nondeterminism
> > ```


If you see a flood of messages like the following and the build takes too long:

```
        Normalizing debian/com.jetbrains.phpstorm/apps/com.jetbrains.phpstorm/files/lib/jsch.agentproxy.usocket-nc-0.0.9.jar using File::StripNondeterminism::handlers::jar
```

>  This happens when the `strip_nondeterminism` feature is not disabled: the tool inspects every file for useless data and trims it. To save processing time (it is mostly unnecessary), disable the feature.
>  > <font color="red">Fix</font>: add an `override_dh_strip_nondeterminism:` target to `debian/rules`; for details see
> > ```
> > man dh_strip
> > ```


If you see this kind of message and the build aborts:

```
dpkg-buildpackage: info: source package cn.com.example.demo
dpkg-buildpackage: info: source version 2.16.2200
dpkg-buildpackage: info: source distribution unstable
dpkg-buildpackage: info: source changed by root <root@unknown>
dpkg-architecture: error: unknown Debian architecture loongarch64, you must specify GNU system type, too
dpkg-buildpackage: error: dpkg-architecture subprocess returned exit status 255
```

It is because older UOS releases predate loongarch64 support. Manually edit `/usr/share/dpkg/cputable` and add the following line:

```
# <Debian name> <GNU name>      <config.guess regex>    <Bits>  <Endianness>
...
...
...
loongarch64     loongarch64     loongarch64             64      little
```


----------


## Packaging walkthrough

Next, we demonstrate UOS packaging using JetBrains' PhpStorm as an example.

> Warning! This tutorial only demonstrates how to package a binary product. Do not copy it verbatim to bundle PhpStorm into a vendor's program!

### Environment setup

Configure the package maintainer identity:

```bash
cat >> ~/.bashrc <<EOF
DEBEMAIL="example@debian.org"
DEBFULLNAME="Kane"
export DEBEMAIL DEBFULLNAME
EOF
```

Run the above (the values are the **maintainer's full name** and **maintainer's email** respectively).

### Install dependencies

Building packages requires some dependencies:

```bash
sudo apt install dh-make fakeroot build-essential
```

> Tip: the `dh-make` package usually pulls in the other two tools, but install them together just in case.

### Get the binary package

This is the "example program", used only to **demonstrate the packaging process**! Vendors can use their already-compiled binaries and skip straight to the next steps.

```bash
cd ~/Desktop
wget https://download-cf.jetbrains.com/webide/PhpStorm-2020.3.1.tar.gz
```

Extract it to get a folder:

```bash
tar xf PhpStorm-2020.3.1.tar.gz
```

### Create the structure


This step can be done in one shot with the script provided in this article. [Argument 1] and [Argument 2] are required: the **package name** and the **version number (without a leading V or v)**.

For example:

```bash
cd ~/Desktop
curl https://wave.md/init.sh | bash -s com.jetbrains.phpstorm 2020.3.1
```

> Tip: substitute your own package name and version when using the command above. The version does not have to be a date — this example just follows JetBrains' official version naming, for reference only.

What the script does can also be done manually. First create the packaging project folder; its name must follow the `<package>-<version>` format.

```bash
cd ~/Desktop
mkdir com.jetbrains.phpstorm-2020.3.1
```

Create the directory structure per the UOS specification, **copy** the original project's SVG/PNG icons into the icons directory, and create the launcher file in the applications directory. In the structure below, `.` is the packaging project folder created above, i.e. `com.jetbrains.phpstorm-2020.3.1`.

> Tip: copy the icon files — do not move them. The original project's source cannot be modified, and calls inside the software may break if you move them; copying is enough for UOS to display the icons correctly. For PNG icons, confirm the actual resolution of each image and place it under the path for that resolution, otherwise the system will scale it and the image will distort.

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

Write the desktop file:

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

Write the info file (this program has no plugins, so the redundant fields are removed):

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

Then move everything extracted from the official binary archive into `opt/apps/com.jetbrains.clion/files/`, making sure the original executables end up under `opt/apps/com.jetbrains.phpstorm/files/bin`.

```bash
cd ~/Desktop/com.jetbrains.phpstorm-2020.3.1/opt/apps/com.jetbrains.phpstorm/
cp -a ~/Desktop/PhpStorm-203.6682.180 ./files/
```

The files directory looks like this:

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
drwxr-xr-x  2 kane kane   4096 Jan 25 17:27 license
drwxr-xr-x 59 kane kane   4096 Jan 25 17:28 plugins
-rw-r--r--  1 kane kane     428 Dec 31 03:02 product-info.json
```

### Build the package

Create the packaging rules (i.e. the DEBIAN directory) by running `dh_make --createorig -s -n` inside `com.jetbrains.phpstorm-2020.3.1`:

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

> Tip: if you don't want to set the maintainer via environment variables, use the `-e` flag to specify the maintainer email directly, e.g. `-e kane@example.com`.

Fix the packaging rules

The sample files generated under debian/ are not fully applicable, so fix them manually:

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

A bunch of sample files (.ex/.EX) are generated under debian/ — delete them:

```bash
rm *.ex *.EX
```

Edit the packaging control file `control`:

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

> Tip: for the `Section` field, see the official Debian doc [2.4. Sections](https://www.debian.org/doc/debian-policy/ch-archive.html#s-subsections).
> Common choices: admin, cli-mono, comm, database, debug, devel, doc, editors, education, electronics, embedded, fonts, games, gnome, gnu-r, gnustep, graphics, hamradio, haskell, httpd, interpreters, introspection, java, javascript, kde, kernel, libdevel, libs, lisp, localization, mail, math, metapackages, misc, net, news, ocaml, oldlibs, otherosfs, perl, php, python, ruby, rust, science, shells, sound, tasks, tex, text, utils, vcs, video, web, x11, xfce, zope.
> Pick the one that matches your software.

Edit the packaging rules file `rules`:

```
#!/usr/bin/make -f
# See debhelper(7) (uncomment to enable)
# output every command that modifies files on the build system.
export DH_VERBOSE = 1              # print the full build log


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

override_dh_strip:                 # do not strip symbols and debug info (strip operation)

override_dh_strip_nondeterminism:  # do not strip redundant text data

override_dh_installchangelogs:     # do not install changelogs

override_dh_installdocs:           # do not install documentation

override_dh_md5sums:               # do not generate MD5 checksums

# dh_make generated override targets
# This is example for Cmake (See https://bugs.debian.org/641051 )
#override_dh_auto_configure:
#       dh_auto_configure -- #  -DCMAKE_LIBRARY_PATH=$(DEB_HOST_MULTIARCH)
```

Because the UOS-specified installation layout differs from native Debian rules, create an install rules file:

```bash
echo "opt/ /" > ./install
```

> Tip: this installs the package's `opt/` directory into the system root `/`, so the project directory layout needs no changes.

Remove the extra documentation and readme files:

```bash
rm -rf *.docs README README.*
```

When done, the debian directory should contain exactly **six files** and **one folder**:

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

> Tip: if the vendor's software needs hook scripts to do work the installer cannot, move the hook scripts into the `debian` directory at this step.

| Name | Purpose |
| :---: | --- |
| `preinst` | Runs before the package is unpacked; typically stops services of the package being upgraded until the upgrade or installation completes (`postinst` runs on success). |
| `postinst` | Runs after the package is unpacked; typically performs configuration the program needs, such as moving config files or starting/stopping services. |
| `prerm` | Runs before the package is removed; typically stops the package's related processes. |
| `postrm` | Runs after the package is removed; typically deletes leftover files or links the program created. |

Once everything checks out, go back to the **project root** and build. Build time varies with package contents (the build command must run inside the `<package>-<version>` folder):

```bash
cd ..
fakeroot dpkg-buildpackage -us -uc -b -tc
```

> One more note: if you want to "cross-build" (e.g. build a loongarch64 package on amd64) — only when the executables for that architecture are already compiled and you just need to package them — add `--host-arch loongarch64` (loongarch64 is just an example).

Check the parent directory:

```bash
total 371864
drwxr-xr-x 4 kane kane      4096 Jan 18 10:23 com.jetbrains.phpstorm-2020.3.1
-rw-r--r-- 1 kane kane      4449 Jan 18 11:12 com.jetbrains.phpstorm_2020.3.1_amd64.buildinfo
-rw-r--r-- 1 kane kane      1086 Jan 18 11:12 com.jetbrains.phpstorm_2020.3.1_amd64.changes
-rw-r--r-- 1 kane kane 380767800 Jan 18 11:12 com.jetbrains.phpstorm_2020.3.1_amd64.deb
```

Build complete — congratulations!


----------


## Appendix

### This article

* [如何构建符合要求的 UOS 软件安装包 - VVavE](https://www.vvave.net/archives/how-to-build-a-debian-series-distros-installation-package.html)

### References

* [Debian 维护者指南 - 青木](https://lx.atzlinux.com:24359/debmake-doc/index.zh-cn.html)
* [Debian control fields - Debian Docs](https://www.debian.org/doc/debian-policy/ch-controlfields.html)
* [编译报错 Unable to recognise the format of the input file `./libs/x86_64/libxxx.so'的解决 - CSDN](https://blog.csdn.net/darwinlong/article/details/48178131)
* [第 4 章 debian 目录中的必需内容 - Debian 官方手册](https://www.debian.org/doc/manuals/maint-guide/dreq.zh-cn.html#rules)
* [第 6 章 构建软件包 - Debian 官方手册](https://www.debian.org/doc/manuals/maint-guide/build.zh-cn.html)
