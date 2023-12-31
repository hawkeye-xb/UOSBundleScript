// install 文件
export const install = `opt/ /`;

// rules 文件
export const rules = `#!/usr/bin/make -f
# See debhelper(7) (uncomment to enable)
# output every command that modifies files on the build system.
#export DH_VERBOSE = 1


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
#	dh_auto_configure -- #	-DCMAKE_LIBRARY_PATH=$(DEB_HOST_MULTIARCH)

`;

