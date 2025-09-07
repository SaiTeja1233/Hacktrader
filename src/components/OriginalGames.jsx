import React, { useState } from "react";
import NavBar from "./NavBar";
import "../originalGames.css";

const OriginalGames = () => {
    const [bombHistory, setBombHistory] = useState([]);
    const [selectedBoxes, setSelectedBoxes] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [resultMessage, setResultMessage] = useState(
        "Add 5 trades to get a prediction."
    );
    const [showBlastWarning, setShowBlastWarning] = useState(false);

    const checkBlastWarning = (history) => {
        if (history.length >= 3) {
            const lastThree = history.slice(0, 3);
            const counts = {};
            lastThree.forEach((box) => {
                counts[box] = (counts[box] || 0) + 1;
            });

            for (const box in counts) {
                if (counts[box] >= 2) {
                    setShowBlastWarning(true);
                    return;
                }
            }
        }
        setShowBlastWarning(false);
    };

    const handleCheckboxChange = (event) => {
        const boxNumber = parseInt(event.target.value);

        const newHistory = [boxNumber, ...bombHistory].slice(0, 5);
        setBombHistory(newHistory);
        setSelectedBoxes([boxNumber]);

        setResultMessage(`You selected Box ${boxNumber}.`);

        checkBlastWarning(newHistory);

        if (newHistory.length === 5) {
            predictNextBomb(newHistory);
        } else {
            setPrediction(null);
            setResultMessage(
                `Add ${5 - newHistory.length} more trades to get a prediction.`
            );
        }
    };

    const undoLastAction = () => {
        if (bombHistory.length > 0) {
            const newHistory = bombHistory.slice(1);
            setBombHistory(newHistory);
            setSelectedBoxes([]);
            setPrediction(null);
            checkBlastWarning(newHistory);
            setResultMessage("Last entry has been undone.");
            if (newHistory.length < 5) {
                setResultMessage(
                    `Add ${
                        5 - newHistory.length
                    } more trades to get a prediction.`
                );
            } else {
                predictNextBomb(newHistory);
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
        setShowBlastWarning(false);
    };

    const predictNextBomb = (currentHistory) => {
        const counts = {};
        for (let i = 1; i <= 5; i++) {
            counts[i] = 0;
        }
        currentHistory.forEach((bombLocation) => {
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

        let finalPrediction = null;
        if (safestBoxes.length === 1) {
            finalPrediction = safestBoxes[0];
        } else {
            // Find a new prediction that isn't the previous one
            const otherSafestBoxes = safestBoxes.filter(
                (box) => box !== prediction
            );
            if (otherSafestBoxes.length > 0) {
                finalPrediction = otherSafestBoxes[0];
            } else {
                finalPrediction = safestBoxes[0];
            }
        }

        if (finalPrediction) {
            setPrediction(finalPrediction);
            setResultMessage(
                `Prediction: The safest box is likely Box ${finalPrediction}.`
            );
        } else {
            setPrediction(null);
            setResultMessage("Prediction failed: No clear safest box found.");
        }
    };

    return (
        <>
            <NavBar title="ORIGINAL GAMES" />
            <div className="game-container">
                {showBlastWarning && (
                    <div className="blast-warning-popup">
                        <p>⚠ Better cash out! High chance of a blast!</p>
                    </div>
                )}
                <div className="section-card">
                    <h2>Previous Bomb Locations (Last 5)</h2>
                    <ul className="history-list">
                        {bombHistory.length > 0 ? (
                            bombHistory.map((bomb, index) => (
                                <li key={index}>
                                    Trade #{bombHistory.length - index}: Box{" "}
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
