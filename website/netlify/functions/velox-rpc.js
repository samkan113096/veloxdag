// Proxies wallet/stats requests to your VeloxDAG node (set VELOX_RPC_BACKEND in Netlify env)
const BACKEND = process.env.VELOX_RPC_BACKEND || "";

// This is a *public* endpoint. It must never expose block submission, block
// templates, or peer management to the internet — miners and operators connect
// to the node directly. The browser wallet only needs read queries plus
// sendrawtransaction (which is safe because every tx is signature-verified).
const ALLOWED_METHODS = new Set([
  "getbalance",
  "getnonce",
  "getchaininfo",
  "gettips",
  "getblock",
  "sendrawtransaction",
]);

exports.handler = async (event) => {
  if (!BACKEND) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "VELOX_RPC_BACKEND not set. Point Netlify to your public node URL.",
      }),
    };
  }

  const base = BACKEND.replace(/\/$/, "");

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }

  const headers = {
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true",
    "User-Agent": "VeloxDAG-Netlify-Proxy",
  };

  if (event.queryStringParameters?.path === "stats") {
    const res = await fetch(`${base}/api/stats`, { headers });
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
      body,
    };
  }

  if (event.httpMethod === "POST") {
    let method = "";
    try {
      method = JSON.parse(event.body || "{}").method || "";
    } catch {
      /* invalid JSON handled below */
    }
    if (!ALLOWED_METHODS.has(method)) {
      return {
        statusCode: 403,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ error: "method not allowed on public proxy" }),
      };
    }
    const res = await fetch(base, {
      method: "POST",
      headers,
      body: event.body,
    });
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
      body,
    };
  }

  return { statusCode: 405, headers: corsHeaders(), body: "Method not allowed" };
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
