from enum import unique, IntEnum, Enum


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


@unique
class GraphOption(IntEnum):
    Get = 1  # 打开网页操作|Open Web
    Click = 2  # 点击操作|Click
    Extract = 3  # 提取数据操作|Extract Data
    Input = 4  # 输入操作|Input
    Custom = 5  # 自定义操作|Custom
    Move = 7  # 移动操作|Move
    Loop = 8  # 循环操作|Loop


@unique
class Platform(Enum):
    Windows = 'Windows'
    Linux = 'Linux'
    MacOS = 'Darwin'


@unique
class Architecture(Enum):
    Bit64 = '64bit'
    Bit32 = '32bit'

