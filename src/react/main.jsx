import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// React-specific CSS: lw-* design system + Tailwind utilities layer
import "./styles/global.css";
import App from "./App.jsx";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);