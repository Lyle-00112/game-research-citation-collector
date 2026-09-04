import assert from "node:assert/strict";
import test from "node:test";
import { collectCitations, type CollectionRequest } from "../src/citation_collector.ts";

test("keeps the fuller citation when a tracked URL repeats", async () => {
  const input: CollectionRequest = {
    query: "creator asset review",
    notes: [
      {
        kind: "player_asset",
        entityId: "map-7",
        sourceUrl: "https://learn.example.com/assets?utm_source=course",
        title: "Asset states",
        summary: "Creator maps pass through review before publication."
      },
      {
        kind: "moderation_queue",
        entityId: "review-7",
        sourceUrl: "https://learn.example.com/assets",
        title: "Asset states and moderation",
        summary: "Creator maps pass through automated checks and a priority moderation queue before publication."
      },
      {
        kind: "live_event",
        entityId: "event-2",
        sourceUrl: "https://learn.example.com/events",
        title: "Live event state",
        summary: "A live event has scheduled, active, and completed states."
      }
    ]
  };

  const result = await collectCitations(input, async () => [
    [1, 0],
    [1, 0],
    [0, 1]
  ]);

  assert.equal(result.duplicateCount, 1);
  assert.equal(result.clusters.length, 2);
  assert.equal(result.clusters[0].matchReason, "canonical_url");
  assert.equal(result.clusters[0].citation.entityId, "review-7");
  assert.deepEqual(result.clusters[0].duplicateUrls, ["https://learn.example.com/assets?utm_source=course"]);
});
