import { BrowserRouter, Routes, Route } from "react-router-dom";
import AgenticContentFlow from "./AgenticContentFlow";
import DocumentManager from "./components/DocumentManager";
import Navbar from "./components/Navbar";
import { NotificationProvider } from "./AgenticContentFlow/Notifications";

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <div className="flex flex-col w-[100vw] h-[100vh] bg-background text-foreground overflow-hidden">
          <Navbar />
          <div className="flex-1 overflow-hidden relative">
            <Routes>
              <Route path="/" element={<AgenticContentFlow />} />
              <Route path="/documents" element={<DocumentManager />} />
            </Routes>
          </div>
        </div>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
