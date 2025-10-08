import requests
import time
import random

def translate(text):
    """Translate English text to Meitei Mayek with robust error handling"""
    if not text or len(text.strip()) == 0:
        return ""
    
    # Try Google Translate API first
    result = _google_translate(text)
    
    # If Google Translate fails or returns empty result, try a fallback
    if not result or len(result.strip()) < 3:
        # Log the failure
        with open("translation_log.txt", "a", encoding="utf-8") as log:
            log.write(f"Google Translate (EN->MNI) failed for: {text[:100]}...\n")
        
        # Try a different translation endpoint as fallback
        result = _fallback_translate(text)
    
    return result

def _google_translate(text):
    """Use Google Translate API to translate English to Meitei"""
    params = {
        "sl": "en",
        "tl": "mni-Mtei",
        "q": text
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        # Add a timeout to prevent hanging indefinitely
        res = requests.get(
            "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t", 
            params=params, 
            headers=headers,
            timeout=10
        )
        
        # Check if the response is valid
        if res.status_code != 200:
            raise Exception(f"HTTP error {res.status_code}")
            
        # Parse the response
        json_data = res.json()
        
        # Extract the translation
        if json_data and len(json_data) > 0 and json_data[0] and len(json_data[0]) > 0:
            translated_text = ""
            # Concatenate all translated segments
            for segment in json_data[0]:
                if segment and len(segment) > 0:
                    translated_text += segment[0]
            return translated_text
        else:
            return ""
            
    except Exception as e:
        with open("translation_log.txt", "a", encoding="utf-8") as log:
            log.write(f"Google Translate (EN->MNI) error: {e}\n")
        return ""

def _fallback_translate(text):
    """Fallback translation method when Google Translate fails"""
    # Try a different translation API or method here
    try:
        # Add a small delay to avoid rate limiting if we're retrying
        time.sleep(random.uniform(0.5, 1.5))
        
        # Try with a different endpoint
        params = {
            "source": "en",
            "target": "mni",
            "q": text
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "application/json"
        }
        
        # Try a different endpoint (LibreTranslate-compatible API if available)
        res = requests.post(
            "https://translate.argosopentech.com/translate",
            json=params,
            headers=headers,
            timeout=15
        )
        
        if res.status_code == 200:
            json_data = res.json()
            if 'translatedText' in json_data:
                return json_data['translatedText']
    
    except Exception as e:
        with open("translation_log.txt", "a", encoding="utf-8") as log:
            log.write(f"Fallback translation (EN->MNI) error: {e}\n")
    
    # If all else fails, return a placeholder that indicates translation failed
    return ""  # Return empty string to trigger the fallback in the chat system

# Test the translation function
if __name__ == "__main__":
    while True:
        try:
            txt = input("🔤 English: ")
            if txt.lower() == "exit":
                break
            
            print("Translating...")
            result = translate(txt)
            if result:
                print("Meitei Mayek:", result)
            else:
                print("Translation failed.")
            
        except KeyboardInterrupt:
            print("\n👋 Interrupted by user. Exiting...")
            break
        except Exception as e:
            print(f"Error: {e}")
            continue
