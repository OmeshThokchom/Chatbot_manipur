
import time
import requests
import base64
import numpy as np
import sounddevice as sd
from N7Speech.manipur_asr.realtime_speech import RealTimeSpeech
from meitei_chat_system import MeiteiChatSystem

# --- TTS Configuration ---
TTS_API_URL = "https://enabling-golden-muskox.ngrok-free.app/tts"
SAMPLE_RATE = 44000
DATA_TYPE = np.int16

def play_tts_from_text(prompt: str, description: str = "female voice, clear tone"):
    """
    Fetches TTS audio from the specified API and plays it directly.
    """
    if not prompt or not prompt.strip():
        print("TTS Error: No text to speak.")
        return

    print("AI is speaking...")
    try:
        data = {"prompt": prompt, "description": description}
        response = requests.post(TTS_API_URL, json=data)
        response.raise_for_status()

        audio_base64 = response.json()["audio"]
        audio_bytes = base64.b64decode(audio_base64)

        audio_np = np.frombuffer(audio_bytes, dtype=DATA_TYPE)

        sd.play(audio_np, samplerate=SAMPLE_RATE)
        sd.wait()

    except requests.exceptions.RequestException as e:
        print(f"TTS Error: Could not connect to API. {e}")
    except Exception as e:
        print(f"TTS Error: {e}")

def main():
    """
    This function initializes and runs the real-time speech recognition CLI.
    """
    print("Starting real-time voice-to-voice chat. Press Ctrl+C to stop.")

    # Initialize the chat system
    chat_system = MeiteiChatSystem()
    chat_system.streaming = False  # Disable streaming for CLI

    # Define the callback function to handle transcribed text
    def on_transcription(text):
        """
        This function is called when a new transcription is available.
        It sends the text to the chat system and plays the AI's audio response.
        """
        if text and text.strip():
            print(f"You: {text}")
            ai_response = chat_system.chat(text)
            print(f"AI: {ai_response}")
            play_tts_from_text(ai_response)

    # Initialize the real-time speech recognition system
    try:
        realtime_speech = RealTimeSpeech(lang="mni")
        realtime_speech.start(on_transcript=on_transcription)

        # Keep the main thread alive while the recognition is running
        while realtime_speech.running:
            time.sleep(0.1)

    except KeyboardInterrupt:
        print("\nStopping the voice CLI.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
