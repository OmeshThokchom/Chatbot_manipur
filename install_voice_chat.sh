#!/bin/bash

echo "🚀 Installing Voice Chat Dependencies..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install flask-socketio==5.3.6

# Install frontend dependencies (if needed)
echo "📦 Frontend dependencies already installed (socket.io-client)"

echo "✅ Installation complete!"
echo ""
echo "🎯 To start the voice chat system:"
echo "1. Run: python app.py"
echo "2. Open: http://localhost:8000"
echo "3. Click the voice-only button to start real-time voice chat!"
echo ""
echo "🎤 Features:"
echo "- Real-time voice-to-voice conversation"
echo "- Meitei language support"
echo "- Beautiful orb audio visualization"
echo "- WebSocket-based real-time communication"
