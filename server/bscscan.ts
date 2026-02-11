const BSC_RPC_URL = "https://bsc-dataseed.binance.org/";
const ETHERSCAN_V2_URL = "https://api.etherscan.io/v2/api";
const API_KEY = process.env.BSCSCAN_API_KEY || "";
const REQUEST_INTERVAL_MS = 220;

let lastApiRequestTime = 0;

async function rpcCall(method: string, params: any[] = []): Promise<any> {
  const response = await fetch(BSC_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  if (!response.ok) {
    throw new Error(`BSC RPC error: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(`BSC RPC error: ${data.error.message}`);
  }
  return data.result;
}

async function rateLimitedEtherscanFetch(params: Record<string, string>): Promise<any> {
  const now = Date.now();
  const timeSince = now - lastApiRequestTime;
  if (timeSince < REQUEST_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL_MS - timeSince));
  }
  lastApiRequestTime = Date.now();

  const searchParams = new URLSearchParams({ chainid: "56", ...params, apikey: API_KEY });
  const url = `${ETHERSCAN_V2_URL}?${searchParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Etherscan V2 error: ${response.status}`);
  }
  return response.json();
}

export async function getLatestBlockNumber(): Promise<number> {
  const result = await rpcCall("eth_blockNumber");
  return parseInt(result, 16);
}

export interface BscBlock {
  number: number;
  hash: string;
  parentHash: string;
  miner: string;
  gasUsed: string;
  gasLimit: string;
  timestamp: number;
  transactions: BscTransaction[];
}

export interface BscTransaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
  blockNumber: string;
}

export async function getBlockByNumber(blockNumber: number): Promise<BscBlock | null> {
  const hex = "0x" + blockNumber.toString(16);
  const result = await rpcCall("eth_getBlockByNumber", [hex, true]);
  if (!result) return null;

  return {
    number: parseInt(result.number, 16),
    hash: result.hash,
    parentHash: result.parentHash,
    miner: result.miner,
    gasUsed: parseInt(result.gasUsed, 16).toLocaleString(),
    gasLimit: parseInt(result.gasLimit, 16).toLocaleString(),
    timestamp: parseInt(result.timestamp, 16),
    transactions: (result.transactions || []).map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      input: tx.input,
      blockNumber: tx.blockNumber,
    })),
  };
}

export interface BscContractInfo {
  sourceCode: string;
  contractName: string;
  compilerVersion: string;
  optimizationUsed: string;
  abi: string;
  licenseType: string;
  implementation: string;
  proxy: string;
}

export async function getContractSourceCode(address: string): Promise<BscContractInfo | null> {
  const data = await rateLimitedEtherscanFetch({
    module: "contract",
    action: "getsourcecode",
    address,
  });
  if (!data.result || data.result.length === 0) return null;

  const info = data.result[0];
  return {
    sourceCode: info.SourceCode || "",
    contractName: info.ContractName || "",
    compilerVersion: info.CompilerVersion || "",
    optimizationUsed: info.OptimizationUsed || "",
    abi: info.ABI || "",
    licenseType: info.LicenseType || "",
    implementation: info.Implementation || "",
    proxy: info.Proxy || "",
  };
}

export async function getBalance(address: string): Promise<string> {
  const result = await rpcCall("eth_getBalance", [address, "latest"]);
  const weiBalance = BigInt(result || "0");
  const bnb = Number(weiBalance) / 1e18;
  return bnb.toFixed(6) + " BNB";
}

export function isContract(input: string): boolean {
  return input !== "0x" && input.length > 2;
}

export function weiToEther(wei: string): string {
  try {
    const val = BigInt(wei);
    const ether = Number(val) / 1e18;
    if (ether === 0) return "0";
    if (ether < 0.0001) return ether.toExponential(4);
    return ether.toFixed(6);
  } catch {
    return "0";
  }
}

export function gweiFromWei(wei: string): string {
  try {
    const val = BigInt(wei);
    const gwei = Number(val) / 1e9;
    return gwei.toFixed(2) + " Gwei";
  } catch {
    return "0 Gwei";
  }
}


export async function getRuntimeBytecode(address: string): Promise<string> {
  const code = await rpcCall("eth_getCode", [address, "latest"]);
  return typeof code === "string" ? code.toLowerCase() : "0x";
}
export async function ethCall(to: string, data: string): Promise<string> {
  return rpcCall("eth_call", [{ to, data }, "latest"]);
}

function encodeUint256(n: number): string {
  return n.toString(16).padStart(64, "0");
}

function decodeUint256(hex: string): number {
  if (!hex || hex === "0x") return 0;
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  return parseInt(clean.slice(0, 64), 16);
}

function decodeAddress(hex: string): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  return "0x" + clean.slice(24, 64);
}

function decodeString(hex: string): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length < 128) return "";
  const offset = parseInt(clean.slice(0, 64), 16) * 2;
  const length = parseInt(clean.slice(offset, offset + 64), 16);
  const strHex = clean.slice(offset + 64, offset + 64 + length * 2);
  let str = "";
  for (let i = 0; i < strHex.length; i += 2) {
    str += String.fromCharCode(parseInt(strHex.slice(i, i + 2), 16));
  }
  return str;
}

export async function erc721TotalSupply(contractAddress: string): Promise<number> {
  const result = await ethCall(contractAddress, "0x18160ddd");
  return decodeUint256(result);
}

export async function erc721OwnerOf(contractAddress: string, tokenId: number): Promise<string> {
  const data = "0x6352211e" + encodeUint256(tokenId);
  const result = await ethCall(contractAddress, data);
  return decodeAddress(result);
}

export async function erc721TokenURI(contractAddress: string, tokenId: number): Promise<string> {
  const data = "0xc87b56dd" + encodeUint256(tokenId);
  const result = await ethCall(contractAddress, data);
  return decodeString(result);
}

export async function getContractTransactions(
  address: string,
  startBlock = 0,
  endBlock = 99999999,
  page = 1,
  offset = 100,
  sort = "desc"
): Promise<any[]> {
  const data = await rateLimitedEtherscanFetch({
    module: "account",
    action: "txlist",
    address,
    startblock: startBlock.toString(),
    endblock: endBlock.toString(),
    page: page.toString(),
    offset: offset.toString(),
    sort,
  });
  if (!data.result || !Array.isArray(data.result)) return [];
  return data.result;
}

export async function fetchTokenMetadata(uri: string): Promise<any | null> {
  try {
    let url = uri;
    if (uri.startsWith("ipfs://")) {
      url = "https://ipfs.io/ipfs/" + uri.slice(7);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
