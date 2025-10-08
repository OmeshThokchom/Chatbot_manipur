from misaki import en

g2p = en.G2P(trf=False, british=False, fallback=None) # no transformer, American English

text = 'hello this is testing the kokoro model'

phonemes, tokens = g2p(text)

print(phonemes) # misˈɑki ɪz ə ʤˈitəpˈi ˈɛnʤən dəzˈInd fɔɹ kˈOkəɹO mˈɑdᵊlz.