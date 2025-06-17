import React from "react";

const KeywordChecker = ({
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
}) => {
  return (
    <div>
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
};

export default KeywordChecker;
