import requests
import re
import numpy as np

TTS_API_URL = "https://enabling-golden-muskox.ngrok-free.app/tts"
SAMPLE_RATE = 44000
DATA_TYPE = np.int16

def synthesize_meitei_speech(text: str, description: str = "male voice, clear tone, professional hollywood action movie hero voice"):
    """
    Fetches Meitei TTS audio from external API and returns base64 audio data
    """
    if not text or not text.strip():
        print("TTS Error: No text to speak")
        return None

    # Remove symbols and markdown, keeping only English, Meitei Mayek, and basic punctuation
    cleaned_text = re.sub(r'[^a-zA-Z0-9\s\uABC0-\uABFF.,?!]', '', text)
    print(f"TTS Request - Original: '{text}' -> Cleaned: '{cleaned_text}'")

    try:
        data = {"prompt": cleaned_text, "description": description}
        print(f"TTS API URL: {TTS_API_URL}")
        print(f"TTS Request data: {data}")
        
        response = requests.post(TTS_API_URL, json=data)
        print(f"TTS Response status: {response.status_code}")
        
        # Check if response is ok before trying to parse JSON
        if response.status_code != 200:
            print(f"TTS API returned status code: {response.status_code}")
            print(f"TTS API response text: {response.text}")
            return None
            
        response.raise_for_status()
        
        # Try to parse response JSON
        try:
            response_data = response.json()
        except ValueError:  # includes json.decoder.JSONDecodeError
            print(f"TTS Error: Invalid JSON response from API: {response.text}")
            return None
            
        print(f"TTS Response data type: {type(response_data)}")
        print(f"TTS Response data: {response_data}")
        
        # Handle different possible response formats
        if isinstance(response_data, dict):
            if "audio" in response_data:
                audio_base64 = response_data["audio"]
                print(f"TTS Success: Got audio data, length: {len(audio_base64)}")
                return audio_base64
            elif "data" in response_data and "audio" in response_data["data"]:
                # Handle response in format {"data": {"audio": "..."}}
                audio_base64 = response_data["data"]["audio"]
                print(f"TTS Success: Got audio data from nested 'data' field, length: {len(audio_base64)}")
                return audio_base64
            elif "result" in response_data and "audio" in response_data["result"]:
                # Handle response in format {"result": {"audio": "..."}}
                audio_base64 = response_data["result"]["audio"]
                print(f"TTS Success: Got audio data from nested 'result' field, length: {len(audio_base64)}")
                return audio_base64
            else:
                print(f"TTS Error: Expected 'audio' key not found in response: {response_data.keys() if isinstance(response_data, dict) else 'Not a dict'}")
                return None
        else:
            print(f"TTS Error: Unexpected response format, expected dict but got {type(response_data)}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Meitei TTS Error: Could not connect to API. {e}")
        return None
    except Exception as e:
        print(f"Meitei TTS Error: {e}")
        return None