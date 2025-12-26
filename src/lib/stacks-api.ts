/**
 * Low-level Stacks API Client
 * Handles all raw HTTP calls to the Stacks blockchain API
 */

import { cvToJSON, hexToCV } from '@stacks/transactions';
import type {
  Network,
  NetworkConfig,
  NETWORKS,
  AccountBalanceResponse,
  ReadOnlyFunctionResponse,
  ContractInfo,
  BlockInfo,
  ApiError,
} from './stacks-types';

/**
 * Get network configuration
 */
export function getNetworkConfig(network: Network = 'mainnet'): NetworkConfig {
  const config: Record<Network, NetworkConfig> = {
    mainnet: { url: 'https://api.mainnet.hiro.so', network: 'mainnet' },
    testnet: { url: 'https://api.testnet.hiro.so', network: 'testnet' },
  };
  return config[network];
}

/**
 * Retry configuration
 */
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Exponential backoff retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // If rate limited (429), retry with exponential backoff
    if (response.status === 429 && retries > 0) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries);
      console.warn(`Rate limited. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }

    // If server error (5xx) and retries remaining, retry
    if (response.status >= 500 && retries > 0) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries);
      console.warn(`Server error. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries);
      console.warn(`Network error. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Convert microSTX to STX
 */
export function microStxToStx(microStx: string | number): number {
  const amount = typeof microStx === 'string' ? parseInt(microStx, 10) : microStx;
  return amount / 1_000_000;
}

/**
 * Convert STX to microSTX
 */
export function stxToMicroStx(stx: number): number {
  return Math.floor(stx * 1_000_000);
}

/**
 * Validate Stacks address format
 */
export function isValidStacksAddress(address: string): boolean {
  // Stacks addresses: SP or ST followed by alphanumeric characters
  // Contract addresses: {address}.{contract-name}
  const addressRegex = /^(SP|ST)[0-9A-Z]{38,41}(\.[a-z][a-z0-9-]*)?$/i;
  return addressRegex.test(address);
}

/**
 * Parse contract identifier into principal and contract name
 */
export function parseContractId(contractId: string): {
  principal: string;
  contractName: string;
} | null {
  const parts = contractId.split('.');
  if (parts.length !== 2) return null;
  return {
    principal: parts[0],
    contractName: parts[1],
  };
}

/**
 * Fetch account balance for a given address
 */
export async function fetchAccountBalance(
  address: string,
  network: Network = 'mainnet'
): Promise<AccountBalanceResponse> {
  if (!isValidStacksAddress(address)) {
    throw new Error(`Invalid Stacks address format: ${address}`);
  }

  // Extract principal if this is a contract address (format: PRINCIPAL.contract-name)
  const principal = address.includes('.') ? address.split('.')[0] : address;

  const config = getNetworkConfig(network);
  // Use the V1 endpoint for address balances (v2 doesn't exist!)
  const url = `${config.url}/extended/v1/address/${principal}/balances`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'Unknown error',
      status: response.status,
    }));
    throw new Error(
      `Failed to fetch balance: ${errorData.error || errorData.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Call a read-only function on a smart contract
 */
export async function callReadOnlyFunction(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: string[] = [],
  sender: string = contractAddress,
  network: Network = 'mainnet'
): Promise<any> {
  const config = getNetworkConfig(network);
  const url = `${config.url}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;

  const response = await fetchWithRetry(url, {
    method: 'POST',
    body: JSON.stringify({
      sender,
      arguments: functionArgs,
    }),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'Unknown error',
      status: response.status,
    }));
    throw new Error(
      `Failed to call read-only function: ${errorData.error || errorData.message || response.statusText}`
    );
  }

  const result: ReadOnlyFunctionResponse = await response.json();

  if (!result.okay) {
    throw new Error(`Contract call failed: ${result.cause || 'Unknown error'}`);
  }

  // Parse the hex-encoded Clarity value into JSON
  try {
    const clarityValue = hexToCV(result.result);
    return cvToJSON(clarityValue);
  } catch (error) {
    console.warn('Failed to parse Clarity value:', error);
    return result.result; // Return raw hex if parsing fails
  }
}

/**
 * Get contract information
 */
export async function getContractInfo(
  contractId: string,
  network: Network = 'mainnet'
): Promise<ContractInfo> {
  const parsed = parseContractId(contractId);
  if (!parsed) {
    throw new Error(`Invalid contract ID format: ${contractId}`);
  }

  const config = getNetworkConfig(network);
  const url = `${config.url}/v2/contracts/interface/${parsed.principal}/${parsed.contractName}`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Contract not found: ${contractId}`);
    }
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'Unknown error',
      status: response.status,
    }));
    throw new Error(
      `Failed to fetch contract info: ${errorData.error || errorData.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get block information by height
 */
export async function getBlockInfo(
  height: number,
  network: Network = 'mainnet'
): Promise<BlockInfo> {
  const config = getNetworkConfig(network);
  const url = `${config.url}/extended/v1/block/by_height/${height}`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'Unknown error',
      status: response.status,
    }));
    throw new Error(
      `Failed to fetch block info: ${errorData.error || errorData.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get latest block height
 */
export async function getLatestBlockHeight(network: Network = 'mainnet'): Promise<number> {
  const config = getNetworkConfig(network);
  const url = `${config.url}/extended/v1/block`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error('Failed to fetch latest block');
  }

  const data = await response.json();
  return data.results?.[0]?.height || 0;
}

/**
 * Format STX amount for display
 */
export function formatStxAmount(microStx: string | number, decimals: number = 2): string {
  const stx = microStxToStx(microStx);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(stx);
}
