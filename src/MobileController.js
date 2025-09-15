import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FrameSimulator from "./FrameSimulator";

const Page = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-size: 1.5rem;
  padding: 1.25rem;
  max-width: 37.5rem;
  margin: 0 auto;
  gap: 1.25rem;
`;

const TextInput = styled.textarea`
  width: calc(100% - 2.5rem);
  padding: 1rem 1.25rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 1rem;
  font-size: 2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 1);
  text-align: left;
  min-height: 8rem;
  resize: none;
  font-family: inherit;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 400;
  }

  &:focus {
    outline: none;
  }

  // &:disabled {
  //   background-color: rgba(255, 255, 255, 0.05);
  //   color: rgba(255, 255, 255, 0.1);
  // }
`;

const QuestionItem = styled.button`
  padding: 1rem 1.25rem;
  background-color: ${(props) =>
    props.selected ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.1)"};
  border: none;
  border-radius: 1rem;
  font-size: 2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 1);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  position: relative;
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};

  @media (hover: hover) {
    &:hover {
      background-color: ${(props) => {
        // if (props.disabled) return "rgba(255, 255, 255, 0.1)";
        if (props.selected) return "rgba(255, 255, 255, 0.4)";
        return "rgba(255, 255, 255, 0.2)";
      }};
    }
  }

  &:active {
    background-color: ${(props) => {
      // if (props.disabled) return "rgba(255, 255, 255, 0.1)";
      if (props.selected) return "rgba(255, 255, 255, 0.4)";
      return "rgba(255, 255, 255, 0.4)";
    }};
  }
`;

// eslint-disable-next-line no-unused-vars
const SpinnerOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "show"
})`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: ${(props) => (props.show ? "block" : "none")};
`;

const Spinner = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: rgba(255, 255, 255, 0.8);
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const SpinnerWithMargin = styled.div`
  margin-top: 2rem;
  display: flex;
  justify-content: center;
`;

const TextAreaContainer = styled.div`
  position: relative;
  width: 100%;
`;

const TextAreaOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "show"
})`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
  display: ${(props) => (props.show ? "flex" : "none")};
  align-items: center;
  justify-content: center;
