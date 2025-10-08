import React, { useEffect } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; // Or any other theme you prefer

interface MessageProps {
  text: string;
  isUser: boolean;
  isMeitei?: boolean;
}

const Message: React.FC<MessageProps> = ({ text, isUser }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && !isUser) {
      contentRef.current.innerHTML = marked.parse(text) as string;
      contentRef.current.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [text, isUser]);

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--assistant'}`}>
      <div className={`message__avatar ${isUser ? 'message__avatar--user' : 'message__avatar--assistant'}`}>
        {isUser ? <i className="fas fa-user"></i> : <i className="fas fa-robot"></i>}
      </div>
      <div className="message__content">
        {isUser ? (
          <p>{text}</p>
        ) : (
          <div className="markdown" ref={contentRef}></div>
        )}
      </div>
    </div>
  );
};

export default Message;
