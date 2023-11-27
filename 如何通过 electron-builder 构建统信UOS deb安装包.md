# 如何通过 electron-builder 构建统信UOS deb安装包
## UOS 虚拟机环境安装
## UOS 安装未签名包（开发者模式）
未使用统信签名的deb安装包，需要使用开发者模式才能安装。比如：vscode。
开启关闭皆需要重启。

### 开启
[设置] => [通用] => [开发者模式]
[离线] => [导出本地JSON] => 上传到提示的地址，得到证书文件 => [导入证书文件即可]

### 关闭
```
# 取消文件的禁止删除状态
sudo chattr -i /var/lib/deepin/developer-mode/enabled
# 删除文件
sudo rm /var/lib/deepin/developer-mode/enabled
# 重启
reboot
```

## 构建环境（docker）
启动ubuntu latest既可
```
sudo apt-get update
sudo apt-get install -y dh-make fakeroot dpkg-dev
```

## 构建

## 签名
https://doc.chinauos.com/content/LrnDinQB_uwzIp6HxF7k

