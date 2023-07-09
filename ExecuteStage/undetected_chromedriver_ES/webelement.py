from typing import List

from selenium.webdriver.common.by import By
import selenium.webdriver.remote.webelement


class WebElement(selenium.webdriver.remote.webelement.WebElement):
    def click_safe(self):
        super().click()
        self._parent.reconnect(0.1)

    def children(
        self, tag=None, recursive=False
    ) -> List[selenium.webdriver.remote.webelement.WebElement]:
        """
        returns direct child elements of current element
        :param tag: str,  if supplied, returns <tag> nodes only
        """
        script = "return [... arguments[0].children]"
        if tag:
            script += ".filter( node => node.tagName === '%s')" % tag.upper()
        if recursive:
            return list(_recursive_children(self, tag))
        return list(self._parent.execute_script(script, self))


class UCWebElement(WebElement):
    """
    Custom WebElement class which makes it easier to view elements when
    working in an interactive environment.

    standard webelement repr:
    <selenium.webdriver.remote.webelement.WebElement (session="85ff0f671512fa535630e71ee951b1f2", element="6357cb55-92c3-4c0f-9416-b174f9c1b8c4")>

    using this WebElement class:
    <WebElement(<a class="mobile-show-inline-block mc-update-infos init-ok" href="#" id="main-cat-switcher-mobile">)>

    """

    def __init__(self, parent, id_):
        super().__init__(parent, id_)
        self._attrs = None

    @property
    def attrs(self):
        if not self._attrs:
            self._attrs = self._parent.execute_script(
                """
                var items = {}; 
                for (index = 0; index < arguments[0].attributes.length; ++index) 
                {
                 items[arguments[0].attributes[index].name] = arguments[0].attributes[index].value 
                }; 
                return items;
                """,
                self,
            )
        return self._attrs

    def __repr__(self):
        strattrs = " ".join([f'{k}="{v}"' for k, v in self.attrs.items()])
        if strattrs:
            strattrs = " " + strattrs
        return f"{self.__class__.__name__} <{self.tag_name}{strattrs}>"


def _recursive_children(element, tag: str = None, _results=None):
    """
    returns all children of <element> recursively

    :param element: `WebElement` object.
            find children below this <element>

    :param tag: str = None.
            if provided, return only <tag> elements. example: 'a', or 'img'
    :param _results: do not use!
    """
    results = _results or set()
    for element in element.children():
        if tag:
            if element.tag_name == tag:
                results.add(element)
        else:
            results.add(element)
        results |= _recursive_children(element, tag, results)
    return results
