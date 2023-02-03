import pandas as pd

if __name__ == "__main__":
    df = pd.read_excel('list.xlsx', "sheet2")
    data = df.values
    print(len(data), data[0])
