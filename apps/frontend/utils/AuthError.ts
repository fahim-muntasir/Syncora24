export const getRequestError = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return "We couldn’t complete that request. Check your connection and try again.";
  }

  if ("status" in error && error.status === "FETCH_ERROR") {
    const detail = "error" in error && typeof error.error === "string"
      ? ` (${error.error})`
      : "";
    return `Could not reach the Syncora24 API. Check NEXT_PUBLIC_API_URL and that the API allows this frontend origin${detail}.`;
  }

  if ("status" in error && error.status === "PARSING_ERROR") {
    return "The Syncora24 API returned an unexpected response. Check that NEXT_PUBLIC_API_URL points to the API server.";
  }

  if (typeof error === "object" && error !== null && "data" in error) {
    const data = error.data;
    if (typeof data === "object" && data !== null) {
      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }
      if ("error" in data && typeof data.error === "string") {
        return data.error;
      }
    }
  }

  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }

  if ("status" in error && typeof error.status === "number") {
    return `Google sign-in failed (API returned ${error.status}). Check that GOOGLE_CLIENT_ID on the backend matches NEXT_PUBLIC_GOOGLE_CLIENT_ID and review the backend logs.`;
  }

  if ("error" in error && typeof error.error === "string") {
    return error.error;
  }

  return "Google sign-in failed. Check the backend configuration and try again.";
};
