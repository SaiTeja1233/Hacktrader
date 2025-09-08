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

        const newHistory = [boxNumber, ...bombHistory].slice(0, 10);
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

        // Deterministic Tie-Breaker: choose the one that appeared earliest in the history.
        if (safestBoxes.length > 1) {
            const oldestSafestBox = history.find((item) =>
                safestBoxes.includes(item)
            );
            return [oldestSafestBox];
        }

        return safestBoxes;
    };

    const predictNextBomb = (currentHistory) => {
        // 1. Check for Alternating Pattern (highest priority)
        if (currentHistory.length >= 4) {
            const history4 = currentHistory.slice(0, 4);
            if (
                history4[0] === history4[2] &&
                history4[1] === history4[3] &&
                history4[0] !== history4[1]
            ) {
                const alternatingPrediction = history4[0];
                setPrediction(alternatingPrediction);
                setResultMessage(
                    `Super Prediction: The alternating pattern suggests Box ${alternatingPrediction}.`
                );
                return;
            }
        }

        // 2. Check for Skip Pattern
        if (currentHistory.length >= 3) {
            const history3 = currentHistory.slice(0, 3);
            const diff1 = history3[0] - history3[1];
            const diff2 = history3[1] - history3[2];
            if (diff1 === diff2 && Math.abs(diff1) > 0) {
                const skipPrediction = history3[0] + diff1;
                if (skipPrediction >= 1 && skipPrediction <= 5) {
                    setPrediction(skipPrediction);
                    setResultMessage(
                        `Super Prediction: The skip pattern suggests Box ${skipPrediction}.`
                    );
                    return;
                }
            }
        }

        // 3. Fallback to Frequency Bias (safest bet)
        if (currentHistory.length >= 2) {
            const safestBoxes = getSafestBox(currentHistory);
            if (safestBoxes.length === 1) {
                setPrediction(safestBoxes[0]);
                setResultMessage(
                    `Super Prediction: The safest box is likely Box ${safestBoxes[0]}.`
                );
                return;
            } else if (safestBoxes.length > 0) {
                // In this case, getSafestBox should always return a single value due to the tie-breaker logic.
                const finalPrediction = safestBoxes[0];
                setPrediction(finalPrediction);
                setResultMessage(
                    `Super Prediction: The safest boxes are ${safestBoxes.join(
                        ", "
                    )}. We've deterministically chosen Box ${finalPrediction}.`
                );
                return;
            }
        }

        // Default case if no pattern is found
        setPrediction(null);
        setResultMessage("No clear pattern found. Add more trades.");
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
