import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Upload from "./pages/Upload/Upload";
import Results from "./pages/Results/Results";

function App() {

  return (

    <Routes>

      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/upload" element={<Upload />} />

      <Route path="/results" element={<Results />} />

    </Routes>

  );

}

export default App;