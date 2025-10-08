import sys
import json
import requests
import signal
from TTS.piperTTS import PiperTTS

tts_engine = PiperTTS()

#example: tts_engine.text_to_speech("hello")


import os
from dotenv import load_dotenv

load_dotenv()

class RealtimeChatSystem:
    """Realtime chat system core functionality"""
    
    def __init__(self, api_key=None, model=None, system_prompt=None, use_tts=False):
        """
        Initialize the chat system
        
        Args:
            api_key: The API key for the LLM service (Groq)
            model: The model to use for chat
            system_prompt: System prompt to control the behavior of the AI
            use_tts: Whether to use text-to-speech
        """
        # API settings
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.model = model or "meta-llama/llama-4-scout-17b-16e-instruct"
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        
        # Chat history
        self.messages = []
        
        # Add system prompt if provided
        if system_prompt:
            self.add_message("system", system_prompt)
        
        # Stream settings
        self.streaming = True
        
        # TTS settings
        self.use_tts = use_tts
        
        # Setup signal handler for graceful exit
        signal.signal(signal.SIGINT, self._handle_interrupt)
        
    def add_message(self, role, content):
        """Add a message to the chat history"""
        self.messages.append({"role": role, "content": content})
        
    def clear_history(self):
        """Clear the chat history"""
        self.messages = []
        
    def get_chat_completion(self):
        """Get a chat completion from the API"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "model": self.model,
            "messages": self.messages,
            "temperature": 0.7,
            "max_tokens": 1024,
            "stream": self.streaming
        }
        
        try:
            if self.streaming:
                return self._stream_response(headers, payload)
            else:
                # Add timeout to prevent hanging
                response = requests.post(self.api_url, headers=headers, json=payload, timeout=10)
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
        except requests.ConnectionError as e:
            error_msg = f"Connection error: {str(e)}"
            print(f"Error getting chat completion: {error_msg}")
            return "I'm sorry, I'm having trouble connecting to my knowledge service right now. This could be due to network issues or service unavailability. Please try again later or check your internet connection."
        except requests.Timeout as e:
            error_msg = f"Request timed out: {str(e)}"
            print(f"Error getting chat completion: {error_msg}")
            return "I'm sorry, the request timed out. This could be due to network issues or high server load. Please try again later."
        except Exception as e:
            print(f"Error getting chat completion: {e}")
            return f"Error: {str(e)}"
            
    def _handle_interrupt(self, sig, frame):
        """Handle keyboard interrupt gracefully"""
        print("\n\nExiting chat session...")
        sys.exit(0)
        
    def _stream_response(self, headers, payload):
        """Stream the response from the API"""
        try:
            # Show a spinner while connecting
            print("Connecting to API...", end="", flush=True)
            
            # Add timeout to prevent hanging
            response = requests.post(
                self.api_url, 
                headers=headers, 
                json=payload, 
                stream=True,
                timeout=10  # 10 second timeout
            )
            response.raise_for_status()
            
            # Clear the connecting message
            print("\r" + " " * 20 + "\r", end="", flush=True)
            
            # Initialize variables for streaming
            full_response = ""
            
            # Process the response
            full_response = ""
            for line in response.iter_lines():
                if line:
                    # Skip the data: prefix
                    line_text = line.decode('utf-8')
                    if line_text.startswith("data: "):
                        line_text = line_text[6:]
                        
                    # Skip [DONE] message
                    if line_text.strip() == "[DONE]":
                        continue
                        
                    try:
                        # Parse the JSON
                        json_data = json.loads(line_text)
                        
                        # Extract the content
                        if "choices" in json_data and len(json_data["choices"]) > 0:
                            delta = json_data["choices"][0]["delta"]
                            if "content" in delta and delta["content"]:
                                content = delta["content"]
                                print(content, end="", flush=True)
                                full_response += content
                    except json.JSONDecodeError:
                        print(f"\nError parsing JSON: {line_text}")
                    except Exception as e:
                        print(f"\nError processing response: {e}")
            
            # Add the assistant message to history
            self.add_message("assistant", full_response)
            
            # Use TTS if enabled
            if self.use_tts and full_response.strip():
                try:
                    # Use the global tts_engine
                    global tts_engine
                    tts_engine.text_to_speech(full_response)
                except Exception as e:
                    print(f"\nTTS Error: {e}")
            
            # Add a newline at the end for better formatting
            print("\n")
            
            return full_response
        except requests.ConnectionError as e:
            error_msg = f"Connection error: {str(e)}"
            print(f"\nError streaming response: {error_msg}")
            return "I'm sorry, I'm having trouble connecting to my knowledge service right now. This could be due to network issues or service unavailability. Please try again later or check your internet connection."
        except requests.Timeout as e:
            error_msg = f"Request timed out: {str(e)}"
            print(f"\nError streaming response: {error_msg}")
            return "I'm sorry, the request timed out. This could be due to network issues or high server load. Please try again later."
        except Exception as e:
            print(f"Error streaming response: {e}")
            return f"Error: {str(e)}"
    
    def chat(self, user_input):
        """Process a user input and get a response"""
        # Add the user message to history
        self.add_message("user", user_input)
        
        # Get and return the response
        return self.get_chat_completion()
    
    def interactive_session(self):
        """Run an interactive chat session"""
        print("=" * 50)
        print("Realtime Chat System")
        print("Type 'exit' or 'quit' to end the session")
        print("Type 'clear' to clear the chat history")
        print("Type 'tts on/off' to toggle text-to-speech")
        print("Type 'system <prompt>' to set a system prompt")
        print("=" * 50)
        
        while True:
            try:
                # Get user input
                user_input = input("\nYou: ")
                
                # Check for exit commands
                if user_input.lower() in ['exit', 'quit']:
                    print("Exiting chat session...")
                    break
                    
                # Check for clear command
                if user_input.lower() == 'clear':
                    self.clear_history()
                    print("Chat history cleared.")
                    continue
                
                # Check for TTS toggle commands
                if user_input.lower() == 'tts on':
                    self.use_tts = True
                    print("Text-to-speech enabled.")
                    continue
                elif user_input.lower() == 'tts off':
                    self.use_tts = False
                    print("Text-to-speech disabled.")
                    continue
                
                # Check for system prompt command
                if user_input.lower().startswith('system '):
                    system_prompt = user_input[7:].strip()  # Remove 'system ' prefix
                    if system_prompt:
                        # Clear history and add the new system prompt
                        self.clear_history()
                        self.add_message("system", system_prompt)
                        print(f"System prompt set to: {system_prompt}")
                    else:
                        print("System prompt cannot be empty.")
                    continue
                    
                # Skip empty inputs
                if not user_input.strip():
                    continue
                    
                # Process the input and get a response
                print("\nAssistant: ", end="", flush=True)
                self.chat(user_input)
            except KeyboardInterrupt:
                print("\n\nExiting chat session...")
                break
            except Exception as e:
                print(f"\nError: {e}")
                continue

def main():
    """Main entry point"""
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description="Realtime Chat System")
    parser.add_argument("--api-key", help="API key for the LLM service")
    parser.add_argument("--model", help="Model to use for chat")
    parser.add_argument("--no-stream", action="store_true", help="Disable streaming")
    parser.add_argument("--tts", action="store_true", help="Enable text-to-speech")
    parser.add_argument("--system-prompt", help="System prompt to control the behavior of the AI")
    args = parser.parse_args()
    
    # Create the chat system
    chat_system = RealtimeChatSystem(
        api_key=args.api_key,
        model=args.model,
        system_prompt=args.system_prompt,
        use_tts=args.tts
    )
    
    # Set options from command line arguments
    if args.no_stream:
        chat_system.streaming = False
    
    # Start the interactive session
    try:
        chat_system.interactive_session()
    except KeyboardInterrupt:
        print("\nExiting chat session...")
    except Exception as e:
        print(f"\nError: {e}")

if __name__ == "__main__":
    main()
