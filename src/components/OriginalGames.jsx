import React, { useState } from "react";
import NavBar from "./NavBar";
import "./originalGames.css";

const OriginalGames = () => {
    const [bombHistory, setBombHistory] = useState([]);
    const [selectedBoxes, setSelectedBoxes] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [resultMessage, setResultMessage] = useState(
        "Add 1 trade to get a prediction."
    );
    const [showCongratsPopup, setShowCongratsPopup] = useState(false);
    const [consecutiveWins, setConsecutiveWins] = useState(0);

    // Helper function to generate a purely random integer from 1 to 5
    const getRandomInt = () => {
        return Math.floor(Math.random() * 5) + 1;
    };

    // Logic for a "Super Pure Random" prediction after a loss
    const getSuperPureRandomPrediction = (lastLostBox) => {
        let newPrediction;
        do {
            newPrediction = getRandomInt();
        } while (newPrediction === lastLostBox); // Ensure it doesn't repeat the box that caused the loss
        return newPrediction;
    };

    // The main prediction function
    const predictNextBomb = () => {
        const randomPrediction = getRandomInt();
        setPrediction(randomPrediction);
        setResultMessage(
            `Pure Random Prediction: The next bomb could be in Box ${randomPrediction}.`
        );
    };

    const checkCongratsPopup = (wins) => {
        if (wins >= 10) {
            setShowCongratsPopup(true);
        } else {
            setShowCongratsPopup(false);
        }
    };

    const handleCheckboxChange = (event) => {
        const boxNumber = parseInt(event.target.value);
        setSelectedBoxes([boxNumber]);

        // Check for a loss first
        if (prediction !== null && boxNumber === prediction) {
            setResultMessage(
                "LOSS! Switching to a Super Pure Random prediction."
            );
            const newPrediction = getSuperPureRandomPrediction(boxNumber);
            setPrediction(newPrediction);
            setConsecutiveWins(0);
            setShowCongratsPopup(false);
        } else {
            // You won or it's the first trade
            const newConsecutiveWins =
                prediction !== null ? consecutiveWins + 1 : 0;
            setConsecutiveWins(newConsecutiveWins);
            checkCongratsPopup(newConsecutiveWins);
            setResultMessage(`You selected Box ${boxNumber}.`);

            // Update history and generate next random prediction
            const newHistory = [boxNumber, ...bombHistory].slice(0, 10);
            setBombHistory(newHistory);
            predictNextBomb();
        }
    };

    const undoLastAction = () => {
        if (bombHistory.length > 0) {
            const newHistory = bombHistory.slice(1);
            setBombHistory(newHistory);
            setSelectedBoxes([]);
            setPrediction(null);
            setConsecutiveWins(0);
            setShowCongratsPopup(false);
            setResultMessage("Last entry has been undone.");
            if (newHistory.length > 0) {
                predictNextBomb();
            } else {
                setResultMessage("Add 1 trade to get a prediction.");
            }
        } else {
            setResultMessage("No history to undo.");
        }
    };

    const resetAll = () => {
        setBombHistory([]);
        setSelectedBoxes([]);
        setPrediction(null);
        setResultMessage("All data has been reset.");
        setShowCongratsPopup(false);
        setConsecutiveWins(0);
    };

    return (
        <>
            <NavBar title="ORIGINAL GAMES" />
            <div className="game-container">
                {showCongratsPopup && (
                    <div className="blast-warning-popup">
                        <p>🎉 Congratulations! You've won 10 games in a row!</p>
                    </div>
                )}

                {/* Prediction Section (Now at the top) */}
                <div className="section-card">
                    <div className="game-result">
                        {resultMessage && <p>{resultMessage}</p>}
                        {prediction && (
                            <div className="prediction-box">
                                <p>Safest Box to Bet On:</p>
                                <span className="predicted-location">
                                    Box {prediction}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Select Bomb Location Section (Middle) */}
                <div className="section-card">
                    <h2>Select Last Bomb Location</h2>
                    <p>
                        Click on the box where the bomb was found in the last
                        trade.
                    </p>
                    <div className="checkbox-group">
                        {[1, 2, 3, 4, 5].map((box) => (
                            <label key={box}>
                                <input
                                    type="checkbox"
                                    value={box}
                                    checked={selectedBoxes.includes(box)}
                                    onChange={handleCheckboxChange}
                                />
                                <span className="box-label">{box}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* History Section (Now at the bottom) */}
                <div className="section-card">
                    <h2>Previous Bomb Locations</h2>
                    <ul className="history-list">
                        {bombHistory.length > 0 ? (
                            bombHistory.map((bomb, index) => (
                                <li key={index}>
                                    Trade #{bombHistory.length - index}: Box
                                    <span className="bomb-location">
                                        {bomb}
                                    </span>
                                </li>
                            ))
                        ) : (
                            <p className="empty-history">
                                No history added yet.
                            </p>
                        )}
                    </ul>

                    <div className="history-controls">
                        <button
                            className="game-button undo-button"
                            onClick={undoLastAction}
                        >
                            Undo Last
                        </button>

                        <button
                            className="game-button reset-button"
                            onClick={resetAll}
                        >
                            Reset All
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OriginalGames;
