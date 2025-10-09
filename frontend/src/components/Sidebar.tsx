import React from 'react';
import { FiGrid, FiEdit, FiSearch, FiImage, FiMaximize, FiUser } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar sidebar--collapsed">
      <div className="sidebar__top">
        <div className="sidebar__item">
          <FiGrid />
        </div>
        <div className="sidebar__item">
          <FiEdit />
        </div>
        <div className="sidebar__item">
          <FiSearch />
        </div>
        <div className="sidebar__item">
          <FiImage />
        </div>
      </div>
      <div className="sidebar__bottom">
        <div className="sidebar__item">
          <FiMaximize />
        </div>
        <div className="sidebar__item sidebar__item--profile">
          <FiUser />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;