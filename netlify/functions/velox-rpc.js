// Proxies wallet/stats requests to your VeloxDAG node (set VELOX_RPC_BACKEND in Netlify env)
const BACKEND = process.env.VELOX_RPC_BACKEND || "";

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
