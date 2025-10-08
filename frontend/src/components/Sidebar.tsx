import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <div className="chat-sidebar">
      <button className="chat-sidebar__new-chat-button">
        <i className="fas fa-plus"></i> New Chat
      </button>
      <div className="chat-sidebar__history">
        {/* Chat history items will go here */}
      </div>
      <div className="chat-sidebar__footer">
        <button className="chat-sidebar__footer-button">
          <i className="fas fa-user-circle"></i> User Name
        </button>
        <button className="chat-sidebar__footer-button">
          <i className="fas fa-cog"></i> Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
