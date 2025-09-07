import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import WingoTrader from "./components/WingoTrader";
import OriginalGames from "./components/OriginalGames";
import "./styles.css";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/wingo-trader" element={<WingoTrader />} />
                <Route path="/original-games" element={<OriginalGames />} />
            </Routes>
        </Router>
    );
};

export default App;
