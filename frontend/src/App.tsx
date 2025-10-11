import Sidebar from './components/Sidebar';
import Header from './components/Header'; // Import Header
import MainContentRouter from './components/MainContentRouter'; // Import the new router component
import './App.css';

function App() {
  return (
    <div className="app-root-layout"> {/* New wrapper div */}
      <Header /> {/* Render Header here */}
      <Sidebar />
      <main className="main-content">
        <MainContentRouter /> {/* Render the new router component here */}
      </main>
    </div>
  );
}

export default App;