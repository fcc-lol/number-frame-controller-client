import React, { useState, useEffect } from "react";
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

  &:disabled {
    background-color: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.1);
  }
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
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};

  @media (hover: hover) {
    &:hover {
      background-color: ${(props) => {
        if (props.disabled) return "rgba(255, 255, 255, 0.1)";
        if (props.selected) return "rgba(255, 255, 255, 0.4)";
        return "rgba(255, 255, 255, 0.2)";
      }};
    }
  }

  &:active {
    background-color: ${(props) => {
      if (props.disabled) return "rgba(255, 255, 255, 0.1)";
      if (props.selected) return "rgba(255, 255, 255, 0.4)";
      return "rgba(255, 255, 255, 0.2)";
    }};
  }
`;

const QuestionText = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== "isLoading"
})`
  opacity: ${(props) => (props.isLoading ? 0 : 1)};
  transition: opacity 0.2s ease;
`;

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

  const getServerUrl = () => {
    let serverUrl = process.env.REACT_APP_SERVER_URL;
    if (serverUrl && !serverUrl.startsWith("http")) {
      const protocol = serverUrl.includes("localhost") ? "http" : "https";
      serverUrl = `${protocol}://${serverUrl}`;
    }
    return serverUrl;
  };

  const fetchSuggestedQuestions = async () => {
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
      console.error("Failed to load suggested questions:", err.message);
      setSuggestedQuestionsError(
        `Failed to load suggested questions: ${err.message}`
      );
    } finally {
      setSuggestedQuestionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedQuestions();
  }, []);

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
    } catch (err) {
      console.error("Failed to send question:", err.message);
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
      console.error("Failed to send question:", err.message);
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
          disabled={loading}
        />
        <TextAreaOverlay show={loading}>
          <Spinner />
        </TextAreaOverlay>
      </TextAreaContainer>

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
          const isCurrentlyLoading = loadingSuggestionIndex === index;
          const isAnyLoading = loadingSuggestionIndex !== null;
          const shouldBeDisabled = isAnyLoading && !isCurrentlyLoading;
          const isSelected = selectedQuestionIndex === index;

          return (
            <QuestionItem
              key={index}
              onClick={() =>
                handleSuggestedQuestionClick(suggestedQuestion, index)
              }
              disabled={shouldBeDisabled}
              selected={isSelected}
            >
              <QuestionText isLoading={isCurrentlyLoading}>
                {suggestedQuestion}
              </QuestionText>
              <SpinnerOverlay show={isCurrentlyLoading}>
                <Spinner />
              </SpinnerOverlay>
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
