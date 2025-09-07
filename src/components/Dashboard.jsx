import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
    return (
        <div className="dashboard-container">
            <h1>Welcome Traders!</h1>
            <h2>Choose a Game to Start</h2>
            <div className="dashboard-buttons">
                <Link to="/wingo-trader" className="dashboard-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16H9v-2h2v2zm3.07-7.65l-2.09 2.09c-1.46 1.46-3.79 1.46-5.25 0-.4-.4-.4-1.04 0-1.44s1.04-.4 1.44 0c.78.78 2.05.78 2.83 0l2.09-2.09c.78-.78 2.05-.78 2.83 0 .4.4.4 1.04 0 1.44s-1.04.4-1.44 0zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-1 2h2v2h-2V6zm4 0h2v2h-2V6zm-8 0h2v2H7V6z" />
                    </svg>
                    <span>WIN-GO TRADER</span>
                </Link>
                <Link to="/original-games" className="dashboard-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-12h4c1.1 0 2 .9 2 2v2h-2v-2h-4v2H8v-2c0-1.1.9-2 2-2zm-2 6h8v2H8v-2z" />
                    </svg>
                    <span>ORIGINAL GAMES</span>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
