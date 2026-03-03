import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { StatusBar } from './components/StatusBar';

function App() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white text-slate-800">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <StatusBar />
    </div>
  );
}

export default App;
