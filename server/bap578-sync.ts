import { storage } from "./storage";
import {
  erc721TotalSupply,
  erc721OwnerOf,
  erc721TokenURI,
  getBalance,
  getContractSourceCode,
  getContractTransactions,
  fetchTokenMetadata,
  weiToEther,
  gweiFromWei,
  ethCall,
} from "./bscscan";
import { log } from "./index";

const ERC8004_IDENTITY_REGISTRY = "0xBE6745f74DF1427a073154345040a37558059eBb";
const ERC8004_REPUTATION_REGISTRY = "0x0dEe18C860514147518604911166E034e4C83623";
const BAP578_NFA_CONTRACT = "0xf2954d349D7FF9E0d4322d750c7c2921b0445fdf";
const NFA_MARKETPLACE = "0x0260A2fa1d0Ea88F8165f5B0b61349F7735e4250";

const BAP578_CONTRACTS = [
  ERC8004_IDENTITY_REGISTRY,
  ERC8004_REPUTATION_REGISTRY,
  BAP578_NFA_CONTRACT,
  NFA_MARKETPLACE,
];

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    return fallback;
  }
}

interface Erc8004Agent {
  tokenId: number;
  owner: string;
  tokenURI: string;
  metadata: any | null;
}

interface NfaAgent {
  tokenId: number;
  owner: string;
  tokenURI: string;
  metadata: any | null;
}

async function fetchErc8004Agents(): Promise<Erc8004Agent[]> {
  log("Querying ERC-8004 Identity Registry...", "bap578");
  const total = await safeCall(() => erc721TotalSupply(ERC8004_IDENTITY_REGISTRY), 0);
  log(`ERC-8004 Identity Registry: ${total} agents registered`, "bap578");

  const agents: Erc8004Agent[] = [];
  for (let tokenId = 1; tokenId <= total; tokenId++) {
    try {
      const owner = await erc721OwnerOf(ERC8004_IDENTITY_REGISTRY, tokenId);
      await delay(100);
      const tokenURI = await safeCall(() => erc721TokenURI(ERC8004_IDENTITY_REGISTRY, tokenId), "");
      await delay(100);

      let metadata: any = null;
      if (tokenURI) {
        metadata = await safeCall(() => fetchTokenMetadata(tokenURI), null);
      }

      agents.push({ tokenId, owner, tokenURI, metadata });

      if (tokenId % 20 === 0) {
        log(`  ERC-8004: fetched ${tokenId}/${total} agents...`, "bap578");
      }
    } catch (e: any) {
      log(`  ERC-8004 agent #${tokenId} error: ${e.message}`, "bap578");
    }
  }

  log(`ERC-8004: fetched all ${agents.length} agents`, "bap578");
  return agents;
}

async function fetchNfaAgents(): Promise<NfaAgent[]> {
  log("Querying BAP-578 NFA Contract...", "bap578");

  let reportedTotal = await safeCall(() => erc721TotalSupply(BAP578_NFA_CONTRACT), 0);
  log(`BAP-578 NFA Contract: totalSupply=${reportedTotal} (probing individual IDs)`, "bap578");

  const MAX_PROBE_ID = 200;
  const MAX_CONSECUTIVE_MISSING = 20;

  const agents: NfaAgent[] = [];
  let consecutiveMissing = 0;

  for (let tokenId = 1; tokenId <= MAX_PROBE_ID; tokenId++) {
    try {
      const owner = await erc721OwnerOf(BAP578_NFA_CONTRACT, tokenId);
      consecutiveMissing = 0;
      await delay(100);
      const tokenURI = await safeCall(() => erc721TokenURI(BAP578_NFA_CONTRACT, tokenId), "");
      await delay(100);

      let metadata: any = null;
      if (tokenURI) {
        metadata = await safeCall(() => fetchTokenMetadata(tokenURI), null);
      }

      agents.push({ tokenId, owner, tokenURI, metadata });

      if (agents.length % 10 === 0) {
        log(`  NFA: found ${agents.length} agents so far (scanning ID ${tokenId})...`, "bap578");
      }
    } catch (e: any) {
      consecutiveMissing++;
      await delay(50);
      if (consecutiveMissing >= MAX_CONSECUTIVE_MISSING) {
        log(`  NFA: ${MAX_CONSECUTIVE_MISSING} consecutive missing IDs after ${tokenId}, stopping scan`, "bap578");
        break;
      }
    }
  }

  log(`NFA: found ${agents.length} active NFAs (scanned up to ID ${Math.min(MAX_PROBE_ID, agents.length > 0 ? agents[agents.length-1].tokenId + MAX_CONSECUTIVE_MISSING : MAX_PROBE_ID)})`, "bap578");
  return agents;
}

