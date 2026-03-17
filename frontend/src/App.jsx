import { Routes, Route } from "react-router-dom";
import { UserProvider } from './context/UserContext'; // Make sure this path is correct

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Upload from "./pages/Upload/Upload";
import Results from "./pages/Results/Results";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />

        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />
      </Routes>
    </UserProvider>
  );
}

export default App;