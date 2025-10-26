import requests
import base64
import numpy as np
import sounddevice as sd

# --- Configuration ---
API_URL = "https://enabling-golden-muskox.ngrok-free.app/tts"

# NOTE: These are assumptions. If audio is distorted or has the wrong speed,
# these values may need to be changed.
SAMPLE_RATE = 44000  # Common for voice models
DATA_TYPE = np.int16   # Common for WAV audio data


def play_tts_from_text(prompt: str, description: str):
    """
    Fetches TTS audio from the specified API and plays it directly.

    Args:
        prompt: The text to be converted to speech.
        description: A description to guide the voice generation.
    """
    print(f"Requesting TTS for: '{prompt}'")
    
    try:
        # 1. Call the TTS API
        data = {"prompt": prompt, "description": description}
        response = requests.post(API_URL, json=data)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

        # 2. Decode the base64 audio data
        audio_base64 = response.json()["audio"]
        audio_bytes = base64.b64decode(audio_base64)

        # 3. Convert raw bytes to a NumPy array
        # The API is assumed to return raw PCM data.
        audio_np = np.frombuffer(audio_bytes, dtype=DATA_TYPE)

        print("Playing audio...")
        
        # 4. Play the audio array
        sd.play(audio_np, samplerate=SAMPLE_RATE)
        
        # 5. Wait for playback to finish
        sd.wait()
        
        print("Playback finished.")

    except requests.exceptions.RequestException as e:
        print(f"Error calling TTS API: {e}")
    except (KeyError, TypeError):
        print("Error: Unexpected response format from API.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    # Example usage with the prompt from the user's script
    example_prompt = "ꯀꯁꯨꯕꯤ ꯒꯤ ꯃꯆꯥ"
    example_description = "male voice, clear tone, fast tempo"
    
    play_tts_from_text(example_prompt, example_description)
