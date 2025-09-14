import React, { useState, useEffect } from "react";
import styled from "styled-components";

const Page = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 24px;
  color: #333;
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
  margin-bottom: 20px;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }
`;

const ResponseContainer = styled.div`
  width: 100%;
  min-height: 100px;
  padding: 16px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  color: #495057;
  white-space: pre-wrap;
`;

const LoadingText = styled.div`
  color: #6c757d;
  font-style: italic;
`;

const ErrorText = styled.div`
  color: #dc3545;
`;

const SuggestedQuestionsContainer = styled.div`
  width: 100%;
  margin-bottom: 20px;
`;

const SuggestedQuestionsTitle = styled.h3`
  margin-bottom: 12px;
  color: #495057;
  font-size: 18px;
`;

const QuestionsList = styled.div`
  display: grid;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const QuestionItem = styled.button`
  padding: 8px 12px;
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  color: #495057;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }

  &:active {
    background-color: #dee2e6;
  }
`;

function App() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [suggestedQuestionsLoading, setSuggestedQuestionsLoading] =
    useState(false);
  const [suggestedQuestionsError, setSuggestedQuestionsError] = useState("");

  const fetchSuggestedQuestions = async () => {
    setSuggestedQuestionsLoading(true);
    setSuggestedQuestionsError("");

    try {
      const serverUrl =
        process.env.REACT_APP_SERVER_URL || "http://localhost:3001";
      const res = await fetch(`${serverUrl}/get-suggested-questions`);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success && data.questions) {
        setSuggestedQuestions(data.questions);
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
  };

  useEffect(() => {
    fetchSuggestedQuestions();
  }, []);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const serverUrl =
        process.env.REACT_APP_SERVER_URL || "http://localhost:3001";
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

      const data = await res.json();
      setResponse(data.number);
    } catch (err) {
      setError(`Failed to send question: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSuggestedQuestionClick = async (selectedQuestion) => {
    setQuestion(selectedQuestion);

    // Immediately submit the question
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const serverUrl =
        process.env.REACT_APP_SERVER_URL || "http://localhost:3001";
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

      const data = await res.json();
      setResponse(data.number);
    } catch (err) {
      setError(`Failed to send question: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <h1>Question Processor</h1>

      {/* Suggested Questions Section */}
      <SuggestedQuestionsContainer>
        <SuggestedQuestionsTitle>Suggested Questions</SuggestedQuestionsTitle>
        <QuestionsList>
          {suggestedQuestionsLoading && (
            <LoadingText>Loading suggested questions...</LoadingText>
          )}
          {suggestedQuestionsError && (
            <ErrorText>{suggestedQuestionsError}</ErrorText>
          )}
          {!suggestedQuestionsLoading &&
            !suggestedQuestionsError &&
            suggestedQuestions.length > 0 &&
            suggestedQuestions.map((suggestedQuestion, index) => (
              <QuestionItem
                key={index}
                onClick={() => handleSuggestedQuestionClick(suggestedQuestion)}
              >
                {suggestedQuestion}
              </QuestionItem>
            ))}
          {!suggestedQuestionsLoading &&
            !suggestedQuestionsError &&
            suggestedQuestions.length === 0 && (
              <LoadingText>No suggested questions available</LoadingText>
            )}
        </QuestionsList>
      </SuggestedQuestionsContainer>

      <TextInput
        type="text"
        placeholder="Enter your question and press Enter..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <ResponseContainer>
        {loading && <LoadingText>Sending question...</LoadingText>}
        {error && <ErrorText>{error}</ErrorText>}
        {response !== "" && !loading && !error && response}
        {!loading &&
          !error &&
          response === "" &&
          "Response will appear here..."}
      </ResponseContainer>
    </Page>
  );
}

export default App;
