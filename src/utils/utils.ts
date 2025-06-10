export const getKeywordsFromLocalStorage = (): string[] => {
  const keywords = localStorage.getItem("keywords");
  if (keywords) {
    try {
      return JSON.parse(keywords);
    } catch (error) {
      console.error("Error parsing keywords from localStorage:", error);
      return [];
    }
  }
  return [];
};

export const setKeywordsToLocalStorage = (keywords: string[]): void => {
  try {
    localStorage.setItem("keywords", JSON.stringify(keywords));
  } catch (error) {
    console.error("Error setting keywords to localStorage:", error);
  }
};
