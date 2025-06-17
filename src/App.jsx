/* global chrome */
import { useState, useEffect, useCallback } from "react";
import {
  getKeywordsFromLocalStorage,
  setKeywordsToLocalStorage,
} from "./utils/utils";
import KeywordChecker from "./components/KeywordChecker";
import CoverLetterGenerator from "./components/CoverLetterGenerator";

function App() {
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState(getKeywordsFromLocalStorage() || []);
  const [results, setResults] = useState([]);
  const [isAutoChecking, setIsAutoChecking] = useState(true);
  const [error, setError] = useState("");
  const [jdContent, setJdContent] = useState("");

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

      setJdContent(result.jobText);
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
    chrome?.tabs?.onUpdated.addListener(handleTabUpdate);
    chrome?.tabs?.onActivated.addListener(handleTabActivated);

    // Cleanup listeners on unmount
    return () => {
      chrome?.tabs?.onUpdated.removeListener(handleTabUpdate);
      chrome?.tabs?.onActivated.removeListener(handleTabActivated);
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
      <KeywordChecker
        {...{
          isAutoChecking,
          setIsAutoChecking,
          keyword,
          setKeyword,
          handleKeyPress,
          addKeyword,
          keywords,
          removeKeyword,
          error,
          checkKeywords,
          results,
        }}
      />
      <CoverLetterGenerator jdContent={jdContent} />
    </div>
  );
}

export default App;
