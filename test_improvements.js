/**
 * 安全和错误处理改进的测试文件
 * Test file for security and error handling improvements
 */

// 测试安全工具类
function testSecurityUtils() {
    console.log('Testing SecurityUtils...');
    
    // 测试 XPath 验证
    console.log('XPath validation tests:');
    console.log('Safe XPath:', SecurityUtils.validateXPath('//div[@class="test"]')); // true
    console.log('Unsafe XPath:', SecurityUtils.validateXPath('javascript:alert(1)')); // false
    console.log('Unsafe XPath:', SecurityUtils.validateXPath('<script>alert(1)</script>')); // false
    
    // 测试 JavaScript 验证
    console.log('\nJavaScript validation tests:');
    console.log('Safe JS:', SecurityUtils.validateJavaScript('return document.title;')); // {valid: true}
    console.log('Unsafe JS:', SecurityUtils.validateJavaScript('eval("alert(1)")')); // {valid: false, reason: ...}
    console.log('Field usage:', SecurityUtils.validateJavaScript('Field["title"]')); // {valid: true}
    
    // 测试文件路径验证
    console.log('\nFile path validation tests:');
    console.log('Safe path:', SecurityUtils.validateFilePath('./data/output.csv')); // true
    console.log('Unsafe path:', SecurityUtils.validateFilePath('../../../etc/passwd')); // false
    console.log('Unsafe path:', SecurityUtils.validateFilePath('C:\\Windows\\System32')); // false
    
    // 测试输入清理
    console.log('\nInput sanitization tests:');
    console.log('Sanitized:', SecurityUtils.sanitizeInput('<script>alert("test")</script>'));
    console.log('Sanitized:', SecurityUtils.sanitizeInput('Normal text with some symbols @#$%'));
    
    // 测试邮箱验证
    console.log('\nEmail validation tests:');
    console.log('Valid email:', SecurityUtils.validateEmail('test@example.com')); // true
    console.log('Invalid email:', SecurityUtils.validateEmail('invalid-email')); // false
    
    // 测试 URL 验证
    console.log('\nURL validation tests:');
    console.log('Valid URL:', SecurityUtils.validateURL('https://www.example.com')); // true
    console.log('Invalid URL:', SecurityUtils.validateURL('ftp://example.com')); // false
    
    console.log('SecurityUtils tests completed.\n');
}

// 测试错误处理器
function testErrorHandler() {
    console.log('Testing ErrorHandler...');
    
    // 创建错误处理器实例
    const errorHandler = new ErrorHandler();
    
    // 测试不同类型的错误
    console.log('Testing different error types:');
    
    // 验证错误
    errorHandler.handleError(
        'Invalid input format',
        ErrorHandler.ErrorTypes.VALIDATION_ERROR,
        ErrorHandler.Severity.MEDIUM
    );
    
    // 网络错误
    errorHandler.handleError(
        'Connection timeout',
        ErrorHandler.ErrorTypes.NETWORK_ERROR,
        ErrorHandler.Severity.HIGH
    );
    
    // 安全错误
    errorHandler.handleError(
        'Suspicious script detected',
        ErrorHandler.ErrorTypes.SECURITY_ERROR,
        ErrorHandler.Severity.CRITICAL
    );
    
    // 获取错误统计
    const stats = errorHandler.getErrorStats();
    console.log('Error statistics:', stats);
    
    console.log('ErrorHandler tests completed.\n');
}

// 测试配置验证器
function testConfigValidator() {
    console.log('Testing ConfigValidator...');
    
    // 测试配置对象
    const testConfig = {
        id: 1,
        name: 'Test Task',
        version: '0.6.3',
        outputFormat: 'csv',
        saveName: 'test_table',
        url: 'https://example.com',
        emailConfig: {
            username: 'test@example.com',
            to: 'recipient@example.com',
            port: '587'
        },
        graph: [
            {
                id: 1,
                option: 1,
                parameters: {
                    url: 'https://example.com',
                    xpath: '//div[@class="content"]'
                }
            },
            {
                id: 2,
                option: 5,
                parameters: {
                    code: 'return document.title;'
                }
            }
        ]
    };
    
    // 验证配置
    const validationReport = ConfigValidator.generateValidationReport(testConfig);
    console.log('Validation report:', validationReport);
    
    // 测试不安全的配置
    const unsafeConfig = {
        id: 2,
        name: 'Unsafe Task',
        version: '0.6.3',
        graph: [
            {
                id: 1,
                option: 5,
                parameters: {
                    code: 'eval("alert(1)")'  // 不安全的代码
                }
            }
        ]
    };
    
    const unsafeValidation = ConfigValidator.generateValidationReport(unsafeConfig);
    console.log('Unsafe config validation:', unsafeValidation);
    
    console.log('ConfigValidator tests completed.\n');
}

// 测试集成功能
function testIntegration() {
    console.log('Testing integration...');
    
    // 模拟一个完整的任务验证流程
    const taskConfig = {
        id: 3,
        name: 'Integration Test Task',
        version: '0.6.3',
        outputFormat: 'csv',
        saveName: 'integration_test',
        graph: [
            {
                id: 1,
                option: 1,
                parameters: {
                    url: 'https://example.com',
                    beforeJS: 'console.log("Starting task");',
                    afterJS: 'console.log("Task completed");'
                }
            },
            {
                id: 2,
                option: 2,
                parameters: {
                    xpath: '//button[@id="submit"]'
                }
            },
            {
                id: 3,
                option: 3,
                parameters: {
                    xpath: '//div[@class="result"]',
                    params: [
                        {
                            name: 'title',
                            relativeXPath: './/h1',
                            exampleValues: [{ value: 'Example Title' }]
                        }
                    ]
                }
            }
        ]
    };
    
    // 1. 验证配置安全性
    const validation = ConfigValidator.generateValidationReport(taskConfig);
    console.log('Task validation:', validation.isValid ? 'PASSED' : 'FAILED');
    
    if (!validation.isValid) {
        console.log('Validation errors:', validation.service.errors);
        return;
    }
    
    // 2. 清理配置
    const sanitizedConfig = ConfigValidator.sanitizeConfig(taskConfig);
    console.log('Configuration sanitized successfully');
    
    // 3. 模拟执行过程中的错误处理
    const errorHandler = new ErrorHandler();
    
    try {
        // 模拟一些可能的错误
        if (Math.random() < 0.3) {
            throw new Error('Simulated network error');
        }
        
        console.log('Task execution simulated successfully');
        
    } catch (error) {
        errorHandler.handleError(
            error.message,
            ErrorHandler.ErrorTypes.NETWORK_ERROR,
            ErrorHandler.Severity.HIGH,
            { taskId: taskConfig.id, taskName: taskConfig.name }
        );
    }
    
    console.log('Integration test completed.\n');
}

// 主测试函数
function runAllTests() {
    console.log('=== EasySpider Security and Error Handling Tests ===\n');
    
    try {
        testSecurityUtils();
        testErrorHandler();
        testConfigValidator();
        testIntegration();
        
        console.log('=== All tests completed successfully! ===');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// 如果在浏览器环境中运行测试
if (typeof window !== 'undefined') {
    // 等待 DOM 加载完成后运行测试
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllTests);
    } else {
        runAllTests();
    }
}

// 如果在 Node.js 环境中，导出测试函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testSecurityUtils,
        testErrorHandler,
        testConfigValidator,
        testIntegration,
        runAllTests
    };
}
