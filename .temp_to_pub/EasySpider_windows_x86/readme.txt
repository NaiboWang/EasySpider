Official Site: https://www.easyspider.net

Welcome to promote this software to other friends.

This version is for Windows 7 and above, including both 32-bit and 64-bit version. Please note that this version of the Chrome browser will always remain at version 109 and will not update with Chrome updates (for compatibility with Windows 7). Therefore, if you want to use the latest version of the Chrome browser for data scraping, please run the x64 version of EasySpider on Windows 10 x64 or higher systems.

Video Tutorial: https://youtube.com/playlist?list=PL0kEFEkWrT7mt9MUlEBV2DTo1QsaanUTp

The software is totally not trojan/virus! If mistaken by antivirus software such as Windows Defender as a virus, please recover it, or open "EasySpider.bat" to run our software instead.

Tasks can be imported from other machines by simply placing the .json files from the "tasks" folder of those machines into the "tasks" folder of this directory. Similarly, execution instance files can be imported by copying the .json files from the "execution_instances" folder. Note that only files named with a number greater than 0 are supported in both folders.


======Version New Features======

Please see more new features for version greater than v0.3.2 at github release page: https://github.com/NaiboWang/EasySpider/releases

-----v0.3.2-----

## Update Instruction

1. Selected child element operations can delete fields and unmark deleted fields in real-time in the browser.
2. Selecting child elements adds a selection mode that allows you to choose only the child elements that are present in all blocks or the child elements that are the same as the first selected block.
3. In the text input and webpage open options, you can use the extracted field value as a variable for text input, represented by Field["field_name"].
4. Files can be downloaded, such as PDF files.
5. Fixed a bug where the software could display a blank screen for about 10 seconds after opening, making it usable in intranets, darknets, and any local network.
6. Fixed a bug where the current page URL and title could not be extracted.
7. Fixed a bug where OCR recognition could fail to extract information.
8. Updated extraction logic to save locally every 10 records collected.
9. When modifying a task, the default anchor position is set to after the last operation in the task flow.
10. Updated Chrome version to 114.

-----v0.3.1-----

## Update Instruction


1. Advanced Operations:

- Custom scripts can be executed in the workflow, including executing JavaScript commands in the browser and invoking scripts at the operating system level. The command's return value can be obtained and recorded, greatly expanding the scope of operations.
- Before and after each operation, you can specify a JavaScript command to be executed targeting the current located element.

2. Custom scripts are also supported in the conditions and loop conditions. The return value of the custom script determines the condition for the judgment of conditions and loops, greatly enhancing the flexibility of tasks. The ability to use the break statement within a loop is added, allowing custom operations to manipulate elements within the loop.


3. Multiple XPath expressions are generated simultaneously for user selection, and the XPath Helper extension is pre-installed for XPath debugging.

4. Added the functionality to extract the background image URL of elements, current page title, and current page URL.

5. Added the capability to save screenshots of elements or entire web pages. This feature works best in headless mode.

6. Added the functionality to download images.

7. Added OCR recognition of elements. To use this feature, Tesseract library needs to be installed first: https://tesseract-ocr.github.io/tessdoc/Installation.html

8. Directly extract the return value of executing JavaScript code on elements, allowing for functionalities such as regular expression matching and obtaining the background color of elements.

9. Added the capability to switch dropdown options and extract the selected value and text of dropdown options.

10. Significantly improved user guidance and explanations to make the software more user-friendly. This includes instructions on handling iframe tags, explanations of parameter meanings for various options, and explanations on modifying the XPath for loop items, and more.

11. Added instructions on how to execute tasks from the command line.

12. Added headless mode configuration, allowing the software to run without a browser interface.

13. Fixed the issue where Chinese paths couldn't be recognized correctly when using user-configured browser modes.

14. Fixed the issue where the program would freeze when there was no unconditional branch in the conditional branching.

15. Fixed the issue where the input box would freeze after saving a task.

16. Added the option to set the maximum waiting time for page load in the "Open Page" and "Click element" operations.

17. Added the functionality to move the mouse to an element.

18. Displays a prompt when an element cannot be found.

19. Fixed the webpage scrolling bug.

20. The task name is initialized with the value of the page title upon the first visit.

21. Added version update prompts.

22. Added the information of the publisher as requested.

23. Updated Chrome version to 113.