# -*- coding: utf-8 -*-
"""
安全工具类 - Python 版本
Security utilities for Python execution stage
"""

import re
import os
import urllib.parse
from pathlib import Path
from typing import Dict, List, Union, Tuple


class SecurityUtils:
    """安全验证工具类"""
    
    # 危险的 XPath 模式
    DANGEROUS_XPATH_PATTERNS = [
        r'javascript:',
        r'data:',
        r'vbscript:',
        r'on\w+\s*=',
        r'<script',
        r'eval\s*\(',
        r'Function\s*\(',
        r'setTimeout\s*\(',
        r'setInterval\s*\('
    ]
    
    # 危险的文件路径模式
    DANGEROUS_PATH_PATTERNS = [
        r'\.\.\/',
        r'\.\.\\',
        r'~\/',
        r'\/etc\/',
        r'\/proc\/',
        r'\/sys\/',
        r'\/dev\/',
        r'\/tmp\/',
        r'\/var\/',
        r'C:\\Windows',
        r'C:\\System',
        r'C:\\Program Files'
    ]
    
    @staticmethod
    def validate_xpath(xpath: str) -> bool:
        """
        验证 XPath 表达式的安全性
        Args:
            xpath: XPath 表达式
        Returns:
            bool: 是否安全
        """
        if not xpath or not isinstance(xpath, str):
            return False
        
        # 检查危险模式
        for pattern in SecurityUtils.DANGEROUS_XPATH_PATTERNS:
            if re.search(pattern, xpath, re.IGNORECASE):
                return False
        
        return True
    
    @staticmethod
    def validate_javascript(js_code: str) -> Tuple[bool, str]:
        """
        验证 JavaScript 代码的安全性
        Args:
            js_code: JavaScript 代码
        Returns:
            Tuple[bool, str]: (是否有效, 错误原因)
        """
        if not js_code or not isinstance(js_code, str):
            return False, "Invalid input"
        
        dangerous_patterns = [
            (r'eval\s*\(', 'eval() function is not allowed for security reasons'),
            (r'Function\s*\(', 'Function constructor is not allowed'),
            (r'with\s*\(', 'with statement is not allowed'),
            (r'import\s*\(', 'Dynamic imports are not allowed'),
            (r'require\s*\(', 'require() is not allowed in this context'),
            (r'process\.', 'Process object access is not allowed'),
            (r'global\.', 'Global object access is not allowed'),
            (r'window\.location', 'Location manipulation is restricted'),
            (r'document\.write', 'document.write is not recommended')
        ]
        
        # 检查 eval 但允许 Field[""] 相关用法
        if 'eval(' in js_code and 'Field[""]' not in js_code:
            for pattern, reason in dangerous_patterns:
                if re.search(pattern, js_code, re.IGNORECASE):
                    return False, reason
        
        return True, ""
    
    @staticmethod
    def validate_file_path(file_path: str) -> bool:
        """
        验证文件路径的安全性
        Args:
            file_path: 文件路径
        Returns:
            bool: 是否安全
        """
        if not file_path or not isinstance(file_path, str):
            return False
        
        # 规范化路径
        try:
            normalized_path = os.path.normpath(file_path)
        except Exception:
            return False
        
        # 检查危险模式
        for pattern in SecurityUtils.DANGEROUS_PATH_PATTERNS:
            if re.search(pattern, normalized_path, re.IGNORECASE):
                return False
        
        return True
    
    @staticmethod
    def sanitize_input(input_str: str, max_length: int = 1000) -> str:
        """
        清理用户输入
        Args:
            input_str: 用户输入
            max_length: 最大长度
        Returns:
            str: 清理后的输入
        """
        if not input_str or not isinstance(input_str, str):
            return ""
        
        # 移除危险字符
        sanitized = re.sub(r'[<>\'"&]', '', input_str)
        
        # 限制长度
        return sanitized.strip()[:max_length]
    
    @staticmethod
    def validate_mysql_table_name(table_name: str) -> bool:
        """
        验证 MySQL 表名
        Args:
            table_name: 表名
        Returns:
            bool: 是否有效
        """
        if not table_name or not isinstance(table_name, str):
            return False
        
        # MySQL 表名规则：以字母或汉字开头，后接字母、数字、下划线或汉字，长度为1到64字符
        pattern = r'^[\u4e00-\u9fa5a-zA-Z][\u4e00-\u9fa5a-zA-Z0-9_]{0,63}$'
        return bool(re.match(pattern, table_name))
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """
        验证邮箱地址
        Args:
            email: 邮箱地址
        Returns:
            bool: 是否有效
        """
        if not email or not isinstance(email, str):
            return False
        
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        return bool(re.match(email_pattern, email)) and len(email) <= 254
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """
        验证 URL
        Args:
            url: URL 地址
        Returns:
            bool: 是否有效
        """
        if not url or not isinstance(url, str):
            return False
        
        try:
            parsed = urllib.parse.urlparse(url)
            return parsed.scheme in ['http', 'https', 'file']
        except Exception:
            return False
    
    @staticmethod
    def validate_css_selector(selector: str) -> bool:
        """
        验证 CSS 选择器的安全性
        Args:
            selector: CSS 选择器
        Returns:
            bool: 是否安全
        """
        if not selector or not isinstance(selector, str):
            return False
        
        # 检查是否包含危险字符
        dangerous_patterns = [
            r'javascript:',
            r'expression\s*\(',
            r'@import',
            r'url\s*\(',
            r'<script'
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, selector, re.IGNORECASE):
                return False
        
        return True
    
    @staticmethod
    def create_safe_filename(filename: str) -> str:
        """
        创建安全的文件名
        Args:
            filename: 原始文件名
        Returns:
            str: 安全的文件名
        """
        if not filename or not isinstance(filename, str):
            return "untitled"
        
        # 移除危险字符
        safe_chars = re.sub(r'[<>:"/\\|?*]', '_', filename)
        
        # 限制长度
        safe_chars = safe_chars[:255]
        
        # 确保不为空
        if not safe_chars:
            safe_chars = "untitled"
        
        return safe_chars


