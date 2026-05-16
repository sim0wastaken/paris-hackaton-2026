const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
const endpoint = new URL("/api/demo/reset", appUrl);
const headers = {
  "content-type": "application/json"
};

if (process.env.DEMO_OPERATOR_TOKEN) {
  headers["x-demo-operator-token"] = process.env.DEMO_OPERATOR_TOKEN;
}

const response = await fetch(endpoint, {
  method: "POST",
  headers,
  body: JSON.stringify({
    replay: process.env.DEMO_RESET_REPLAY !== "false",
    requested_by: "pnpm demo:reset"
  })
});
const payload = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(payload, null, 2));
