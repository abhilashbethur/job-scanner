import { useState } from "react";

function App() {
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [results, setResults] = useState([]);

  const addKeyword = () => {
    if (keyword.trim() && !keywords.includes(keyword.trim())) {
      setKeywords([...keywords, keyword.trim()]);
    }
    setKeyword("");
  };

  const removeKeyword = (kw) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const checkKeywords = async () => {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        setResults(["Unable to access current tab."]);
        return;
      }

      // Check if the tab URL is valid (not chrome:// or extension pages)
      if (
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:")
      ) {
        setResults([
          "Cannot access this type of page. Please navigate to a regular website.",
        ]);
        return;
      }

      // Inject script to get job description content
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const jobTextElement = document.querySelector(
            ".jobs-description-content__text--stretch"
          );

          if (!jobTextElement) {
            return {
              error:
                "Job description not found. Make sure you're on a LinkedIn job page.",
            };
          }

          return { jobText: jobTextElement.innerText };
        },
      });

      const result = injectionResults[0].result;

      if (result.error) {
        setResults([result.error]);
        return;
      }

      const jobText = result.jobText.toLowerCase();
      const found = keywords.map((kw) =>
        jobText.includes(kw.toLowerCase())
          ? `✅ ${kw} found`
          : `❌ ${kw} not found`
      );
      setResults(found);
    } catch (error) {
      console.error("Error checking keywords:", error);
      setResults([`Error: ${error.message}`]);
    }
  };

  // Handle Enter key in input
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addKeyword();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4 text-blue-400">
        Job Keyword Checker
      </h1>

      <div className="flex mb-4">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter keywords (e.g., relocation, visa support)"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400"
        />
        <button
          onClick={addKeyword}
          className="ml-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {keywords.map((kw) => (
          <span
            key={kw}
            className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center"
          >
            {kw}
            <button
              onClick={() => removeKeyword(kw)}
              className="ml-2 text-white font-bold"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <button
        onClick={checkKeywords}
        disabled={keywords.length === 0}
        className={`px-4 py-2 rounded text-white ${
          keywords.length === 0
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        Check Keywords in Current Tab
      </button>

      <div className="mt-6" id="result">
        {results.map((res, index) => (
          <p key={index} className="mb-2 p-2 bg-gray-800 rounded">
            {res}
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
