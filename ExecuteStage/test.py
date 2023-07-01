from lxml import etree

# 解析HTML
html = """
<div>
123
  <ul class="list">
    <li class="item-0">first item</li>
    <li class="item-1"><a href="link2.html">second item</a></li>
  </ul>
  456
  <div></div>
  789
</div>
"""
html = etree.HTML(html)
element = html.xpath("*")
direct_text = "/html/body/" + html[0][0].tag + "/text()"
all_text = "/html/body/" + html[0][0].tag + "//text()"
# 使用XPath选择元素
results = html.xpath(direct_text)
# print(results)
# 拼接所有文本内容并去掉两边的空白
text = ' '.join(result.strip() for result in results if result.strip())

# 输出结果
print(text)

results = html.xpath(all_text)
# print(results)
# 拼接所有文本内容并去掉两边的空白
text = ' '.join(result.strip() for result in results if result.strip())

# 输出结果
print(text)