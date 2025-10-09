import React, { useEffect, useRef, useState } from 'react';
import { Marked } from 'marked';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

import './Message.css';

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);


interface MessageProps {
  text: string;
  isUser: boolean;
  isMeitei?: boolean;
  status?: 'pending' | 'sent' | 'error';
  isError?: boolean;
}

const Message: React.FC<MessageProps> = ({ text, isUser, status, isError }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const handlePlayAloud = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    if (isLoadingAudio) return; // Prevent multiple clicks while loading

    setIsLoadingAudio(true);
    try {
      const response = await fetch('/tts/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
      } else {
        audioRef.current = new Audio(audioUrl);
      }

      audioRef.current.play();
      setIsPlaying(true);

      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl); // Clean up the object URL
      };

      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl); // Clean up the object URL
        alert('Error playing audio.');
      };

    } catch (error) {
      console.error('Error fetching TTS audio:', error);
      alert('Failed to play audio. Please try again.');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  useEffect(() => {
    if (contentRef.current && !isUser) {
      contentRef.current.innerHTML = marked.parse(text) as string;
      contentRef.current.querySelectorAll('pre').forEach((preElement) => {
        const codeBlock = preElement.querySelector('code');
        if (codeBlock) {
          // Create a header for the code block
          const header = document.createElement('div');
          header.className = 'code-block-header';

          // Get the language name
          const language = codeBlock.className.split(' ').find(cls => cls.startsWith('language-'))?.replace('language-', '') || 'code';
          const languageName = document.createElement('span');
          languageName.className = 'language-name';
          languageName.innerText = language;

          // Create a copy button
          const copyButton = document.createElement('button');
          copyButton.className = 'copy-button';
          copyButton.innerText = 'Copy';
          copyButton.onclick = () => {
            navigator.clipboard.writeText(codeBlock.innerText);
            copyButton.innerText = 'Copied!';
            setTimeout(() => {
              copyButton.innerText = 'Copy';
            }, 2000);
          };

          // Assemble the header
          header.appendChild(languageName);
          header.appendChild(copyButton);

          // Add the header to the pre element
          preElement.prepend(header);
        }
      });
    }
  }, [text, isUser]);

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--assistant'} ${status === 'pending' ? 'message--pending' : ''} ${isError ? 'message--error' : ''}`}>
      <div className="message__content">
        {isUser ? (
          <p>{text}</p>
        ) : (
          <>
            <div className="markdown" ref={contentRef}></div>
            <div className="message__actions">
              <i
                className={`fas ${isLoadingAudio ? 'fa-spinner fa-spin' : (isPlaying ? 'fa-stop' : 'fa-volume-up')}`}
                title={isPlaying ? 'Stop Playback' : 'Play Aloud'}
                onClick={handlePlayAloud}
                style={{ cursor: isLoadingAudio ? 'not-allowed' : 'pointer' }}
              ></i>
              <i className="fas fa-clipboard" title="Copy"></i>
              <i className="fas fa-share-square" title="Share"></i>
              <i className="fas fa-sync-alt" title="Retry"></i>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Message;