class ErrorReporter:
    """错误报告类"""
    
    ERROR_TYPES = {
        'VALIDATION_ERROR': 'validation_error',
        'NETWORK_ERROR': 'network_error',
        'FILE_ERROR': 'file_error',
        'BROWSER_ERROR': 'browser_error',
        'TASK_ERROR': 'task_error',
        'SECURITY_ERROR': 'security_error',
        'CONFIGURATION_ERROR': 'configuration_error'
    }
    
    SEVERITY_LEVELS = {
        'LOW': 'low',
        'MEDIUM': 'medium',
        'HIGH': 'high',
        'CRITICAL': 'critical'
    }
    
    def __init__(self):
        self.error_count = 0
        self.error_log = []
    
    def report_error(self, error_msg: str, error_type: str = None, 
                    severity: str = None, context: Dict = None) -> Dict:
        """
        报告错误
        Args:
            error_msg: 错误消息
            error_type: 错误类型
            severity: 严重级别
            context: 错误上下文
        Returns:
            Dict: 错误信息
        """
        import time
        
        if error_type is None:
            error_type = self.ERROR_TYPES['TASK_ERROR']
        if severity is None:
            severity = self.SEVERITY_LEVELS['MEDIUM']
        if context is None:
            context = {}
        
        self.error_count += 1
        
        error_info = {
            'id': int(time.time() * 1000),
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'type': error_type,
            'severity': severity,
            'message': str(error_msg),
            'context': context,
            'count': self.error_count
        }
        
        self.error_log.append(error_info)
        
        # 保持日志大小在合理范围内
        if len(self.error_log) > 100:
            self.error_log = self.error_log[-50:]
        
        # 根据严重级别处理
        if severity == self.SEVERITY_LEVELS['CRITICAL']:
            self._handle_critical_error(error_info)
        elif severity == self.SEVERITY_LEVELS['HIGH']:
            self._handle_high_severity_error(error_info)
        else:
            self._log_error(error_info)
        
        return error_info
    
    def _handle_critical_error(self, error_info: Dict):
        """处理关键错误"""
        print(f"CRITICAL ERROR: {error_info}")
    
    def _handle_high_severity_error(self, error_info: Dict):
        """处理高严重级别错误"""
        print(f"HIGH SEVERITY ERROR: {error_info}")
    
    def _log_error(self, error_info: Dict):
        """记录错误"""
        print(f"ERROR: {error_info}")
    
    def get_error_stats(self) -> Dict:
        """获取错误统计"""
        stats = {
            'total_errors': self.error_count,
            'errors_by_type': {},
            'errors_by_severity': {},
            'recent_errors': self.error_log[-10:]
        }
        
        for error in self.error_log:
            error_type = error.get('type', 'unknown')
            severity = error.get('severity', 'unknown')
            
            stats['errors_by_type'][error_type] = stats['errors_by_type'].get(error_type, 0) + 1
            stats['errors_by_severity'][severity] = stats['errors_by_severity'].get(severity, 0) + 1
        
        return stats


# 创建全局错误报告器实例
global_error_reporter = ErrorReporter()
