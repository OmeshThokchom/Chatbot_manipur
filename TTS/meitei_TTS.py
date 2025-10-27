import requests, base64

API = "https://enabling-golden-muskox.ngrok-free.app/tts"

data = {
    "prompt": "ꯅꯪꯒꯤ ꯃꯤꯡ ꯀꯔꯤ ꯀꯧꯒꯦ ꯑꯗꯨꯒꯥ ꯅꯪ ꯆꯥꯛ ꯆꯥꯔꯕꯣ",
    "description": "male voice, clear tone, fast tempo"
}
r = requests.post(API, json=data)
audio = base64.b64decode(r.json()["audio"])

with open("tts_output.wav", "wb") as f:
    f.write(audio)
