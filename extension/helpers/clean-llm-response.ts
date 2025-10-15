const cleanLLMResponse = (props: {
  response: string;
  requiredFields: string[];
  preserveFormatting?: boolean;
}) => {
  const { response, preserveFormatting = true, requiredFields = [] } = props;

  // Strip markdown or json code fences
  let stripped = response
    ?.trim()
    .replace(/^```(?:json|markdown)?\s*/i, "")
    .replace(/\s*```$/, "");

  if (!preserveFormatting) {
    stripped = stripped.replace(/\\n/g, " ").trim();
  }

  let parsed: any;

  try {
    parsed = JSON.parse(stripped);
  } catch (err) {
    console.error("Failed to parse JSON:", stripped);
    throw new Error("Invalid JSON response from LLM.");
  }

  const missingFields = requiredFields
    .filter((d) => d.length > 0) // remove empty strings
    .map((field) => field.trim())
    .filter((field) =>
      Array.isArray(parsed)
        ? parsed.every((item) => typeof item[field] === "undefined")
        : typeof parsed?.[field] === "undefined"
    );

  if (missingFields.length > 0) {
    throw new Error(
      `Invalid format: Missing required fields: [${missingFields.join(", ")}]`
    );
  }

  return parsed;
};

export default cleanLLMResponse;
