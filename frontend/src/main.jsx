import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Welcome from "./components/Welcome.jsx";
import Project from "./components/Project.jsx";
import Skill from "./components/Skill.jsx";
import Experience from "./components/Experience.jsx";
import Contact from "./components/Contact.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter basename="/Portfolio">
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Welcome />} />
        <Route path="project" element={<Project />} />
        <Route path="skill" element={<Skill />} />
        <Route path="experience" element={<Experience />} />
        <Route path="contact" element={<Contact />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