async function storeErc8004Agent(agent: Erc8004Agent, nfaMap: Map<number, NfaAgent>): Promise<void> {
  const nfa = nfaMap.get(agent.tokenId);
  const isNfa = !!nfa;

  const name = agent.metadata?.name || `Agent #${agent.tokenId}`;
  const description = buildAgentDescription(agent, nfa);
  const metadataUri = agent.tokenURI || null;
  const imageUrl = agent.metadata?.image || null;

  const agentType = isNfa ? "merkle_learning" : "json_light";
  const erc8004Id = `erc8004:bsc:${agent.tokenId}`;

  const agentAddress = `0x8004agent${agent.tokenId.toString().padStart(28, "0")}`.toLowerCase();

  let learningModel: string | null = null;
  if (isNfa) {
    const services = agent.metadata?.services || [];
    if (services.some((s: any) => s.name === "MCP")) learningModel = "mcp";
    else if (services.some((s: any) => s.name === "A2A")) learningModel = "hybrid";
    else learningModel = "rag";
  }

  const balance = nfa ? "0 BNB" : null;

  await storage.upsertAgent({
    address: agentAddress,
    name,
    description,
    owner: agent.owner.toLowerCase(),
    status: "active",
    version: "1.0.0",
    logicAddress: isNfa ? BAP578_NFA_CONTRACT : null,
    metadataUri,
    learningRoot: null,
    compiler: isNfa ? "BAP-578 NFA" : "ERC-8004",
    license: "MIT",
    verified: true,
    balance,
    agentType,
    erc8004Id,
    learningModel,
    chainSupport: ["bsc_mainnet"],
    mintFee: isNfa ? "Free" : "10 U",
  });
}

async function storeStandaloneNfa(nfa: NfaAgent): Promise<void> {
  const name = nfa.metadata?.name || `NFA Agent #${nfa.tokenId}`;
  const description = nfa.metadata?.description
    ? `${nfa.metadata.description} BAP-578 NFA (ID: ${nfa.tokenId}) with autonomous execution capabilities.`
    : `BAP-578 Non-Fungible Agent (NFA ID: ${nfa.tokenId}) on BNB Chain.`;
  const metadataUri = nfa.tokenURI || null;
  const agentAddress = `0xbap578nfa${nfa.tokenId.toString().padStart(26, "0")}`.toLowerCase();
  const erc8004Id = null;

  const services = nfa.metadata?.services || [];
  let learningModel: string | null = null;
  if (services.some((s: any) => s.name === "MCP")) learningModel = "mcp";
  else if (services.some((s: any) => s.name === "A2A")) learningModel = "hybrid";
  else learningModel = "rag";

  await storage.upsertAgent({
    address: agentAddress,
    name,
    description,
    owner: nfa.owner.toLowerCase(),
    status: "active",
    version: "1.0.0",
    logicAddress: BAP578_NFA_CONTRACT,
    metadataUri,
    learningRoot: null,
    compiler: "BAP-578 NFA",
    license: "MIT",
    verified: true,
    balance: null,
    agentType: "merkle_learning",
    erc8004Id,
    learningModel,
    chainSupport: ["bsc_mainnet"],
    mintFee: "Free",
  });
}

