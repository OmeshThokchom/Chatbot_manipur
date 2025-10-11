import re
from piper.voice import PiperVoice
import wave
import io
import numpy as np
import sounddevice as sd
import time

class PiperTTS:
    """Piper Text-to-Speech with direct audio playback"""
    
    def __init__(self, model_path=None, config_path=None):
        """Initialize the Piper TTS engine"""
        self.model_path = model_path or "./models/en_US-amy-medium.onnx"
        self.config_path = config_path or "./models/config_ammy.onnx.json"
        self.voice = None
        self._load_voice()
    
    def _load_voice(self):
        """Load the Piper voice model"""
        try:
            self.voice = PiperVoice.load(self.model_path, config_path=self.config_path)
            print(f"Loaded Piper voice model from {self.model_path}")
            return True
        except Exception as e:
            print(f"Error loading voice model: {e}")
            return False
    
    def _clean_text(self, text):
        "\"\"\"Clean the text by removing markdown, HTML, and other special characters.\"\"\""
        # Remove HTML tags
        text = re.sub(r'<.*?>', '', text)
        # Remove markdown links
        text = re.sub(r'\\\[(.*?)\\]\\(.*?\\)', r'\\1', text)
        # Remove markdown formatting characters
        text = re.sub(r'([*_~`#])', '', text)
        # Remove emojis and other pictographs
        emoji_pattern = re.compile("["
                               u"\U0001F600-\U0001F64F"  # emoticons
                               u"\U0001F300-\U0001F5FF"  # symbols & pictographs
                               u"\U0001F680-\U0001F6FF"  # transport & map symbols
                               u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
                               u"\U00002702-\U000027B0"
                               u"\U000024C2-\U0001F251"
                               "]+", flags=re.UNICODE)
        text = emoji_pattern.sub(r'', text)
        return text

    def text_to_speech(self, text):
        """Convert text to speech and return the audio buffer"""
        if not self.voice:
            if not self._load_voice():
                return None
        
        # Create an in-memory buffer
        buffer = io.BytesIO()
        
        try:
            # Clean the text before synthesis
            cleaned_text = self._clean_text(text)
            
            # Generate speech to the buffer
            with wave.open(buffer, "wb") as wav_file:
                self.voice.synthesize(cleaned_text, wav_file)
            
            # Reset buffer position to the beginning
            buffer.seek(0)
            
            return buffer
        except Exception as e:
            print(f"Error generating speech: {e}")
            return None

# Example usage in a loop
def interactive_tts_demo():
    """Interactive TTS demo with a loop"""
    tts = PiperTTS()
    
    print("=" * 50)
    print("Piper TTS Interactive Demo")
    print("Type 'exit' or 'quit' to end the session")
    print("=" * 50)
    
    while True:
        # Get user input
        text = input("\nEnter text to speak: ")
        
        # Check for exit commands
        if text.lower() in ['exit', 'quit']:
            print("Exiting...")
            break
        
        # Skip empty inputs
        if not text.strip():
            continue
        
        # Speak the text
        print(f"Speaking: {text}")
        tts.text_to_speech(text)

# Run the demo if this script is executed directly
#if __name__ == "__main__":
#    interactive_tts_demo()

