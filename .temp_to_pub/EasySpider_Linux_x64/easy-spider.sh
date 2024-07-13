#!/bin/bash

# 使用 lsb_release 获取系统信息
os_name=$(lsb_release -si)
os_version=$(lsb_release -sr)

# 提取主版本号副版本号
major_version=$(echo $os_version | cut -d'.' -f1)
minor_version=$(echo $os_version | cut -d'.' -f2)

# 检查是否为Ubuntu且版本大于等于24.04
if [ "$os_name" == "Ubuntu" ] && [ "$major_version" -gt 24 ] || { [ "$major_version" -eq 24 ]; }; then
   # 要检查的文件路径
	file_path="./EasySpider/chrome-sandbox"

	# 检查文件是否存在
	if [ ! -e "$file_path" ]; then
		echo "File Not Exist!"
		exit 1
	fi

	# 获取文件的拥有者
	owner=$(stat -c %U "$file_path")

	# 获取文件的权限
	permissions=$(stat -c %a "$file_path")

	# 检查拥有者是否为root且权限是否为4755
	if [ "$owner" != "root" ] || [ "$permissions" != "4755" ]; then
		echo "这是你第一次在该Ubuntu系统上使用EasySpider，请在下方输入密码来调整文件权限以使用EasySpider："
		echo "This is the first time you use EasySpider in this Ubuntu system, please change your permission of the software by input your password below (should have root/sudo permission):"
		sudo chown root:root "$file_path"
		sudo chmod 4755 "$file_path"
		sudo chown root:root "./EasySpider/resources/app/chrome_linux64/chrome-sandbox"
		sudo chmod 4755 "./EasySpider/resources/app/chrome_linux64/chrome-sandbox"
	fi
else
	echo "如果报错“The SUID sandbox helper binary was found, but is not configured correctly”，请尝试执行以下命令后再次运行EasySpider："
	echo "If you encounter the error message “The SUID sandbox helper binary was found, but is not configured correctly”, please try run the following commands and run EasySpider again:"
	echo ""
	echo "sudo chown root:root ./EasySpider/chrome-sandbox"
	echo "sudo chmod 4755 ./EasySpider/chrome-sandbox"
	echo "sudo chown root:root ./EasySpider/resources/app/chrome_linux64/chrome-sandbox"
	echo "sudo chmod 4755 ./EasySpider/resources/app/chrome_linux64/chrome-sandbox"
	echo ""
	echo ""
fi


./EasySpider/EasySpider
