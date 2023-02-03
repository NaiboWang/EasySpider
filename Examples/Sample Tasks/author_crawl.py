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
    csv_reader = csv.reader(open("./关键词.csv", encoding='utf-8'))
    keywords = []
    i = 0
    for line in csv_reader:
        if i < c.test_pages:
            print(line)
        i += 1
        keywords.append(line[0])
    urlList = ""
    i = 0
    for keyword in keywords:
        url = "https://so.toutiao.com/search?dvpf=pc&source=pagination&filter_vendor=site&keyword=%s&pd=synthesis&filter_vendor=site&action_type=pagination&page_num=0\r\n" % keyword
        # print(url)
        urlList += url
        i += 1
        if c.test and i > c.test_pages:
            break
    print(urlList)

    # result = requests.post(
    #     "http://servicewrapper.naibo.wang/backEnd/invokeService",
    #     data={"id": 6,  # serviceID
    #           "paras": json.dumps({"loopTimes_Loop_Click_1": c.pages,
    #                                "urlList_0": urlList,
    #                                }),
    #           })
    # authorTaskID = int(result.text)
    authorTaskID = invokeService(
        0,  {"loopTimes_Loop_Click_1": c.pages, "urlList_0": urlList})
    print("authorTaskID:    " + str(authorTaskID))
    # exit(0)
    filename = generate_timestamp().replace(" ", "").replace(":", "-")
    print("filename:", filename)

    command = 'python ServiceWrapper_ExecuteStage_local.py ' + \
        str(authorTaskID) + ' ' + filename
    result = os.system(command)

    # authorTaskID = 53
    file_name = "task_" + str(authorTaskID) + "_" + filename + ".csv"
    # file_name = "task_53_2022-10-1723-35-40.881448.csv"
    print("file_name:", file_name)
    csv_reader = csv.reader(
        open("./Data/"+file_name, encoding='utf-8'))  # taskID
    new_author_list = []
    i = 0
    for line in csv_reader:
        # print(line)
        if i > 0:
            new_author_list.append(line[0])
        i += 1
    # print(new_author_list)
    new_author_list = list(set(new_author_list))  # 去重

    csv_reader = csv.reader(open("./author_list.csv", encoding='utf-8'))
    author_list = []
    for line in csv_reader:
        author_list.append(line[0])
    author_list = list(set(author_list))  # 去重

    print("author_list:", author_list)
    print("new_author_list:", new_author_list)

    real_new_author_list = list(
        set(new_author_list).difference(set(author_list)))
    print("real_new_author_list:", real_new_author_list)
    with open("author_list.csv", "a", encoding='utf-8', newline='') as csvfile:
        writer = csv.writer(csvfile)
        for row in real_new_author_list:
            writer.writerow([row])

    

if __name__ == '__main__':
    main()
