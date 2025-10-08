document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const voiceButton = document.getElementById('voice-button');
    const waveContainer = document.querySelector('.wave-container');
    const voiceWaves = document.querySelector('.voice-waves');

    // Configure marked options
    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });

    const addMessage = (text, isUser = false, metadata = null) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${isUser ? 'user' : 'assistant'}-message`);

        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble');
        
        // If not user, assume it might be markdown
        if (!isUser) {
            const contentDiv = document.createElement('div');
            contentDiv.className = 'markdown';
            contentDiv.innerHTML = marked.parse(text);
            // Highlight code blocks if hljs is available
            contentDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
            bubble.appendChild(contentDiv);
        } else {
            bubble.textContent = text;
        }

        messageElement.appendChild(bubble);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const showTypingIndicator = () => {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'assistant-message');
        typingIndicator.id = 'typing-indicator';

        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble');
        bubble.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

        typingIndicator.appendChild(bubble);
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const hideTypingIndicator = () => {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    };

    const sendMessage = async () => {
        const message = userInput.value.trim();
        if (message === '') return;

        addMessage(message, 'user');
        userInput.value = '';

        showTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            hideTypingIndicator();
            addMessage(data.response, false);
        } catch (error) {
            hideTypingIndicator();
            addMessage('Error: Could not connect to the server.', false);
        }
    };

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    let isVoiceActive = false;
    let eventSource = null;

    function startTranscriptionStream() {
        eventSource = new EventSource('/get-transcription');
        
        eventSource.onmessage = function(e) {
            const data = JSON.parse(e.data);
            addMessage(data.transcript, true);
            addMessage(data.response, false);
        };
        
        eventSource.onerror = function() {
            console.log('SSE error, closing connection');
            eventSource.close();
            eventSource = null;
        };
    }

    async function toggleVoiceInput() {
        try {
            const response = await fetch('/voice-input', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (data.error) {
                addMessage(`Error: ${data.error}`, false);
                return;
            }

            isVoiceActive = data.status === 'started';
            voiceButton.classList.toggle('active', isVoiceActive);
            voiceWaves.classList.toggle('active', isVoiceActive);
            waveContainer.classList.toggle('active', isVoiceActive);
            userInput.classList.toggle('voice-active', isVoiceActive);
            voiceButton.title = isVoiceActive ? 'Stop voice input' : 'Start voice input';
            
            if (isVoiceActive) {
                addMessage('Voice input activated. Speak to interact.', false);
                userInput.disabled = true;
                userInput.placeholder = 'Voice input active...';
                startTranscriptionStream();
            } else {
                addMessage('Voice input deactivated.', false);
                userInput.disabled = false;
                userInput.placeholder = 'Type your message...';
                if (eventSource) {
                    eventSource.close();
                    eventSource = null;
                }
            }
        } catch (error) {
            addMessage('Error: Could not toggle voice input.', false);
            console.error('Voice input error:', error);
        }
    }

    voiceButton.addEventListener('click', toggleVoiceInput);

    // Initial welcome message
    addMessage("Hi! How can I help you today?", false);
});