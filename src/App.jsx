/* global chrome */
import { useState, useEffect, useCallback } from "react";
import {
  getKeywordsFromLocalStorage,
  setKeywordsToLocalStorage,
} from "./utils/utils";

function App() {
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState(getKeywordsFromLocalStorage() || []);
  const [results, setResults] = useState([]);
  const [isAutoChecking, setIsAutoChecking] = useState(true);
  const [error, setError] = useState("");

  const checkKeywords = useCallback(async () => {
    if (keywords.length === 0) {
      setResults([]);
      setError("Please add some keywords to check.");
      return;
    }

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        setError("No active tab found.");
        return;
      }

      // Check if the tab URL is valid (not chrome:// or extension pages)
      if (
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:")
      ) {
        setError(
          "Cannot access this type of page. Please navigate to a regular website."
        );
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
        setError(result.error);
        return;
      }

      const jobText = result.jobText.toLowerCase();
      const found = keywords.map((kw) =>
        jobText.includes(kw.toLowerCase())
          ? { kw, found: true }
          : // `❌ ${kw} not found`
            { kw, found: false }
      );
      setResults(found);
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("Error checking keywords:", error);
      setError(
        "An error occurred while checking keywords. Error: " + error.message
      );
    }
  }, [keywords]);

  // Auto-check when keywords change
  useEffect(() => {
    if (isAutoChecking) {
      checkKeywords();
    }
  }, [keywords, checkKeywords, isAutoChecking]);

  // Set up tab change listener
  useEffect(() => {
    if (!isAutoChecking) return;

    const handleTabUpdate = (tabId, changeInfo) => {
      // Check when tab is completely loaded
      if (changeInfo.status === "complete") {
        // Add a small delay to ensure content is fully loaded
        setTimeout(() => {
          checkKeywords();
        }, 1000);
      }
    };

    const handleTabActivated = (_activeInfo) => {
      // Check when switching to a different tab
      setTimeout(() => {
        checkKeywords();
      }, 500);
    };

    // Add listeners
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onActivated.addListener(handleTabActivated);

    // Cleanup listeners on unmount
    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, [checkKeywords, isAutoChecking]);

  // Set up content change monitoring
  useEffect(() => {
    if (!isAutoChecking) return;

    const monitorContentChanges = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (
          !tab ||
          tab.url.startsWith("chrome://") ||
          tab.url.startsWith("chrome-extension://") ||
          tab.url.startsWith("edge://") ||
          tab.url.startsWith("about:")
        ) {
          return;
        }

        // Inject script to monitor content changes
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            // Remove existing observer if any
            if (window.keywordCheckerObserver) {
              window.keywordCheckerObserver.disconnect();
            }

            const targetElement = document.querySelector(
              ".jobs-description-content__text--stretch"
            );

            if (targetElement) {
              // Create a MutationObserver to watch for content changes
              window.keywordCheckerObserver = new MutationObserver(
                (mutations) => {
                  let contentChanged = false;
                  mutations.forEach((mutation) => {
                    if (
                      mutation.type === "childList" ||
                      mutation.type === "characterData"
                    ) {
                      contentChanged = true;
                    }
                  });

                  if (contentChanged) {
                    // Send message to extension popup
                    chrome.runtime
                      .sendMessage({
                        action: "contentChanged",
                      })
                      .catch(() => {
                        // Ignore errors if popup is not open
                      });
                  }
                }
              );

              // Start observing
              window.keywordCheckerObserver.observe(targetElement, {
                childList: true,
                subtree: true,
                characterData: true,
              });
            }
          },
        });
      } catch (error) {
        console.error("Error setting up content monitoring:", error);
      }
    };

    monitorContentChanges();

    // Set up message listener for content changes
    const handleMessage = (message, _sender, _sendResponse) => {
      if (message.action === "contentChanged") {
        setTimeout(() => {
          checkKeywords();
        }, 500);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [checkKeywords, isAutoChecking]);

  const addKeyword = () => {
    if (keyword.trim() && !keywords.includes(keyword.trim())) {
      const updatedKeywords = [...keywords, keyword.trim()];
      setKeywordsToLocalStorage(updatedKeywords);
      setKeywords(updatedKeywords);
    }
    setKeyword("");
  };

  const removeKeyword = (kw) => {
    const updatedKeywords = keywords.filter((k) => k !== kw);
    setKeywordsToLocalStorage(updatedKeywords);
    setKeywords(updatedKeywords);
  };

  // Handle Enter key in input
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addKeyword();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">
        Job Keyword Checker
      </h1>

      <div className="flex items-center mb-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isAutoChecking}
            onChange={(e) => setIsAutoChecking(e.target.checked)}
            className="mr-2"
          />
          <span className="text-base text-gray-300">
            Auto-check on page/content changes
          </span>
        </label>
      </div>

      <div className="flex mb-4">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter keywords (e.g., relocation, visa support)"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-base text-white placeholder-gray-400"
        />
        <button
          onClick={addKeyword}
          className="ml-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-base text-white"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {keywords.map((kw) => (
          <span
            key={kw}
            className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center text-base"
          >
            {kw}
            <button
              onClick={() => removeKeyword(kw)}
              className="ml-2 text-white font-bold text-lg"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <button
        onClick={checkKeywords}
        disabled={keywords.length === 0}
        className={`px-4 py-2 rounded text-base text-white ${
          keywords.length === 0
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isAutoChecking ? "Manual Check" : "Check Keywords in Current Tab"}
      </button>

      {isAutoChecking && (
        <p className="text-base text-green-400 mt-2">
          ✓ Auto-checking enabled - keywords will be checked automatically
        </p>
      )}
      <div className="mt-4">
        {error && <p className="text-red-500 text-lg mb-4">Error: {error}</p>}
        {!error && results.length === 0 && (
          <p className="text-gray-400 text-lg">
            No results yet. Add keywords and check them!
          </p>
        )}
      </div>
      {results.length && !error ? (
        <div className="mt-6" id="result">
          {results.map((res, index) => (
            <p
              key={index}
              className={`mb-2 p-2 bg-gray-800 rounded text-lg ${
                res.found
                  ? "border-1 border-amber-300 bg-green-500"
                  : "border-0"
              }`}
            >
              {res.found ? `✅ ${res.kw} found` : `❌ ${res.kw} not found`}
            </p>
          ))}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default App;
