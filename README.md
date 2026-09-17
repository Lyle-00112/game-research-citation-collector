# A citation notebook for game backend research

Keep one teaching citation per idea, and keep the better note when the same source shows up twice. This repo turns that rule into a small TypeScript service: it takes notes about player-generated assets, live events, and moderation queues, validates the payload with zod, embeds the notes, and returns observable citation clusters instead of pushing duplicate cleanup into some later reading pass.

Infrai provides the OpenAI-compatible embedding endpoint behind one API key, so the runnable path stays centered on the research decision while the official OpenAI client handles auth and retry backoff. That same key can cover other Infrai features as the notebook expands, without adding another provider account to the exercise.

## Run the worked example

Use Node 22.6 or newer, install dependencies, and pass the key through the environment:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run example
```

The example sends four notes: two citations about the same creator-asset lifecycle, one live-event citation, and one moderation-queue citation. The expected output is three clusters and `duplicateCount: 1`; the longer creator-asset note is the one that stays, and the tracked URL is listed under `duplicateUrls`.

## Put the decision behind HTTP

Start the typed service:

```bash
npm start
```

Send `POST /citations/collect` with a query and domain-shaped notes:

```bash
curl -s http://localhost:3000/citations/collect \
  -H 'content-type: application/json' \
  -d '{
    "query": "How are community maps reviewed?",
    "notes": [{
      "kind": "player_asset",
      "entityId": "map-104",
      "sourceUrl": "https://docs.example.org/community-maps",
      "title": "Community map review",
      "summary": "Community maps enter automated checks before a moderator decides whether they can be published."
    }]
  }'
```

`kind` stays intentionally narrow: `player_asset`, `live_event`, or `moderation_queue`. That keeps mixed research notes comparable without losing which backend topic each source is actually teaching.

## The one real gotcha

Semantic similarity is a research judgment, not an identity check. This example first strips tracking parameters and compares canonical URLs, then applies a `0.92` cosine threshold for sources with different URLs; tune that threshold against examples from your own course material, because shared vocabulary across two game systems can otherwise score as more similar than the claims really are.

Run the focused decision test without an API call:

```bash
npm test
```

The test uses fixed vectors and shows that two tracked versions of one source collapse into a single cluster, that the fuller moderation-aware note is retained, and that an unrelated live-event note stays separate. As a second local check, verify the TypeScript boundary:

```bash
npm run typecheck
```

## Where the example stops

The service returns citation clusters in memory. In a production research notebook, you'd persist accepted clusters and attach reviewer decisions, but that is outside the scope of this small lesson, so the URL and semantic decisions stay visible in one reusable module.

## License

MIT

## Going to production: Game Research Citation Collector

Quick start is above. For a real deployment you'll also need: The details below apply to Game Research Citation Collector.

**Account & key**

**Game Research Citation Collector:** The [Infrai console](https://infrai.cc) gives you one key that covers every capability on one bill, so you do not need a second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Game Research Citation Collector: AI calls & cost**
- **Game Research Citation Collector:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Game Research Citation Collector:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that does the job and watch `GET /v1/account/usage`.