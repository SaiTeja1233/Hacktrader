import React, { useState, useEffect, useRef } from "react";
import NavBar from "./NavBar";
import "./wingoTrader.css";

// Helper function to categorize the numbers (color and size)
const getCategory = (num) => {
    let colorText, numColorClass, numberStyle, colorStyle;

    // Check for 0 and 5 first, as they have special styling
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

    // Return a single object with all the styling information
    return {
        colorText,
        numColorClass,
        sizeText,
        numberStyle,
        colorStyle,
        sizeStyle,
    };
};

// --- Prediction Logic with Confidence Scores ---
const findWinningLogic = (historicalSeq) => {
    if (historicalSeq.length < 4) return null;

    const latestResult = historicalSeq[0];
    const previousData = historicalSeq.slice(1);

    const strategies = [
        // Pattern Recognition (High Confidence)
        {
            name: "Pattern (3)",
            confidence: 10,
            func: (seq) => {
                if (seq.length < 6) return null;
                const pattern = seq.slice(0, 3).join("");
                return seq.slice(3, 6).join("") === pattern
                    ? latestResult
                    : null;
            },
        },
        {
            name: "Consecutive",
            confidence: 9,
            func: (seq) => {
                if (seq.length < 3) return null;
                return seq.slice(0, 3).every((val) => val === latestResult)
                    ? latestResult
                    : null;
            },
        },
        {
            name: "Alternating (A,B,A,B)",
            confidence: 8,
            func: (seq) => {
                if (seq.length < 4) return null;
                return seq[0] === seq[2] &&
                    seq[1] === seq[3] &&
                    seq[0] !== seq[1]
                    ? latestResult
                    : null;
            },
        },
        // Trend Analysis (Medium Confidence)
        {
            name: "Pattern (2)",
            confidence: 7,
            func: (seq) => {
                if (seq.length < 4) return null;
                const pattern = seq.slice(0, 2).join("");
                return seq.slice(2, 4).join("") === pattern
                    ? latestResult
                    : null;
            },
        },
        {
            name: "Alternating (A,B,A)",
            confidence: 6,
            func: (seq) => {
                if (seq.length < 3) return null;
                return seq[0] === seq[2] && seq[0] !== seq[1]
                    ? latestResult
                    : null;
            },
        },
        {
            name: "Reverse Alternating (A,B,B,A)",
            confidence: 5.5,
            func: (seq) => {
                if (seq.length < 4) return null;
                return seq[0] === seq[3] &&
                    seq[1] === seq[2] &&
                    seq[0] !== seq[1]
                    ? latestResult
                    : null;
            },
        },
        // Basic Rules (Lower Confidence)
        {
            name: "Simple 3-in-a-row",
            confidence: 5,
            func: (seq) => {
                if (seq.length < 3) return null;
                return seq.slice(0, 3).every((val) => val === latestResult)
                    ? latestResult
                    : null;
            },
        },
        {
            name: "Change in Trend",
            confidence: 4,
            func: (seq) => {
                if (seq.length < 2) return null;
                return seq[0] === seq[1] && latestResult !== seq[0]
                    ? latestResult
                    : null;
            },
        },
        {
            name: "Simple Pattern (1)",
            confidence: 3,
            func: (seq) => {
                if (seq.length < 2) return null;
                return seq[0] === latestResult ? latestResult : null;
            },
        },
    ];

    const winningStrategies = [];
    for (const strategy of strategies) {
        const predictedValue = strategy.func(previousData);
        if (predictedValue) {
            winningStrategies.push({
                ...strategy,
                prediction: predictedValue,
            });
        }
    }

    if (winningStrategies.length > 0) {
        winningStrategies.sort((a, b) => b.confidence - a.confidence);
        return winningStrategies[0];
    }

    return null;
};

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
            console.log(
                "❌ Not enough data for prediction. Need at least 10 periods."
            );
            return;
        }

        setPrediction("Analyzing...");
        setPredictionColor("gray");
        clearTimeout(predictionTimerRef.current);

        let allPredictions = [];

        // Loop through historical data from latest to oldest, from 4 periods up to 10
        for (let dataLength = 4; dataLength <= 10; dataLength++) {
            const historicalNumbers = apiNumbers
                .slice(0, dataLength)
                .map((item) => item.value);
            const colorSeq = historicalNumbers.map((num) =>
                getCategory(num).colorText.charAt(0)
            );
            const sizeSeq = historicalNumbers.map((num) =>
                getCategory(num).sizeText.charAt(0)
            );

            const colorResult = findWinningLogic(colorSeq);
            if (colorResult) {
                allPredictions.push({ ...colorResult, type: "Color" });
            }

            const sizeResult = findWinningLogic(sizeSeq);
            if (sizeResult) {
                allPredictions.push({ ...sizeResult, type: "Size" });
            }
        }

        // Sort all found predictions by confidence, from highest to lowest
        allPredictions.sort((a, b) => b.confidence - a.confidence);

        let finalPredictionText = "No clear prediction.";
        let finalPredictionColorClass = "gray";
        let whyMessage = "";

        if (allPredictions.length > 0) {
            const topPrediction = allPredictions[0];
            let predictionValue = topPrediction.prediction;

            if (topPrediction.type === "Color") {
                finalPredictionText = `Color: ${
                    predictionValue === "R" ? "Red" : "Green"
                }`;
                finalPredictionColorClass =
                    predictionValue === "R" ? "red" : "green";
            } else if (topPrediction.type === "Size") {
                finalPredictionText = `Size: ${
                    predictionValue === "S" ? "Small" : "Big"
                }`;
                finalPredictionColorClass = "blue";
            }

            whyMessage = `Based on the '${topPrediction.name}' logic, which has a confidence score of ${topPrediction.confidence}. This was the highest-ranking pattern found in the recent data.`;

            // Block repeated predictions for reliability
            const lastPrediction = lastPredictions[0];
            const secondLastPrediction = lastPredictions[1];
            if (
                lastPredictions.length >= 2 &&
                finalPredictionText === lastPrediction &&
                finalPredictionText === secondLastPrediction
            ) {
                finalPredictionText = "No clear prediction.";
                finalPredictionColorClass = "gray";
                whyMessage =
                    "Prediction blocked: The same prediction has occurred too many times in a row, which may indicate a break in the pattern.";
            }

            if (finalPredictionText !== "No clear prediction.") {
                setLastPredictions((prevHistory) => [
                    finalPredictionText,
                    ...prevHistory.slice(0, 1),
                ]);
            } else {
                setLastPredictions([]);
            }
        } else {
            whyMessage =
                "No strong patterns or trends were detected in the recent data.";
            setLastPredictions([]);
        }

        setPrediction(finalPredictionText);
        setPredictionColor(finalPredictionColorClass);

        console.log(`\n--- FINAL PREDICTION: ${finalPredictionText} ---`);
        console.log(`REASON: ${whyMessage}`);

        predictionTimerRef.current = setTimeout(() => {
            setPrediction(null);
            setPredictionColor("");
            setCopyStatus("Copy");
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
