export default function handler(req, res) {
  res.status(200).json({
    functions: [
      {
        name: "schedule_social_post",
        description:
          "Schedules and (simulated) publishes posts to Twitter, LinkedIn, or Mastodon, with optional repetition and human-in-loop approval.",
        parameters: [
          {
            name: "platform",
            type: "string",
            description: "Target platform (twitter|mastodon|linkedin|generic)",
          },
          { name: "content", type: "string", description: "Post content" },
          { name: "repeat", type: "boolean", description: "Repeat posting" },
          { name: "days", type: "integer", description: "Interval in days" },
          {
            name: "approve",
            type: "boolean",
            description: "Require approval before posting",
          },
        ],
        endpoint: "/api/tools/schedule-social-post",
        auth_requirements: [
          {
            provider: "OptiID",
            scope_bundle: "content",
            required: true,
          },
        ],
        http_method: "POST",
      },
      {
        name: "engage_post_followup",
        description:
          "Generates simulated follow-up replies for a post; can schedule repeats.",
        parameters: [
          { name: "platform", type: "string", description: "Social platform" },
          { name: "post_id", type: "string", description: "Target post ID" },
          {
            name: "content",
            type: "string",
            description: "Reply content or prompt",
          },
          { name: "repeat", type: "boolean", description: "Repeat follow-up" },
          {
            name: "days",
            type: "integer",
            description: "Interval days for repeat",
          },
        ],
        endpoint: "/api/tools/engage-post-followup",
        http_method: "POST",
      },
      {
        name: "get_cms_content",
        description: "Returns CMS content list or single item by id",
        parameters: [
          { name: "id", type: "string", description: "Optional content id" },
        ],
        endpoint: "/api/tools/get-cms-content",
        auth_requirements: [
          {
            provider: "OptiID",
            scope_bundle: "content",
            required: true,
          },
        ],
        http_method: "POST",
      },
      {
        name: "summarize_content",
        description: "Returns a short summary of provided text (simulated LLM)",
        parameters: [
          { name: "text", type: "string", description: "Text to summarize" },
        ],
        endpoint: "/api/tools/summarize-content",
        auth_requirements: [
          {
            provider: "OptiID",
            scope_bundle: "content",
            required: true,
          },
        ],
        http_method: "POST",
      },
      {
        name: "image_generation",
        description: "Generates an image based on a text prompt.",
        parameters: [
          {
            name: "prompt",
            type: "string",
            description: "The text prompt to generate the image from.",
            required: true,
          },
          {
            name: "width",
            type: "integer",
            description: "The width of the image to generate. Defaults to 512.",
            required: false,
          },
          {
            name: "height",
            type: "integer",
            description:
              "The height of the image to generate. Defaults to 512.",
            required: false,
          },
        ],
        endpoint: "/tools/image-generation",
        http_method: "POST",
        auth_requirements: [
          {
            provider: "OptiID",
            scope_bundle: "content",
            required: true,
          },
        ],
      },
      {
        name: "content_scraper",
        description: "Extracts and cleans text content from a given URL.",
        parameters: [
          {
            name: "url",
            type: "string",
            description: "The URL to scrape content from.",
            required: true,
          },
        ],
        endpoint: "/tools/content-scraper",
        http_method: "POST",
        auth_requirements: [
          {
            provider: "OptiID",
            scope_bundle: "content",
            required: true,
          },
        ],
      },
    ],
  });
}
