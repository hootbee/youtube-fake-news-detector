import whisper
import sys

def transcribe(file_path):
    model = whisper.load_model("base")
    result = model.transcribe(file_path)
    print(result["text"])

if __name__ == "__main__":
    transcribe(sys.argv[1])
