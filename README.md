# Trigger.dev Stream Stringify Bug Reproduction

This is a minimal reproduction of an issue where `stream.append()` returns `[Object object]` when passing an object directly, despite the TypeScript types suggesting this is valid.

## The Bug

In `apps/trigger/src/emit-messages.ts`, the following code produces `[Object object]` in the stream:

```typescript
const payload = { message: "one" };
await messageStream.append(payload); // Results in "[Object object]"
```

**Expected:** The stream should contain `{"message":"one"}`

**Actual:** The stream contains `"[Object object]"`

### Likely Root Cause

`stream.append()` expects a `BodyInit` (string, Blob, etc.) at runtime, but the TypeScript types incorrectly suggest it accepts plain objects. When you pass an object, JavaScript calls `.toString()` on it, resulting in `"[Object object]"`.

### Workaround

In the streaming job, stringify the json directly:

```typescript
await messageStream.append(
  JSON.stringify(payload) as unknown as { message: string }
);
```

Then parse it in the `messageStream.read()` call.

## Steps to Reproduce

1. **Clone and install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start the server**
   Find the TRIGGER_SECRET_KEY for your project, then:
   ```bash
   TRIGGER_SECRET_KEY=... pnpm dev
   ```

3. **Open http://localhost:3000 and click "Start Stream"**

You should see the stream error, because the messages are not correctly being serialized or deserialized.

4. Make the following changes:

```typescript
// Bug demonstration: typescript thinks chunk is an object, but it's actually
// a string. Specifically not commenting in the next line, to demonstrate the bug.
// const data = JSON.parse(chunk as unknown as string);
// console.log("Parsed chunk:", data, "Type:", typeof data);
// res.write(JSON.stringify(data) + "\n");
res.write(JSON.stringify(chunk) + "\n");
```

To:

```typescript
// Bug demonstration: typescript thinks chunk is an object, but it's actually
// a string. Specifically not commenting in the next line, to demonstrate the bug.
const data = JSON.parse(chunk as unknown as string);
console.log("Parsed chunk:", data, "Type:", typeof data);
res.write(JSON.stringify(data) + "\n");
// res.write(JSON.stringify(chunk) + "\n");
```

and:

```typescript
// BUG DEMONSTRATION:
// The TypeScript types suggest we can pass an object directly to append(),
// but at runtime this results in "[Object object]" because append() expects
// a BodyInit (string, Blob, etc.) and JavaScript calls .toString() on objects.
//
// To fix this, you need to use JSON.stringify():
//   await messageStream.append(JSON.stringify(payload) as unknown as { message: string });
//
// But we're NOT doing that here to demonstrate the bug:
// await messageStream.append(payload);
await messageStream.append(
  JSON.stringify(payload) as unknown as { message: string }
);
```

to:

```typescript
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
// await messageStream.append(
//   JSON.stringify(payload) as unknown as { message: string }
// );
```

5. Reload the localhost:3000 page and observe the stream works as expected and displays the messages.

## Project Structure

```
├── apps/
│   ├── frontend/          # React + Vite (port 3000)
│   ├── backend/           # Express server (port 4000)
│   └── trigger/           # Trigger.dev tasks
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Package Versions

- `@trigger.dev/sdk`: ^4.3.1
- `@trigger.dev/build`: ^4.3.1
- `trigger.dev`: ^4.3.1
