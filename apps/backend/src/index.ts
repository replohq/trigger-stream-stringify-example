import express from "express";
import cors from "cors";
import { tasks, streams } from "@trigger.dev/sdk/v3";

const app = express();
app.use(cors());
app.use(express.json());

// Define the stream - must match the trigger app's stream definition
const messageStream = streams.define<{ message: string }>({
  id: "message-stream",
});

// Endpoint to start a new stream task
app.post("/api/start-stream", async (_req, res) => {
  try {
    console.log("Starting stream task...");

    const handle = await tasks.trigger("emit-messages", {});

    console.log(`Task triggered with run ID: ${handle.id}`, handle);
    res.json({ runId: handle.id });
  } catch (error) {
    console.error("Error starting stream:", error);
    res.status(500).json({ error: String(error) });
  }
});

// Endpoint to subscribe to a stream
app.get("/api/subscribe-stream/:runId", async (req, res) => {
  const { runId } = req.params;

  try {
    console.log(`Subscribing to stream for run: ${runId}`);

    // Set up streaming response
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Read from the stream
    const stream = await messageStream.read(runId, {
      timeoutInSeconds: 60,
    });

    for await (const chunk of stream) {
      console.log("Received chunk:", chunk, "Type:", typeof chunk);

      // Bug demonstration: typescript thinks chunk is an object, but it's actually
      // a string. Specifically not commenting in the next line, to demonstrate the bug.
      const data = JSON.parse(chunk as unknown as string);
      console.log("Parsed chunk:", data, "Type:", typeof data);
      res.write(JSON.stringify(data) + "\n");

      // Write each chunk as a newline-delimited JSON
      // res.write(JSON.stringify(chunk) + "\n");
    }

    console.log("Stream finished");
    res.end();
  } catch (error) {
    console.error("Error subscribing to stream:", error);
    res.status(500).json({ error: String(error) });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
