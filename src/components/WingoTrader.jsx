import React, { useState, useEffect, useRef } from "react";
import NavBar from "./NavBar";
import "./wingoTrader.css";

// Helper function to categorize the numbers (color and size)
const getCategory = (num) => {
    let colorText, numColorClass, numberStyle, colorStyle;

    // Check for 0 and 5 first, as they have special styling
    if (num === 0) {
        colorText = "Purple";
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
        colorText = "Purple";
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
        colorStyle = {};
    } else {
        colorText = "Green";
        numColorClass = "green-text";
        numberStyle = {};
        colorStyle = {};
    }

    const sizeText = num <= 4 ? "SMALL" : "BIG";

    // Return a single object with all the styling information
    return { colorText, numColorClass, sizeText, numberStyle, colorStyle };
};

// Prediction functions
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

const getMajority = (arr) => {
    let count = { R: 0, G: 0, S: 0, B: 0 };
    arr.forEach((v) => count[v]++);
    let maxCount = 0;
    let majority = null;
    for (const key in count) {
        if (count[key] > maxCount) {
            maxCount = count[key];
            majority = key;
        }
    }
    return majority;
};

const getAlternateNext = (seq) => {
    const last = seq[0],
        second = seq[1];
    return last !== second ? last : null;
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
        if (apiNumbers.length < 4) {
            setPrediction("Not enough data. Need at least 4 entries.");
            setPredictionColor("gray");
            return;
        }

        setPrediction("Analyzing...");
        setPredictionColor("gray");
        clearTimeout(predictionTimerRef.current);

        const top4Numbers = apiNumbers.slice(0, 4).map((item) => item.value);
        const colorSeq = top4Numbers.map((num) => (num % 2 === 0 ? "R" : "G"));
        const sizeSeq = top4Numbers.map((num) => (num <= 4 ? "S" : "B"));

        const predictionStrategies = [
            () => getNextPattern(colorSeq),
            () => getNextPattern(sizeSeq),
            () => getAlternateNext(colorSeq),
            () => getAlternateNext(sizeSeq),
            () => getMajority(colorSeq),
            () => getMajority(sizeSeq),
        ];

        let finalPredictionText = "No clear prediction.";
        let finalPredictionColorClass = "gray";
        let newPredictionValue = null;

        for (const strategy of predictionStrategies) {
            const result = strategy();
            if (result) {
                newPredictionValue = result;
                break;
            }
        }

        // Avoid repeating the same prediction more than twice
        if (lastPredictions.length >= 2) {
            if (
                newPredictionValue === lastPredictions[0] &&
                newPredictionValue === lastPredictions[1]
            ) {
                const alternativeStrategies = [
                    () => {
                        const allColors = apiNumbers.map((item) =>
                            getCategory(item.value).colorText.charAt(0)
                        );
                        return getMajority(allColors);
                    },
                    () => {
                        const allSizes = apiNumbers.map((item) =>
                            getCategory(item.value).sizeText.charAt(0)
                        );
                        return getMajority(allSizes);
                    },
                ];

                for (const altStrategy of alternativeStrategies) {
                    const altResult = altStrategy();
                    if (altResult && altResult !== newPredictionValue) {
                        newPredictionValue = altResult;
                        break;
                    }
                }
            }
        }

        if (newPredictionValue) {
            if (newPredictionValue === "R") {
                finalPredictionText = "Color: Green";
                finalPredictionColorClass = "green";
            } else if (newPredictionValue === "G") {
                finalPredictionText = "Color: Red";
                finalPredictionColorClass = "red";
            } else if (newPredictionValue === "S") {
                finalPredictionText = "Size: Big";
                finalPredictionColorClass = "blue";
            } else if (newPredictionValue === "B") {
                finalPredictionText = "Size: Small";
                finalPredictionColorClass = "blue";
            }
            setLastPredictions((prev) => [
                newPredictionValue,
                ...prev.slice(0, 1),
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
                                        <td>{sizeText}</td>
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
