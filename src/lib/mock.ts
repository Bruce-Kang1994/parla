import { TranscriptionResult } from "./types";

const mockPairs = [
  {
    raw: "嗯 我想说的是 就是那个 我们需要在下周一之前 不对 应该是周三之前 把那个设计稿给到开发团队 然后 嗯 让他们开始做前端的 就是页面的开发工作",
    polished:
      "我们需要在周三之前把设计稿给到开发团队，然后让他们开始做前端页面的开发工作。",
  },
  {
    raw: "Hey so um I was thinking we should probably like schedule a meeting with the um the design team to go over the new like the new mockups and stuff you know what I mean and also we need to we need to talk about the timeline",
    polished:
      "I was thinking we should schedule a meeting with the design team to go over the new mockups. We also need to talk about the timeline.",
  },
  {
    raw: "第一点 我们要优化首页的加载速度 第二点 嗯 那个 要把用户反馈的那个bug修掉 就是登录页面的那个问题 第三点 需要加上数据埋点",
    polished:
      "1. 优化首页的加载速度\n2. 修复用户反馈的登录页面 Bug\n3. 加上数据埋点",
  },
  {
    raw: "ok so basically the the issue is that our API response time is like way too slow right now its taking like 3 seconds no actually more like 5 seconds and we need to get it under 500 milliseconds",
    polished:
      "The issue is that our API response time is too slow — it's taking about 5 seconds, and we need to get it under 500 milliseconds.",
  },
  {
    raw: "えーと 来週の月曜日に あ いや 火曜日に ミーティングを設定してください えーと 参加者は田中さんと 佐藤さんと あと山田さんです",
    polished:
      "来週の火曜日にミーティングを設定してください。参加者は田中さん、佐藤さん、山田さんです。",
  },
];

let mockIndex = 0;

export function getMockTranscription(): TranscriptionResult {
  const pair = mockPairs[mockIndex % mockPairs.length];
  mockIndex++;
  return {
    raw: pair.raw,
    polished: pair.polished,
    language: "auto",
    duration: 3.2 + Math.random() * 4,
  };
}

export function getMockPolish(raw: string): string {
  const pair = mockPairs.find((p) => p.raw === raw);
  if (pair) return pair.polished;

  // Generic cleanup for unknown input
  return raw
    .replace(/\b(um|uh|like|you know|so basically|I mean)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
