import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Contact from "./pages/Contact";
import "./styles/global.css";
import "./styles/app.css";
import Prediction from "./pages/Prediction";

const PAGE_STORAGE_KEY = "tradetrack-current-page";

const PAGES = {
  home: "home",
  prediction: "prediction",
  stocks: "stocks",
  contact: "contact",
  
};

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = window.localStorage.getItem(PAGE_STORAGE_KEY);
    return Object.values(PAGES).includes(savedPage) ? savedPage : PAGES.home;
  });

  useEffect(() => {
    window.localStorage.setItem(PAGE_STORAGE_KEY, currentPage);
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      
      case PAGES.prediction:
        return <Prediction />;
        case PAGES.stocks:
        return <Stocks />;
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