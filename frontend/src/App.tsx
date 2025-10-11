import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import Header from './components/Header'; // Import Header
import './App.css';

function App() {
  return (
    <div className="app-root-layout"> {/* New wrapper div */}
      <Header /> {/* Render Header here */}
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <ChatPage />
        </main>
      </div>
    </div>
  );
}

export default App;