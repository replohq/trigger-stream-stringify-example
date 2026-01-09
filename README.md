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

### Root Cause

`stream.append()` expects a `BodyInit` (string, Blob, etc.) at runtime, but the TypeScript types incorrectly suggest it accepts plain objects. When you pass an object, JavaScript calls `.toString()` on it, resulting in `"[Object object]"`.

### Workaround

```typescript
await messageStream.append(JSON.stringify(payload) as unknown as { message: string });
```

## Steps to Reproduce

1. **Clone and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your TRIGGER_SECRET_KEY from https://cloud.trigger.dev
   ```

3. **Start the trigger dev server (terminal 1):**
   ```bash
   pnpm dev:trigger
   ```

4. **Start the backend server (terminal 2):**
   ```bash
   pnpm dev:backend
   ```

5. **Start the frontend (terminal 3):**
   ```bash
   pnpm dev:frontend
   ```

6. **Open http://localhost:3000 and click "Start Stream"**

You should see messages appear that show `RAW (not JSON): [Object object]` instead of the expected `{"message":"one"}`, `{"message":"two"}`, etc.

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
