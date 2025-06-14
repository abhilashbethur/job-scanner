# 🔍 Job Keyword Checker – Chrome Extension

A powerful Chrome Extension to automatically check for specific keywords (e.g., "visa support", "relocation", "remote") in **LinkedIn job descriptions**. Stay on top of your job search with real-time tracking of job-related criteria.

---

## ✨ Features

- ✅ **Real-time Keyword Checking** on LinkedIn job descriptions.
- 🔁 **Auto-checking** on page changes, content updates, or tab switches.
- 📌 **Persistent Keyword Storage** using local storage.
- 🛠️ **Manual Keyword Check** button for full control.
- 📡 **MutationObserver Integration** to detect content changes inside job listings.

---

## 📦 Tech Stack

- **React** with `useEffect` and `useCallback`
- **Chrome Extension APIs** (`chrome.tabs`, `chrome.scripting`, `chrome.runtime`)
- **TailwindCSS** for styling
- **MutationObserver** for DOM content change detection

---

## 🚀 How It Works

1. **Add keywords** that you want to track.
2. The extension:
   - Monitors LinkedIn job pages.
   - Extracts job descriptions.
   - Searches for the keywords.
3. If a keyword is found:
   - ✅ Green highlight with positive match.
   - ❌ Red highlight if not found.

---

## 🧠 Why Use This?

This tool is perfect for:
- Job seekers filtering jobs with visa/relocation support.
- Quickly validating job descriptions without manual reading.
- Saving time across multiple LinkedIn job tabs.

---

## 🛠️ Installation

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/job-keyword-checker.git
cd job-keyword-checker
```

### 2. Build the Extension

Assuming you're using a React + CRX setup:

```bash
npm install
npm run build
```

### 3. Load into Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load Unpacked**
4. Select the `build` directory from the project

---

## 📌 Limitations

- Only works on **LinkedIn job pages** currently.
- Cannot access system or internal browser pages like `chrome://`, `about:`, etc.

---

## 🤝 Contribution

Pull requests are welcome. For major changes, open an issue first to discuss what you would like to change or improve.

