import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Journal from "./components/Journal";
import Chatbox from "./components/Chatbox";
import Personality from "./components/Personality";
import Recommendations from "./components/Recommendations";
import Memories from "./components/Memories";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/chat" element={<Chatbox />} />
        <Route path="/personality" element={<Personality />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/memories" element={<Memories />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;