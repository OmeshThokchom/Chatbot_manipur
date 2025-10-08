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
        self.model_path = model_path or "/home/omesh_thokchom/Documents/AI_MODEL/models/en_US-amy-medium.onnx"
        self.config_path = config_path or "/home/omesh_thokchom/Documents/AI_MODEL/models/config_ammy.onnx.json"
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
    
    def text_to_speech(self, text, play_audio=True, output_file=None):
        """Convert text to speech and optionally play it or save to file"""
        if not self.voice:
            if not self._load_voice():
                return False
        
        # Create an in-memory buffer
        buffer = io.BytesIO()
        
        try:
            # Generate speech to the buffer
            with wave.open(buffer, "wb") as wav_file:
                self.voice.synthesize(text, wav_file)
            
            # Reset buffer position to the beginning
            buffer.seek(0)
            
            # Save to file if requested
            if output_file:
                with open(output_file, "wb") as f:
                    f.write(buffer.getvalue())
                print(f"Audio saved to {output_file}")
                buffer.seek(0)  # Reset position after writing
            
            # Play audio if requested
            if play_audio:
                with wave.open(buffer, "rb") as wav_file:
                    # Get audio parameters
                    sample_rate = wav_file.getframerate()
                    n_channels = wav_file.getnchannels()
                    sample_width = wav_file.getsampwidth()
                    n_frames = wav_file.getnframes()
                    
                    # Read all frames
                    frames = wav_file.readframes(n_frames)
                    
                    # Convert to numpy array
                    if sample_width == 2:  # 16-bit audio
                        dtype = np.int16
                    elif sample_width == 4:  # 32-bit audio
                        dtype = np.int32
                    else:
                        dtype = np.uint8
                    
                    audio_data = np.frombuffer(frames, dtype=dtype)
                    
                    # Play the audio
                    sd.play(audio_data, sample_rate)
                    sd.wait()  # Wait until audio is finished playing
            
            return True
        except Exception as e:
            print(f"Error generating or playing speech: {e}")
            return False

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

