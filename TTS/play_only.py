from piperTTS import PiperTTS


tts = PiperTTS()

while True:
    try:
        txt = input("enter the text here:")
        tts.text_to_speech(txt)
    except KeyboardInterrupt:
        break
    except Exception as e:
        print(f"Error: {e}")
        