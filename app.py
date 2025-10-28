import os
from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from meitei_chat_system import MeiteiChatSystem
import base64
import sounddevice as sd
from queue import Queue
from TTS.piperTTS import PiperTTS
from TTS.meitei_TTS import synthesize_meitei_speech, SAMPLE_RATE

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
        if not text:
            return jsonify({'error': 'No text provided'}), 400

        audio_buffer = piper_tts.text_to_speech(text)
        if audio_buffer:
            return Response(audio_buffer.getvalue(), mimetype='audio/wav')
        else:
            return jsonify({'error': 'Failed to generate speech'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- WebSocket Events for Real-time Voice Chat ---
@socketio.on('connect')
def handle_connect():
    emit('connected', {'status': 'Connected to voice chat'})

@socketio.on('disconnect')
def handle_disconnect():
    pass

@socketio.on('voice_data')
def handle_voice_data(data):
    """Handle real-time voice data from client"""
    try:
        # Get audio data from client
        audio_data = data.get('audio_data')
        if not audio_data:
            emit('error', {'message': 'No audio data received'})
            return
        
        # Convert base64 audio data to bytes
        audio_bytes = base64.b64decode(audio_data)
        
        # Transcribe using existing ASR
        transcript = chat_system.transcribe_audio_data(audio_bytes)
        
        if transcript and transcript.strip():
            # Get AI response using existing chat system
            ai_response = chat_system.chat(transcript)
            
            # Send transcript and response back to client
            emit('transcript', {
                'transcript': transcript,
                'response': ai_response
            })
            
            # Generate TTS audio using Meitei TTS
            tts_audio = synthesize_meitei_speech(ai_response)
            if tts_audio:
                emit('tts_audio', {
                    'audio_data': tts_audio,
                    'sample_rate': SAMPLE_RATE
                })
            else:
                # Still emit an event so the frontend knows processing is complete
                emit('tts_audio', {
                    'audio_data': None,
                    'sample_rate': SAMPLE_RATE,
                    'error': 'Failed to generate TTS audio'
                })
        else:
            emit('transcript', {
                'transcript': '',
                'response': ''
            })
            
    except Exception as e:
        emit('error', {'message': f'Error processing voice: {str(e)}'})

@socketio.on('start_voice_chat')
def handle_start_voice_chat():
    """Handle start of voice chat session"""
    emit('voice_chat_started', {'status': 'Voice chat session started'})

@socketio.on('stop_voice_chat')
def handle_stop_voice_chat():
    """Handle stop of voice chat session"""
    emit('voice_chat_stopped', {'status': 'Voice chat session stopped'})

if __name__ == '__main__':
    socketio.run(app, debug=False, port=8000)
