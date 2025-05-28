from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer, util

app = Flask(__name__)

# ✅ Ko-SBERT 모델 로드
model = SentenceTransformer('snunlp/KR-SBERT-V40K-klueNLI-augSTS')

# ✅ 문장 임베딩 함수 (자동 평균 풀링 사용)
def get_embedding(text):
    return model.encode(text, convert_to_tensor=True)

# ✅ 코사인 유사도 엔드포인트
@app.route("/embed", methods=["POST"])
def embed():
    try:
        data = request.get_json()
        text1, text2 = data.get("text1"), data.get("text2")

        if not text1 or not text2:
            return jsonify({"error": "Both text1 and text2 are required."}), 400

        vec1 = get_embedding(text1)
        vec2 = get_embedding(text2)

        similarity = util.cos_sim(vec1, vec2).item()

        return jsonify({
            "similarity": round(similarity * 100, 2),
            "text1": text1,
            "text2": text2
        })
    except Exception as e:
        print(f"[ERROR] /embed 요청 처리 중 에러 발생: {e}")
        return jsonify({"error": str(e)}), 500

# ✅ 서버 실행
if __name__ == "__main__":
    app.run(port=5001)
