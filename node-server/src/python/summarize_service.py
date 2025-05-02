# summarize_service.py
# import whisper
# from transformers import pipeline

# def transcribe_audio(file_path):
#     model = whisper.load_model("small")
#     result = model.transcribe(file_path)
#     return result["text"]

# def summarize_text(text):
#     summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
#     summary = summarizer(text, max_length=150, min_length=50, do_sample=False)
#     return summary[0]['summary_text']

# if __name__ == "__main__":
#     import sys
#     audio_path = sys.argv[1]
#     text = transcribe_audio(audio_path)
#     print("원문:\n", text)
#     print("\n요약:\n", summarize_text(text))

from transformers import pipeline
import sys
import json

def summarize_text(text):
    try:
        # 다국어 지원 BART 모델 사용
        summarizer = pipeline(
            "summarization",
            model="facebook/mbart-large-cc25",
            tokenizer="facebook/mbart-large-cc25"
        )
        
        # 텍스트 요약 수행
        summary = summarizer(
            text,
            max_length=600,
            min_length=30,
            do_sample=False
        )
        
        # JSON 형식으로 반환
        result = {
            "summary": summary[0]['summary_text']
        }
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_msg = {"error": str(e)}
        print(json.dumps(error_msg, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "입력 텍스트가 필요합니다."}, ensure_ascii=False), 
              file=sys.stderr)
        sys.exit(1)
    
    input_text = sys.argv[1].strip()
    if not input_text:
        print(json.dumps({"error": "텍스트가 비어있습니다."}, ensure_ascii=False), 
              file=sys.stderr)
        sys.exit(1)
        
    summarize_text(input_text)