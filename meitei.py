from N7Speech.manipur_asr.realtime_speech import RealTimeSpeech

#if __name__ == "__main__":
#    RealTimeSpeech(lang="mni").start(lambda t: print(t, flush=True))

while True:
    try:
        result = RealTimeSpeech(lang="mni").start(lambda t: print(t, flush=True))
        print(result)
    except Exception as error:
        print(error)