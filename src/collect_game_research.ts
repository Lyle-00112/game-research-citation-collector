import {
  collectCitations,
  collectionRequestSchema,
  createInfraiEmbedder
} from "./citation_collector.ts";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the example");

const lesson = collectionRequestSchema.parse({
  query: "How should a game backend connect creator assets, events, and review work?",
  notes: [
    {
      kind: "player_asset",
      entityId: "asset-map-104",
      sourceUrl: "https://docs.example.org/creator-assets?utm_source=class",
      title: "Creator asset lifecycle",
      summary: "Player-made maps move through upload, validation, publication, and revision states."
    },
    {
      kind: "player_asset",
      entityId: "asset-map-104",
      sourceUrl: "https://docs.example.org/creator-assets",
      title: "Creator asset lifecycle notes",
      summary: "Player-made maps move through upload, automated validation, moderator publication, and later revision states."
    },
    {
      kind: "live_event",
      entityId: "event-spring-cup",
      sourceUrl: "https://engineering.example.net/live-events",
      title: "Scheduling a seasonal tournament",
      summary: "The event record separates its schedule, audience rules, rewards, and current operational state."
    },
    {
      kind: "moderation_queue",
      entityId: "queue-community-assets",
      sourceUrl: "https://safety.example.com/review-queues",
      title: "Review queue priorities",
      summary: "A moderation queue orders creator submissions using policy severity, player reach, and waiting time."
    }
  ]
});

const result = await collectCitations(lesson, createInfraiEmbedder(apiKey));
console.log(JSON.stringify(result, null, 2));
