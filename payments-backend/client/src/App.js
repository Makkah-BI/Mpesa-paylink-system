import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import PaymentPage from "./pages/PaymentPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pay/:linkId" element={<PaymentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
