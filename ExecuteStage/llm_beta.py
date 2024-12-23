from transformers import AutoProcessor, AutoModelForVision2Seq
from PIL import Image
import torch

# 加载 Llama 3.2 视觉模型和处理器
model_name = "meta-llama/Llama-3.2-11B-Vision"  # 请根据实际模型路径替换
processor = AutoProcessor.from_pretrained(model_name)
model = AutoModelForVision2Seq.from_pretrained(model_name)

# 处理网页截图并提取结构
def predict_structure_from_image(image_path):
    # 加载图像
    image = Image.open(image_path).convert("RGB")

    # 预处理图像
    inputs = processor(images=image, return_tensors="pt")

    # 生成描述（结构描述）
    outputs = model.generate(
        inputs["pixel_values"],
        max_length=512,
        num_beams=5,
        early_stopping=True
    )
    description = processor.decode(outputs[0], skip_special_tokens=True)
    return description

# 示例使用
if __name__ == "__main__":
    # 提供网页截图的路径
    image_path = "webpage_screenshot.png"  # 请替换为实际的图像文件路径

    # 预测结构
    predicted_structure = predict_structure_from_image(image_path)

    print("预测的结构:", predicted_structure)
