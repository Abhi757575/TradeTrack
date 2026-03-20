import { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Prediction from "./pages/Prediction";
import Contact from "./pages/Contact";
import "./styles/global.css";
import "./styles/app.css";

const PAGES = {
  home: "home",
  predictor: "predictor",
  contact: "contact",
};

function App() {
  const [currentPage, setCurrentPage] = useState(PAGES.home);

  const renderPage = () => {
    switch (currentPage) {
      case PAGES.predictor:
        return <Prediction />;
      case PAGES.contact:
        return <Contact />;
      case PAGES.home:
      default:
        return <Landing onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="app-shell">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="app-content">{renderPage()}</main>
      <Footer />
    </div>
  );
}

export default App;
