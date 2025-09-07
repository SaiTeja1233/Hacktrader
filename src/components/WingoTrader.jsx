import React, { useState, useEffect } from "react";
import NavBar from "./NavBar";
import "./wingoTrader.css";
// Helper function to get color and size
const getCategory = (num) => {
    let colorText, numColorClass;
    if (num === 0 || num === 5) {
        colorText = "Purple";
        numColorClass = "purple-text";
    } else if (num % 2 === 0) {
        colorText = "Red";
        numColorClass = "red-text";
    } else {
        colorText = "Green";
        numColorClass = "green-text";
    }
    const sizeText = num <= 4 ? "SMALL" : "BIG";
    return { colorText, numColorClass, sizeText };
};

// --- Prediction Logic Functions ---
const getNextPattern = (seq) => {
    for (let i = 3; i <= 6; i++) {
        const lastPattern = seq.slice(0, i).join("");
        for (let j = 1; j < seq.length - i; j++) {
            const comparePattern = seq.slice(j, j + i).join("");
            if (comparePattern === lastPattern && seq[j + i]) {
                return seq[j + i];
            }
        }
    }
    return null;
};

const getWeightedMajority = (arr) => {
    if (arr.length === 0) return null;
    const weightedCounts = {};
    arr.forEach((item, index) => {
        const weight = 10 - index;
        weightedCounts[item] = (weightedCounts[item] || 0) + weight;
    });

    const sorted = Object.entries(weightedCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
};

const WingoTrader = () => {
    const [numbers, setNumbers] = useState([]);
    const [periodInput, setPeriodInput] = useState("");
    const [numInput, setNumInput] = useState("");
    const [result, setResult] = useState("");
    const [prediction, setPrediction] = useState(null);
    const [logicUsed, setLogicUsed] = useState("");

    useEffect(() => {
        const periodEl = document.getElementById("periodInput");
        if (periodEl) {
            periodEl.style.display =
                numbers.length === 0 ? "inline-block" : "none";
        }
    }, [numbers]);

    const handleNumInput = (e) => {
        let cleaned = e.target.value.replace(/\D/g, "");
        setNumInput(cleaned.split("").join(" "));
    };

    const addNumbers = () => {
        const values = numInput.trim().split(/\s+/).map(Number);
        const valid = values.filter((n) => !isNaN(n) && n >= 0 && n <= 9);

        if (numInput.trim() === "" || valid.length === 0) {
            alert("Please enter a number.");
            return;
        }

        let startPeriod;
        if (numbers.length === 0) {
            const enteredPeriod = parseInt(periodInput);
            if (isNaN(enteredPeriod) || enteredPeriod <= 0) {
                alert("Please enter a valid starting period number.");
                return;
            }
            startPeriod = enteredPeriod;
        } else {
            startPeriod = numbers[0].periodNumber + 1;
        }

        const newEntries = valid.map((num, i) => ({
            value: num,
            periodNumber: startPeriod + i,
        }));

        const updatedNumbers = [...newEntries, ...numbers].slice(0, 20);
        setNumbers(updatedNumbers);
        setNumInput("");
        setPrediction(null);
        setResult("");
    };

    const editNumber = (periodNumber) => {
        const entry = numbers.find((e) => e.periodNumber === periodNumber);
        if (!entry) return;

        const newValue = prompt("Enter new number (0–9):", entry.value);
        const n = parseInt(newValue);
        if (!isNaN(n) && n >= 0 && n <= 9) {
            const updatedNumbers = numbers.map((item) =>
                item.periodNumber === periodNumber
                    ? { ...item, value: n }
                    : item
            );
            setNumbers(updatedNumbers);
            setPrediction(null);
            setResult("");
        } else {
            alert("Invalid number.");
        }
    };

    const smartPredict = () => {
        if (numbers.length < 20) {
            setResult("Enter at least 20 numbers to get a prediction.");
            setPrediction(null);
            return;
        }

        setResult("Analyzing...");
        setPrediction(null);
        setLogicUsed("");

        setTimeout(() => {
            const recentEntries = numbers.slice(0, 10);
            const values = recentEntries.map((e) => e.value);

            const colors = values.map((n) => {
                if (n === 0 || n === 5) return "P";
                return n % 2 === 0 ? "R" : "G";
            });

            const sizes = values.map((n) => (n <= 4 ? "S" : "B"));

            let currentPrediction = null;
            let currentLogicUsed = "";

            // Step 1: Sequence Logic
            currentPrediction = getNextPattern(colors) || getNextPattern(sizes);
            if (currentPrediction) {
                currentLogicUsed = "Sequence Logic";
            }

            // Step 2: Weighted Majority
            if (!currentPrediction) {
                const dominantColor = getWeightedMajority(colors);
                const dominantSize = getWeightedMajority(sizes);
                currentPrediction = dominantColor;
                currentLogicUsed = "Weighted Majority Logic (Color)";
                if (!currentPrediction) {
                    currentPrediction = dominantSize;
                    currentLogicUsed = "Weighted Majority Logic (Size)";
                }
            }

            // Step 3: Alternate Logic
            if (!currentPrediction && colors.length > 1) {
                currentPrediction = colors[1];
                currentLogicUsed = "Alternate Logic";
            }

            setPrediction(currentPrediction);
            setLogicUsed(currentLogicUsed);
            setResult(
                currentPrediction
                    ? `Result: ${
                          getCategory(currentPrediction).colorText ||
                          getCategory(currentPrediction).sizeText
                      }`
                    : "No clear prediction found."
            );
        }, 1000);
    };

    const copyPrediction = () => {
        if (!prediction) return;
        const nextPeriod = numbers.length > 0 ? numbers[0].periodNumber + 1 : 1;
        const { colorText, sizeText } = getCategory(prediction);
        const predictionValue = colorText || sizeText;

        const formattedText = `╭⚬──────────────⚬╮\n│ ....⭐ 1 MinWinGo ⭐....\n│⚬───────────────⚬\n│🎯WINGO : 1MinWinGo\n│⏳PERIOD : ${nextPeriod}\n│🔮PREDICTION : ${predictionValue}\n╰⚬──────────────⚬╯`;

        navigator.clipboard
            .writeText(formattedText)
            .then(() => {
                alert("Prediction copied to clipboard!");
            })
            .catch((err) => {
                console.error("Failed to copy text: ", err);
                alert(
                    "Failed to copy. Your browser may not support this feature or permission was denied."
                );
            });
    };

    return (
        <>
            <NavBar title="WIN-GO TRADER" />
            <h2>Enter Numbers (Auto Spaced)</h2>
            <div id="input-group">
                {numbers.length === 0 && (
                    <input
                        type="number"
                        id="periodInput"
                        placeholder="Enter starting period"
                        value={periodInput}
                        onChange={(e) => setPeriodInput(e.target.value)}
                    />
                )}
                <input
                    type="text"
                    id="numInput"
                    placeholder={
                        numbers.length === 0
                            ? "e.g. 2378"
                            : "Next Period:Result num"
                    }
                    value={numInput}
                    onChange={handleNumInput}
                    onKeyPress={(e) => e.key === "Enter" && addNumbers()}
                    maxLength="39"
                />
                <button className="add-btn" onClick={addNumbers}>
                    Add
                </button>
            </div>

            <div id="controls">
                <button className="predict-btn" onClick={smartPredict}>
                    Smart Predict
                </button>
                <div
                    id="result"
                    className={result.includes("Analyzing") ? "loading" : ""}
                >
                    {result}
                </div>
            </div>

            {prediction && (
                <div id="prediction-box-container">
                    <div className="prediction-container">
                        <div id="prediction-box">
                            {/* This is the new line of code that uses logicUsed */}
                            <p className="logic-used">
                                Logic Used: {logicUsed}
                            </p>
                            <div className="result-line">
                                🎯 WIN-GO : 1 Min WinGo
                            </div>
                            <div className="result-line">
                                ⏳ PERIOD :{" "}
                                <span id="predicted-period">
                                    {numbers.length > 0
                                        ? numbers[0].periodNumber + 1
                                        : 1}
                                </span>
                            </div>
                            <div className="result-line">
                                🔮 PREDICTION :{" "}
                                <span id="predicted-value">
                                    {getCategory(prediction).colorText ||
                                        getCategory(prediction).sizeText}
                                </span>
                            </div>
                        </div>
                        <div className="copy-btn-container">
                            <div>
                                <button
                                    id="copyLinkBtn"
                                    className="copy-btn"
                                    onClick={copyPrediction}
                                >
                                    <span>
                                        <svg
                                            width="20"
                                            height="20"
                                            fill="#00ff99"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 467 512.22"
                                        >
                                            <path
                                                fillRule="nonzero"
                                                d="M131.07 372.11c.37 1 .57 2.08.57 3.2 0 1.13-.2 2.21-.57 3.21v75.91c0 10.74 4.41 20.53 11.5 27.62s16.87 11.49 27.62 11.49h239.02c10.75 0 20.53-4.4 27.62-11.49s11.49-16.88 11.49-27.62V152.42c0-10.55-4.21-20.15-11.02-27.18l-.47-.43c-7.09-7.09-16.87-11.5-27.62-11.5H170.19c-10.75 0-20.53 4.41-27.62 11.5s-11.5 16.87-11.5 27.61v219.69zm-18.67 12.54H57.23c-15.82 0-30.1-6.58-40.45-17.11C6.41 356.97 0 342.4 0 326.52V57.79c0-15.86 6.5-30.3 16.97-40.78l.04-.04C27.51 6.49 41.94 0 57.79 0h243.63c15.87 0 30.3 6.51 40.77 16.98l.03.03c10.48 10.48 16.99 24.93 16.99 40.78v36.85h50c15.9 0 30.36 6.5 40.82 16.96l.54.58c10.15 10.44 16.43 24.66 16.43 40.24v302.01c0 15.9-6.5 30.36-16.96 40.82-10.47 10.47-24.93 16.97-40.83 16.97H170.19c-15.9 0-30.35-6.5-40.82-16.97-10.47-10.46-16.97-24.92-16.97-40.82v-69.78zM340.54 94.64V57.79c0-10.74-4.41-20.53-11.5-27.63-7.09-7.08-16.86-11.48-27.62-11.48H57.79c-10.78 0-20.56 4.38-27.62 11.45l-.04.04c-7.06 7.06-11.45 16.84-11.45 27.62v268.73c0 10.86 4.34 20.79 11.38 27.97 6.95 7.07 16.54 11.49 27.17 11.49h55.17V152.42c0-15.9 6.5-30.35 16.97-40.82 10.47-10.47 24.92-16.96 40.82-16.96h170.35z"
                                            ></path>
                                        </svg>
                                        Copy
                                    </span>
                                    <span>Copied!!</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>Number</th>
                            <th>Color</th>
                            <th>Size</th>
                        </tr>
                    </thead>
                    <tbody>
                        {numbers.map((entry) => {
                            const { colorText, numColorClass, sizeText } =
                                getCategory(entry.value);
                            return (
                                <tr key={entry.periodNumber}>
                                    <td>{entry.periodNumber}</td>
                                    <td
                                        className={numColorClass}
                                        onClick={() =>
                                            editNumber(entry.periodNumber)
                                        }
                                    >
                                        {entry.value}
                                    </td>
                                    <td>
                                        <span
                                            className={colorText.toLowerCase()}
                                        >
                                            {colorText}
                                        </span>
                                    </td>
                                    <td>{sizeText}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default WingoTrader;
