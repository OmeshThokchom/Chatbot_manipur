import os
from flask import Flask, render_template, request, jsonify, Response, send_from_directory
from flask_cors import CORS
from meitei_chat_system import MeiteiChatSystem
import threading
import json
from queue import Queue
import time
from TTS.piperTTS import PiperTTS

app = Flask(__name__, static_folder='frontend/dist', static_url_path='/')
CORS(app)

# Initialize chat system with streaming disabled for web interface
chat_system = MeiteiChatSystem()
chat_system.streaming = False  # Disable streaming for web interface

# Initialize PiperTTS
piper_tts = PiperTTS()

# Queue for transcribed text
transcription_queue = Queue()

# Callback for transcriptions
def web_transcription_callback(transcript):
    if transcript and transcript.strip():
        transcription_queue.put({'transcript': transcript.strip()})

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_assets(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        # Get response from chat system
        response = chat_system.chat(user_message)
        
        # Clean up any translation markers or system messages
        cleaned_response = response
        if '[Translation failed]' in response:
            cleaned_response = response.replace('[Translation failed]', '').strip()
        
        return jsonify({
            'response': cleaned_response,
            'status': 'success'
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'response': 'Sorry, there was an error processing your message.'
        }), 500

@app.route('/voice-input', methods=['POST'])
def voice_input():
    try:
        if not chat_system.voice_input:
            # Clear any old transcriptions
            while not transcription_queue.empty():
                transcription_queue.get()
                
            # Start voice input with our custom callback
            chat_system.voice_input = True
            chat_system._custom_partial_callback = web_transcription_callback
            chat_system.start_voice_input()
            return jsonify({'status': 'started'})
        else:
            # Stop voice input if it's running
            chat_system.stop_voice_input()
            chat_system.voice_input = False
            return jsonify({'status': 'stopped'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-transcription')
def get_transcription():
    def generate():
        while chat_system.voice_input:
            try:
                data = transcription_queue.get(timeout=0.1)
                if data:
                    yield f'data: {json.dumps(data)}\n\n'
            except:
                yield ':keepalive\n\n'
            time.sleep(0.1)
    return Response(generate(), mimetype='text/event-stream')

@app.route('/tts/speak', methods=['POST'])
def tts_speak():
    try:
        data = request.json
        text = data.get('text', '')
        print(f"Received TTS request for text: {text[:50]}...") # Log received text
        if not text:
            return jsonify({'error': 'No text provided'}), 400

        audio_buffer = piper_tts.text_to_speech(text)
        if audio_buffer:
            print("Successfully generated audio buffer.") # Log success
            return Response(audio_buffer.getvalue(), mimetype='audio/wav')
        else:
            print("Failed to generate audio buffer.") # Log failure
            return jsonify({'error': 'Failed to generate speech'}), 500
    except Exception as e:
        print(f"Error in /tts/speak endpoint: {e}") # Log exception
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
