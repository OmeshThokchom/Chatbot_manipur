import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css'; // A more modern theme

import './Message.css';

interface MessageProps {
  text: string;
  isUser: boolean;
  isMeitei?: boolean;
}

const Message: React.FC<MessageProps> = ({ text, isUser }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && !isUser) {
      contentRef.current.innerHTML = marked.parse(text) as string;
      contentRef.current.querySelectorAll('pre').forEach((preElement) => {
        const codeBlock = preElement.querySelector('code');
        if (codeBlock) {
          // Highlight the code block
          hljs.highlightElement(codeBlock as HTMLElement);

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
    <div className={`message ${isUser ? 'message--user' : 'message--assistant'}`}>
      <div className="message__content">
        {isUser ? (
          <p>{text}</p>
        ) : (
          <>
            <div className="markdown" ref={contentRef}></div>
            <div className="message__actions">
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