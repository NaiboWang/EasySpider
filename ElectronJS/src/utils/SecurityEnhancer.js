/**
 * EasySpider 前端安全增强初始化脚本
 * 负责初始化所有安全工具类并提供统一的安全接口
 * @version 1.0.0
 * @author EasySpider Security Enhancement
 */

(function() {
    'use strict';

    // 安全增强管理器
    class SecurityEnhancer {
        constructor() {
            this.isInitialized = false;
            this.securityUtils = null;
            this.errorHandler = null;
            this.configValidator = null;
            this.formValidator = null;
            
            // 配置选项
            this.config = {
                enableFormValidation: true,
                enableRealTimeValidation: true,
                enableSecurityLogging: true,
                enableErrorReporting: true,
                logLevel: 'INFO' // DEBUG, INFO, WARN, ERROR
            };

            // 初始化
            this.init();
        }

        /**
         * 初始化安全增强功能
         */
        async init() {
            try {
                console.log('[SecurityEnhancer] 正在初始化安全增强功能...');
                
                // 加载并初始化各个工具类
                await this.initializeSecurityUtils();
                await this.initializeErrorHandler();
                await this.initializeConfigValidator();
                await this.initializeFormValidator();
                
                // 设置全局错误处理
                this.setupGlobalErrorHandling();
                
                // 设置表单安全增强
                this.setupFormSecurity();
                
                // 设置输入过滤
                this.setupInputFiltering();
                
                // 设置安全监控
                this.setupSecurityMonitoring();
                
                this.isInitialized = true;
                console.log('[SecurityEnhancer] 安全增强功能初始化完成');
                
                // 触发初始化完成事件
                this.dispatchEvent('security-enhanced', {
                    message: '安全增强功能已启用',
                    features: ['输入验证', '错误处理', '安全监控', '表单保护']
                });
                
            } catch (error) {
                console.error('[SecurityEnhancer] 初始化失败:', error);
                this.handleInitializationError(error);
            }
        }

        /**
         * 初始化安全工具类
         */
        async initializeSecurityUtils() {
            if (typeof SecurityUtils !== 'undefined') {
                this.securityUtils = SecurityUtils;
                console.log('[SecurityEnhancer] SecurityUtils 已加载');
            } else {
                console.warn('[SecurityEnhancer] SecurityUtils 未找到，将使用后备验证');
            }
        }

        /**
         * 初始化错误处理器
         */
        async initializeErrorHandler() {
            if (typeof ErrorHandler !== 'undefined') {
                this.errorHandler = new ErrorHandler();
                console.log('[SecurityEnhancer] ErrorHandler 已初始化');
            } else {
                // 创建简单的后备错误处理器
                this.errorHandler = this.createFallbackErrorHandler();
                console.warn('[SecurityEnhancer] 使用后备错误处理器');
            }
        }

        /**
         * 初始化配置验证器
         */
        async initializeConfigValidator() {
            if (typeof ConfigValidator !== 'undefined') {
                this.configValidator = new ConfigValidator();
                console.log('[SecurityEnhancer] ConfigValidator 已初始化');
            } else {
                console.warn('[SecurityEnhancer] ConfigValidator 未找到');
            }
        }

        /**
         * 初始化表单验证器
         */
        async initializeFormValidator() {
            if (typeof FormValidator !== 'undefined') {
                this.formValidator = new FormValidator();
                console.log('[SecurityEnhancer] FormValidator 已初始化');
            } else {
                console.warn('[SecurityEnhancer] FormValidator 未找到');
            }
        }

        /**
         * 设置全局错误处理
         */
        setupGlobalErrorHandling() {
            // 捕获未处理的JavaScript错误
            window.addEventListener('error', (event) => {
                if (this.errorHandler) {
                    this.errorHandler.logError('GlobalError', event.error, {
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                        message: event.message
                    });
                }
            });

            // 捕获未处理的Promise拒绝
            window.addEventListener('unhandledrejection', (event) => {
                if (this.errorHandler) {
                    this.errorHandler.logError('UnhandledPromiseRejection', event.reason, {
                        promise: event.promise
                    });
                }
            });

            // 增强console.error
            const originalConsoleError = console.error;
            console.error = (...args) => {
                if (this.errorHandler) {
                    this.errorHandler.logError('ConsoleError', new Error(args.join(' ')), { args });
                }
                originalConsoleError.apply(console, args);
            };
        }

        /**
         * 设置表单安全增强
         */
        setupFormSecurity() {
            if (!this.formValidator || !this.config.enableFormValidation) {
                return;
            }

            // 定义常见表单字段的验证配置
            const commonValidationConfig = {
                // 任务配置相关
                serviceName: { type: 'taskName', options: { required: true, maxLength: 100 } },
                url: { type: 'url', options: { required: true } },
                links: { type: 'url', options: { required: false } },
                serviceDescription: { type: 'generic', options: { maxLength: 500 } },
                
                // 文件路径相关
                saveName: { type: 'taskName', options: { required: true, maxLength: 64 } },
                inputExcel: { type: 'filePath', options: { required: false } },
                user_data_folder: { type: 'filePath', options: { required: false } },
                mysql_config_path: { type: 'filePath', options: { required: false } },
                
                // 邮件配置相关
                'emailConfig.host': { type: 'generic', options: { required: true, maxLength: 255 } },
                'emailConfig.port': { type: 'number', options: { required: true, min: 1, max: 65535 } },
                'emailConfig.username': { type: 'email', options: { required: true } },
                'emailConfig.password': { type: 'generic', options: { required: true, maxLength: 100 } },
                'emailConfig.to': { type: 'email', options: { required: true } },
                'emailConfig.subject': { type: 'generic', options: { required: true, maxLength: 200 } },
                'emailConfig.content': { type: 'generic', options: { required: false, maxLength: 5000 } },
                
                // 数字配置相关
                saveThreshold: { type: 'number', options: { required: true, min: 1, max: 10000 } },
                quitWaitTime: { type: 'number', options: { required: true, min: 0, max: 3600 } },
                maxViewLength: { type: 'number', options: { required: true, min: 1, max: 1000 } },
                maxWaitTime: { type: 'number', options: { required: true, min: 0, max: 300 } },
                
                // XPath和脚本相关
                xpath: { type: 'xpath', options: { required: true } },
                beforeJS: { type: 'javascript', options: { required: false } },
                afterJS: { type: 'javascript', options: { required: false } },
                value: { type: 'generic', options: { required: false, maxLength: 10000 } },
                textList: { type: 'generic', options: { required: false, maxLength: 50000 } }
            };

            // 监听DOM变化，为新表单绑定验证
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 查找表单元素
                            const forms = node.tagName === 'FORM' ? [node] : node.querySelectorAll('form');
                            forms.forEach(form => this.enhanceForm(form, commonValidationConfig));
                            
                            // 查找输入元素
                            const inputs = node.querySelectorAll('input, textarea, select');
                            inputs.forEach(input => this.enhanceInput(input));
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // 增强现有表单
            document.querySelectorAll('form').forEach(form => {
                this.enhanceForm(form, commonValidationConfig);
            });

            // 增强现有输入元素
            document.querySelectorAll('input, textarea, select').forEach(input => {
                this.enhanceInput(input);
            });
        }

        /**
         * 增强单个表单
         */
        enhanceForm(form, validationConfig) {
            if (!form || form.dataset.securityEnhanced) {
                return;
            }

            try {
                // 标记已增强
                form.dataset.securityEnhanced = 'true';

                // 添加验证错误显示容器
                if (!form.querySelector('.validation-errors')) {
                    const errorContainer = document.createElement('div');
                    errorContainer.className = 'validation-errors';
                    errorContainer.id = `validation-errors-${form.id || 'form'}`;
                    errorContainer.style.display = 'none';
                    form.insertBefore(errorContainer, form.firstChild);
                }

                // 绑定表单验证
                if (this.formValidator) {
                    this.formValidator.bindFormValidation(form.id || 'form', validationConfig);
                }

                console.log(`[SecurityEnhancer] 表单安全增强已应用: ${form.id || 'unnamed'}`);
            } catch (error) {
                if (this.errorHandler) {
                    this.errorHandler.logError('SecurityEnhancer.enhanceForm', error, { formId: form.id });
                }
            }
        }

        /**
         * 增强单个输入元素
         */
        enhanceInput(input) {
            if (!input || input.dataset.securityEnhanced) {
                return;
            }

            try {
                // 标记已增强
                input.dataset.securityEnhanced = 'true';

                // 添加基础安全属性
                if (input.type === 'text' || input.type === 'url' || input.tagName === 'TEXTAREA') {
                    // 防止XSS
                    input.setAttribute('autocomplete', 'off');
                    
                    // 添加输入过滤
                    input.addEventListener('input', (e) => {
                        this.filterInput(e.target);
                    });
                }

                // 添加验证反馈元素
                if (!input.parentNode.querySelector('.invalid-feedback')) {
                    const feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    feedback.style.display = 'none';
                    input.parentNode.appendChild(feedback);
                }

                // 添加警告反馈元素
                if (!input.parentNode.querySelector('.warning-feedback')) {
                    const warning = document.createElement('div');
                    warning.className = 'warning-feedback text-warning';
                    warning.style.display = 'none';
                    warning.style.fontSize = '0.875em';
                    warning.style.marginTop = '0.25rem';
                    input.parentNode.appendChild(warning);
                }

            } catch (error) {
                if (this.errorHandler) {
                    this.errorHandler.logError('SecurityEnhancer.enhanceInput', error, { inputName: input.name });
                }
            }
        }

        /**
         * 输入过滤
         */
        filterInput(input) {
            if (!input.value) return;

            let filteredValue = input.value;
            const inputType = input.type || input.dataset.validationType || 'generic';

            // 基础XSS过滤
            if (inputType !== 'javascript') { // JavaScript代码字段保持原样
                // 移除危险的HTML标签
                filteredValue = filteredValue.replace(/<script[^>]*>.*?<\/script>/gi, '');
                filteredValue = filteredValue.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
                filteredValue = filteredValue.replace(/javascript:/gi, '');
                filteredValue = filteredValue.replace(/on\w+\s*=/gi, '');
            }

            // SQL注入基础防护
            if (inputType === 'text' || inputType === 'generic') {
                // 替换常见的SQL注入模式
                filteredValue = filteredValue.replace(/['";]/g, '');
                filteredValue = filteredValue.replace(/--/g, '');
                filteredValue = filteredValue.replace(/\/\*/g, '');
                filteredValue = filteredValue.replace(/\*\//g, '');
            }

            // 如果值被修改，更新输入框并记录
            if (filteredValue !== input.value) {
                input.value = filteredValue;
                
                if (this.errorHandler) {
                    this.errorHandler.logWarning('SecurityEnhancer.filterInput', 
                        '检测到潜在危险输入并已过滤', 
                        { inputName: input.name, originalValue: input.value, filteredValue });
                }

                // 显示警告信息
                this.showInputWarning(input, '输入内容已被安全过滤');
            }
        }

        /**
         * 显示输入警告
         */
        showInputWarning(input, message) {
            const warning = input.parentNode.querySelector('.warning-feedback');
            if (warning) {
                warning.textContent = message;
                warning.style.display = 'block';
                
                // 3秒后隐藏
                setTimeout(() => {
                    warning.style.display = 'none';
                }, 3000);
            }
        }

        /**
         * 设置输入过滤
         */
        setupInputFiltering() {
            // 为所有现有输入元素添加过滤
            document.querySelectorAll('input[type="text"], input[type="url"], textarea').forEach(input => {
                if (!input.dataset.filteringEnabled) {
                    input.dataset.filteringEnabled = 'true';
                    input.addEventListener('blur', () => this.filterInput(input));
                }
            });
        }

        /**
         * 设置安全监控
         */
        setupSecurityMonitoring() {
            if (!this.config.enableSecurityLogging) {
                return;
            }

            // 监控敏感操作
            this.monitorSensitiveOperations();
            
            // 监控异常网络请求
            this.monitorNetworkRequests();
            
            // 监控DOM修改
            this.monitorDOMModifications();
        }

        /**
         * 监控敏感操作
         */
        monitorSensitiveOperations() {
            // 监控任务保存操作
            const saveButtons = document.querySelectorAll('#saveButton, #saveAsButton');
            saveButtons.forEach(button => {
                button.addEventListener('click', () => {
                    if (this.errorHandler) {
                        this.errorHandler.logInfo('SecurityMonitor', '任务保存操作', {
                            timestamp: new Date().toISOString(),
                            action: button.id === 'saveButton' ? 'save' : 'saveAs'
                        });
                    }
                });
            });

            // 监控任务执行操作
            const executeButtons = document.querySelectorAll('[onclick*="execute"], [onclick*="invoke"]');
            executeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    if (this.errorHandler) {
                        this.errorHandler.logInfo('SecurityMonitor', '任务执行操作', {
                            timestamp: new Date().toISOString(),
                            action: 'execute'
                        });
                    }
                });
            });
        }

        /**
         * 监控网络请求
         */
        monitorNetworkRequests() {
            // 拦截fetch请求
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const [url, options] = args;
                
                if (this.errorHandler) {
                    this.errorHandler.logInfo('NetworkMonitor', 'Fetch请求', {
                        url: url.toString(),
                        method: options?.method || 'GET',
                        timestamp: new Date().toISOString()
                    });
                }

                return originalFetch.apply(window, args);
            };

            // 拦截XMLHttpRequest
            const originalXHROpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                if (window.securityEnhancer?.errorHandler) {
                    window.securityEnhancer.errorHandler.logInfo('NetworkMonitor', 'XHR请求', {
                        method,
                        url: url.toString(),
                        timestamp: new Date().toISOString()
                    });
                }

                return originalXHROpen.apply(this, [method, url, ...args]);
            };
        }

        /**
         * 监控DOM修改
         */
        monitorDOMModifications() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // 检查是否添加了可疑的脚本标签
                                const scripts = node.tagName === 'SCRIPT' ? [node] : node.querySelectorAll('script');
                                scripts.forEach((script) => {
                                    if (this.errorHandler) {
                                        this.errorHandler.logWarning('DOMMonitor', '检测到动态脚本添加', {
                                            src: script.src,
                                            innerHTML: script.innerHTML.substring(0, 100),
                                            timestamp: new Date().toISOString()
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        /**
         * 创建后备错误处理器
         */
        createFallbackErrorHandler() {
            return {
                logError: (source, error, context) => {
                    console.error(`[${source}]`, error, context);
                },
                logWarning: (source, message, context) => {
                    console.warn(`[${source}]`, message, context);
                },
                logInfo: (source, message, context) => {
                    if (this.config.logLevel === 'DEBUG' || this.config.logLevel === 'INFO') {
                        console.info(`[${source}]`, message, context);
                    }
                }
            };
        }

        /**
         * 处理初始化错误
         */
        handleInitializationError(error) {
            console.error('[SecurityEnhancer] 初始化失败，将使用降级模式');
            
            // 创建最基本的安全防护
            this.setupBasicProtection();
            
            // 通知用户
            this.dispatchEvent('security-init-error', {
                error: error.message,
                message: '安全增强功能部分失效，请联系管理员'
            });
        }

        /**
         * 设置基本防护
         */
        setupBasicProtection() {
            // 基本的XSS防护
            document.addEventListener('input', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    const value = e.target.value;
                    if (/<script|<iframe|javascript:|on\w+=/i.test(value)) {
                        e.target.value = value.replace(/<script[^>]*>.*?<\/script>/gi, '')
                                              .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
                                              .replace(/javascript:/gi, '')
                                              .replace(/on\w+\s*=/gi, '');
                        console.warn('[BasicProtection] 检测到并过滤了潜在危险输入');
                    }
                }
            });
        }

        /**
         * 分发自定义事件
         */
        dispatchEvent(eventName, detail) {
            const event = new CustomEvent(eventName, { detail });
            window.dispatchEvent(event);
        }

        /**
         * 获取安全状态
         */
        getSecurityStatus() {
            return {
                isInitialized: this.isInitialized,
                availableFeatures: {
                    securityUtils: !!this.securityUtils,
                    errorHandler: !!this.errorHandler,
                    configValidator: !!this.configValidator,
                    formValidator: !!this.formValidator
                },
                config: this.config
            };
        }

        /**
         * 更新配置
         */
        updateConfig(newConfig) {
            this.config = { ...this.config, ...newConfig };
            console.log('[SecurityEnhancer] 配置已更新:', this.config);
        }
    }

    // 创建全局实例
    window.securityEnhancer = new SecurityEnhancer();

    // 监听页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[SecurityEnhancer] DOM加载完成，安全增强功能已就绪');
        });
    }

    // 导出API给其他脚本使用
    window.EasySpiderSecurity = {
        getStatus: () => window.securityEnhancer.getSecurityStatus(),
        updateConfig: (config) => window.securityEnhancer.updateConfig(config),
        validateInput: (value, type, options) => {
            if (window.securityEnhancer.formValidator) {
                return window.securityEnhancer.formValidator.validateField(value, type, options);
            }
            return { isValid: true, cleanValue: value, errors: [], warnings: [] };
        }
    };

})();
