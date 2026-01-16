import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import AppRouter from "./Routerfile/Router";
import Example from "./pages/main/example";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <div>
        <ToastContainer position="top-right" />

        <AppRouter />
        {/* <BrowserRouter>
    <Example/>
     </BrowserRouter> */}
      </div>
    </>
  );
}

export default App;
