/**
 * 前端表单验证工具类
 * 提供统一的表单输入验证、清理和安全处理功能
 * @version 1.0.0
 * @author EasySpider Security Enhancement
 */

class FormValidator {
    constructor() {
        this.securityUtils = typeof SecurityUtils !== 'undefined' ? SecurityUtils : null;
        this.errorHandler = typeof ErrorHandler !== 'undefined' ? ErrorHandler : null;
        
        // 验证规则配置
        this.validationRules = {
            url: {
                pattern: /^https?:\/\/.+/,
                maxLength: 2048,
                required: true
            },
            email: {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                maxLength: 254,
                required: false
            },
            xpath: {
                maxLength: 1000,
                required: true
            },
            javascript: {
                maxLength: 10000,
                required: false
            },
            taskName: {
                pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]{1,100}$/,
                maxLength: 100,
                required: true
            },
            filePath: {
                pattern: /^[^<>"|?*]+$/,
                maxLength: 260,
                required: false
            },
            number: {
                pattern: /^\d+$/,
                min: 0,
                max: 999999,
                required: false
            }
        };
    }

    /**
     * 验证单个输入字段
     * @param {string} value - 输入值
     * @param {string} type - 验证类型
     * @param {object} options - 额外选项
     * @returns {object} 验证结果
     */
    validateField(value, type, options = {}) {
        try {
            const result = {
                isValid: true,
                cleanValue: value,
                errors: [],
                warnings: []
            };

            // 空值检查
            if (!value || value.trim() === '') {
                if (this.validationRules[type]?.required || options.required) {
                    result.isValid = false;
                    result.errors.push(`${type} 字段不能为空`);
                }
                return result;
            }

            // 基础清理
            result.cleanValue = this.sanitizeInput(value, type);

            // 长度验证
            const maxLength = options.maxLength || this.validationRules[type]?.maxLength;
            if (maxLength && result.cleanValue.length > maxLength) {
                result.isValid = false;
                result.errors.push(`${type} 字段长度不能超过 ${maxLength} 字符`);
            }

            // 类型特定验证
            switch (type) {
                case 'url':
                    return this.validateUrl(result.cleanValue, result);
                case 'email':
                    return this.validateEmail(result.cleanValue, result);
                case 'xpath':
                    return this.validateXPath(result.cleanValue, result);
                case 'javascript':
                    return this.validateJavaScript(result.cleanValue, result);
                case 'taskName':
                    return this.validateTaskName(result.cleanValue, result);
                case 'filePath':
                    return this.validateFilePath(result.cleanValue, result);
                case 'number':
                    return this.validateNumber(result.cleanValue, result, options);
                default:
                    return this.validateGeneric(result.cleanValue, result, type);
            }
        } catch (error) {
            if (this.errorHandler) {
                this.errorHandler.logError('FormValidator.validateField', error, { type, value });
            }
            return {
                isValid: false,
                cleanValue: '',
                errors: ['验证过程中发生错误'],
                warnings: []
            };
        }
    }

    /**
     * 验证URL
     */
    validateUrl(value, result) {
        if (this.securityUtils) {
            if (!this.securityUtils.validateUrl(value)) {
                result.isValid = false;
                result.errors.push('URL 格式无效');
            }
        } else {
            // 后备验证
            const rule = this.validationRules.url;
            if (!rule.pattern.test(value)) {
                result.isValid = false;
                result.errors.push('URL 必须以 http:// 或 https:// 开头');
            }
        }

        // 检查危险URL
        const dangerousPatterns = [
            /javascript:/i,
            /data:/i,
            /file:/i,
            /ftp:/i,
            /<script/i
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(value)) {
                result.isValid = false;
                result.errors.push('检测到潜在危险的URL格式');
                break;
            }
        }

