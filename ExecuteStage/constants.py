from enum import unique, IntEnum


@unique
class WriteMode(IntEnum):
    Create = 0  # 新建模式|Create Mode
    Append = 1  # 追加模式|Append Mode
    MySQL = 2  # MySQL模式|MySQL Mode
    Json = 3   # Json模式|Json Mode


@unique
class DataWriteMode(IntEnum):
    Append = 1  # 追加模式|Append Mode
    Cover = 2  # 覆盖模式|Cover Mode
    Rename = 3  # 重命名模式|Rename Mode
