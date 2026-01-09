import { task, wait, streams } from "@trigger.dev/sdk/v3";

// Define the stream
const messageStream = streams.define<{ message: string }>({
  id: "message-stream",
});

const messages = ["one", "two", "three", "four", "five"];

export const emitMessages = task({
  id: "emit-messages",
  run: async () => {
    console.log("Starting to emit messages...");

    for (const msg of messages) {
      const payload = { message: msg };

      // BUG DEMONSTRATION:
      // The TypeScript types suggest we can pass an object directly to append(),
      // but at runtime this results in "[Object object]" because append() expects
      // a BodyInit (string, Blob, etc.) and JavaScript calls .toString() on objects.
      //
      // To fix this, you need to use JSON.stringify():
      //   await messageStream.append(JSON.stringify(payload) as unknown as { message: string });
      //
      // But we're NOT doing that here to demonstrate the bug:
      await messageStream.append(payload);

      console.log(`Emitted: ${JSON.stringify(payload)}`);

      // Wait 2 seconds between messages
      await wait.for({ seconds: 2 });
    }

    console.log("Finished emitting messages");
    return { success: true, messagesEmitted: messages.length };
  },
});
