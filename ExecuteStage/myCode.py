"""
这是一个示例代码文件，可以直接在这里写Python代码，然后在程序中的exec操作中调用。如果此文件名称为myCode.py，请将此文件放置在EasySpider程序目录下（和Data/文件夹同级），那么在程序中的exec操作中可以直接写outside:myCode.py来调用此文件中的代码，示例：

1. 用self.browser表示当前操作的浏览器，可直接用selenium的API进行操作，如self.browser.find_element(By.CSS_SELECTOR, "body").send_keys(Keys.END)即可滚动到页面最下方。
2. 自定义一个全局变量：self.myVar = 1
3. 操纵上面定义的全局变量：self.myVar = self.myVar + 1
4. 打印上面定义的全局变量：print(self.myVar)
5. 将自定义变量的值赋值为某个字段提取的值：self.myVar = self.outputParameters["字段名"]
6. 修改某个字段提取的值：self.outputParameters["字段名"] = "新值"

对于更加复杂的操作，请直接下载源代码并编译执行。

This is a sample code snippet file. You can directly write Python code here, and then call it in the program using an `exec` operation. If this file is named myCode.py, please place this file under the EasySpider program directory (at the same level as the Data/ folder). Then, in the program's `exec` operation, you can directly write outside:myCode.py to invoke the code from this file. Examples:

1. Use self.browser to refer to the current browser being operated on. You can directly utilize the selenium API to perform actions. For instance, self.browser.find_element(By.CSS_SELECTOR, "body").send_keys(Keys.END) will scroll to the bottom of the page.
2. Define a global variable: self.myVar = 1
3. Manipulate the above-defined global variable: self.myVar = self.myVar + 1
4. Print the above-defined global variable: print(self.myVar)
5. Assign a value to the custom variable from a value extracted for some field: self.myVar = self.outputParameters["field name"]
6. Modify the value extracted for some field: self.outputParameters["field name"] = "new value"

For more complex operations, please download the source code and compile it for execution.
"""

# 请在下面编写你的代码，不要有代码缩进！！！ | Please write your code below, do not indent the code!!!

# 导包 | Import packages
from selenium.common.exceptions import ElementClickInterceptedException

# 定义一个函数 | Define a function
def test(n = 0):
    for i in range(0, n):
        if i % 2 == 0:
            print(i)
    return "test"

# 异常捕获 | Exception capture
try:
    # 使用XPath定位元素并点击浏览器中元素 | Use XPath to locate the element and click the element in the browser
    element = self.browser.find_element(By.XPATH, "//*[contains(@class, 'LeftSide_menu_list__qXCeM')]/div[1]/a[1]") # 这里请忽略IDE的报错，因为代码是嵌入到程序中的，IDE无法识别self变量和By变量是正常的 | Please ignore the error reported by the IDE, because the code is embedded in the program, and the IDE cannot recognize that the self variable and By variable are normal
    element.click()
    print("点击成功|Click success")
except ElementClickInterceptedException:
    # 如果元素被遮挡，点击失败
    print("元素被遮挡，无法点击|The element is blocked and cannot be clicked")
except Exception as e:
    # 打印其他异常
    print("发生了一个异常|An exception occurred", e)
finally:
    # 测试函数 | Test function
    self.a = 1
    print("a = ", self.a)
    self.a = self.a + 1
    print("a = ", self.a)
    print("All parameters:", self.outputParameters)
    print(test(3))
    print("执行完毕|Execution completed")
