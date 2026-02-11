import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot,
  Brain,
  FileJson,
  Shield,
  GitBranch,
  Globe,
  Link2,
  Award,
  Cpu,
  Database,
  Layers,
  Lock,
} from "lucide-react";

interface Bap578Stats {
  totalAgents: number;
  merkleLearningAgents: number;
  jsonLightAgents: number;
  erc8004Registered: number;
  totalMerkleRoots: number;
  learningModelBreakdown: Record<string, number>;
  chainCoverage: Record<string, number>;
}

const learningModelLabels: Record<string, string> = {
  reinforcement: "Reinforcement Learning",
  rag: "RAG (Retrieval-Augmented)",
  mcp: "MCP (Model Context Protocol)",
  fine_tuning: "Fine-Tuning",
  hybrid: "Hybrid",
};

const chainLabels: Record<string, string> = {
  bsc_mainnet: "BSC Mainnet",
  ethereum: "Ethereum",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  base: "Base",
  polygon: "Polygon",
  avalanche: "Avalanche",
};

export default function Bap578Page() {
  const [, navigate] = useLocation();

  const { data: stats, isLoading } = useQuery<Bap578Stats>({
    queryKey: ["/api/bap578/stats"],
  });

  const merklePct = stats ? Math.round((stats.merkleLearningAgents / stats.totalAgents) * 100) : 0;
  const lightPct = stats ? Math.round((stats.jsonLightAgents / stats.totalAgents) * 100) : 0;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
      <div className="border-b pb-4">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-lg font-semibold flex items-center gap-2" data-testid="text-bap578-title">
            <Cpu className="w-5 h-5 text-primary" />
            BAP-578: Non-Fungible Agent Standard
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          BNB Chain Application Proposal for autonomous AI agents as ownable, tradeable on-chain assets.
          Extends ERC-721 with learning capabilities, identity registry, and cross-chain support.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">Total NFAs</span>
              <div className="text-sm font-semibold" data-testid="text-bap578-total-agents">
                {isLoading ? <Skeleton className="h-5 w-12" /> : stats?.totalAgents ?? 0}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">Merkle Learning</span>
              <div className="text-sm font-semibold" data-testid="text-bap578-merkle-count">
                {isLoading ? <Skeleton className="h-5 w-12" /> : `${stats?.merkleLearningAgents ?? 0} (${merklePct}%)`}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-chart-3/10 flex items-center justify-center shrink-0">
              <FileJson className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">JSON Light</span>
              <div className="text-sm font-semibold" data-testid="text-bap578-light-count">
                {isLoading ? <Skeleton className="h-5 w-12" /> : `${stats?.jsonLightAgents ?? 0} (${lightPct}%)`}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">ERC-8004 Registered</span>
              <div className="text-sm font-semibold" data-testid="text-bap578-erc8004-count">
                {isLoading ? <Skeleton className="h-5 w-12" /> : stats?.erc8004Registered ?? 0}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              Dual-Path Architecture
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-chart-2" />
                  <span className="text-sm font-medium">Merkle Tree Learning Agents</span>
                </div>
                <span className="text-sm font-semibold" data-testid="text-bap578-merkle-pct">{merklePct}%</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${merklePct}%`, backgroundColor: 'hsl(var(--chart-2))' }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Evolving agents that learn from interactions. User interactions generate learning data stored in Merkle tree structures with only the 32-byte root committed on-chain.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-chart-3" />
                  <span className="text-sm font-medium">JSON Light Memory Agents</span>
                </div>
                <span className="text-sm font-semibold" data-testid="text-bap578-light-pct">{lightPct}%</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${lightPct}%`, backgroundColor: 'hsl(var(--chart-3))' }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Simple static agents for basic functions. Uses JSON-based static memory without evolving learning capabilities.
              </p>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Merkle Roots Committed</span>
              </div>
              <span className="text-lg font-bold" data-testid="text-bap578-merkle-roots">
                {isLoading ? <Skeleton className="h-6 w-16" /> : stats?.totalMerkleRoots ?? 0}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Cryptographically verifiable snapshots of agent learning state stored on-chain.
              </p>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-muted-foreground" />
              Learning Models
            </h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : stats?.learningModelBreakdown ? (
              <div className="space-y-3">
                {Object.entries(stats.learningModelBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([model, modelCount]) => {
                    const pct = Math.round((modelCount / stats.merkleLearningAgents) * 100);
                    return (
                      <div key={model} className="space-y-1.5" data-testid={`row-learning-model-${model}`}>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <span className="text-sm">{learningModelLabels[model] ?? model}</span>
                          <span className="text-xs text-muted-foreground">{modelCount} agents ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No learning model data available</p>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              BAP-578 supports multiple AI learning approaches: RAG, MCP, fine-tuning, reinforcement learning, and hybrid combinations.
            </p>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            Cross-Chain Coverage
          </h2>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : stats?.chainCoverage ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.chainCoverage)
                .sort(([, a], [, b]) => b - a)
                .map(([chain, chainCount]) => (
                  <div
                    key={chain}
                    className="border rounded-md p-3 text-center"
                    data-testid={`card-chain-${chain}`}
                  >
                    <div className="text-lg font-bold">{chainCount}</div>
                    <div className="text-xs text-muted-foreground">{chainLabels[chain] ?? chain}</div>
                  </div>
                ))}
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground mt-4">
            NFAs can operate across multiple chains. BAP-578 roadmap includes support for 100+ chains via Hyperlane integration.
          </p>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">ERC-721 Extension</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            NFAs extend the ERC-721 standard, making AI agents ownable, tradeable NFTs. Full backward compatibility with existing NFT infrastructure while adding intelligent agent capabilities.
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">ERC-8004 Identity</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Agents can register with the ERC-8004 identity standard for verifiable on-chain identities. Includes Identity Registry, Reputation Registry, and Validation Registry -- like a passport and credit score for AI.
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Hybrid Storage</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            On-chain: identity, permissions, Merkle roots (32 bytes). Off-chain: extended memory, learning data, AI behaviors, media. Achieves 80-90% gas savings while maintaining cryptographic verifiability.
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            Protocol Specification
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-bap578-spec">
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground w-[200px] whitespace-nowrap">Standard</td>
                <td className="px-4 py-2.5 text-sm">BAP-578 (extends ERC-721)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Blockchain</td>
                <td className="px-4 py-2.5 text-sm">BNB Smart Chain (BSC Mainnet & Testnet)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Token Type</td>
                <td className="px-4 py-2.5 text-sm">Non-Fungible Agent (NFA)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Agent Types</td>
                <td className="px-4 py-2.5 text-sm">Merkle Tree Learning / JSON Light Memory</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Identity Standard</td>
                <td className="px-4 py-2.5 text-sm">ERC-8004 (Identity, Reputation, Validation Registries)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Learning Proof</td>
                <td className="px-4 py-2.5 text-sm">32-byte Merkle Root (on-chain, tamper-proof)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Gas Efficiency</td>
                <td className="px-4 py-2.5 text-sm">80-90% savings via hybrid on/off-chain storage</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Cross-Chain</td>
                <td className="px-4 py-2.5 text-sm">Roadmap for 100+ chains via Hyperlane</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Mint Fee</td>
                <td className="px-4 py-2.5 text-sm">0.01 BNB per agent</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Security</td>
                <td className="px-4 py-2.5 text-sm">Circuit breakers, access controls, multi-layer framework</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Core Interface</td>
                <td className="px-4 py-2.5 text-sm">
                  IBAP578 (executeAction, setLogicAddress, fundAgent, getState, getAgentMetadata, updateAgentMetadata, pause, unpause, terminate)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Learning Module</td>
                <td className="px-4 py-2.5 text-sm">
                  ILearningModule (updateLearningTree, getLearningMetrics, verifyLearning)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Permission System</td>
                <td className="px-4 py-2.5 text-sm">
                  Vault Permissions (grantPermission, revokePermission, hasPermission) with Execute, Configure, Learn, Fund scopes
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Memory Module</td>
                <td className="px-4 py-2.5 text-sm">
                  registerMemoryModule, getMemoryModule
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Agent Metadata</td>
                <td className="px-4 py-2.5 text-sm">
                  persona, experience, voiceHash, animationURI, vaultURI, vaultHash (on-chain struct)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Agent States</td>
                <td className="px-4 py-2.5 text-sm">
                  Active, Paused, Terminated (full lifecycle management)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">NFA Contract</td>
                <td className="px-4 py-2.5 text-sm">
                  <span
                    className="bscscan-link cursor-pointer font-mono text-xs"
                    onClick={() => window.open("https://bscscan.com/address/0xf2954d349D7FF9E0d4322d750c7c2921b0445fdf", "_blank")}
                    data-testid="link-nfa-contract"
                  >
                    0xf2954d349D7FF9E0d4322d750c7c2921b0445fdf
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">ERC-8004 Registry</td>
                <td className="px-4 py-2.5 text-sm">
                  <span
                    className="bscscan-link cursor-pointer font-mono text-xs"
                    onClick={() => window.open("https://bscscan.com/address/0xBE6745f74DF1427a073154345040a37558059eBb", "_blank")}
                    data-testid="link-erc8004-registry"
                  >
                    0xBE6745f74DF1427a073154345040a37558059eBb
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Specification</td>
                <td className="px-4 py-2.5 text-sm">
                  <span
                    className="bscscan-link cursor-pointer font-mono text-xs"
                    onClick={() => window.open("https://github.com/bnb-chain/BEPs/blob/master/BAPs/BAP-578.md", "_blank")}
                    data-testid="link-bap578-spec"
                  >
                    github.com/bnb-chain/BEPs/BAP-578.md
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">Reference Impl</td>
                <td className="px-4 py-2.5 text-sm">
                  <span
                    className="bscscan-link cursor-pointer font-mono text-xs"
                    onClick={() => window.open("https://github.com/ChatAndBuild/non-fungible-agents-BAP-578", "_blank")}
                    data-testid="link-bap578-ref-impl"
                  >
                    github.com/ChatAndBuild/non-fungible-agents-BAP-578
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
