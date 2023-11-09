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
import sys

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
            # 遍历所有的 iframe 并查找里面的元素
            for iframe in iframes:
                # 切换到 iframe
                super().switch_to.default_content()
                super().switch_to.frame(iframe)
                self.iframe_env = True
                try:
                    # 在 iframe 中查找元素
                    # 在这个例子中，我们查找 XPath 为 '//div[1]' 的元素
                    element = super().find_element(by=by, value=value)
                    find_element = True
                except NoSuchElementException as e:
                    print(f"No such element found in the iframe: {str(e)}")
                except Exception as e:
                    print(f"Exception: {str(e)}")
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
            # 遍历所有的 iframe 并找到里面的元素
            for iframe in iframes:
                # 切换到 iframe
                try:
                    super().switch_to.default_content()
                    super().switch_to.frame(iframe)
                    self.iframe_env = True
                    # 在 iframe 中查找元素
                    # 在这个例子中，我们查找 XPath 为 '//div[1]' 的元素
                    elements = super().find_elements(by=by, value=value)
                    if len(elements) > 0:
                        find_element = True
                    # 完成操作后切回主文档
                    # super().switch_to.default_content()
                    if find_element:
                        return elements
                except NoSuchElementException as e:
                    print(f"No such element found in the iframe: {str(e)}")
                except Exception as e:
                    print(f"Exception: {str(e)}")
            if not find_element:
                raise NoSuchElementException
        else:
            return super().find_elements(by=by, value=value)

# MacOS不支持直接打包带Cloudflare的功能，如果要自己编译运行，可以把这个if去掉，然后配置好浏览器和driver路径
if sys.platform != "darwin": 
    ES = True
    if ES: # 用自己写的ES版本
        import undetected_chromedriver_ES as uc
    else:
        import undetected_chromedriver as uc

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
                # 遍历所有的 iframe 并找到里面的元素
                for iframe in iframes:
                    # 切换到 iframe
                    super().switch_to.default_content()
                    super().switch_to.frame(iframe)
                    self.iframe_env = True
                    try:
                        # 在 iframe 中查找元素
                        # 在这个例子中，我们查找 XPath 为 '//div[1]' 的元素
                        element = super().find_element(by=by, value=value)
                        find_element = True
                    except NoSuchElementException as e:
                        print(f"No such element found in the iframe: {str(e)}")
                    except Exception as e:
                        print(f"Exception: {str(e)}")
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
                # 遍历所有的 iframe 并查找里面的元素
                for iframe in iframes:
                    # 切换到 iframe
                    try:
                        super().switch_to.default_content()
                        super().switch_to.frame(iframe)
                        self.iframe_env = True
                        # 在 iframe 中查找元素
                        # 在这个例子中，我们查找 XPath 为 '//div[1]' 的元素
                        elements = super().find_elements(by=by, value=value)
                        if len(elements) > 0:
                            find_element = True
                        # 完成操作后切回主文档
                        # super().switch_to.default_content()
                        if find_element:
                            return elements
                    except NoSuchElementException as e:
                        print(f"No such element found in the iframe: {str(e)}")
                    except Exception as e:
                        print(f"Exception: {str(e)}")
                if not find_element:
                    raise NoSuchElementException
            else:
                return super().find_elements(by=by, value=value)

