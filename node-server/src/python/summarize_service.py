# summarize_service.py
import whisper
from transformers import pipeline

def transcribe_audio(file_path):
    model = whisper.load_model("small")
    result = model.transcribe(file_path)
    return result["text"]

def summarize_text(text):
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    summary = summarizer(text, max_length=150, min_length=50, do_sample=False)
    return summary[0]['summary_text']

if __name__ == "__main__":
    import sys
    audio_path = sys.argv[1]
    text = transcribe_audio(audio_path)
    print("원문:\n", text)
    print("\n요약:\n", summarize_text(text))
