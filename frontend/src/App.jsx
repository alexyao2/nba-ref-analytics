import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import HomePage from "./components/HomePage.jsx";
import DashboardPage from "./components/DashboardPage.jsx";
import ConclusionsPage from "./components/ConclusionsPage.jsx";

const hashToPage = {
  "#intro": "intro",
  "#data": "data",
  "#future": "future",
  "#conclusions": "future"
};

const pageToHash = {
  intro: "intro",
  data: "data",
  future: "future"
};

function initialPage() {
  return hashToPage[window.location.hash] || "intro";
}

export default function App() {
  const [page, setPageState] = useState(initialPage);

  const setPage = (nextPage) => {
    setPageState(nextPage);
    window.history.replaceState(null, "", `#${pageToHash[nextPage]}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const onHashChange = () => setPageState(initialPage());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <>
      <Header currentPage={page} onNavigate={setPage} />
      <main>
        {page === "intro" && <HomePage onNavigate={setPage} />}
        {page === "data" && <DashboardPage />}
        {page === "future" && <ConclusionsPage />}
      </main>
    </>
  );
}
