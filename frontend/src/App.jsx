import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Landing from "./components/Landing";
import Prediction from "./components/Prediction";
import Contact from "./components/Contact";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const savedUser = localStorage.getItem("pulseai_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user:", e);
      }
    }
  }, []);

  const handleNavigate = (pageId) => {
    setCurrentPage(pageId);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("pulseai_user");
    localStorage.removeItem("access_token");
    setCurrentPage("home");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Landing onNavigate={handleNavigate} />;
      case "predictor":
        return <Prediction />;
      case "contact":
        return <Contact />;
      default:
        return <Landing onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />
      <main className="app-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
