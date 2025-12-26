/**
 * DAO Registry and Adapter Factory
 * Manages known DAOs and provides the appropriate adapter for each
 */

import type { DaoAdapter } from './dao-adapters/base';
import { GenericDaoAdapter } from './dao-adapters/generic';
import type { KnownDao } from './types';
import type { Network } from './stacks-types';

/**
 * Registry of known DAOs with metadata  
 */
export const KNOWN_DAOS: KnownDao[] = [
  {
    name: 'Stacking DAO',
    // Using the core deployer address as the DAO treasury
    contractAddress: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG',
    network: 'mainnet',
  },
  {
    name: 'Arkadiko DAO',
    // Using the DAO deployer/treasury address
    contractAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    network: 'mainnet',
  },
  {
    name: 'Stackswap DAO',
    // Using the principal address for the DAO
    contractAddress: 'SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275',
    network: 'mainnet',
  },
  // Add more known DAOs as discovered
];

/**
 * Adapter registry - maps adapter types to adapter instances
 */
const adapterRegistry = new Map<string, DaoAdapter>();

/**
 * Get or create an adapter instance
 */
function getAdapterInstance(adapterType: string): DaoAdapter {
  if (!adapterRegistry.has(adapterType)) {
    switch (adapterType) {
      case 'generic':
        adapterRegistry.set(adapterType, new GenericDaoAdapter());
        break;
      // Add more adapter types here as they're implemented
      // case 'executor':
      //   adapterRegistry.set(adapterType, new ExecutorDaoAdapter());
      //   break;
      default:
        adapterRegistry.set(adapterType, new GenericDaoAdapter());
    }
  }
  return adapterRegistry.get(adapterType)!;
}

/**
 * Get the appropriate adapter for a DAO contract address
 * 
 * Strategy:
 * 1. Check if DAO is in known registry - use specific adapter if configured
 * 2. Try to auto-detect DAO framework by probing for signature functions
 * 3. Fall back to generic adapter
 */
export async function getAdapterForDao(
  contractAddress: string,
  network: Network = 'mainnet'
): Promise<DaoAdapter> {
  // Check known DAOs registry
  const knownDao = KNOWN_DAOS.find(
    (dao) => dao.contractAddress.toLowerCase() === contractAddress.toLowerCase()
  );

  if (knownDao && knownDao.adapterType) {
    console.log(`Using ${knownDao.adapterType} adapter for known DAO: ${knownDao.name}`);
    return getAdapterInstance(knownDao.adapterType);
  }

  // Auto-detection logic (Phase 2 - future implementation)
  // For now, we'll always use the generic adapter
  console.log('Using generic adapter for:', contractAddress);
  return getAdapterInstance('generic');
}

/**
 * Get list of known DAOs, optionally filtered by network
 */
export function getKnownDaos(network?: Network): KnownDao[] {
  if (network) {
    return KNOWN_DAOS.filter((dao) => dao.network === network);
  }
  return KNOWN_DAOS;
}

/**
 * Add a DAO to the known DAOs registry
 * Useful for user-discovered DAOs
 */
export function registerDao(dao: KnownDao): void {
  const exists = KNOWN_DAOS.some(
    (d) => d.contractAddress.toLowerCase() === dao.contractAddress.toLowerCase()
  );

  if (!exists) {
    KNOWN_DAOS.push(dao);
    console.log('Registered new DAO:', dao.name);
  }
}
