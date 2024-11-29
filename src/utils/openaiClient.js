const { OpenAI } = require("openai");
const Bottleneck = require("bottleneck");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API,
});

// Create a rate limiter with a limit of 20 requests per minute
const limiter = new Bottleneck({
  minTime: 3000, // Minimum time between requests in milliseconds (3 seconds)
  maxConcurrent: 1, // Maximum number of concurrent requests
});

const generateResponse = async (messages) => {
  try {
    // Use the rate limiter to schedule API requests
    const completion = await limiter.schedule(() =>
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
      })
    );

    return completion.choices[0].message.content;
  } catch (error) {
    // Improved error handling
    if (error.response) {
      // API response error
      console.error(
        "OpenAI API error:",
        error.response.status,
        error.response.data
      );
      throw new Error(
        `OpenAI API error: ${error.response.status} ${error.response.data.error.message}`
      );
    } else if (error.request) {
      // Request made but no response received
      console.error("No response received from OpenAI API:", error.request);
      throw new Error("No response received from OpenAI API");
    } else {
      // Other errors
      console.error("Error generating response from OpenAI:", error.message);
      throw new Error(
        `Error generating response from OpenAI: ${error.message}`
      );
    }
  }
};

module.exports = {
  generateResponse,
};
