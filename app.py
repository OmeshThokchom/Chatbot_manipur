import os
from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from meitei_chat_system import MeiteiChatSystem
import base64
import requests
import numpy as np
import sounddevice as sd
import re

from queue import Queue

from TTS.piperTTS import PiperTTS

app = Flask(__name__, static_folder='frontend/dist', static_url_path='/')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

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

# --- Meitei TTS Configuration (for real-time voice chat) ---
TTS_API_URL = "https://enabling-golden-muskox.ngrok-free.app/tts"
SAMPLE_RATE = 44000
DATA_TYPE = np.int16

def play_meitei_tts(text: str, description: str = "male voice, clear tone"):
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
        
        response = requests.post(TTS_API_URL, json=data, timeout=10)
        print(f"TTS Response status: {response.status_code}")
        
        response.raise_for_status()
        
        response_data = response.json()
        print(f"TTS Response data keys: {response_data.keys()}")
        
        if "audio" in response_data:
            audio_base64 = response_data["audio"]
            print(f"TTS Success: Got audio data, length: {len(audio_base64)}")
            return audio_base64
        else:
            print(f"TTS Error: No 'audio' key in response: {response_data}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Meitei TTS Error: Could not connect to API. {e}")
        return None
    except Exception as e:
        print(f"Meitei TTS Error: {e}")
        return None

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

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        audio_data = request.data
        if not audio_data:
            return jsonify({'error': 'No audio data received'}), 400

        transcript = chat_system.transcribe_audio_data(audio_data)
        return jsonify({'transcript': transcript})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

# --- WebSocket Events for Real-time Voice Chat ---
@socketio.on('connect')
def handle_connect():
    print('Client connected to voice chat')
    emit('connected', {'status': 'Connected to voice chat'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected from voice chat')

@socketio.on('voice_data')
def handle_voice_data(data):
    """Handle real-time voice data from client"""
    try:
        print("Received voice data from client")
        # Get audio data from client
        audio_data = data.get('audio_data')
        if not audio_data:
            print("No audio data received")
            emit('error', {'message': 'No audio data received'})
            return
        
        print(f"Audio data size: {len(audio_data)} characters")
        # Convert base64 audio data to bytes
        audio_bytes = base64.b64decode(audio_data)
        print(f"Decoded audio bytes size: {len(audio_bytes)} bytes")
        
        # Transcribe using existing ASR
        transcript = chat_system.transcribe_audio_data(audio_bytes)
        print(f"Transcription result: '{transcript}'")
        
        if transcript and transcript.strip():
            print(f"Transcribed: {transcript}")
            
            # Get AI response using existing chat system
            ai_response = chat_system.chat(transcript)
            print(f"AI Response: {ai_response}")
            
            # Send transcript and response back to client
            emit('transcript', {
                'transcript': transcript,
                'response': ai_response
            })
            
            # Generate TTS audio using Meitei TTS
            tts_audio = play_meitei_tts(ai_response)
            if tts_audio:
                print("Sending TTS audio to client")
                emit('tts_audio', {
                    'audio_data': tts_audio,
                    'sample_rate': SAMPLE_RATE
                })
            else:
                print("Failed to generate TTS audio")
                emit('error', {'message': 'Failed to generate TTS audio'})
        else:
            print("No transcript generated")
            emit('transcript', {
                'transcript': '',
                'response': ''
            })
            
    except Exception as e:
        print(f"Error processing voice data: {e}")
        emit('error', {'message': f'Error processing voice: {str(e)}'})

@socketio.on('start_voice_chat')
def handle_start_voice_chat():
    """Handle start of voice chat session"""
    print('Starting voice chat session')
    emit('voice_chat_started', {'status': 'Voice chat session started'})

@socketio.on('stop_voice_chat')
def handle_stop_voice_chat():
    """Handle stop of voice chat session"""
    print('Stopping voice chat session')
    emit('voice_chat_stopped', {'status': 'Voice chat session stopped'})

if __name__ == '__main__':
    socketio.run(app, debug=True, port=8000)
