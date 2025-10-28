import os
import logging
from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from meitei_chat_system import MeiteiChatSystem
import base64
import sounddevice as sd
from queue import Queue
from TTS.piperTTS import PiperTTS
from TTS.meitei_TTS import synthesize_meitei_speech, SAMPLE_RATE

# Configure logging
logging.basicConfig(filename='app.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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
        logging.info(f"Received message: {user_message}")
        
        # Get response from chat system
        response = chat_system.chat(user_message)
        logging.info(f"Sending response: {response}")
        
        # Clean up any translation markers or system messages
        cleaned_response = response
        if '[Translation failed]' in response:
            cleaned_response = response.replace('[Translation failed]', '').strip()
        
        return jsonify({
            'response': cleaned_response,
            'status': 'success'
        })
    except Exception as e:
        logging.error(f"Error in /chat endpoint: {e}")
        return jsonify({
            'error': str(e),
            'response': 'Sorry, there was an error processing your message.'
        }), 500

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        audio_data = request.data
        if not audio_data:
            logging.warning("No audio data received in /transcribe")
            return jsonify({'error': 'No audio data received'}), 400

        transcript = chat_system.transcribe_audio_data(audio_data)
        logging.info(f"Transcription result: {transcript}")
        return jsonify({'transcript': transcript})
    except Exception as e:
        logging.error(f"Error in /transcribe endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/tts/speak', methods=['POST'])
def tts_speak():
    try:
        data = request.json
        text = data.get('text', '')
        logging.info(f"TTS request for text: {text[:50]}...")
        if not text:
            logging.warning("No text provided in /tts/speak")
            return jsonify({'error': 'No text provided'}), 400

        audio_buffer = piper_tts.text_to_speech(text)
        if audio_buffer:
            logging.info("Successfully generated audio buffer.")
            return Response(audio_buffer.getvalue(), mimetype='audio/wav')
        else:
            logging.error("Failed to generate audio buffer.")
            return jsonify({'error': 'Failed to generate speech'}), 500
    except Exception as e:
        logging.error(f"Error in /tts/speak endpoint: {e}")
        return jsonify({'error': str(e)}), 500

# --- WebSocket Events for Real-time Voice Chat ---
@socketio.on('connect')
def handle_connect():
    logging.info("Client connected to voice chat")
    emit('connected', {'status': 'Connected to voice chat'})

@socketio.on('disconnect')
def handle_disconnect():
    logging.info("Client disconnected from voice chat")

@socketio.on('voice_data')
def handle_voice_data(data):
    """Handle real-time voice data from client"""
    try:
        logging.info("Received voice data from client")
        # Get audio data from client
        audio_data = data.get('audio_data')
        if not audio_data:
            logging.warning("No audio data received in voice_data")
            emit('error', {'message': 'No audio data received'})
            return
        
        # Convert base64 audio data to bytes
        audio_bytes = base64.b64decode(audio_data)
        
        # Transcribe using existing ASR
        transcript = chat_system.transcribe_audio_data(audio_bytes)
        logging.info(f"Transcription result: '{transcript}'")
        
        if transcript and transcript.strip():
            # Get AI response using existing chat system
            ai_response = chat_system.chat(transcript)
            logging.info(f"AI Response: {ai_response}")
            
            # Send transcript and response back to client
            emit('transcript', {
                'transcript': transcript,
                'response': ai_response
            })
            
            # Generate TTS audio using Meitei TTS
            tts_audio = synthesize_meitei_speech(ai_response)
            if tts_audio:
                logging.info("Sending TTS audio to client")
                emit('tts_audio', {
                    'audio_data': tts_audio,
                    'sample_rate': SAMPLE_RATE
                })
            else:
                logging.error("Failed to generate TTS audio")
                # Still emit an event so the frontend knows processing is complete
                emit('tts_audio', {
                    'audio_data': None,
                    'sample_rate': SAMPLE_RATE,
                    'error': 'Failed to generate TTS audio'
                })
        else:
            logging.info("No transcript generated")
            emit('transcript', {
                'transcript': '',
                'response': ''
            })
            
    except Exception as e:
        logging.error(f"Error processing voice data: {e}")
        emit('error', {'message': f'Error processing voice: {str(e)}'})

@socketio.on('start_voice_chat')
def handle_start_voice_chat():
    """Handle start of voice chat session"""
    logging.info("Voice chat session started")
    emit('voice_chat_started', {'status': 'Voice chat session started'})

@socketio.on('stop_voice_chat')
def handle_stop_voice_chat():
    """Handle stop of voice chat session"""
    logging.info("Voice chat session stopped")
    emit('voice_chat_stopped', {'status': 'Voice chat session stopped'})

if __name__ == '__main__':
    socketio.run(app, debug=False, port=8000)
