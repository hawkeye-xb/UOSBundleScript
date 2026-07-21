# How to Build a UnionTech UOS deb Package with electron-builder

## Setting up a UOS virtual machine

## Installing unsigned packages on UOS (developer mode)

deb packages without a UnionTech signature require developer mode to install — VS Code is one example. Enabling or disabling developer mode both require a reboot.

### Enable

[Settings] => [General] => [Developer Mode]
[Offline] => [Export local JSON] => upload it to the prompted address to get a certificate file => [Import the certificate file]

### Disable

```
# Clear the immutable flag on the file
sudo chattr -i /var/lib/deepin/developer-mode/enabled
# Delete the file
sudo rm /var/lib/deepin/developer-mode/enabled
# Reboot
reboot
```

## Build environment (docker)

Starting an ubuntu:latest container is enough:

```
sudo apt-get update
sudo apt-get install -y dh-make fakeroot dpkg-dev
```

## Build

## Signing

https://doc.chinauos.com/content/LrnDinQB_uwzIp6HxF7k
