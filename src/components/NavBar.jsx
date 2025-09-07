import React from "react";
import { useNavigate } from "react-router-dom";

const NavBar = ({ title }) => {
    const navigate = useNavigate();

    return (
        <nav className="navbar">
            <button
                onClick={() => navigate("/")}
                className="navbar-back-button"
            >
                ←
            </button>
            <h1 className="navbar-title">{title}</h1>
        </nav>
    );
};

export default NavBar;