function buildAgentDescription(agent: Erc8004Agent, nfa: NfaAgent | undefined): string {
  const parts: string[] = [];

  if (agent.metadata?.description) {
    parts.push(agent.metadata.description);
  }

  parts.push(`ERC-8004 registered agent (ID: ${agent.tokenId}).`);

  if (nfa) {
    parts.push(`Upgraded to BAP-578 NFA with autonomous execution capabilities.`);
  }

  const services = agent.metadata?.services || [];
  if (services.length > 0) {
    const serviceNames = services.map((s: any) => s.name).join(", ");
    parts.push(`Services: ${serviceNames}.`);
  }

  if (agent.metadata?.x402Support) {
    parts.push("X402 payment support enabled.");
  }

  return parts.join(" ");
}

async function syncBap578Transactions(): Promise<void> {
  log("Fetching BAP-578 contract transactions...", "bap578");

  for (const contractAddr of [BAP578_NFA_CONTRACT, ERC8004_IDENTITY_REGISTRY]) {
    try {
      const txs = await getContractTransactions(contractAddr, 0, 99999999, 1, 100, "desc");
      if (!txs || txs.length === 0) continue;

      let agent = await storage.getAgentByAddress(contractAddr.toLowerCase());
      if (!agent) {
        const contractName = contractAddr === BAP578_NFA_CONTRACT
          ? "BAP-578 NFA Registry"
          : "ERC-8004 Identity Registry";
        agent = await storage.upsertAgent({
          address: contractAddr.toLowerCase(),
          name: contractName,
          description: `Official ${contractName} on BNB Chain.`,
          owner: contractAddr.toLowerCase(),
          status: "active",
          version: "1.0.0",
          logicAddress: null,
          metadataUri: null,
          learningRoot: null,
          compiler: "Solidity",
          license: "MIT",
          verified: true,
          balance: null,
          agentType: "merkle_learning",
          erc8004Id: null,
          learningModel: null,
          chainSupport: ["bsc_mainnet"],
          mintFee: null,
        });
      }

      let stored = 0;
      for (const tx of txs) {
        const existingTx = await storage.getEventByTxHash(tx.hash);
        if (existingTx) continue;

        try {
          await storage.createEvent({
            agentId: agent.id,
            type: "transaction",
            txHash: tx.hash,
            blockNumber: parseInt(tx.blockNumber),
            fromAddress: tx.from,
            toAddress: tx.to,
            value: weiToEther(tx.value) + " BNB",
            gasUsed: tx.gasUsed || tx.gas,
            gasPrice: gweiFromWei(tx.gasPrice || "0"),
            status: tx.txreceipt_status === "1" ? "confirmed" : "failed",
            method: deriveMethodFromInput(tx.input || "0x"),
            details: null,
          });
          stored++;
        } catch (e: any) {
          if (!e.message?.includes("duplicate")) {
            console.error(`Error storing BAP-578 tx ${tx.hash}:`, e.message);
          }
        }
      }

      log(`${contractAddr === BAP578_NFA_CONTRACT ? "NFA" : "ERC-8004"}: stored ${stored} new transactions`, "bap578");
      await delay(300);
    } catch (e: any) {
      log(`Error fetching txs for ${contractAddr}: ${e.message}`, "bap578");
    }
  }
}

