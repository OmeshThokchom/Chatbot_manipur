document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const voiceButton = document.getElementById('voice-button');
    const voiceWaves = document.querySelector('.voice-button-container__waves');
    // The waveContainer is now part of the input field, so we need to adjust its selection
    const inputContainer = document.querySelector('.chat-input'); // Select the parent of the input field

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
        messageElement.classList.add('message');

        const avatar = document.createElement('div');
        avatar.classList.add('message__avatar');
        if (isUser) {
            avatar.classList.add('message__avatar--user');
            avatar.innerHTML = '<i class="fas fa-user"></i>'; // User icon
        } else {
            avatar.classList.add('message__avatar--assistant');
            avatar.innerHTML = '<i class="fas fa-robot"></i>'; // Assistant icon
        }
        messageElement.appendChild(avatar);

        const content = document.createElement('div');
        content.classList.add('message__content');
        
        // If not user, assume it might be markdown
        if (!isUser) {
            const contentDiv = document.createElement('div');
            contentDiv.className = 'markdown';
            contentDiv.innerHTML = marked.parse(text);
            // Highlight code blocks if hljs is available
            contentDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block); // Use highlightElement for pre-existing blocks
            });
            content.appendChild(contentDiv);
        } else {
            content.textContent = text;
        }

        messageElement.appendChild(content);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const showTypingIndicator = () => {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'typing-indicator');
        typingIndicator.id = 'typing-indicator';

        const avatar = document.createElement('div');
        avatar.classList.add('message__avatar', 'message__avatar--assistant');
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        typingIndicator.appendChild(avatar);

        const content = document.createElement('div');
        content.classList.add('message__content');
        content.innerHTML = '<span class="typing-indicator__dot"></span><span class="typing-indicator__dot"></span><span class="typing-indicator__dot"></span>';
        typingIndicator.appendChild(content);

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

        addMessage(message, true);
        userInput.value = '';
        userInput.style.height = 'auto'; // Reset textarea height

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
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent new line on Enter
            sendMessage();
        }
    });

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
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
            voiceWaves.classList.toggle('voice-button-container__waves--active', isVoiceActive);
            // The waveContainer is now the inputContainer itself for visual effect
            inputContainer.classList.toggle('wave-container--active', isVoiceActive); // Apply wave effect to input container
            userInput.classList.toggle('chat__input-field--voice-active', isVoiceActive);
            voiceButton.title = isVoiceActive ? 'Stop voice input' : 'Start voice input';
            
            if (isVoiceActive) {
                addMessage('Voice input activated. Speak to interact.', false);
                userInput.disabled = true;
                userInput.placeholder = 'Voice input active...';
                startTranscriptionStream();
            } else {
                addMessage('Voice input deactivated.', false);
                userInput.disabled = false;
                userInput.placeholder = 'Message ChatGPT...'; // Reset placeholder
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


});