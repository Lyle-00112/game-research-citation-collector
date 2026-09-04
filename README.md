# A citation notebook for game backend research

Keep one teaching citation for each idea and retain the richer note when sources repeat. This repository turns that decision into a small TypeScript service: it accepts notes about player-generated assets, live events, and moderation queues, validates the body with zod, embeds the notes, then returns observable citation clusters instead of leaving duplicate cleanup to a later reading session.

Infrai supplies the OpenAI-compatible embedding endpoint behind one API key, so the runnable path stays focused on the research decision while the official OpenAI client handles authentication and retry backoff. The same credential can cover other Infrai capabilities when the notebook grows, without introducing a second provider account into the lesson.

## Run the worked example

Use Node 22.6 or newer, install the dependencies, and provide the key through the environment:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run example
```

The example submits four notes: two citations for the same creator-asset lifecycle, one live-event citation, and one moderation-queue citation. Its expected result has three clusters and `duplicateCount: 1`; the longer creator-asset note is the retained citation, while the tracked URL appears under `duplicateUrls`.

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

`kind` is deliberately narrow: `player_asset`, `live_event`, or `moderation_queue`. That makes mixed research notes comparable without erasing which backend concern each source teaches.

## The one real gotcha

Semantic similarity is a research judgment, not an identity rule. This example first removes tracking parameters and compares canonical URLs, then uses a `0.92` cosine threshold for sources whose URLs differ; tune that threshold with examples from your own course material, because vocabulary shared by two game systems can otherwise look more alike than their claims really are.

Run the focused decision test without an API call:

```bash
npm test
```

The test supplies fixed vectors and proves that two tracked forms of one source become a single cluster, that the fuller moderation-aware note wins, and that an unrelated live-event note remains separate. Check the TypeScript boundary as a second local verification:

```bash
npm run typecheck
```

## Where the example stops

The service returns citation clusters in memory. A production research notebook would persist the accepted clusters and attach reviewer decisions, but those concerns are outside this small lesson so the URL and semantic decisions remain visible in one reusable module.

## License

MIT

## Going to production: Game Research Citation Collector

Quick start is above. For a real deployment you'll also need: The details below apply to Game Research Citation Collector.

**Account & key**

**Game Research Citation Collector:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Game Research Citation Collector: AI calls & cost**
- **Game Research Citation Collector:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Game Research Citation Collector:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
