
import time
from N7Speech.manipur_asr.realtime_speech import RealTimeSpeech
from meitei_chat_system import MeiteiChatSystem

def main():
    """
    This function initializes and runs the real-time speech recognition CLI.
    """
    print("Starting real-time voice-to-text CLI. Press Ctrl+C to stop.")

    # Initialize the chat system
    chat_system = MeiteiChatSystem()
    chat_system.streaming = False  # Disable streaming for CLI

    # Define the callback function to handle transcribed text
    def on_transcription(text):
        """
        This function is called when a new transcription is available.
        It sends the text to the chat system and prints the AI's response.
        """
        if text and text.strip():
            print(f"You: {text}")
            ai_response = chat_system.chat(text)
            print(f"AI: {ai_response}")

    # Initialize the real-time speech recognition system
    try:
        realtime_speech = RealTimeSpeech(lang="mni")
        realtime_speech.start(on_transcript=on_transcription)

        # Keep the main thread alive while the recognition is running
        while realtime_speech.running:
            time.sleep(0.1)

    except KeyboardInterrupt:
        print("\nStopping the voice CLI.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
