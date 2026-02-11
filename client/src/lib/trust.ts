import type { Agent } from "@shared/schema";

export function calculateTrustScore(agent: Agent): number {
  let score = 0;
  if (agent.verified) score += 30;
  if (agent.erc8004Id) score += 25;
  if (agent.agentType === "merkle_learning") score += 20;
  if (agent.learningRoot) score += 10;
  if (agent.learningModel) score += 10;
  if (agent.chainSupport && agent.chainSupport.length > 0) score += 5;
  return score;
}

export function getTrustLevel(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}
