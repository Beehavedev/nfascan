import { storage } from "./storage";
import {
  getLatestBlockNumber,
  getBlockByNumber,
  getContractSourceCode,
  getBalance,
  getRuntimeBytecode,
  getContractTransactions,
  isContract,
  weiToEther,
  gweiFromWei,
} from "./bscscan";
import { log } from "./index";

const BLOCKS_PER_SYNC = 20;
const SYNC_INTERVAL_MS = 60_000;
const MAX_CONTRACTS_PER_BLOCK = 5;

let syncTimer: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

// BAP-578 function selectors computed via keccak256 from the official IBAP578/ILearningModule interfaces
// Spec: https://github.com/bnb-chain/BEPs/blob/master/BAPs/BAP-578.md
const BAP578_SELECTORS: Record<string, string> = {
  // IBAP578 Core: executeAction(uint256,bytes) -> 0x55150c16
  "0x55150c16": "executeAction",
  // IBAP578 Core: setLogicAddress(uint256,address) -> 0x4590ae21
  "0x4590ae21": "setLogicAddress",
  // IBAP578 Core: fundAgent(uint256) -> 0xef03c6db
  "0xef03c6db": "fundAgent",
  // IBAP578 Core: getState(uint256) -> 0x44c9af28
  "0x44c9af28": "getState",
  // IBAP578 Core: getAgentMetadata(uint256) -> 0x59295330
  "0x59295330": "getAgentMetadata",
  // IBAP578 Core: updateAgentMetadata(uint256,(string,string,string,string,string,bytes32)) -> 0x1af41d4d
  "0x1af41d4d": "updateAgentMetadata",
  // IBAP578 Lifecycle: pause(uint256) -> 0x136439dd
  "0x136439dd": "pause",
  // IBAP578 Lifecycle: unpause(uint256) -> 0xfabc1cbc
  "0xfabc1cbc": "unpause",
  // IBAP578 Lifecycle: terminate(uint256) -> 0x7a828b28
  "0x7a828b28": "terminate",
  // ILearningModule: updateLearningTree(uint256,bytes32,bytes32[]) -> 0x976a605b
  "0x976a605b": "updateLearningTree",
  // ILearningModule: getLearningMetrics(uint256) -> 0x5d70a074
  "0x5d70a074": "getLearningMetrics",
  // ILearningModule: verifyLearning(uint256,bytes32[]) -> 0x18042017
  "0x18042017": "verifyLearning",
  // Permission System: grantPermission(uint256,address,uint8) -> 0x78a9e84a
  "0x78a9e84a": "grantPermission",
  // Permission System: revokePermission(uint256,address,uint8) -> 0xed665272
  "0xed665272": "revokePermission",
  // Permission System: hasPermission(uint256,address,uint8) -> 0x823abfd9
  "0x823abfd9": "hasPermission",
  // Memory Module: registerMemoryModule(uint256,address) -> 0xe1ff077a
  "0xe1ff077a": "registerMemoryModule",
  // Memory Module: getMemoryModule(uint256) -> 0x26ffc7b2
  "0x26ffc7b2": "getMemoryModule",
  // Agent Templates: createFromTemplate(uint256,bytes) -> 0xc9b04adc
  "0xc9b04adc": "createFromTemplate",
};

const BAP578_SELECTOR_SET = new Set(Object.keys(BAP578_SELECTORS));

const BAP578_EVENT_HINTS: Record<string, string[]> = {
  updateLearningTree: ["updatelearningtree", "learning", "merkle", "snapshot"],
  verifyLearning: ["verifylearning", "learningverified", "proof"],
};

function selectorsPresentInBytecode(bytecode: string): string[] {
  if (!bytecode || bytecode === "0x") return [];
  return Object.keys(BAP578_SELECTORS).filter((selector) => bytecode.includes(selector.slice(2).toLowerCase()));
}

