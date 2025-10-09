import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <ChatPage />
      </main>
    </div>
  );
}

export default App;