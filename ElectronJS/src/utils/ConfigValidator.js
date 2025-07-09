/**
 * 配置验证工具类 - 用于验证配置文件的安全性和有效性
 * Configuration validation utilities for security and validity checks
 */

class ConfigValidator {
    /**
     * 验证服务配置
     * Validate service configuration
     * @param {object} config - 配置对象
     * @returns {object} 验证结果
     */
    static validateServiceConfig(config) {
        const errors = [];
        const warnings = [];

        // 检查必需的字段
        const requiredFields = ['id', 'name', 'version'];
        for (const field of requiredFields) {
            if (!config[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // 验证任务名称
        if (config.name && typeof config.name === 'string') {
            if (config.name.length > 100) {
                warnings.push('Task name is too long (>100 characters)');
            }
            if (!/^[\w\s\u4e00-\u9fa5-]+$/.test(config.name)) {
                warnings.push('Task name contains invalid characters');
            }
        }

        // 验证保存名称（MySQL 表名）
        if (config.saveName) {
            if (!SecurityUtils.validateMySQLTableName(config.saveName)) {
                errors.push('Invalid save name for MySQL table');
            }
        }

        // 验证输出格式
        const validFormats = ['csv', 'xlsx', 'txt', 'json', 'mysql'];
        if (config.outputFormat && !validFormats.includes(config.outputFormat)) {
            errors.push(`Invalid output format: ${config.outputFormat}`);
        }

        // 验证邮件配置
        if (config.emailConfig) {
            const emailValidation = this.validateEmailConfig(config.emailConfig);
            errors.push(...emailValidation.errors);
            warnings.push(...emailValidation.warnings);
        }

        // 验证图形结构
        if (config.graph && Array.isArray(config.graph)) {
            const graphValidation = this.validateGraphStructure(config.graph);
            errors.push(...graphValidation.errors);
            warnings.push(...graphValidation.warnings);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 验证邮件配置
     * Validate email configuration
     * @param {object} emailConfig - 邮件配置
     * @returns {object} 验证结果
     */
    static validateEmailConfig(emailConfig) {
        const errors = [];
        const warnings = [];

        // 验证邮箱地址
        if (emailConfig.username && !SecurityUtils.validateEmail(emailConfig.username)) {
            errors.push('Invalid sender email address');
        }

        if (emailConfig.to) {
            const recipients = emailConfig.to.split(',');
            for (const recipient of recipients) {
                if (!SecurityUtils.validateEmail(recipient.trim())) {
                    errors.push(`Invalid recipient email: ${recipient.trim()}`);
                }
            }
        }

        // 验证端口
        if (emailConfig.port) {
            const port = parseInt(emailConfig.port);
            if (isNaN(port) || port < 1 || port > 65535) {
                errors.push('Invalid email server port');
            }
        }

        // 检查密码设置警告
        if (emailConfig.password) {
            warnings.push('Email password is set - be careful not to leak task files');
        }

        return { errors, warnings };
    }

    /**
     * 验证图形结构
     * Validate graph structure
     * @param {Array} graph - 图形节点数组
     * @returns {object} 验证结果
     */
    static validateGraphStructure(graph) {
        const errors = [];
        const warnings = [];

        for (let i = 0; i < graph.length; i++) {
            const node = graph[i];
            
            if (!node || typeof node !== 'object') {
                errors.push(`Invalid node at index ${i}`);
                continue;
            }

            // 验证节点基本结构
            if (typeof node.id !== 'number') {
                errors.push(`Node ${i}: Missing or invalid id`);
            }

            if (typeof node.option !== 'number') {
                errors.push(`Node ${i}: Missing or invalid option`);
            }

            // 验证参数
            if (node.parameters) {
                const paramValidation = this.validateNodeParameters(node, i);
                errors.push(...paramValidation.errors);
                warnings.push(...paramValidation.warnings);
            }
        }

        return { errors, warnings };
    }

    /**
     * 验证节点参数
     * Validate node parameters
     * @param {object} node - 节点对象
     * @param {number} index - 节点索引
     * @returns {object} 验证结果
     */
    static validateNodeParameters(node, index) {
        const errors = [];
        const warnings = [];
        const params = node.parameters;

        // 根据操作类型验证参数
        switch (node.option) {
            case 1: // 打开网页
                if (params.url && !SecurityUtils.validateURL(params.url)) {
                    errors.push(`Node ${index}: Invalid URL`);
                }
                break;

            case 2: // 点击元素
            case 3: // 提取数据
                if (params.xpath && !SecurityUtils.validateXPath(params.xpath)) {
                    errors.push(`Node ${index}: Unsafe XPath detected`);
                }
                break;

            case 4: // 输入文字
                if (params.value && params.value.length > 10000) {
                    warnings.push(`Node ${index}: Input text is very long`);
                }
                break;

            case 5: // 自定义操作
                if (params.code) {
                    const jsValidation = SecurityUtils.validateJavaScript(params.code);
                    if (!jsValidation.valid) {
                        errors.push(`Node ${index}: Unsafe JavaScript code - ${jsValidation.reason}`);
                    }
                }
                break;
        }

        // 验证通用的 JavaScript 参数
        const jsFields = ['beforeJS', 'afterJS', 'code'];
        for (const field of jsFields) {
            if (params[field]) {
                const jsValidation = SecurityUtils.validateJavaScript(params[field]);
                if (!jsValidation.valid) {
                    errors.push(`Node ${index}: Unsafe JavaScript in ${field} - ${jsValidation.reason}`);
                }
            }
        }

        return { errors, warnings };
    }

    /**
     * 验证用户数据文件夹路径
     * Validate user data folder path
     * @param {string} path - 文件夹路径
     * @returns {object} 验证结果
     */
    static validateUserDataPath(path) {
        const errors = [];
        const warnings = [];

        if (!path || typeof path !== 'string') {
            errors.push('User data path is required');
            return { isValid: false, errors, warnings };
        }

        if (!SecurityUtils.validateFilePath(path)) {
            errors.push('Unsafe user data path detected');
        }

        // 检查是否为系统关键目录
        const systemPaths = [
            '/etc', '/sys', '/proc', '/dev',
            'C:\\Windows', 'C:\\System32', 'C:\\Program Files'
        ];

        for (const systemPath of systemPaths) {
            if (path.toLowerCase().includes(systemPath.toLowerCase())) {
                errors.push('User data path cannot be in system directories');
                break;
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 清理配置对象
     * Sanitize configuration object
     * @param {object} config - 原始配置
     * @returns {object} 清理后的配置
     */
    static sanitizeConfig(config) {
        const sanitized = { ...config };

        // 清理字符串字段
        const stringFields = ['name', 'desc', 'saveName', 'url'];
        for (const field of stringFields) {
            if (sanitized[field] && typeof sanitized[field] === 'string') {
                sanitized[field] = SecurityUtils.sanitizeInput(sanitized[field]);
            }
        }

        // 清理图形结构中的字符串
        if (sanitized.graph && Array.isArray(sanitized.graph)) {
            sanitized.graph = sanitized.graph.map(node => {
                if (node.parameters) {
                    const cleanParams = { ...node.parameters };
                    
                    // 清理各种字符串参数
                    const paramFields = ['value', 'url', 'xpath', 'code', 'beforeJS', 'afterJS'];
                    for (const field of paramFields) {
                        if (cleanParams[field] && typeof cleanParams[field] === 'string') {
                            cleanParams[field] = SecurityUtils.sanitizeInput(cleanParams[field], 5000);
                        }
                    }
                    
                    return { ...node, parameters: cleanParams };
                }
                return node;
            });
        }

        return sanitized;
    }

    /**
     * 生成配置验证报告
     * Generate configuration validation report
     * @param {object} config - 配置对象
     * @returns {object} 验证报告
     */
    static generateValidationReport(config) {
        const serviceValidation = this.validateServiceConfig(config);
        
        let userDataValidation = { isValid: true, errors: [], warnings: [] };
        if (config.user_data_folder) {
            userDataValidation = this.validateUserDataPath(config.user_data_folder);
        }

        const overallValid = serviceValidation.isValid && userDataValidation.isValid;
        
        return {
            isValid: overallValid,
            summary: {
                totalErrors: serviceValidation.errors.length + userDataValidation.errors.length,
                totalWarnings: serviceValidation.warnings.length + userDataValidation.warnings.length
            },
            service: serviceValidation,
            userDataPath: userDataValidation,
            recommendations: this.generateRecommendations(serviceValidation, userDataValidation)
        };
    }

    /**
     * 生成改进建议
     * Generate improvement recommendations
     * @param {object} serviceValidation - 服务验证结果
     * @param {object} userDataValidation - 用户数据路径验证结果
     * @returns {Array} 建议列表
     */
    static generateRecommendations(serviceValidation, userDataValidation) {
        const recommendations = [];

        if (serviceValidation.errors.length > 0) {
            recommendations.push('Fix configuration errors before running the task');
        }

        if (serviceValidation.warnings.length > 0) {
            recommendations.push('Review configuration warnings for potential issues');
        }

        if (userDataValidation.errors.length > 0) {
            recommendations.push('Choose a safe user data folder path');
        }

        recommendations.push('Regularly review and validate your task configurations');
        recommendations.push('Keep your EasySpider version updated for latest security fixes');

        return recommendations;
    }
}

// 如果在 Node.js 环境中，导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigValidator;
}

// 如果在浏览器环境中，添加到全局对象
if (typeof window !== 'undefined') {
    window.ConfigValidator = ConfigValidator;
}
