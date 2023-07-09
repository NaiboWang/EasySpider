from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import TimeoutException
from selenium.common.exceptions import StaleElementReferenceException, InvalidSelectorException
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.support.ui import Select
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
import undetected_chromedriver_ES as uc
desired_capabilities = DesiredCapabilities.CHROME
desired_capabilities["pageLoadStrategy"] = "none"



class MyChrome(webdriver.Chrome):

    def __init__(self, *args, **kwargs):
        self.iframe_env = False  # 现在的环境是root还是iframe
        super().__init__(*args, **kwargs)  # 调用父类的 __init__

    def find_element(self, by=By.ID, value=None, iframe=False):
        # 在这里改变查找元素的行为
        if self.iframe_env:
            super().switch_to.default_content()
            self.iframe_env = False
        if iframe:
            # 获取所有的 iframe
            try:
                iframes = super().find_elements(By.CSS_SELECTOR, "iframe")
            except Exception as e:
                print(e)
            find_element = False
            # 遍历所有的 iframe 并点击里面的元素
            for iframe in iframes:
                # 切换到 iframe
                super().switch_to.default_content()
                super().switch_to.frame(iframe)
                self.iframe_env = True
                try:
                    # 在 iframe 中查找并点击元素
                    # 在这个例子中，我们查找 XPath 为 '//div[1]' 的元素
                    element = super().find_element(by=by, value=value)
                    find_element = True
                except:
                    print("No such element found in the iframe")
                # 完成操作后切回主文档
                # super().switch_to.default_content()
                if find_element:
                    return element
            if not find_element:
                raise NoSuchElementException
        else:
            return super().find_element(by=by, value=value)

    def find_elements(self, by=By.ID, value=None, iframe=False):
        # 在这里改变查找元素的行为
        if self.iframe_env:
            super().switch_to.default_content()
            self.iframe_env = False
        if iframe:
            # 获取所有的 iframe
            iframes = super().find_elements(By.CSS_SELECTOR, "iframe")
            find_element = False
            # 遍历所有的 iframe 并点击里面的元素
            for iframe in iframes:
                # 切换到 iframe
                try:
                    super().switch_to.default_content()
                    super().switch_to.frame(iframe)
                    self.iframe_env = True
                    # 在 iframe 中查找并点击元素
                    # 在这个例子中，我们查找 XPath 为 '//div[1]' 的元素
                    elements = super().find_elements(by=by, value=value)
                    if len(elements) > 0:
                        find_element = True
                    # 完成操作后切回主文档
                    # super().switch_to.default_content()
                    if find_element:
                        return elements
                except:
                    print("No such element found in the iframe")
            if not find_element:
                raise NoSuchElementException
        else:
            return super().find_elements(by=by, value=value)
        

class MyUCChrome(uc.Chrome):

    def __init__(self, *args, **kwargs):
        self.iframe_env = False  # 现在的环境是root还是iframe
        super().__init__(*args, **kwargs)  # 调用父类的 __init__

    def find_element(self, by=By.ID, value=None, iframe=False):
        # 在这里改变查找元素的行为
        if self.iframe_env:
            super().switch_to.default_content()
            self.iframe_env = False
        if iframe:
            # 获取所有的 iframe
            try:
                iframes = super().find_elements(By.CSS_SELECTOR, "iframe")
            except Exception as e:
                print(e)
            find_element = False
            # 遍历所有的 iframe 并点击里面的元素
            for iframe in iframes:
                # 切换到 iframe
                super().switch_to.default_content()
                super().switch_to.frame(iframe)
                self.iframe_env = True
                try:
                    # 在 iframe 中查找并点击元素
                    # 在这个例子中，我们查找 XPath 为 '//div[1]' 的元素
                    element = super().find_element(by=by, value=value)
                    find_element = True
                except:
                    print("No such element found in the iframe")
                # 完成操作后切回主文档
                # super().switch_to.default_content()
                if find_element:
                    return element
            if not find_element:
                raise NoSuchElementException
        else:
            return super().find_element(by=by, value=value)

    def find_elements(self, by=By.ID, value=None, iframe=False):
        # 在这里改变查找元素的行为
        if self.iframe_env:
            super().switch_to.default_content()
            self.iframe_env = False
        if iframe:
            # 获取所有的 iframe
            iframes = super().find_elements(By.CSS_SELECTOR, "iframe")
            find_element = False
            # 遍历所有的 iframe 并点击里面的元素
            for iframe in iframes:
                # 切换到 iframe
                try:
                    super().switch_to.default_content()
                    super().switch_to.frame(iframe)
                    self.iframe_env = True
                    # 在 iframe 中查找并点击元素
                    # 在这个例子中，我们查找 XPath 为 '//div[1]' 的元素
                    elements = super().find_elements(by=by, value=value)
                    if len(elements) > 0:
                        find_element = True
                    # 完成操作后切回主文档
                    # super().switch_to.default_content()
                    if find_element:
                        return elements
                except:
                    print("No such element found in the iframe")
            if not find_element:
                raise NoSuchElementException
        else:
            return super().find_elements(by=by, value=value)

