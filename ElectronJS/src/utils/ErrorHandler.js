/**
 * 错误处理工具类 - 统一的错误处理和用户友好的错误信息
 * Error handling utilities for consistent error management and user-friendly messages
 */

class ErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.lastError = null;
        this.errorLog = [];
    }

    /**
     * 错误类型枚举
     * Error type enumeration
     */
    static ErrorTypes = {
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        NETWORK_ERROR: 'NETWORK_ERROR',
        FILE_ERROR: 'FILE_ERROR',
        BROWSER_ERROR: 'BROWSER_ERROR',
        TASK_ERROR: 'TASK_ERROR',
        SECURITY_ERROR: 'SECURITY_ERROR',
        CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
    };

    /**
     * 错误严重级别
     * Error severity levels
     */
    static Severity = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    };

    /**
     * 多语言错误消息
     * Multilingual error messages
     */
    static ErrorMessages = {
        [ErrorHandler.ErrorTypes.VALIDATION_ERROR]: {
            zh: '输入验证失败',
            en: 'Input validation failed'
        },
        [ErrorHandler.ErrorTypes.NETWORK_ERROR]: {
            zh: '网络连接错误',
            en: 'Network connection error'
        },
        [ErrorHandler.ErrorTypes.FILE_ERROR]: {
            zh: '文件操作错误',
            en: 'File operation error'
        },
        [ErrorHandler.ErrorTypes.BROWSER_ERROR]: {
            zh: '浏览器操作错误',
            en: 'Browser operation error'
        },
        [ErrorHandler.ErrorTypes.TASK_ERROR]: {
            zh: '任务执行错误',
            en: 'Task execution error'
        },
        [ErrorHandler.ErrorTypes.SECURITY_ERROR]: {
            zh: '安全验证失败',
            en: 'Security validation failed'
        },
        [ErrorHandler.ErrorTypes.CONFIGURATION_ERROR]: {
            zh: '配置错误',
            en: 'Configuration error'
        }
    };

    /**
     * 处理错误
     * Handle error
     * @param {Error|string} error - 错误对象或错误消息
     * @param {string} type - 错误类型
     * @param {string} severity - 严重级别
     * @param {object} context - 错误上下文
     * @returns {object} 处理后的错误信息
     */
    handleError(error, type = ErrorHandler.ErrorTypes.TASK_ERROR, severity = ErrorHandler.Severity.MEDIUM, context = {}) {
        this.errorCount++;
        
        const errorInfo = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            type,
            severity,
            message: typeof error === 'string' ? error : error.message,
            stack: typeof error === 'object' ? error.stack : null,
            context,
            count: this.errorCount
        };

        this.lastError = errorInfo;
        this.errorLog.push(errorInfo);

        // 保持错误日志大小在合理范围内
        if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(-50);
        }

        // 根据严重级别决定处理方式
        switch (severity) {
            case ErrorHandler.Severity.CRITICAL:
                this.handleCriticalError(errorInfo);
                break;
            case ErrorHandler.Severity.HIGH:
                this.handleHighSeverityError(errorInfo);
                break;
            default:
                this.logError(errorInfo);
        }

        return errorInfo;
    }

    /**
     * 处理关键错误
     * Handle critical errors
     * @param {object} errorInfo - 错误信息
     */
    handleCriticalError(errorInfo) {
        console.error('CRITICAL ERROR:', errorInfo);
        
        // 显示用户友好的错误信息
        this.showUserError(errorInfo, true);
        
        // 可能需要停止当前任务或重启应用
        if (typeof window !== 'undefined' && window.showError) {
            window.showError(this.getUserFriendlyMessage(errorInfo, 'zh'), true);
        }
    }

    /**
     * 处理高严重级别错误
     * Handle high severity errors
     * @param {object} errorInfo - 错误信息
     */
    handleHighSeverityError(errorInfo) {
        console.error('HIGH SEVERITY ERROR:', errorInfo);
        this.showUserError(errorInfo, false);
    }

    /**
     * 记录错误
     * Log error
     * @param {object} errorInfo - 错误信息
     */
    logError(errorInfo) {
        console.warn('ERROR:', errorInfo);
        
        // 如果有日志文件写入功能，在此处添加
        if (typeof this.writeToLogFile === 'function') {
            this.writeToLogFile(errorInfo);
        }
    }

    /**
     * 显示用户友好的错误信息
     * Show user-friendly error message
     * @param {object} errorInfo - 错误信息
     * @param {boolean} isBlocking - 是否为阻塞性错误
     */
    showUserError(errorInfo, isBlocking = false) {
        const message = this.getUserFriendlyMessage(errorInfo);
        const solution = this.getSolution(errorInfo);
        
        const fullMessage = `${message}\n\n${solution}`;
        
        if (typeof window !== 'undefined') {
            if (window.notify_browser) {
                window.notify_browser(fullMessage, fullMessage, 'error');
            } else if (isBlocking && window.alert) {
                window.alert(fullMessage);
            } else if (window.console) {
                window.console.error(fullMessage);
            }
        }
    }

    /**
     * 获取用户友好的错误消息
     * Get user-friendly error message
     * @param {object} errorInfo - 错误信息
     * @param {string} lang - 语言
     * @returns {string} 用户友好的错误消息
     */
    getUserFriendlyMessage(errorInfo, lang = 'en') {
        const baseMessage = ErrorHandler.ErrorMessages[errorInfo.type];
        if (baseMessage && baseMessage[lang]) {
            return baseMessage[lang];
        }
        
        // 根据错误类型提供更具体的消息
        switch (errorInfo.type) {
            case ErrorHandler.ErrorTypes.VALIDATION_ERROR:
                return lang === 'zh' 
                    ? `输入验证失败：${errorInfo.message}` 
                    : `Input validation failed: ${errorInfo.message}`;
            
            case ErrorHandler.ErrorTypes.NETWORK_ERROR:
                return lang === 'zh' 
                    ? '网络连接出现问题，请检查网络设置'
                    : 'Network connection problem, please check your network settings';
            
            case ErrorHandler.ErrorTypes.FILE_ERROR:
                return lang === 'zh' 
                    ? '文件操作失败，请检查文件权限和路径'
                    : 'File operation failed, please check file permissions and path';
            
            case ErrorHandler.ErrorTypes.BROWSER_ERROR:
                return lang === 'zh' 
                    ? '浏览器操作失败，请尝试重新启动浏览器'
                    : 'Browser operation failed, please try restarting the browser';
            
            default:
                return errorInfo.message || (lang === 'zh' ? '未知错误' : 'Unknown error');
        }
    }

    /**
     * 获取错误解决方案
     * Get error solution
     * @param {object} errorInfo - 错误信息
     * @returns {string} 解决方案
     */
    getSolution(errorInfo) {
        switch (errorInfo.type) {
            case ErrorHandler.ErrorTypes.VALIDATION_ERROR:
                return '解决方案：请检查输入格式是否正确\nSolution: Please check if the input format is correct';
            
            case ErrorHandler.ErrorTypes.NETWORK_ERROR:
                return '解决方案：\n1. 检查网络连接\n2. 检查防火墙设置\n3. 尝试使用代理\nSolution:\n1. Check network connection\n2. Check firewall settings\n3. Try using a proxy';
            
            case ErrorHandler.ErrorTypes.FILE_ERROR:
                return '解决方案：\n1. 检查文件是否存在\n2. 检查文件权限\n3. 确保路径正确\nSolution:\n1. Check if file exists\n2. Check file permissions\n3. Ensure path is correct';
            
            case ErrorHandler.ErrorTypes.BROWSER_ERROR:
                return '解决方案：\n1. 重新启动浏览器\n2. 清除浏览器缓存\n3. 检查浏览器版本\nSolution:\n1. Restart browser\n2. Clear browser cache\n3. Check browser version';
            
            case ErrorHandler.ErrorTypes.SECURITY_ERROR:
                return '解决方案：\n1. 检查输入内容的安全性\n2. 避免使用危险的代码\n3. 联系管理员\nSolution:\n1. Check input security\n2. Avoid dangerous code\n3. Contact administrator';
            
            default:
                return '解决方案：请查看详细错误信息或联系技术支持\nSolution: Please check detailed error information or contact technical support';
        }
    }

    /**
     * 尝试错误恢复
     * Attempt error recovery
     * @param {object} errorInfo - 错误信息
     * @returns {boolean} 是否成功恢复
     */
    attemptRecovery(errorInfo) {
        switch (errorInfo.type) {
            case ErrorHandler.ErrorTypes.NETWORK_ERROR:
                return this.retryNetworkOperation(errorInfo);
            
            case ErrorHandler.ErrorTypes.BROWSER_ERROR:
                return this.restartBrowser(errorInfo);
            
            default:
                return false;
        }
    }

    /**
     * 重试网络操作
     * Retry network operation
     * @param {object} errorInfo - 错误信息
     * @returns {boolean} 是否成功
     */
    retryNetworkOperation(errorInfo) {
        // 实现网络重试逻辑
        console.log('Attempting to retry network operation...');
        return false; // 暂时返回 false，实际实现中应该尝试重新连接
    }

    /**
     * 重启浏览器
     * Restart browser
     * @param {object} errorInfo - 错误信息
     * @returns {boolean} 是否成功
     */
    restartBrowser(errorInfo) {
        // 实现浏览器重启逻辑
        console.log('Attempting to restart browser...');
        return false; // 暂时返回 false，实际实现中应该重启浏览器
    }

    /**
     * 获取错误统计
     * Get error statistics
     * @returns {object} 错误统计信息
     */
    getErrorStats() {
        const stats = {
            totalErrors: this.errorCount,
            errorsByType: {},
            errorsBySeverity: {},
            recentErrors: this.errorLog.slice(-10)
        };

        this.errorLog.forEach(error => {
            stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
            stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
        });

        return stats;
    }

    /**
     * 清除错误日志
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        this.errorCount = 0;
        this.lastError = null;
    }
}

// 创建全局错误处理器实例
const globalErrorHandler = new ErrorHandler();

// 如果在 Node.js 环境中，导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, globalErrorHandler };
}

// 如果在浏览器环境中，添加到全局对象
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
    window.globalErrorHandler = globalErrorHandler;
    
    // 全局错误处理
    window.addEventListener('error', function(event) {
        globalErrorHandler.handleError(
            event.error || event.message,
            ErrorHandler.ErrorTypes.TASK_ERROR,
            ErrorHandler.Severity.HIGH,
            {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            }
        );
    });
    
    window.addEventListener('unhandledrejection', function(event) {
        globalErrorHandler.handleError(
            event.reason,
            ErrorHandler.ErrorTypes.TASK_ERROR,
            ErrorHandler.Severity.HIGH,
            { type: 'unhandledPromiseRejection' }
        );
    });
}
