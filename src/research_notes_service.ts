import { createServer } from "node:http";
import OpenAI from "openai";
import { ZodError } from "zod";
import {
  collectCitations,
  collectionRequestSchema,
  createInfraiEmbedder
} from "./citation_collector.ts";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

const embedTexts = createInfraiEmbedder(apiKey);
const port = Number(process.env.PORT ?? 3000);

function sendJson(response: import("node:http").ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/citations/collect") {
    sendJson(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const input = collectionRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    sendJson(response, 200, await collectCitations(input, embedTexts));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      sendJson(response, 400, { error: "Request body is invalid" });
      return;
    }
    if (error instanceof OpenAI.APIError) {
      const status = error.status && error.status < 500 ? error.status : 502;
      sendJson(response, status, { error: error.message });
      return;
    }
    sendJson(response, 500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
});

server.listen(port, () => {
  console.log(`Citation collector listening on http://localhost:${port}`);
});