`;

function QuestionProcessor() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setError] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [suggestedQuestionsLoading, setSuggestedQuestionsLoading] =
    useState(false);
  const [suggestedQuestionsError, setSuggestedQuestionsError] = useState("");
  const [loadingSuggestionIndex, setLoadingSuggestionIndex] = useState(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionHistory, setQuestionHistory] = useState([]);

  const getServerUrl = () => {
    let serverUrl = process.env.REACT_APP_SERVER_URL;
    if (serverUrl && !serverUrl.startsWith("http")) {
      const protocol = serverUrl.includes("localhost") ? "http" : "https";
      serverUrl = `${protocol}://${serverUrl}`;
    }
    return serverUrl;
  };

  const fetchCurrentQuestion = useCallback(async () => {
    try {
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/get-current-question`);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success && data.question) {
        setCurrentQuestion({
          question: data.question,
          number: data.number,
          answerSource: data.answerSource,
          timestamp: data.timestamp
        });
        // Mark the current question as selected (index 0 since it's first)
        setSelectedQuestionIndex(0);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      // Silently handle fetch errors
    }
  }, []);

  const fetchSuggestedQuestions = useCallback(async () => {
    setSuggestedQuestionsLoading(true);
    setSuggestedQuestionsError("");

    try {
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/get-suggested-questions`);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success && data.questions) {
        // Clean up questions by removing trailing commas and whitespace
        const cleanedQuestions = data.questions.map((question) =>
          question.trim().replace(/,+$/, "")
        );
        setSuggestedQuestions(cleanedQuestions);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setSuggestedQuestionsError(
        `Failed to load suggested questions: ${err.message}`
      );
    } finally {
      setSuggestedQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentQuestion();
    fetchSuggestedQuestions();
  }, [fetchCurrentQuestion, fetchSuggestedQuestions]);

  // WebSocket setup for listening to number-update events
  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL;

    // Convert HTTP URL to WebSocket URL
    let websocketUrl = serverUrl;
    if (
      !websocketUrl.startsWith("ws://") &&
      !websocketUrl.startsWith("wss://")
    ) {
      // Remove any existing http/https prefix
      websocketUrl = websocketUrl.replace(/^https?:\/\//, "");
      // Use wss for production, ws for localhost
      const protocol = websocketUrl.includes("localhost") ? "ws://" : "wss://";
      websocketUrl = protocol + websocketUrl;
    }

    const websocket = new WebSocket(websocketUrl);

    websocket.onopen = () => {
      // Connected to WebSocket server
    };

    websocket.onclose = (event) => {
      // If the connection was closed by the server (not by us), attempt to reconnect
      if (event.code !== 1000 && event.code !== 1001) {
        setTimeout(() => {
          // Create new connection by triggering this useEffect again would require state change
          // For now, just handle that we detected an unexpected disconnection
        }, 3000);
      }
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle number-update events with question data
        if (data.type === "number-update") {
          // Update current question from socket event if question data is provided
          if (data.question) {
            // Only update current question and selection if no question is selected,
            // or if the current question is already selected
            setSelectedQuestionIndex((prev) => {
              const shouldUpdateCurrent = prev === null || prev === 0;

              if (shouldUpdateCurrent) {
                // Add the existing current question to history before replacing it
                setCurrentQuestion((currentQ) => {
                  if (
                    currentQ &&
                    currentQ.question &&
                    currentQ.question !== data.question
                  ) {
                    setQuestionHistory((prevHistory) => {
                      // Check if this question already exists in history (avoid duplicates)
                      if (
                        prevHistory.some(
                          (q) =>
                            q.toLowerCase() === currentQ.question.toLowerCase()
                        )
                      ) {
                        return prevHistory;
                      }
                      // Add previous current question to the beginning of history
                      return [currentQ.question, ...prevHistory];
                    });
                  }

                  // Return the new current question
                  return {
                    question: data.question,
                    number: data.number || null, // Handle missing number field
                    answerSource: data.answerSource || null,
                    timestamp: data.timestamp
                  };
                });
                return 0; // Set to current question
              }

              return prev; // Keep existing selection
            });
          }
        }
      } catch (error) {
        // Silently handle WebSocket message parsing errors
      }
    };

    websocket.onerror = (error) => {
      // Silently handle WebSocket connection errors
    };

    // Cleanup on unmount
    return () => {
      websocket.close();
    };
  }, []); // Remove fetchCurrentQuestion dependency to prevent unnecessary reconnections

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError("");

    try {
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/process-question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: question.trim()
        })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      // eslint-disable-next-line no-unused-vars
      const data = await res.json();
      // Process response but don't update suggested questions to avoid reload

      // Clear the text field after successful submission
      setQuestion("");
    } catch (err) {
      setError(`Failed to send question: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestedQuestionClick = async (selectedQuestion, index) => {
    // Set selected and loading state for this specific suggestion
    setSelectedQuestionIndex(index);
    setLoadingSuggestionIndex(index);
    setError("");

    try {
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/process-question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: selectedQuestion.trim()
        })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      // eslint-disable-next-line no-unused-vars
      const data = await res.json();
      // Don't update suggested questions when clicking a suggested question
      // This prevents the list from reloading/changing
    } catch (err) {
      setError(`Failed to send question: ${err.message}`);
    } finally {
      setLoadingSuggestionIndex(null);
    }
  };

  const handleHistoryQuestionClick = async (historyQuestion, index) => {
    // Calculate the adjusted index for history items (right after current question)
    const adjustedIndex = 1 + index; // History starts at index 1 (after current question at 0)

    // Set selected and loading state for this history item
    setSelectedQuestionIndex(adjustedIndex);
    setLoadingSuggestionIndex(adjustedIndex);
    setError("");

    try {
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/process-question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: historyQuestion.trim()
        })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      // eslint-disable-next-line no-unused-vars
      const data = await res.json();
    } catch (err) {
      setError(`Failed to send question: ${err.message}`);
    } finally {
      setLoadingSuggestionIndex(null);
    }
  };

  const handleCurrentQuestionClick = async () => {
    if (!currentQuestion) return;

    // Set selected and loading state for the current question (index 0)
    setSelectedQuestionIndex(0);
    setLoadingSuggestionIndex(0);
    setError("");

    try {
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/process-question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: currentQuestion.question.trim()
        })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      // eslint-disable-next-line no-unused-vars
      const data = await res.json();
    } catch (err) {
      setError(`Failed to send question: ${err.message}`);
    } finally {
      setLoadingSuggestionIndex(null);
    }
  };

  return (
    <Page>
      <TextAreaContainer>
        <TextInput
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || loadingSuggestionIndex !== null}
        />
        <TextAreaOverlay show={loading}>
          <Spinner />
        </TextAreaOverlay>
      </TextAreaContainer>

      {/* Current Question Section */}
      {currentQuestion && (
        <QuestionItem
          onClick={handleCurrentQuestionClick}
          disabled={
            loadingSuggestionIndex !== null && loadingSuggestionIndex !== 0
          }
          selected={selectedQuestionIndex === 0}
        >
          {currentQuestion.question}
          {/* <SpinnerOverlay show={loadingSuggestionIndex === 0}>
            <Spinner />
          </SpinnerOverlay> */}
        </QuestionItem>
      )}

      {/* Question History Section */}
      {questionHistory.length > 0 &&
        questionHistory.map((historyQuestion, index) => {
          // Calculate the adjusted index for history items (after current question)
          const historyStartIndex = 1; // Right after current question
          const adjustedIndex = historyStartIndex + index;
          const isCurrentlyLoading = loadingSuggestionIndex === adjustedIndex;
          const isAnyLoading = loadingSuggestionIndex !== null;
          const shouldBeDisabled = isAnyLoading && !isCurrentlyLoading;
          const isSelected = selectedQuestionIndex === adjustedIndex;

          return (
            <QuestionItem
              key={`history-${index}`}
              onClick={() => handleHistoryQuestionClick(historyQuestion, index)}
              disabled={shouldBeDisabled}
              selected={isSelected}
            >
              {historyQuestion}
              {/* <SpinnerOverlay show={isCurrentlyLoading}>
                <Spinner />
              </SpinnerOverlay> */}
            </QuestionItem>
          );
        })}

      {/* Suggested Questions Section */}
      {suggestedQuestionsLoading && (
        <SpinnerWithMargin>
          <Spinner />
        </SpinnerWithMargin>
      )}
      {!suggestedQuestionsLoading &&
        !suggestedQuestionsError &&
        suggestedQuestions.length > 0 &&
        suggestedQuestions.map((suggestedQuestion, index) => {
          // Adjust index to account for current question (0) and history questions (1+)
          const adjustedIndex = questionHistory.length + 1 + index;
          const isCurrentlyLoading = loadingSuggestionIndex === adjustedIndex;
          const isAnyLoading = loadingSuggestionIndex !== null;
          const shouldBeDisabled = isAnyLoading && !isCurrentlyLoading;
          const isSelected = selectedQuestionIndex === adjustedIndex;

          return (
            <QuestionItem
              key={adjustedIndex}
              onClick={() =>
                handleSuggestedQuestionClick(suggestedQuestion, adjustedIndex)
              }
              disabled={shouldBeDisabled}
              selected={isSelected}
            >
              {suggestedQuestion}
              {/* <SpinnerOverlay show={isCurrentlyLoading}>
                <Spinner />
              </SpinnerOverlay> */}
            </QuestionItem>
          );
        })}
    </Page>
  );
}

function MobileController() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<QuestionProcessor />} />
        <Route path="/frame-simulator" element={<FrameSimulator />} />
      </Routes>
    </Router>
  );
}

export default MobileController;
