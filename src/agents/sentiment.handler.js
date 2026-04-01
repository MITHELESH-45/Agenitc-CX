function applySentiment({ emotion, baseText }) {
  const clean = String(baseText || "").trim();
  if (!clean) return "";

  if (emotion === "angry") {
    return `I'm really sorry for the inconvenience. ${clean}`;
  }

  if (emotion === "frustrated") {
    return `I understand your concern. ${clean}`;
  }

  return clean;
}

module.exports = {
  applySentiment
};

