import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, transforms
from torch.utils.data import DataLoader, Dataset
import numpy as np
from PIL import Image
import os

# 定义 ResNet 模型（以 ResNet18 为例）
class ResNetModel(nn.Module):
    def __init__(self, num_classes):
        super(ResNetModel, self).__init__()
        self.resnet = models.resnet18(pretrained=True)
        # 修改最后的全连接层以适应特定的分类任务
        self.resnet.fc = nn.Linear(self.resnet.fc.in_features, num_classes)

    def forward(self, x):
        return self.resnet(x)

# 自定义数据集类
class WebpageDataset(Dataset):
    def __init__(self, image_dir, transform=None):
        self.image_dir = image_dir
        self.transform = transform
        self.image_files = [f for f in os.listdir(image_dir) if f.endswith('.png')]

    def __len__(self):
        return len(self.image_files)

    def __getitem__(self, idx):
        img_name = os.path.join(self.image_dir, self.image_files[idx])
        image = Image.open(img_name).convert('RGB')
        label = self.get_label_from_filename(self.image_files[idx])
        if self.transform:
            image = self.transform(image)
        return image, label

    def get_label_from_filename(self, filename):
        # 假设文件名格式为 'class_label.png'
        return int(filename.split('_')[0])

# 图像预处理
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# 定义客户端训练函数
def train_local_model(model, dataloader, criterion, optimizer, epochs=5):
    model.train()
    for epoch in range(epochs):
        for images, labels in dataloader:
            outputs = model(images)
            loss = criterion(outputs, labels)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
    return model.state_dict()

# 联邦平均算法
def federated_average(models_state_dicts):
    avg_state_dict = models_state_dicts[0]
    for key in avg_state_dict.keys():
        for i in range(1, len(models_state_dicts)):
            avg_state_dict[key] += models_state_dicts[i][key]
        avg_state_dict[key] = torch.div(avg_state_dict[key], len(models_state_dicts))
    return avg_state_dict

# 模拟多个客户端的数据
client_data_dirs = ['client1_data', 'client2_data', 'client3_data']  # 每个客户端的数据目录
num_classes = 10  # 根据实际情况设置

# 初始化全局模型
global_model = ResNetModel(num_classes=num_classes)

# 定义损失函数
criterion = nn.CrossEntropyLoss()

# 联邦学习过程
num_rounds = 10
for round in range(num_rounds):
    local_models = []
    for client_dir in client_data_dirs:
        # 加载客户端数据
        dataset = WebpageDataset(image_dir=client_dir, transform=transform)
        dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

        # 初始化客户端模型
        local_model = ResNetModel(num_classes=num_classes)
        local_model.load_state_dict(global_model.state_dict())

        # 定义优化器
        optimizer = optim.SGD(local_model.parameters(), lr=0.01, momentum=0.9)

        # 训练本地模型
        local_state_dict = train_local_model(local_model, dataloader, criterion, optimizer)
        local_models.append(local_state_dict)

    # 聚合模型参数
    global_state_dict = federated_average(local_models)
    global_model.load_state_dict(global_state_dict)

    print(f'Round {round+1}/{num_rounds} completed.')

# 保存全局模型
torch.save(global_model.state_dict(), 'federated_resnet_model.pth')