function checkBehaviorConsistency(claimedMethod: string, txs: any[]): { hasCalls: boolean; hasEventHints: boolean } {
  const matched = txs.filter((tx: any) => deriveMethodName(tx.input || "0x") === claimedMethod);
  if (matched.length === 0) return { hasCalls: false, hasEventHints: false };

  const hints = BAP578_EVENT_HINTS[claimedMethod] || [];
  const hasEventHints = matched.some((tx: any) => {
    const fn = (tx.functionName || "").toLowerCase();
    const logs = (tx.logs || "").toLowerCase();
    const method = (tx.methodId || "").toLowerCase();
    const haystack = `${fn} ${logs} ${method}`;
    return hints.some((hint) => haystack.includes(hint));
  });

  return { hasCalls: true, hasEventHints };
}

function deriveMethodName(input: string): string {
  if (!input || input === "0x" || input.length < 10) return "transfer";
  const sig = input.slice(0, 10).toLowerCase();
  const knownMethods: Record<string, string> = {
    ...BAP578_SELECTORS,

    "0xa9059cbb": "transfer",
    "0x23b872dd": "transferFrom",
    "0x095ea7b3": "approve",
    "0x42842e0e": "safeTransferFrom",
    "0xb88d4fde": "safeTransferFrom",
    "0xa22cb465": "setApprovalForAll",
    "0x6352211e": "ownerOf",
    "0x70a08231": "balanceOf",
    "0xc87b56dd": "tokenURI",
    "0x01ffc9a7": "supportsInterface",

    "0x38ed1739": "swapExactTokensForTokens",
    "0x7ff36ab5": "swapExactETHForTokens",
    "0x18cbafe5": "swapExactTokensForETH",
    "0xe8e33700": "addLiquidity",
    "0xf305d719": "addLiquidityETH",
    "0xbaa2abde": "removeLiquidity",
    "0x7b6e9862": "removeLiquidityETH",
    "0xa0712d68": "mint",
    "0x40c10f19": "mint",
    "0x42966c68": "burn",
    "0x2e1a7d4d": "withdraw",
    "0xb6b55f25": "deposit",
    "0xd0e30db0": "deposit",
    "0x3ccfd60b": "withdraw",
    "0x150b7a02": "onERC721Received",
    "0x1249c58b": "mint",
    "0xe2bbb158": "deposit",
    "0x441a3e70": "withdraw",
    "0xc9c65396": "createPair",
    "0x5c11d795": "swapExactTokensForTokensSupportingFeeOnTransferTokens",
    "0x791ac947": "swap",
    "0xf2fde38b": "transferOwnership",
  };
  return knownMethods[sig] || `call_${sig}`;
}

function isBap578Transaction(input: string): boolean {
  if (!input || input.length < 10) return false;
  return BAP578_SELECTOR_SET.has(input.slice(0, 10).toLowerCase());
}

const BAP578_CORE_FUNCTIONS = [
  "executeAction", "fundAgent", "getState", "pause", "unpause", "terminate",
  "setLogicAddress", "getAgentMetadata", "updateAgentMetadata",
];
const BAP578_LEARNING_FUNCTIONS = [
  "updateLearningTree", "getLearningMetrics", "verifyLearning",
];
const BAP578_PERMISSION_FUNCTIONS = [
  "grantPermission", "revokePermission", "hasPermission",
];
const BAP578_MEMORY_FUNCTIONS = [
  "registerMemoryModule", "getMemoryModule",
];

