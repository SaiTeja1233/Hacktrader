import React, { useState, useEffect, useRef } from "react";
import NavBar from "./NavBar";
import "./wingoTrader.css";

// Helper function to categorize the numbers (color and size)
const getCategory = (num) => {
    let colorText, numColorClass, numberStyle, colorStyle;

    if (num === 0) {
        colorText = "Red";
        numColorClass = "linear-gradient-text";
        numberStyle = {
            background: "linear-gradient(to right, red, purple)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        };
        colorStyle = {
            background: "linear-gradient(to right, red, purple)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        };
    } else if (num === 5) {
        colorText = "Green";
        numColorClass = "linear-gradient-text";
        numberStyle = {
            background: "linear-gradient(to right, green, purple)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        };
        colorStyle = {
            background: "linear-gradient(to right, green, purple)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        };
    } else if (num % 2 === 0) {
        colorText = "Red";
        numColorClass = "red-text";
        numberStyle = {};
        colorStyle = { color: "red" };
    } else {
        colorText = "Green";
        numColorClass = "green-text";
        numberStyle = {};
        colorStyle = { color: "green" };
    }

    const sizeText = num <= 4 ? "SMALL" : "BIG";
    const sizeStyle = num <= 4 ? { color: "orange" } : { color: "#ADD8E6" };

    return {
        colorText,
        numColorClass,
        sizeText,
        numberStyle,
        colorStyle,
        sizeStyle,
    };
};

// --- PREDICTION LOGIC (No changes needed here) ---
const findWinningLogic = (historicalSeq) => {
    if (historicalSeq.length < 4) return null;
    const strategies = [
        {
            name: "Consecutive (4 in a row)",
            confidence: 10,
            func: (seq) => {
                const latestFour = seq.slice(0, 4);
                return latestFour.every((val) => val === latestFour[0])
                    ? latestFour[0]
                    : null;
            },
        },
        {
            name: "Alternating (A,B,A,B) -> A",
            confidence: 9,
            func: (seq) => {
                const latestFour = seq.slice(0, 4);
                return latestFour[0] !== latestFour[1] &&
                    latestFour[0] === latestFour[2] &&
                    latestFour[1] === latestFour[3]
                    ? latestFour[0]
                    : null;
            },
        },
        {
            name: "Alternating (A,B,A) -> B",
            confidence: 8,
            func: (seq) => {
                const latestThree = seq.slice(0, 3);
                return latestThree[0] !== latestThree[1] &&
                    latestThree[0] === latestThree[2]
                    ? latestThree[1]
                    : null;
            },
        },
        {
            name: "Block Reversal (A,A,B,B) -> A",
            confidence: 7,
            func: (seq) => {
                const latestFour = seq.slice(0, 4);
                return latestFour[0] === latestFour[1] &&
                    latestFour[2] === latestFour[3] &&
                    latestFour[0] !== latestFour[2]
                    ? latestFour[0]
                    : null;
            },
        },
        {
            name: "Consecutive (2 in a row)",
            confidence: 5,
            func: (seq) => {
                const latestTwo = seq.slice(0, 2);
                return latestTwo[0] === latestTwo[1] ? latestTwo[0] : null;
            },
        },
        {
            name: "Simple Alternating (A,B) -> A",
            confidence: 4,
            func: (seq) => {
                const latestTwo = seq.slice(0, 2);
                return latestTwo[0] !== latestTwo[1] ? latestTwo[0] : null;
            },
        },
        {
            name: "Majority Rule (last 5)",
            confidence: 3,
            func: (seq) => {
                const latestFive = seq.slice(0, 5);
                const counts = latestFive.reduce((acc, val) => {
                    acc[val] = (acc[val] || 0) + 1;
                    return acc;
                }, {});
                let maxCount = 0;
                let prediction = null;
                for (const key in counts) {
                    if (counts[key] > maxCount) {
                        maxCount = counts[key];
                        prediction = key;
                    }
                }
                return prediction;
            },
        },
    ];

    for (const strategy of strategies) {
        const prediction = strategy.func(historicalSeq);
        if (prediction) {
            return {
                ...strategy,
                prediction,
            };
        }
    }
    return null;
};

// --- CORRECTED CONFIDENCE LOADING BAR COMPONENT ---
const ConfidenceLoadingBar = ({ confidenceLevel }) => {
    // Radius should be smaller to accommodate thinner line
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (confidenceLevel / 10) * circumference;

    return (
        <div className="confidence-circle-container">
            <svg className="confidence-circle-svg" width="36" height="36">
                <circle
                    className="confidence-circle-bg"
                    cx="18"
                    cy="18"
                    r={radius}
                />
                <circle
                    className="confidence-circle-fill"
                    cx="18"
                    cy="18"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className="confidence-text-center">
                <span className="confidence-text">{confidenceLevel}</span>
            </div>
        </div>
    );
};

// --- MAIN WINGO TRADER COMPONENT ---
const WingoTrader = () => {
    const [apiNumbers, setApiNumbers] = useState([]);
    const [tableLoading, setTableLoading] = useState(true);
    const [error, setError] = useState(null);
    const [seconds, setSeconds] = useState(60);
    const [prediction, setPrediction] = useState(null);
    const [predictionColor, setPredictionColor] = useState("");
    const [nextPeriod, setNextPeriod] = useState(null);
    const [copyStatus, setCopyStatus] = useState("Copy");
    const [lastPredictions, setLastPredictions] = useState([]);
    const [confidence, setConfidence] = useState(null);
    const timerRef = useRef(null);
    const predictionTimerRef = useRef(null);

    const fetchData = async () => {
        setTableLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?ts=${Date.now()}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data?.data?.list) {
                const processedData = data.data.list
                    .filter(
                        (item) =>
                            !isNaN(parseInt(item.number)) && item.issueNumber
                    )
                    .map((item) => ({
                        value: parseInt(item.number),
                        periodNumber: item.issueNumber,
                    }));

                setApiNumbers(processedData);

                if (processedData.length > 0) {
                    const latestPeriod = processedData[0].periodNumber;
                    const datePart = latestPeriod.slice(0, -3);
                    const sequencePart = parseInt(latestPeriod.slice(-3));
                    const nextPeriodNumber = datePart + (sequencePart + 1);
                    setNextPeriod(nextPeriodNumber);
                } else {
                    setNextPeriod("N/A");
                }
            } else {
                setError("Data format error. Please check the API source.");
                setApiNumbers([]);
                setNextPeriod("N/A");
            }
        } catch (error) {
            setError("Failed to fetch data. Please try again later.");
            setApiNumbers([]);
            setNextPeriod("N/A");
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        const now = new Date();
        const currentSeconds = now.getSeconds();
        const initialSeconds = (60 - currentSeconds - 2 + 60) % 60;
        setSeconds(initialSeconds);
        fetchData();
        timerRef.current = setInterval(() => {
            setSeconds((prev) => {
                if (prev <= 1) {
                    setPrediction(null);
                    setPredictionColor("");
                    setCopyStatus("Copy");
                    setConfidence(null);
                    fetchData();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            clearInterval(timerRef.current);
            clearTimeout(predictionTimerRef.current);
        };
    }, []);

    const handlePrediction = () => {
        if (apiNumbers.length < 10) {
            setPrediction("Not enough data. Need at least 10 entries.");
            setPredictionColor("gray");
            return;
        }

        setPrediction("Analyzing...");
        setPredictionColor("gray");
        clearTimeout(predictionTimerRef.current);

        const historicalNumbers = apiNumbers
            .slice(0, 10)
            .map((item) => item.value);

        const colorSeq = historicalNumbers.map((num) =>
            getCategory(num).colorText.charAt(0)
        );
        const sizeSeq = historicalNumbers.map((num) =>
            getCategory(num).sizeText.charAt(0)
        );

        const colorResult = findWinningLogic(colorSeq);
        const sizeResult = findWinningLogic(sizeSeq);

        let finalPrediction = null;

        if (
            colorResult &&
            (!sizeResult || colorResult.confidence >= sizeResult.confidence)
        ) {
            finalPrediction = { ...colorResult, type: "Color" };
        } else if (sizeResult) {
            finalPrediction = { ...sizeResult, type: "Size" };
        }

        let finalPredictionText = "No clear prediction.";
        let finalPredictionColorClass = "gray";

        if (finalPrediction) {
            setConfidence(finalPrediction.confidence);
            if (finalPrediction.type === "Color") {
                finalPredictionText = `Color: ${
                    finalPrediction.prediction === "R" ? "Red" : "Green"
                }`;
                finalPredictionColorClass =
                    finalPrediction.prediction === "R" ? "red" : "green";
            } else {
                finalPredictionText = `Size: ${
                    finalPrediction.prediction === "S" ? "Small" : "Big"
                }`;
                finalPredictionColorClass = "blue";
            }
        } else {
            setConfidence(null);
        }

        const lastPrediction = lastPredictions[0];
        const secondLastPrediction = lastPredictions[1];
        if (
            lastPredictions.length >= 2 &&
            finalPredictionText === lastPrediction &&
            finalPredictionText === secondLastPrediction
        ) {
            finalPredictionText = "No clear prediction.";
            finalPredictionColorClass = "gray";
            setConfidence(null);
        }

        if (finalPredictionText !== "No clear prediction.") {
            setLastPredictions((prevHistory) => [
                finalPredictionText,
                ...prevHistory.slice(0, 1),
            ]);
        } else {
            setLastPredictions([]);
        }

        setPrediction(finalPredictionText);
        setPredictionColor(finalPredictionColorClass);

        predictionTimerRef.current = setTimeout(() => {
            setPrediction(null);
            setPredictionColor("");
            setCopyStatus("Copy");
            setConfidence(null);
        }, 10000);
    };

    const handleCopyClick = async () => {
        if (
            !prediction ||
            prediction.includes("No clear") ||
            prediction.includes("Not enough")
        ) {
            setCopyStatus("No prediction to copy");
            setTimeout(() => setCopyStatus("Copy"), 2000);
            return;
        }

        const cleanedPrediction = prediction.replace(/^(Color|Size):\s*/, "");
        const shortPeriod = nextPeriod ? nextPeriod.slice(-3) : "N/A";
        const formattedText = `╭⚬──────────────⚬╮
│ ....⭐ 1 MinWinGo ⭐....
│⚬───────────────⚬
│⏳PERIOD : ${shortPeriod}
│🔮PREDICTION : ${cleanedPrediction}
╰⚬──────────────⚬╯`;

        try {
            await navigator.clipboard.writeText(formattedText);
            setCopyStatus("Copied!");
            setTimeout(() => {
                setCopyStatus("Copy");
            }, 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
            setCopyStatus("Failed!");
            setTimeout(() => {
                setCopyStatus("Copy");
            }, 2000);
        }
    };

    return (
        <>
            <NavBar title="WIN-GO TRADER" />
            <div className="timer-container">
                <h2>Next Update In:</h2>
                <span className="countdown">
                    00:{seconds.toString().padStart(2, "0")}
                </span>
            </div>

            {prediction && (
                <div className="prediction-result">
                    <div>
                        <h3>Prediction for Period {nextPeriod || "N/A"}:</h3>
                        <p className={predictionColor}>{prediction}</p>
                    </div>
                    <button className="copy-button" onClick={handleCopyClick}>
                        {copyStatus}
                    </button>
                </div>
            )}

            {confidence !== null && (
                <div className="confidence-display">
                    <h3>
                        Confidence Level:
                        <ConfidenceLoadingBar confidenceLevel={confidence} />
                    </h3>
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
                        {tableLoading ? (
                            <tr>
                                <td colSpan="4" className="status-message">
                                    <p>Loading...</p>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan="4" className="status-message">
                                    <p className="error">{error}</p>
                                    <button onClick={fetchData}>Retry</button>
                                </td>
                            </tr>
                        ) : apiNumbers.length > 0 ? (
                            apiNumbers.map((entry) => {
                                const {
                                    colorText,
                                    numColorClass,
                                    sizeText,
                                    numberStyle,
                                    colorStyle,
                                    sizeStyle,
                                } = getCategory(entry.value);
                                return (
                                    <tr key={entry.periodNumber}>
                                        <td>{entry.periodNumber}</td>
                                        <td
                                            className={numColorClass}
                                            style={numberStyle}
                                        >
                                            {entry.value}
                                        </td>
                                        <td>
                                            <span style={colorStyle}>
                                                {colorText}
                                            </span>
                                        </td>
                                        <td style={sizeStyle}>{sizeText}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="4">
                                    No data available right now.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <button className="prediction-button" onClick={handlePrediction}>
                Prediction
            </button>
        </>
    );
};

export default WingoTrader;
