const cheerio = require('cheerio');

const content_extractor = async ({ url }) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script, style, nav, footer, header, and aside elements
    $("script, style, nav, footer, header, aside").remove();

    // Get text from the body, attempting to find main content areas
    let text = "";
    const mainContentSelectors = [
      "article",
      "main",
      ".main",
      "#main",
      ".post",
      "#content",
    ];
    for (const selector of mainContentSelectors) {
      if ($(selector).length) {
        text = $(selector).text();
        break;
      }
    }

    // If no main content area is found, get all body text as a fallback
    if (!text) {
      text = $("body").text();
    }

    // Simple text cleanup to remove excessive whitespace
    const cleanedText = text.replace(/\s\s+/g, " ").trim();

    if (!cleanedText) {
      return `Failed to retrieve content from the URL. The page might be empty or require JavaScript.`;
    }

    return cleanedText;
  } catch (e) {
    console.error(`Failed to scrape ${url}`, e);
    // Return a message to the LLM so it knows the scrape failed.
    return `Failed to retrieve content from the URL. The error was: ${e.message}`;
  }
};

export const extractContentFromURLFlow = async ({ url }) => {
  // Step 1: Explicitly call the tool to scrape the content.
  const scrapedContent = await content_extractor({ url });

  if (
    scrapedContent.startsWith("Failed to retrieve content") ||
    !scrapedContent
  ) {
    // If scraping fails, return a specific error object that the UI can handle.
    return {
      title: "Scraping Failed",
      content:
        "Could not retrieve meaningful content from the URL. This often happens with sites that require a login, use heavy JavaScript, or have strong bot protection. Please try pasting the text directly.",
    };
  }

  // Step 2: Pass the scraped content to the prompt for summarization.
  return { scrapedContent };
}
