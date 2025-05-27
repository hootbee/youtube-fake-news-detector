from flask import Flask, request, jsonify
from kobert_tokenizer import KoBERTTokenizer
from transformers import BertModel, BertConfig
import torch
import torch.nn.functional as F

app = Flask(__name__)

# 모델 및 토크나이저 로드
tokenizer = KoBERTTokenizer.from_pretrained('skt/kobert-base-v1', sp_model_kwargs={'nbest_size': -1, 'alpha': 0.6, 'enable_sampling': True}, do_lower_case=False)
config = BertConfig.from_pretrained('skt/kobert-base-v1')
model = BertModel(config=config)
model.eval()


# 문장 임베딩 생성 함수
def get_embedding(text):
    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512, padding='max_length')
        with torch.no_grad():
            outputs = model(**inputs)
            return outputs.last_hidden_state[:, 0, :]  # 첫 번째 문장의 [CLS] 벡터
    except Exception as e:
        print(f"[ERROR] get_embedding 실패: {e}")
        raise ValueError(f"Error in embedding generation: {e}")


@app.route("/embed", methods=["POST"])
def embed():
    try:
        data = request.get_json()
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Invalid JSON payload"}), 400

        text1 = data.get("text1")
        text2 = data.get("text2")

        if not text1 or not text2:
            return jsonify({"error": "Both text1 and text2 are required."}), 400

        vec1 = get_embedding(text1)
        vec2 = get_embedding(text2)

        if vec1 is None or vec2 is None:
            return jsonify({"error": "Failed to generate embeddings."}), 500

        similarity = F.cosine_similarity(vec1.squeeze(0), vec2.squeeze(0), dim=0).item()

        return jsonify({
            "similarity": round(similarity * 100, 2),
            "text1": text1,
            "text2": text2
        })
    except Exception as e:
        print(f"[ERROR] /embed 요청 처리 중 에러 발생: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(port=5001)
