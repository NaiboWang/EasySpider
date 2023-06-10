# _*_coding:utf-8_*_
from hashlib import new
import json
import os
import sys
import time
from multiprocessing import Process
import time
from datetime import datetime, timedelta
import os
import pickle
import calendar
import re
from copy import deepcopy
import requests
import csv
from commandline_config import Config
from service_invoke import invokeService


class TimeUtil(object):
    @classmethod
    def parse_timezone(cls, timezone):
        """
        解析时区表示
        :param timezone: str eg: +8
        :return: dict{symbol, offset}
        """
        result = re.match(r'(?P<symbol>[+-])(?P<offset>\d+)', timezone)
        symbol = result.groupdict()['symbol']
        offset = int(result.groupdict()['offset'])

        return {
            'symbol': symbol,
            'offset': offset
        }

    @classmethod
    def convert_timezone(cls, dt, timezone="+0"):
        """默认是utc时间，需要"""
        result = cls.parse_timezone(timezone)
        symbol = result['symbol']

        offset = result['offset']

        if symbol == '+':
            return dt + timedelta(hours=offset)
        elif symbol == '-':
            return dt - timedelta(hours=offset)
        else:
            raise Exception('dont parse timezone format')


def generate_timestamp():
    current_GMT = time.gmtime()
    # ts stores timestamp
    ts = calendar.timegm(current_GMT)

    current_time = datetime.utcnow()
    convert_now = TimeUtil.convert_timezone(current_time, '+8')
    print("current_time:    " + str(convert_now))
    return str(convert_now)


def main():
    # result = os.popen('python ServiceWrapper_ExecuteStage.py 38')
    # res = result.read()
    # for line in res.splitlines():
    #     print("\n\n\n\nfinename:\n\n\n\n\n", line)
    config = {
        "pages": 5,
        "test": False,
        "test_pages": 3,
    }
    c = Config(config)
    print(c)
    csv_reader = csv.reader(open("./raw_data.csv", encoding='utf-8'))
    author_list = []
    for line in csv_reader:
        author_list.append(line[4])

    csv_reader = csv.reader(open("./author_list.csv", encoding='utf-8'))
    keywords = []
    i = 0
    for line in csv_reader:
        if line[0] not in author_list:
            keywords.append(line[0])
        else:
            print("Will not append keyword %s", line[0])
        i += 1
        if c.test and i > c.test_pages * 100:
            break
    # print("author_list:", author_list)
    # exit(0)

    urlList = ""
    i = 0

    for keyword in keywords:
        url = "https://so.toutiao.com/search?dvpf=pc&source=input&keyword=%s&pd=user&action_type=search_subtab_switch&page_num=0&from=media&cur_tab_title=media\r\n" % keyword
        # print(url)
        urlList += url
        i += 1
        if c.test and i > c.test_pages:
            break
    print(urlList)
    # exit(0)
    # result = requests.post(
    #     "http://servicewrapper.naibo.wang/backEnd/invokeService",
    #     data={"id": 7,  # serviceID
    #           "paras": json.dumps({"urlList_0": urlList,
    #                                }),
    #           })
    # descTaskID = int(result.text)
    descTaskID = invokeService(
        1,  {"urlList_0": urlList})
    print("descTaskID:    " + str(descTaskID))
    # exit(0)
    filename = generate_timestamp().replace(" ", "").replace(":", "-")
    print("filename:", filename)

    command = 'python ServiceWrapper_ExecuteStage_local.py ' + \
        str(descTaskID) + ' ' + filename
    result = os.system(command)

    # authorTaskID = 53
    file_name = "task_" + str(descTaskID) + "_" + filename + ".csv"
    # file_name = "task_53_2022-10-1723-35-40.881448.csv"
    print("file_name:", file_name)
    csv_reader = csv.reader(
        open("./Data/"+file_name, encoding='utf-8'))  # taskID
    new_descTaskID = []
    i = 0
    for line in csv_reader:
        # print(line)
        if i > 0:
            new_descTaskID.append(line)
        i += 1
    # print(new_author_list)
    # new_descTaskID = list(set([tuple(t) for t in new_descTaskID]))
    # new_descTaskID = list(set(new_descTaskID))  # 去重

    after_remove_duplicate = []
    for i in range(len(new_descTaskID)):
        try:
            if i > 0:
                if new_descTaskID[i][2] == new_descTaskID[i-1][2]:
                    continue
            if new_descTaskID[i][2] != "":
                zan = new_descTaskID[i][1].split("获赞")[0]
                fans = new_descTaskID[i][1].split("粉丝")[0].split("获赞")[1]
                follow = new_descTaskID[i][1].split("关注")[0].split("粉丝")[1]
                after_remove_duplicate.append(
                    [new_descTaskID[i][0], zan, fans, follow, new_descTaskID[i][2], new_descTaskID[i][3]])
        except:
            pass

    print("after_remove_duplicate", after_remove_duplicate)

    all_collected = []
    for author in after_remove_duplicate:
        all_collected.append(author[4])
    print("all_collected:", all_collected)

    for keyword in keywords:
        if keyword not in all_collected:
            print("keyword not collected:", keyword)
            after_remove_duplicate.append(['', '', '', '', keyword, ''])

    new_descTaskID = after_remove_duplicate

    print("new_descTaskID:", new_descTaskID)

    # for i in range(len(keywords)):
    #     author_list[i] = [keywords[i]].extend(new_descTaskID[i])
    # for row in author_list:
    #     print(row)

    with open("raw_data.csv", "a", encoding='utf-8', newline='') as csvfile:
        writer = csv.writer(csvfile)
        for row in new_descTaskID:
            writer.writerow(row)

    import xlwt

    csv_reader = csv.reader(open("./raw_data.csv", encoding='utf-8'))
    all_data = []
    for line in csv_reader:
        all_data.append(line)

    workbook = xlwt.Workbook()
    sheet = workbook.add_sheet("Sheet")

    for i in range(len(all_data)):
        for j in range(len(all_data[i])):
            sheet.write(i, j, all_data[i][j])

    workbook.save("all_data.xls")


if __name__ == "__main__":
    main()