function checkBap578Compliance(contractInfo: { sourceCode: string; abi: string; contractName: string } | null): {
  agentType: "merkle_learning" | "json_light";
  bap578Score: number;
  hasLearningModule: boolean;
  hasPermissionSystem: boolean;
  hasMemoryModule: boolean;
} {
  const result = {
    agentType: "json_light" as "merkle_learning" | "json_light",
    bap578Score: 0,
    hasLearningModule: false,
    hasPermissionSystem: false,
    hasMemoryModule: false,
  };

  if (!contractInfo) return result;

  const abiFunctions = new Set<string>();
  try {
    const abi = JSON.parse(contractInfo.abi);
    if (Array.isArray(abi)) {
      for (const item of abi) {
        if (item.type === "function" && item.name) {
          abiFunctions.add(item.name);
        }
      }
    }
  } catch {}

  const src = (contractInfo.sourceCode || "").toLowerCase();
  const name = contractInfo.contractName.toLowerCase();

  let coreMatches = 0;
  for (const fn of BAP578_CORE_FUNCTIONS) {
    if (abiFunctions.has(fn) || src.includes(fn.toLowerCase())) coreMatches++;
  }

  let learningMatches = 0;
  for (const fn of BAP578_LEARNING_FUNCTIONS) {
    if (abiFunctions.has(fn) || src.includes(fn.toLowerCase())) learningMatches++;
  }

  let permMatches = 0;
  for (const fn of BAP578_PERMISSION_FUNCTIONS) {
    if (abiFunctions.has(fn) || src.includes(fn.toLowerCase())) permMatches++;
  }

  let memMatches = 0;
  for (const fn of BAP578_MEMORY_FUNCTIONS) {
    if (abiFunctions.has(fn) || src.includes(fn.toLowerCase())) memMatches++;
  }

  const hasBap578Keywords =
    src.includes("bap578") || src.includes("bap-578") ||
    src.includes("nonfungibleagent") || src.includes("non_fungible_agent") ||
    src.includes("ibap578") ||
    (src.includes("merkle") && src.includes("learning")) ||
    (name.includes("agent") && (src.includes("executeaction") || src.includes("fundagent")));

  result.hasLearningModule = learningMatches >= 2;
  result.hasPermissionSystem = permMatches >= 2;
  result.hasMemoryModule = memMatches >= 1;

  if (coreMatches >= 3 || hasBap578Keywords) {
    result.bap578Score = Math.min(100, coreMatches * 12 + learningMatches * 15 + permMatches * 8 + memMatches * 5 + (hasBap578Keywords ? 20 : 0));
  }

  if (result.hasLearningModule || (hasBap578Keywords && src.includes("merkle"))) {
    result.agentType = "merkle_learning";
  } else if (coreMatches >= 3 || hasBap578Keywords) {
    result.agentType = "json_light";
  }

  return result;
}

function deriveLearningModel(contractInfo: { sourceCode: string; contractName: string } | null, bap578Score: number): string | null {
  if (!contractInfo || !contractInfo.sourceCode || bap578Score === 0) return null;
  const src = contractInfo.sourceCode.toLowerCase();
  if (src.includes("reinforcement") || src.includes("reward")) return "reinforcement";
  if (src.includes("fine_tune") || src.includes("finetune") || src.includes("training")) return "fine_tuning";
  if (src.includes("rag") && (src.includes("retrieval") || src.includes("vault"))) return "rag";
  if (src.includes("hybrid") || src.includes("ensemble")) return "hybrid";
  if (src.includes("mcp") || src.includes("model_context")) return "mcp";
  return null;
}

async function processBlock(blockNumber: number): Promise<{ contractAddresses: Set<string>; txCount: number }> {
  const contractAddresses = new Set<string>();

  const block = await getBlockByNumber(blockNumber);
  if (!block) return { contractAddresses, txCount: 0 };

  const blockTimestamp = new Date(block.timestamp * 1000);
  let contractCount = 0;

  await storage.upsertBlock({
    blockNumber: block.number,
    hash: block.hash,
    parentHash: block.parentHash,
    agentCount: 0,
    eventCount: block.transactions.length,
    gasUsed: block.gasUsed,
    gasLimit: block.gasLimit,
    validator: block.miner,
    timestamp: blockTimestamp,
  });

  for (const tx of block.transactions) {
    if (tx.to && isContract(tx.input || "0x")) {
      contractAddresses.add(tx.to.toLowerCase());
      contractCount++;
    }
  }

  const limitedContracts = Array.from(contractAddresses).slice(0, MAX_CONTRACTS_PER_BLOCK);

  for (const tx of block.transactions.slice(0, 50)) {
    const toAddr = tx.to?.toLowerCase();
    if (!toAddr || !limitedContracts.includes(toAddr)) continue;

    const existingTx = await storage.getEventByTxHash(tx.hash);
    if (existingTx) continue;

    let agent = await storage.getAgentByAddress(toAddr);
    if (!agent) {
      agent = await storage.upsertAgent({
        address: toAddr,
        name: `Contract ${toAddr.slice(0, 10)}...`,
        description: null,
        owner: tx.from,
        status: "active",
        version: "1.0.0",
        logicAddress: null,
        metadataUri: null,
        learningRoot: null,
        compiler: null,
        license: null,
        verified: false,
        balance: null,
        agentType: "json_light",
        erc8004Id: null,
        learningModel: null,
        chainSupport: ["bsc_mainnet"],
        mintFee: null,
      });
    }

    try {
      await storage.createEvent({
        agentId: agent.id,
        type: "transaction",
        txHash: tx.hash,
        blockNumber: block.number,
        fromAddress: tx.from,
        toAddress: tx.to,
        value: weiToEther(tx.value) + " BNB",
        gasUsed: parseInt(tx.gas, 16).toString(),
        gasPrice: gweiFromWei(tx.gasPrice),
        status: "confirmed",
        method: deriveMethodName(tx.input || "0x"),
        details: null,
      });
      await createReceiptFromTx(agent.id, tx, block.number);
    } catch (e: any) {
      if (!e.message?.includes("duplicate")) {
        console.error(`Error creating event for tx ${tx.hash}:`, e.message);
      }
    }
  }

  await storage.upsertBlock({
    blockNumber: block.number,
    hash: block.hash,
    parentHash: block.parentHash,
    agentCount: contractCount,
    eventCount: block.transactions.length,
    gasUsed: block.gasUsed,
    gasLimit: block.gasLimit,
    validator: block.miner,
    timestamp: blockTimestamp,
  });

  return { contractAddresses, txCount: block.transactions.length };
}

