.PHONY: all dependency extension chrome chromedriver electron clean_extension clean_electron dev

ROOT_DIR ?= $(shell pwd)
CHROME_DIR ?= /opt/google/chrome
SYSTEM ?= linux64
CHROMEDRIVER_SUFFIX ?= linux64

all: dependency extension chrome chromedriver electron
clean: clean_extension clean_electron
dev: clean extension chrome chromedriver electron

dependency:
	@echo "=====> 安装依赖 | Install dependency"
	sudo apt-get install libxcb1 libxcb-xinerama0 libxcb-cursor0 libxkbcommon-x11-0
	@echo "=====> 安装依赖完成 | Dependency installed finish\n\n\n"

extension:
	@echo "=====> 编译浏览器扩展 | Compile the browser extension"
	cd Extension/manifest_v3 && npm install
	cd $(ROOT_DIR)
	@echo "=====> 编译浏览器扩展完成 | Compile the browser extension finish\n\n\n"

chrome:
	@echo "=====> 复制Chrome文件夹到ElectronJS/chrome_xxx | Copy the Chrome folder to ElectronJS/chrome_xxx"
	cp -rfT $(CHROME_DIR) $(ROOT_DIR)/ElectronJS/chrome_$(SYSTEM)
	cp -rf $(ROOT_DIR)/ElectronJS/stealth.min.js $(ROOT_DIR)/ElectronJS/chrome_$(SYSTEM)
	cp -rf $(ROOT_DIR)/ElectronJS/execute_${SYSTEM}.sh $(ROOT_DIR)/ElectronJS/chrome_$(SYSTEM)
	@echo "=====> 复制Chrome文件夹完成 | Copy the Chrome folder finish\n\n\n"

chromedriver:
	@echo "=====> 获取Chromedriver | Get Chromedriver"
	cp -f $(CHROMEDRIVER_PATH) $(ROOT_DIR)/ElectronJS/chrome_$(SYSTEM)/chromedriver_$(CHROMEDRIVER_SUFFIX)
	@echo "=====> 获取Chromedriver完成 | Get Chromedriver\n\n\n"

electron:
	@echo "=====> 编译 ElectronJS | Compile the ElectronJS"
	cd ElectronJS && npm install
	cd ElectronJS/node_modules/electron/dist && sudo sudo chown root:root chrome-sandbox && sudo chmod 4755 chrome-sandbox
	@echo "你可以去 $(ROOT_DIR)/ElectronJS 目录下运行\`npm run start_direct\`命令启动主程序"
	@echo "You can go to $(ROOT_DIR)/ElectronJS directory and run\`npm run start_direct\` to start the main program."

clean_extension:
	@echo "=====> 清理浏览器扩展 | Clean the browser extension"
	rm -rf $(ROOT_DIR)/Extension/manifest_v3/node_modules
	rm -rf $(ROOT_DIR)/Extension/manifest_v3/package-lock.json
	@echo "=====> 清理浏览器扩展完成 | Clean the browser extension finish\n\n\n"

clean_electron:
	@echo "=====> 清理 ElectronJS | Clean the ElectronJS"
	rm -rf $(ROOT_DIR)/ElectronJS/node_modules
	rm -rf $(ROOT_DIR)/ElectronJS/package-lock.json
	@echo "=====> 清理 ElectronJS 完成 | Clean the ElectronJS finish\n\n\n"
