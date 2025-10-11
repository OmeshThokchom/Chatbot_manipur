from piperTTS import PiperTTS
import sounddevice as sd
import wave
import numpy as np
import io

tts = PiperTTS()

while True:
    try:
        txt = input("enter the text here:")
        audio_buffer = tts.text_to_speech(txt)
        
        if audio_buffer:
            # Read the audio data from the buffer
            audio_buffer.seek(0)
            with wave.open(audio_buffer, 'rb') as wf:
                samplerate = wf.getframerate()
                data = wf.readframes(wf.getnframes())
                
                # Convert to numpy array
                audio_data = np.frombuffer(data, dtype=np.int16)
                
                # Play the audio
                sd.play(audio_data, samplerate)
                sd.wait()

    except KeyboardInterrupt:
        break
    except Exception as e:
        print(f"Error: {e}")
        