async function enrichContract(address: string): Promise<void> {
  try {
    const [contractInfo, balance, runtimeBytecode, txHistory] = await Promise.all([
      getContractSourceCode(address),
      getBalance(address),
      getRuntimeBytecode(address),
      getContractTransactions(address, 0, 99999999, 1, 50, "desc"),
    ]);

    const verified = !!(contractInfo && contractInfo.sourceCode && contractInfo.sourceCode !== "");
    const compliance = checkBap578Compliance(contractInfo);
    const learningModel = deriveLearningModel(contractInfo, compliance.bap578Score);

    const erc8004Id = null;

    const name = contractInfo?.contractName
      ? contractInfo.contractName
      : `Contract ${address.slice(0, 10)}...`;

    const compiler = contractInfo?.compilerVersion || null;
    const license = contractInfo?.licenseType || null;

    const learningRoot: string | null = null;

    let description = "";
    if (compliance.bap578Score > 0) {
      description = `BAP-578 compliant agent (score: ${compliance.bap578Score}/100). `;
      if (compliance.hasLearningModule) description += "Learning module detected. ";
      if (compliance.hasPermissionSystem) description += "Permission system detected. ";
      if (compliance.hasMemoryModule) description += "Memory module detected. ";
    }
    description += verified
      ? `Verified BSC contract${contractInfo?.contractName ? ` (${contractInfo.contractName})` : ""}. Compiler: ${compiler || "unknown"}.`
      : `Unverified BSC contract at ${address}.`;

    const selectorHits = selectorsPresentInBytecode(runtimeBytecode);
    if (selectorHits.length > 0) {
      const namedHits = selectorHits.map((selector) => BAP578_SELECTORS[selector]).filter(Boolean);
      description += ` Bytecode selector hits: ${namedHits.join(", ")}.`;
    }

    if (compliance.bap578Score > 0) {
      const learningConsistency = checkBehaviorConsistency("updateLearningTree", txHistory);
      if (learningConsistency.hasCalls && !learningConsistency.hasEventHints) {
        description += " Warning: updateLearningTree calls observed without matching learning event hints in recent tx history.";
      } else if (learningConsistency.hasCalls && learningConsistency.hasEventHints) {
        description += " updateLearningTree behavior has matching learning event hints in recent tx history.";
      }
    }

    const isProxy = contractInfo?.proxy === "1" || contractInfo?.implementation !== "";
    const logicAddress = isProxy && contractInfo?.implementation ? contractInfo.implementation : null;

    await storage.upsertAgent({
      address: address.toLowerCase(),
      name,
      description,
      owner: address,
      status: "active",
      version: "1.0.0",
      logicAddress,
      metadataUri: null,
      learningRoot,
      compiler,
      license,
      verified,
      balance,
      agentType: compliance.agentType,
      erc8004Id,
      learningModel,
      chainSupport: ["bsc_mainnet"],
      mintFee: null,
    });

    if (compliance.bap578Score > 0) {
      log(`BAP-578 agent detected: ${name} (${address}) - score: ${compliance.bap578Score}, type: ${compliance.agentType}`, "sync");
    }
  } catch (error: any) {
    console.error(`Error enriching contract ${address}:`, error.message);
  }
}

