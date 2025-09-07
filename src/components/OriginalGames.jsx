import React, { useState } from "react";
import NavBar from "./NavBar";
import "./originalGames.css";

const OriginalGames = () => {
    const [bombHistory, setBombHistory] = useState([]);
    const [selectedBoxes, setSelectedBoxes] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [resultMessage, setResultMessage] = useState(
        "Add 2 trades to get a prediction."
    );
    const [showCongratsPopup, setShowCongratsPopup] = useState(false);
    const [consecutiveWins, setConsecutiveWins] = useState(0);

    const checkCongratsPopup = (wins) => {
        if (wins >= 10) {
            setShowCongratsPopup(true);
        } else {
            setShowCongratsPopup(false);
        }
    };

    const handleCheckboxChange = (event) => {
        const boxNumber = parseInt(event.target.value);

        let newConsecutiveWins = consecutiveWins;
        if (prediction !== null) {
            if (boxNumber !== prediction) {
                newConsecutiveWins += 1;
            } else {
                newConsecutiveWins = 0;
            }
        }
        setConsecutiveWins(newConsecutiveWins);
        checkCongratsPopup(newConsecutiveWins);

        const newHistory = [boxNumber, ...bombHistory];
        setBombHistory(newHistory);
        setSelectedBoxes([boxNumber]);

        setResultMessage(`You selected Box ${boxNumber}.`);

        if (newHistory.length >= 2) {
            predictNextBomb(newHistory);
        } else {
            setPrediction(null);
            setResultMessage(
                `Add ${2 - newHistory.length} more trades to get a prediction.`
            );
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
            if (newHistory.length >= 2) {
                predictNextBomb(newHistory);
            } else {
                setResultMessage(
                    `Add ${
                        2 - newHistory.length
                    } more trades to get a prediction.`
                );
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

    const predictNextBomb = (currentHistory) => {
        // Look at the last 2 trades first
        const history2 = currentHistory.slice(0, 2);
        const prediction2 = getSafestBox(history2);

        if (prediction2.length === 1) {
            setPrediction(prediction2[0]);
            setResultMessage(
                `Prediction: The safest box is likely Box ${prediction2[0]}.`
            );
            return;
        }

        // If no single safest box after 2 trades, check last 3 trades
        if (currentHistory.length >= 3) {
            const history3 = currentHistory.slice(0, 3);
            const prediction3 = getSafestBox(history3);

            if (prediction3.length > 0) {
                const finalPrediction =
                    prediction3[Math.floor(Math.random() * prediction3.length)];
                setPrediction(finalPrediction);
                setResultMessage(
                    `Prediction: The safest box is likely Box ${finalPrediction}.`
                );
                return;
            }
        }

        setPrediction(null);
        setResultMessage("No clear safest box found. Add another trade.");
    };

    const getSafestBox = (history) => {
        const counts = {};
        for (let i = 1; i <= 5; i++) {
            counts[i] = 0;
        }
        history.forEach((bombLocation) => {
            counts[bombLocation] = (counts[bombLocation] || 0) + 1;
        });

        let minCount = Infinity;
        let safestBoxes = [];

        for (const box in counts) {
            const count = counts[box];
            if (count < minCount) {
                minCount = count;
                safestBoxes = [parseInt(box)];
            } else if (count === minCount) {
                safestBoxes.push(parseInt(box));
            }
        }
        return safestBoxes;
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
            </div>
        </>
    );
};

export default OriginalGames;
