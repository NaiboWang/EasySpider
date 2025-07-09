/**
 * 安全工具类 - 用于输入验证和安全检查
 * Security utilities for input validation and security checks
 */

class SecurityUtils {
    /**
     * 验证 XPath 表达式的安全性
     * Validate XPath expression for security
     * @param {string} xpath - XPath 表达式
     * @returns {boolean} 是否安全
     */
    static validateXPath(xpath) {
        if (!xpath || typeof xpath !== 'string') {
            return false;
        }

        // 检查危险的 XPath 注入模式
        const dangerousPatterns = [
            /javascript:/i,
            /data:/i,
            /vbscript:/i,
            /on\w+\s*=/i,
            /<script/i,
            /eval\s*\(/i,
            /Function\s*\(/i,
            /setTimeout\s*\(/i,
            /setInterval\s*\(/i
        ];

        return !dangerousPatterns.some(pattern => pattern.test(xpath));
    }

    /**
     * 验证 JavaScript 代码的安全性
     * Validate JavaScript code for security
     * @param {string} jsCode - JavaScript 代码
     * @returns {object} 验证结果
     */
    static validateJavaScript(jsCode) {
        if (!jsCode || typeof jsCode !== 'string') {
            return { valid: false, reason: 'Invalid input' };
        }

        // 检查危险的 JavaScript 模式
        const dangerousPatterns = [
            { pattern: /eval\s*\(/i, reason: 'eval() function is not allowed for security reasons' },
            { pattern: /Function\s*\(/i, reason: 'Function constructor is not allowed' },
            { pattern: /with\s*\(/i, reason: 'with statement is not allowed' },
            { pattern: /import\s*\(/i, reason: 'Dynamic imports are not allowed' },
            { pattern: /require\s*\(/i, reason: 'require() is not allowed in this context' },
            { pattern: /process\./i, reason: 'Process object access is not allowed' },
            { pattern: /global\./i, reason: 'Global object access is not allowed' },
            { pattern: /window\.location/i, reason: 'Location manipulation is restricted' },
            { pattern: /document\.write/i, reason: 'document.write is not recommended' }
        ];

        // 除非是 Field[""] 或特定的 eval 用法，否则不允许
        if (jsCode.includes('eval(') && !jsCode.includes('Field[""]')) {
            const evalMatch = dangerousPatterns.find(p => p.pattern.test(jsCode));
            if (evalMatch) {
                return { valid: false, reason: evalMatch.reason };
            }
        }

        return { valid: true };
    }

    /**
     * 验证文件路径的安全性
     * Validate file path for security
     * @param {string} filePath - 文件路径
     * @returns {boolean} 是否安全
     */
    static validateFilePath(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            return false;
        }

        // 检查路径遍历攻击
        const dangerousPatterns = [
            /\.\.\//g,
            /\.\.\\/g,
            /~\//g,
            /\/etc\//i,
            /\/proc\//i,
            /\/sys\//i,
            /\/dev\//i,
            /\/tmp\//i,
            /\/var\//i,
            /C:\\Windows/i,
            /C:\\System/i,
            /C:\\Program Files/i
        ];

        return !dangerousPatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * 清理用户输入
     * Sanitize user input
     * @param {string} input - 用户输入
     * @returns {string} 清理后的输入
     */
    static sanitizeInput(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        return input
            .replace(/[<>'"]/g, '') // 移除危险字符
            .trim()
            .substring(0, 1000); // 限制长度
    }

    /**
     * 验证 MySQL 表名
     * Validate MySQL table name
     * @param {string} tableName - 表名
     * @returns {boolean} 是否有效
     */
    static validateMySQLTableName(tableName) {
        if (!tableName || typeof tableName !== 'string') {
            return false;
        }

        // MySQL 表名规则：以字母或汉字开头，后接字母、数字、下划线或汉字，长度为1到64字符
        const pattern = /^[\u4e00-\u9fa5a-zA-Z][\u4e00-\u9fa5a-zA-Z0-9_]{0,63}$/;
        return pattern.test(tableName);
    }

    /**
     * 验证邮箱地址
     * Validate email address
     * @param {string} email - 邮箱地址
     * @returns {boolean} 是否有效
     */
    static validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email) && email.length <= 254;
    }

    /**
     * 验证 URL
     * Validate URL
     * @param {string} url - URL 地址
     * @returns {boolean} 是否有效
     */
    static validateURL(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }

        try {
            const urlObj = new URL(url);
            return ['http:', 'https:', 'file:'].includes(urlObj.protocol);
        } catch (e) {
            return false;
        }
    }
}

// 如果在 Node.js 环境中，导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityUtils;
}

// 如果在浏览器环境中，添加到全局对象
if (typeof window !== 'undefined') {
    window.SecurityUtils = SecurityUtils;
}