async function createReceiptFromTx(
  agentId: string,
  tx: { hash: string; from: string; to: string | null; value: string; gas: string },
  blockNumber: number
): Promise<void> {
  try {
    await storage.createReceipt({
      agentId,
      action: "contract_call",
      txHash: tx.hash,
      fromAddress: tx.from,
      toAddress: tx.to || tx.from,
      value: weiToEther(tx.value) + " BNB",
      status: "confirmed",
      blockNumber,
      gasUsed: parseInt(tx.gas, 16).toString(),
    });
  } catch (e: any) {
    if (!e.message?.includes("duplicate")) {
      console.error(`Error creating receipt:`, e.message);
    }
  }
}

export async function runInitialSync(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    log("Starting live BSC data sync...", "sync");

    const lastSynced = await storage.getLastSyncedBlock();
    const latestBlock = await getLatestBlockNumber();

    log(`Latest BSC block: ${latestBlock}, last synced: ${lastSynced}`, "sync");

    const startBlock = lastSynced > 0 ? lastSynced + 1 : latestBlock - BLOCKS_PER_SYNC;
    const endBlock = Math.min(startBlock + BLOCKS_PER_SYNC - 1, latestBlock);

    const allContracts = new Set<string>();

    for (let bn = startBlock; bn <= endBlock; bn++) {
      try {
        const { contractAddresses, txCount } = await processBlock(bn);
        contractAddresses.forEach((addr) => allContracts.add(addr));
        log(`Synced block ${bn} (${txCount} txns, ${contractAddresses.size} contracts)`, "sync");
      } catch (error: any) {
        console.error(`Error syncing block ${bn}:`, error.message);
      }
    }

    log(`Enriching ${allContracts.size} discovered contracts...`, "sync");
    const contractArr = Array.from(allContracts);
    for (let i = 0; i < Math.min(contractArr.length, 15); i++) {
      await enrichContract(contractArr[i]);
    }

    await storage.setLastSyncedBlock(endBlock);
    log(`Sync complete. Synced blocks ${startBlock}-${endBlock}, enriched ${Math.min(contractArr.length, 15)} contracts.`, "sync");
  } catch (error: any) {
    console.error("Sync error:", error.message);
  } finally {
    isSyncing = false;
  }
}

async function periodicSync(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const lastSynced = await storage.getLastSyncedBlock();
    const latestBlock = await getLatestBlockNumber();

    if (latestBlock <= lastSynced) {
      isSyncing = false;
      return;
    }

    const blocksToSync = Math.min(latestBlock - lastSynced, 5);
    const startBlock = lastSynced + 1;
    const endBlock = startBlock + blocksToSync - 1;

    const allContracts = new Set<string>();

    for (let bn = startBlock; bn <= endBlock; bn++) {
      try {
        const { contractAddresses } = await processBlock(bn);
        contractAddresses.forEach((addr) => allContracts.add(addr));
      } catch (error: any) {
        console.error(`Periodic sync error block ${bn}:`, error.message);
      }
    }

    const contractArr = Array.from(allContracts);
    for (let i = 0; i < Math.min(contractArr.length, 5); i++) {
      await enrichContract(contractArr[i]);
    }

    await storage.setLastSyncedBlock(endBlock);
    log(`Periodic sync: blocks ${startBlock}-${endBlock} (${allContracts.size} contracts)`, "sync");
  } catch (error: any) {
    console.error("Periodic sync error:", error.message);
  } finally {
    isSyncing = false;
  }
}

export function startPeriodicSync(): void {
  if (syncTimer) return;
  syncTimer = setInterval(periodicSync, SYNC_INTERVAL_MS);
  log(`Periodic sync started (every ${SYNC_INTERVAL_MS / 1000}s)`, "sync");
}

export function stopPeriodicSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}
