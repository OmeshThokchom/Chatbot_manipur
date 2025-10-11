import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import Header from './components/Header'; // Import Header
import './App.css';

function App() {
  return (
    <div className="app-root-layout"> {/* New wrapper div */}
      <Header /> {/* Render Header here */}
      <Sidebar />
      <main className="main-content">
        <ChatPage />
      </main>
    </div>
  );
}

export default App;