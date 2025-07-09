/**
 * EasySpider 安全增强功能测试脚本
 * 测试所有安全工具类和前端增强功能
 * @version 1.0.0
 * @author EasySpider Security Enhancement
 */

// 等待页面加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('开始EasySpider安全增强功能测试...');
    
    // 测试配置
    const testConfig = {
        enableConsoleOutput: true,
        enableDetailedLogs: true,
        testTimeout: 5000
    };

    // 测试结果收集器
    const testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: [],
        warnings: []
    };

    /**
     * 测试辅助函数
     */
    function assert(condition, message) {
        testResults.total++;
        if (condition) {
            testResults.passed++;
            if (testConfig.enableConsoleOutput) {
                console.log(`✅ ${message}`);
            }
            return true;
        } else {
            testResults.failed++;
            testResults.errors.push(message);
            if (testConfig.enableConsoleOutput) {
                console.error(`❌ ${message}`);
            }
            return false;
        }
    }

    function warn(message) {
        testResults.warnings.push(message);
        if (testConfig.enableConsoleOutput) {
            console.warn(`⚠️ ${message}`);
        }
    }

    /**
     * 测试SecurityUtils工具类
     */
    function testSecurityUtils() {
        console.log('\n=== 测试SecurityUtils ===');
        
        if (typeof SecurityUtils === 'undefined') {
            warn('SecurityUtils未加载，跳过相关测试');
            return;
        }

        // 测试URL验证
        assert(SecurityUtils.validateUrl('https://www.example.com'), 'URL验证：有效HTTPS URL');
        assert(SecurityUtils.validateUrl('http://www.example.com'), 'URL验证：有效HTTP URL');
        assert(!SecurityUtils.validateUrl('javascript:alert(1)'), 'URL验证：拒绝JavaScript协议');
        assert(!SecurityUtils.validateUrl('data:text/html,<script>alert(1)</script>'), 'URL验证：拒绝Data协议');
        assert(!SecurityUtils.validateUrl(''), 'URL验证：拒绝空字符串');

        // 测试邮箱验证
        assert(SecurityUtils.validateEmail('test@example.com'), '邮箱验证：有效邮箱地址');
        assert(SecurityUtils.validateEmail('user.name+tag@domain.co.uk'), '邮箱验证：复杂有效邮箱');
        assert(!SecurityUtils.validateEmail('invalid-email'), '邮箱验证：拒绝无效格式');
        assert(!SecurityUtils.validateEmail('test@'), '邮箱验证：拒绝不完整邮箱');

        // 测试XPath验证
        assert(SecurityUtils.validateXPath('/html/body/div[1]'), 'XPath验证：有效绝对路径');
        assert(SecurityUtils.validateXPath('//div[@class="test"]'), 'XPath验证：有效相对路径');
        assert(SecurityUtils.validateXPath('.//span'), 'XPath验证：有效当前节点路径');
        assert(!SecurityUtils.validateXPath(''), 'XPath验证：拒绝空字符串');

        // 测试JavaScript验证
        assert(SecurityUtils.validateJavaScript('arguments[0].click()'), 'JS验证：允许安全的点击操作');
        assert(SecurityUtils.validateJavaScript('return document.title'), 'JS验证：允许获取文档标题');
        assert(!SecurityUtils.validateJavaScript('eval("alert(1)")'), 'JS验证：拒绝eval函数');
        assert(!SecurityUtils.validateJavaScript('new Function("alert(1)")()'), 'JS验证：拒绝Function构造器');

        // 测试路径验证
        assert(SecurityUtils.validatePath('inputs/data.xlsx'), '路径验证：有效相对路径');
        assert(SecurityUtils.validatePath('/opt/data/file.txt'), '路径验证：有效绝对路径');
        assert(!SecurityUtils.validatePath('../../../etc/passwd'), '路径验证：拒绝路径遍历');
        assert(!SecurityUtils.validatePath('file<test>.txt'), '路径验证：拒绝危险字符');

        // 测试MySQL表名验证
        assert(SecurityUtils.validateMySQLTableName('user_data'), 'MySQL表名：有效表名');
        assert(SecurityUtils.validateMySQLTableName('数据表'), 'MySQL表名：有效中文表名');
        assert(!SecurityUtils.validateMySQLTableName('123invalid'), 'MySQL表名：拒绝数字开头');
        assert(!SecurityUtils.validateMySQLTableName('table-name'), 'MySQL表名：拒绝连字符');

        // 测试输入清理
        const dirtyInput = '<script>alert("xss")</script>用户输入';
        const cleanInput = SecurityUtils.sanitizeInput(dirtyInput);
        assert(!cleanInput.includes('<script>'), '输入清理：移除脚本标签');
        assert(cleanInput.includes('用户输入'), '输入清理：保留安全内容');
    }

    /**
     * 测试ErrorHandler工具类
     */
    function testErrorHandler() {
        console.log('\n=== 测试ErrorHandler ===');
        
        if (typeof ErrorHandler === 'undefined') {
            warn('ErrorHandler未加载，跳过相关测试');
            return;
        }

        const errorHandler = new ErrorHandler();
        
        // 测试错误日志记录
        try {
            errorHandler.logError('TestSource', new Error('测试错误'), { test: true });
            assert(true, 'ErrorHandler：成功记录错误');
        } catch (e) {
            assert(false, 'ErrorHandler：记录错误失败 - ' + e.message);
        }

        // 测试警告日志记录
        try {
            errorHandler.logWarning('TestSource', '测试警告', { test: true });
            assert(true, 'ErrorHandler：成功记录警告');
        } catch (e) {
            assert(false, 'ErrorHandler：记录警告失败 - ' + e.message);
        }

        // 测试信息日志记录
        try {
            errorHandler.logInfo('TestSource', '测试信息', { test: true });
            assert(true, 'ErrorHandler：成功记录信息');
        } catch (e) {
            assert(false, 'ErrorHandler：记录信息失败 - ' + e.message);
        }

        // 测试多语言支持
        const zhMessage = errorHandler.getLocalizedMessage('VALIDATION_FAILED', 'zh');
        const enMessage = errorHandler.getLocalizedMessage('VALIDATION_FAILED', 'en');
        assert(zhMessage && zhMessage !== enMessage, 'ErrorHandler：多语言支持正常');
    }

    /**
     * 测试ConfigValidator工具类
     */
    function testConfigValidator() {
        console.log('\n=== 测试ConfigValidator ===');
        
        if (typeof ConfigValidator === 'undefined') {
            warn('ConfigValidator未加载，跳过相关测试');
            return;
        }

        const configValidator = new ConfigValidator();

        // 测试任务配置验证
        const validTaskConfig = {
            name: '测试任务',
            url: 'https://www.example.com',
            description: '这是一个测试任务',
            outputFormat: 'json',
            saveName: 'test_data'
        };

        const taskResult = configValidator.validateTaskConfig(validTaskConfig);
        assert(taskResult.isValid, 'ConfigValidator：有效任务配置验证通过');

        // 测试无效任务配置
        const invalidTaskConfig = {
            name: '', // 空名称
            url: 'invalid-url', // 无效URL
            outputFormat: 'unknown' // 未知格式
        };

        const invalidResult = configValidator.validateTaskConfig(invalidTaskConfig);
        assert(!invalidResult.isValid, 'ConfigValidator：无效任务配置被正确拒绝');

        // 测试邮件配置验证
        const validEmailConfig = {
            host: 'smtp.gmail.com',
            port: 587,
            username: 'test@gmail.com',
            password: 'password',
            to: 'recipient@gmail.com',
            subject: '测试邮件',
            content: '邮件内容'
        };

        const emailResult = configValidator.validateEmailConfig(validEmailConfig);
        assert(emailResult.isValid, 'ConfigValidator：有效邮件配置验证通过');
    }

    /**
     * 测试FormValidator工具类
     */
    function testFormValidator() {
        console.log('\n=== 测试FormValidator ===');
        
        if (typeof FormValidator === 'undefined') {
            warn('FormValidator未加载，跳过相关测试');
            return;
        }

        const formValidator = new FormValidator();

        // 测试单个字段验证
        const urlResult = formValidator.validateField('https://www.example.com', 'url');
        assert(urlResult.isValid, 'FormValidator：有效URL字段验证');

        const emailResult = formValidator.validateField('test@example.com', 'email');
        assert(emailResult.isValid, 'FormValidator：有效邮箱字段验证');

        const invalidUrlResult = formValidator.validateField('javascript:alert(1)', 'url');
        assert(!invalidUrlResult.isValid, 'FormValidator：无效URL被正确拒绝');

        // 测试表单验证
        const formData = {
            taskName: '测试任务',
            url: 'https://www.example.com',
            email: 'test@example.com'
        };

        const validationConfig = {
            taskName: { type: 'taskName', options: { required: true } },
            url: { type: 'url', options: { required: true } },
            email: { type: 'email', options: { required: false } }
        };

        const formResult = formValidator.validateForm(formData, validationConfig);
        assert(formResult.isValid, 'FormValidator：表单验证通过');
        assert(formResult.summary.totalFields === 3, 'FormValidator：正确统计字段数量');
    }

    /**
     * 测试SecurityEnhancer集成
     */
    function testSecurityEnhancer() {
        console.log('\n=== 测试SecurityEnhancer ===');
        
        if (typeof window.securityEnhancer === 'undefined') {
            warn('SecurityEnhancer未初始化，跳过相关测试');
            return;
        }

        const status = window.securityEnhancer.getSecurityStatus();
        assert(status.isInitialized, 'SecurityEnhancer：已成功初始化');

        // 测试API接口
        if (typeof window.EasySpiderSecurity !== 'undefined') {
            const apiStatus = window.EasySpiderSecurity.getStatus();
            assert(apiStatus.isInitialized, 'SecurityEnhancer：API接口正常');

            // 测试输入验证API
            const apiResult = window.EasySpiderSecurity.validateInput('https://www.example.com', 'url');
            assert(apiResult.isValid, 'SecurityEnhancer：API输入验证正常');
        }
    }

    /**
     * 测试前端安全增强功能
     */
    function testFrontendEnhancements() {
        console.log('\n=== 测试前端安全增强 ===');

        // 测试输入框是否被正确增强
        const inputs = document.querySelectorAll('input, textarea');
        let enhancedCount = 0;
        
        inputs.forEach(input => {
            if (input.dataset.securityEnhanced) {
                enhancedCount++;
            }
        });

        if (inputs.length > 0) {
            assert(enhancedCount > 0, `前端增强：${enhancedCount}/${inputs.length} 个输入框已被安全增强`);
        }

        // 测试表单是否被正确增强
        const forms = document.querySelectorAll('form');
        let enhancedForms = 0;
        
        forms.forEach(form => {
            if (form.dataset.securityEnhanced) {
                enhancedForms++;
            }
        });

        if (forms.length > 0) {
            assert(enhancedForms > 0, `前端增强：${enhancedForms}/${forms.length} 个表单已被安全增强`);
        }

        // 测试验证错误容器是否存在
        const errorContainers = document.querySelectorAll('.validation-errors');
        if (forms.length > 0) {
            assert(errorContainers.length > 0, '前端增强：验证错误容器已创建');
        }
    }

    /**
     * 模拟用户输入测试
     */
    function testUserInputScenarios() {
        console.log('\n=== 测试用户输入场景 ===');

        // 创建测试输入框
        const testInput = document.createElement('input');
        testInput.type = 'text';
        testInput.name = 'testInput';
        testInput.id = 'testInput';
        document.body.appendChild(testInput);

        // 模拟XSS输入
        const xssInput = '<script>alert("xss")</script>';
        testInput.value = xssInput;
        testInput.dispatchEvent(new Event('input'));

        // 检查是否被过滤
        setTimeout(() => {
            const filteredValue = testInput.value;
            assert(!filteredValue.includes('<script>'), '用户输入：XSS内容被成功过滤');
            
            // 清理测试元素
            document.body.removeChild(testInput);
        }, 100);

        // 测试URL输入验证
        if (typeof window.EasySpiderSecurity !== 'undefined') {
            const validUrl = window.EasySpiderSecurity.validateInput('https://www.example.com', 'url');
            assert(validUrl.isValid, '用户输入：有效URL通过验证');

            const invalidUrl = window.EasySpiderSecurity.validateInput('javascript:alert(1)', 'url');
            assert(!invalidUrl.isValid, '用户输入：恶意URL被拒绝');
        }
    }

    /**
     * 运行所有测试
     */
    function runAllTests() {
        console.log('🚀 开始运行EasySpider安全增强功能测试套件');
        console.log('========================================');

        // 运行各项测试
        testSecurityUtils();
        testErrorHandler();
        testConfigValidator();
        testFormValidator();
        testSecurityEnhancer();
        testFrontendEnhancements();
        testUserInputScenarios();

        // 输出测试结果
        console.log('\n========================================');
        console.log('📊 测试结果汇总:');
        console.log(`总计测试: ${testResults.total}`);
        console.log(`通过测试: ${testResults.passed} ✅`);
        console.log(`失败测试: ${testResults.failed} ❌`);
        console.log(`警告信息: ${testResults.warnings.length} ⚠️`);

        if (testResults.failed > 0) {
            console.log('\n❌ 失败的测试:');
            testResults.errors.forEach(error => console.log(`  - ${error}`));
        }

        if (testResults.warnings.length > 0) {
            console.log('\n⚠️ 警告信息:');
            testResults.warnings.forEach(warning => console.log(`  - ${warning}`));
        }

        const successRate = (testResults.passed / testResults.total * 100).toFixed(1);
        console.log(`\n🎯 测试通过率: ${successRate}%`);

        if (successRate >= 90) {
            console.log('🎉 安全增强功能测试基本通过！');
        } else if (successRate >= 70) {
            console.log('⚠️ 安全增强功能部分正常，建议检查失败项目');
        } else {
            console.log('🚨 安全增强功能存在较多问题，需要修复');
        }

        // 在页面上显示测试结果
        displayTestResults();
    }

    /**
     * 在页面上显示测试结果
     */
    function displayTestResults() {
        // 创建结果显示容器
        const resultContainer = document.createElement('div');
        resultContainer.id = 'security-test-results';
        resultContainer.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: white;
            border: 2px solid #007bff;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 9999;
            max-width: 350px;
            font-family: monospace;
            font-size: 12px;
        `;

        const successRate = (testResults.passed / testResults.total * 100).toFixed(1);
        const statusColor = successRate >= 90 ? '#28a745' : successRate >= 70 ? '#ffc107' : '#dc3545';

        resultContainer.innerHTML = `
            <h5 style="margin: 0 0 10px 0; color: ${statusColor};">
                🔒 安全增强测试结果
            </h5>
            <div>总计: ${testResults.total}</div>
            <div style="color: #28a745;">通过: ${testResults.passed} ✅</div>
            <div style="color: #dc3545;">失败: ${testResults.failed} ❌</div>
            <div style="color: #ffc107;">警告: ${testResults.warnings.length} ⚠️</div>
            <div style="margin-top: 10px; font-weight: bold; color: ${statusColor};">
                通过率: ${successRate}%
            </div>
            <button onclick="this.parentNode.style.display='none'" 
                    style="margin-top: 10px; padding: 5px 10px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">
                关闭
            </button>
        `;

        document.body.appendChild(resultContainer);

        // 5秒后自动淡出
        setTimeout(() => {
            resultContainer.style.opacity = '0.7';
        }, 5000);
    }

    // 延迟执行测试，确保所有脚本都已加载
    setTimeout(() => {
        runAllTests();
    }, 1000);
});

// 提供手动测试接口
window.runSecurityTests = function() {
    window.location.reload(); // 重新加载页面来运行测试
};

// 监听安全增强事件
window.addEventListener('security-enhanced', function(event) {
    console.log('🔒 安全增强功能已启用:', event.detail);
});

window.addEventListener('security-init-error', function(event) {
    console.error('🚨 安全增强初始化失败:', event.detail);
});
