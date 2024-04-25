from enum import unique, IntEnum


@unique
class WriteMode(IntEnum):
    Create_Mode = 0  # 新建模式|Create Mode
    Append_Mode = 1  # 追加模式|Append Mode
    Mysql_Mode = 2  # Mysql模式|Mysql Mode
    Json_Mode = 3   # Json模式|Json Mode