const BAP578_METHOD_MAP: Record<string, string> = {
  "0x55150c16": "executeAction",
  "0x4590ae21": "setLogicAddress",
  "0xef03c6db": "fundAgent",
  "0x44c9af28": "getState",
  "0x59295330": "getAgentMetadata",
  "0x1af41d4d": "updateAgentMetadata",
  "0x136439dd": "pause",
  "0xfabc1cbc": "unpause",
  "0x7a828b28": "terminate",
  "0x976a605b": "updateLearningTree",
  "0x5d70a074": "getLearningMetrics",
  "0x18042017": "verifyLearning",
  "0x78a9e84a": "grantPermission",
  "0xed665272": "revokePermission",
  "0x823abfd9": "hasPermission",
  "0xe1ff077a": "registerMemoryModule",
  "0x26ffc7b2": "getMemoryModule",
  "0xc9b04adc": "createFromTemplate",
  "0xa9059cbb": "transfer",
  "0x23b872dd": "transferFrom",
  "0x095ea7b3": "approve",
  "0x42842e0e": "safeTransferFrom",
  "0xa22cb465": "setApprovalForAll",
  "0x6352211e": "ownerOf",
  "0x1249c58b": "mint",
  "0x40c10f19": "mint",
  "0xa0712d68": "mint",
};

function deriveMethodFromInput(input: string): string {
  if (!input || input === "0x" || input.length < 10) return "transfer";
  const sig = input.slice(0, 10).toLowerCase();
  return BAP578_METHOD_MAP[sig] || `call_${sig}`;
}

export async function syncBap578Agents(): Promise<void> {
  log("=== Starting BAP-578 Agent Discovery ===", "bap578");

  try {
    const [erc8004Agents, nfaAgents] = await Promise.all([
      fetchErc8004Agents(),
      fetchNfaAgents(),
    ]);

    const nfaMap = new Map<number, NfaAgent>();
    for (const nfa of nfaAgents) {
      nfaMap.set(nfa.tokenId, nfa);
    }

    const erc8004TokenIds = new Set(erc8004Agents.map(a => a.tokenId));
    const standaloneNfas = nfaAgents.filter(n => !erc8004TokenIds.has(n.tokenId));

    log(`Storing ${erc8004Agents.length} ERC-8004 agents (${nfaMap.size} NFAs found, ${standaloneNfas.length} standalone NFAs)...`, "bap578");

    for (const agent of erc8004Agents) {
      try {
        await storeErc8004Agent(agent, nfaMap);
      } catch (e: any) {
        log(`Error storing agent #${agent.tokenId}: ${e.message}`, "bap578");
      }
    }

    for (const nfa of standaloneNfas) {
      try {
        await storeStandaloneNfa(nfa);
      } catch (e: any) {
        log(`Error storing standalone NFA #${nfa.tokenId}: ${e.message}`, "bap578");
      }
    }

    for (const contractAddr of BAP578_CONTRACTS) {
      const existing = await storage.getAgentByAddress(contractAddr.toLowerCase());
      if (!existing) {
        const names: Record<string, string> = {
          [ERC8004_IDENTITY_REGISTRY]: "ERC-8004 Identity Registry",
          [ERC8004_REPUTATION_REGISTRY]: "ERC-8004 Reputation Registry",
          [BAP578_NFA_CONTRACT]: "BAP-578 NFA Registry",
          [NFA_MARKETPLACE]: "BAP-578 NFA Marketplace",
        };
        await storage.upsertAgent({
          address: contractAddr.toLowerCase(),
          name: names[contractAddr] || `BAP-578 Contract`,
          description: `Official ${names[contractAddr] || "BAP-578"} on BNB Chain.`,
          owner: contractAddr.toLowerCase(),
          status: "active",
          version: "1.0.0",
          logicAddress: null,
          metadataUri: null,
          learningRoot: null,
          compiler: "Solidity",
          license: "MIT",
          verified: true,
          balance: null,
          agentType: "merkle_learning",
          erc8004Id: null,
          learningModel: null,
          chainSupport: ["bsc_mainnet"],
          mintFee: null,
        });
      }
    }

    await syncBap578Transactions();

    log(`=== BAP-578 Sync Complete: ${erc8004Agents.length} ERC-8004 agents, ${nfaAgents.length} NFAs, 4 protocol contracts ===`, "bap578");
  } catch (error: any) {
    log(`BAP-578 sync error: ${error.message}`, "bap578");
    console.error("BAP-578 sync error:", error);
  }
}
