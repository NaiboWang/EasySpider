import os
import subprocess
import sys
from pathlib import Path

# 获取当前Python环境的lib路径
lib_path = Path(sys.prefix) / "lib"

# 使用pip列出所有已安装的包及其版本
installed_packages = subprocess.check_output([sys.executable, '-m', 'pip', 'list']).decode().strip().split('\n')[2:]

# 初始化一个字典来保存数据
package_sizes = {}

# 对于每个已安装的包，找到对应的路径并计算大小
for package in installed_packages:
    name, version = package.split()[:2]
    package_size = 0

    # 寻找与包名相关的顶层目录
    # 注意：这里简单地把包名直接转换为目录名，这在某些情况下可能不适用。
    # 例如，Google 的 protobuf 包在文件系统中称为 'google' 和 'protobuf'
    # 这需要特别处理或者使用包的元数据来找到正确的顶层目录。
    package_dir = lib_path / "python{0}.{1}".format(*sys.version_info) / "site-packages" / name

    # 计算文件夹大小
    if package_dir.exists():
        package_size = sum(f.stat().st_size for f in package_dir.glob('**/*') if f.is_file())

    package_sizes[name] = package_size

# 将包按大小排序并输出
for name, size in sorted(package_sizes.items(), key=lambda item: item[1], reverse=True):
    print(f"{name}: {size/1024/1024:.2f} MB")