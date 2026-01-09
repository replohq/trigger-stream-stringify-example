import { useState } from "react";

interface StreamMessage {
  message: string;
  receivedAt: string;
}

function App() {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  console.log("messages", messages);

  const startStream = async () => {
    setMessages([]);
    setError(null);
    setIsStreaming(true);

    try {
      // Step 1: Start the trigger task
      const startRes = await fetch("/api/start-stream", { method: "POST" });
      if (!startRes.ok) {
        throw new Error(`Failed to start stream: ${startRes.statusText}`);
      }
      const { runId: newRunId } = await startRes.json();
      setRunId(newRunId);

      // Step 2: Subscribe to the stream
      const streamRes = await fetch(`/api/subscribe-stream/${newRunId}`);
      if (!streamRes.ok) {
        throw new Error(
          `Failed to subscribe to stream: ${streamRes.statusText}`
        );
      }

      const reader = streamRes.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              setMessages((prev) => [
                ...prev,
                {
                  message: data.message,
                  receivedAt: new Date().toISOString(),
                },
              ]);
            } catch {
              // Log raw data if it's not valid JSON (this will show the bug)
              setMessages((prev) => [
                ...prev,
                {
                  message: `RAW (not JSON): ${line}`,
                  receivedAt: new Date().toISOString(),
                },
              ]);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div
      style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: "600px" }}
    >
      <h1>Trigger.dev Stream Stringify Example</h1>
      <p>
        This demonstrates the issue where <code>stream.append()</code> with an
        object returns <code>[Object object]</code> instead of the actual data.
      </p>

      <button
        onClick={startStream}
        disabled={isStreaming}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: isStreaming ? "not-allowed" : "pointer",
        }}
      >
        {isStreaming ? "Streaming..." : "Start Stream"}
      </button>

      {runId && (
        <p style={{ color: "#666", fontSize: "12px" }}>Run ID: {runId}</p>
      )}

      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>Error: {error}</div>
      )}

      <h2>Messages ({messages.length})</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {messages.map((msg, i) => (
          <li
            key={i}
            style={{
              padding: "10px",
              margin: "5px 0",
              backgroundColor: msg.message.includes("RAW")
                ? "#ffcccc"
                : "#f0f0f0",
              borderRadius: "4px",
            }}
          >
            <strong>{msg.message}</strong>
            <br />
            <small style={{ color: "#666" }}>{msg.receivedAt}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