        return result;
    }

    /**
     * 验证邮箱
     */
    validateEmail(value, result) {
        if (this.securityUtils) {
            if (!this.securityUtils.validateEmail(value)) {
                result.isValid = false;
                result.errors.push('邮箱格式无效');
            }
        } else {
            // 后备验证
            const rule = this.validationRules.email;
            if (!rule.pattern.test(value)) {
                result.isValid = false;
                result.errors.push('邮箱格式无效');
            }
        }

        return result;
    }

    /**
     * 验证XPath
     */
    validateXPath(value, result) {
        if (this.securityUtils) {
            if (!this.securityUtils.validateXPath(value)) {
                result.isValid = false;
                result.errors.push('XPath 表达式格式无效');
            }
        } else {
            // 后备验证
            if (!value.startsWith('/') && !value.startsWith('//') && !value.startsWith('.')) {
                result.warnings.push('XPath 建议以 /、// 或 . 开头');
            }

            // 检查危险字符
            const dangerousChars = ['<', '>', '"', "'", ';'];
            for (const char of dangerousChars) {
                if (value.includes(char)) {
                    result.warnings.push(`XPath 包含可能危险的字符: ${char}`);
                }
            }
        }

        return result;
    }

    /**
     * 验证JavaScript代码
     */
    validateJavaScript(value, result) {
        if (this.securityUtils) {
            if (!this.securityUtils.validateJavaScript(value)) {
                result.isValid = false;
                result.errors.push('JavaScript 代码包含潜在危险内容');
            }
        } else {
            // 后备验证：检查危险函数调用
            const dangerousPatterns = [
                /eval\s*\(/i,
                /Function\s*\(/i,
                /setTimeout\s*\(\s*['"`]/i,
                /setInterval\s*\(\s*['"`]/i,
                /document\.write/i,
                /innerHTML\s*=/i,
                /outerHTML\s*=/i,
                /location\s*=/i,
                /window\s*\[\s*['"`]/i
            ];

            for (const pattern of dangerousPatterns) {
                if (pattern.test(value)) {
                    result.warnings.push('JavaScript 代码包含需要谨慎使用的函数或属性');
                    break;
                }
            }
        }

        return result;
    }

    /**
     * 验证任务名称
     */
    validateTaskName(value, result) {
        const rule = this.validationRules.taskName;
        if (!rule.pattern.test(value)) {
            result.isValid = false;
            result.errors.push('任务名称只能包含中英文、数字、下划线、连字符和空格');
        }

        return result;
    }

    /**
     * 验证文件路径
     */
    validateFilePath(value, result) {
        if (this.securityUtils) {
            if (!this.securityUtils.validatePath(value)) {
                result.isValid = false;
                result.errors.push('文件路径格式无效');
            }
        } else {
            // 后备验证
            const rule = this.validationRules.filePath;
            if (!rule.pattern.test(value)) {
                result.isValid = false;
                result.errors.push('文件路径包含无效字符');
            }

            // 检查路径遍历攻击
            if (value.includes('../') || value.includes('..\\')) {
                result.isValid = false;
                result.errors.push('文件路径不能包含相对路径遍历字符');
            }
        }

        return result;
    }

    /**
     * 验证数字
     */
    validateNumber(value, result, options = {}) {
        const numValue = parseInt(value);
        if (isNaN(numValue)) {
            result.isValid = false;
            result.errors.push('必须是有效的数字');
            return result;
        }

        const min = options.min !== undefined ? options.min : this.validationRules.number.min;
        const max = options.max !== undefined ? options.max : this.validationRules.number.max;

        if (numValue < min) {
            result.isValid = false;
            result.errors.push(`数值不能小于 ${min}`);
        }

        if (numValue > max) {
            result.isValid = false;
            result.errors.push(`数值不能大于 ${max}`);
        }

        result.cleanValue = numValue.toString();
        return result;
    }

    /**
     * 通用验证
     */
    validateGeneric(value, result, type) {
        // 检查基本的XSS模式
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi
        ];

        for (const pattern of xssPatterns) {
            if (pattern.test(value)) {
                result.isValid = false;
                result.errors.push('输入内容包含潜在的安全风险');
                break;
            }
        }

        return result;
    }

    /**
     * 清理输入内容
     */
    sanitizeInput(value, type) {
        if (!value || typeof value !== 'string') {
            return '';
        }

        // 移除首尾空白
        let cleaned = value.trim();

        // 根据类型进行特定清理
        switch (type) {
            case 'url':
                // URL不需要过多清理，但要确保格式正确
                break;
            case 'email':
                // 邮箱转小写
                cleaned = cleaned.toLowerCase();
                break;
            case 'xpath':
                // XPath保持原样，但移除多余空格
                cleaned = cleaned.replace(/\s+/g, ' ');
                break;
            case 'javascript':
                // JavaScript代码保持原样
                break;
            case 'taskName':
                // 任务名称移除特殊字符
                cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z0-9_\-\s]/g, '');
                break;
            case 'filePath':
                // 文件路径标准化
                cleaned = cleaned.replace(/[\\\/]+/g, '/');
                break;
            default:
                // 默认清理：移除HTML标签和危险字符
                cleaned = cleaned
                    .replace(/<[^>]*>/g, '')
                    .replace(/[<>"']/g, '');
        }

        return cleaned;
    }

    /**
     * 验证整个表单
     * @param {object} formData - 表单数据
     * @param {object} validationConfig - 验证配置
     * @returns {object} 验证结果
     */
    validateForm(formData, validationConfig) {
        const results = {
            isValid: true,
            cleanData: {},
            errors: {},
            warnings: {},
            summary: {
                totalFields: 0,
                validFields: 0,
                errorFields: 0,
                warningFields: 0
            }
        };

        try {
            for (const [fieldName, fieldValue] of Object.entries(formData)) {
                results.summary.totalFields++;
                
                const config = validationConfig[fieldName] || { type: 'generic' };
                const fieldResult = this.validateField(fieldValue, config.type, config.options);

                results.cleanData[fieldName] = fieldResult.cleanValue;

                if (!fieldResult.isValid) {
                    results.isValid = false;
                    results.errors[fieldName] = fieldResult.errors;
                    results.summary.errorFields++;
                } else {
                    results.summary.validFields++;
                }

                if (fieldResult.warnings.length > 0) {
                    results.warnings[fieldName] = fieldResult.warnings;
                    results.summary.warningFields++;
                }
            }

            // 记录验证结果
            if (this.errorHandler) {
                if (!results.isValid) {
                    this.errorHandler.logError('FormValidator.validateForm', 
                        new Error('表单验证失败'), 
                        { errors: results.errors, warnings: results.warnings });
                } else if (results.summary.warningFields > 0) {
                    this.errorHandler.logWarning('FormValidator.validateForm', 
                        '表单验证通过但存在警告', 
                        { warnings: results.warnings });
                }
            }

            return results;
        } catch (error) {
            if (this.errorHandler) {
                this.errorHandler.logError('FormValidator.validateForm', error, { formData });
            }

            return {
                isValid: false,
                cleanData: {},
                errors: { _form: ['表单验证过程中发生错误'] },
                warnings: {},
                summary: { totalFields: 0, validFields: 0, errorFields: 1, warningFields: 0 }
            };
        }
    }

    /**
     * 显示验证错误
     * @param {object} errors - 错误信息
     * @param {string} containerId - 容器ID
     */
    displayErrors(errors, containerId = 'validation-errors') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`验证错误容器 ${containerId} 不存在`);
            return;
        }

        container.innerHTML = '';

        if (Object.keys(errors).length === 0) {
            container.style.display = 'none';
            return;
        }

        const errorList = document.createElement('div');
        errorList.className = 'alert alert-danger';
        errorList.innerHTML = '<strong>请修正以下错误：</strong>';

        const ul = document.createElement('ul');
        ul.style.marginTop = '10px';
        ul.style.marginBottom = '0';

        for (const [field, fieldErrors] of Object.entries(errors)) {
            for (const error of fieldErrors) {
                const li = document.createElement('li');
                li.textContent = `${field}: ${error}`;
                ul.appendChild(li);
            }
        }

        errorList.appendChild(ul);
        container.appendChild(errorList);
        container.style.display = 'block';
    }

    /**
     * 显示验证警告
     * @param {object} warnings - 警告信息
     * @param {string} containerId - 容器ID
     */
    displayWarnings(warnings, containerId = 'validation-warnings') {
        const container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        container.innerHTML = '';

        if (Object.keys(warnings).length === 0) {
            container.style.display = 'none';
            return;
        }

        const warningList = document.createElement('div');
        warningList.className = 'alert alert-warning';
        warningList.innerHTML = '<strong>请注意以下警告：</strong>';

        const ul = document.createElement('ul');
        ul.style.marginTop = '10px';
        ul.style.marginBottom = '0';

        for (const [field, fieldWarnings] of Object.entries(warnings)) {
            for (const warning of fieldWarnings) {
                const li = document.createElement('li');
                li.textContent = `${field}: ${warning}`;
                ul.appendChild(li);
            }
        }

        warningList.appendChild(ul);
        container.appendChild(warningList);
        container.style.display = 'block';
    }

    /**
     * 实时验证字段
     * @param {HTMLElement} element - 输入元素
     * @param {string} type - 验证类型
     * @param {object} options - 选项
     */
    bindRealTimeValidation(element, type, options = {}) {
        if (!element) return;

        const validate = () => {
            const result = this.validateField(element.value, type, options);
            
            // 移除旧的验证状态
            element.classList.remove('is-valid', 'is-invalid');
            
            // 添加新的验证状态
            if (result.isValid) {
                element.classList.add('is-valid');
                element.value = result.cleanValue; // 应用清理后的值
            } else {
                element.classList.add('is-invalid');
            }

            // 显示错误消息
            const errorElement = element.parentNode.querySelector('.invalid-feedback');
            if (errorElement) {
                errorElement.textContent = result.errors.join(', ');
            }

            // 显示警告消息
            const warningElement = element.parentNode.querySelector('.warning-feedback');
            if (warningElement && result.warnings.length > 0) {
                warningElement.textContent = result.warnings.join(', ');
                warningElement.style.display = 'block';
            } else if (warningElement) {
                warningElement.style.display = 'none';
            }
        };

        // 绑定事件
        element.addEventListener('blur', validate);
        element.addEventListener('input', () => {
            // 延迟验证，避免过于频繁
            clearTimeout(element._validationTimeout);
            element._validationTimeout = setTimeout(validate, 500);
        });
    }

    /**
     * 为表单绑定验证
     * @param {string} formId - 表单ID
     * @param {object} validationConfig - 验证配置
     */
    bindFormValidation(formId, validationConfig) {
        const form = document.getElementById(formId);
        if (!form) {
            console.warn(`表单 ${formId} 不存在`);
            return;
        }

        // 为每个字段绑定实时验证
        for (const [fieldName, config] of Object.entries(validationConfig)) {
            const element = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (element) {
                this.bindRealTimeValidation(element, config.type, config.options);
            }
        }

        // 表单提交时进行完整验证
        form.addEventListener('submit', (e) => {
            const formData = new FormData(form);
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }

            const result = this.validateForm(data, validationConfig);
            
            if (!result.isValid) {
                e.preventDefault();
                this.displayErrors(result.errors);
                
                // 聚焦到第一个错误字段
                const firstErrorField = Object.keys(result.errors)[0];
                const firstErrorElement = form.querySelector(`[name="${firstErrorField}"], #${firstErrorField}`);
                if (firstErrorElement) {
                    firstErrorElement.focus();
                }
            } else {
                this.displayErrors({}); // 清除错误显示
                this.displayWarnings(result.warnings); // 显示警告
            }
        });
    }
}

// 全局实例
if (typeof window !== 'undefined') {
    window.FormValidator = FormValidator;
    window.formValidator = new FormValidator();
}

// 兼容模块系统
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}
