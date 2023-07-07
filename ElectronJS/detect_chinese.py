import re

with open('src/taskGrid/FlowChart.js', 'r', encoding='utf-8') as file:
    for line in file:
        line = re.split('//', line)[0]
        if re.search('[\u4e00-\u9fff]', line):
            print(line)