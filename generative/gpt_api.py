import requests
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {GROQ_API_KEY}"
}

payload = {
    "model": "openai/gpt-oss-120b",  # 👈 Update to latest model id on Groq
    "messages": [
        {
            "role": "user",
            "content": "what is the full form of photosynthesis?"
        }
    ],
    "temperature": 0.7,
    "max_tokens": 1024
}

response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)

# 💥 Print out the response
print(response.json()["choices"][0]["message"]["content"])



#########new from qroq######
#from groq import Groq
#
#client = Groq()
#completion = client.chat.completions.create(
#    model="openai/gpt-oss-120b",
#    messages=[
#      {
#        "role": "user",
#        "content": ""
#      }
#    ],
#    temperature=1,
#    max_completion_tokens=8192,
#    top_p=1,
#    reasoning_effort="medium",
#    stream=True,
#    stop=None
#)
#
#for chunk in completion:
#    print(chunk.choices[0].delta.content or "", end="")
#