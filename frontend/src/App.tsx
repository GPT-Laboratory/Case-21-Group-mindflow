import { BrowserRouter, Routes, Route } from "react-router-dom";
import AgenticContentFlow from "./AgenticContentFlow";
import DocumentManager from "./components/DocumentManager";
import FlowSettings from "./components/FlowSettings";
import Homepage from "./components/Homepage";
import HomeLanding from "./components/HomeLanding";
import Navbar from "./components/Navbar";
import { NotificationProvider } from "./AgenticContentFlow/Notifications";
import { CourseDataProvider } from './hooks/CourseDataContext';

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <CourseDataProvider>
          <div className="flex flex-col w-[100vw] h-[100vh] bg-background text-foreground overflow-hidden">
            <Navbar />
            <div className="flex-1 overflow-hidden relative">
              <Routes>
                <Route path="/" element={<HomeLanding />} />
                <Route path="/flows" element={<Homepage />} />
                <Route path="/flows/new" element={<AgenticContentFlow />} />
                <Route path="/flows/:flowId" element={<AgenticContentFlow />} />
                <Route path="/flows/:flowId/settings" element={<FlowSettings />} />
                <Route path="/documents" element={<DocumentManager />} />
              </Routes>
            </div>
          </div>
        </CourseDataProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
