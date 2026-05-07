import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import HufCamApp from "./pages/HufCamApp";
import { Legal } from "./pages/Legal";
import { UpdatePrompt } from "./components/UpdatePrompt";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<HufCamApp />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <UpdatePrompt />
    </BrowserRouter>
  );
}
