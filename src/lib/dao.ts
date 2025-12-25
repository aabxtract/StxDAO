import type { KnownDao, DaoTreasury, Proposal, ProposalDetails } from './types';

const MOCK_DAOS: KnownDao[] = [
  { name: 'Bitcoin Devs', contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.bitcoin-devs-dao' },
  { name: 'Stacks Foundation', contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.stacks-foundation-dao' },
  { name: 'CityCoins', contractAddress: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.citycoins-dao' },
];

const MOCK_TREASURIES: Record<string, DaoTreasury> = {
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.bitcoin-devs-dao': {
    name: 'Bitcoin Devs DAO',
    stxBalance: 1250345.67,
    lastUpdatedBlock: 145234,
  },
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.stacks-foundation-dao': {
    name: 'Stacks Foundation DAO',
    stxBalance: 5890112.11,
    lastUpdatedBlock: 145230,
  },
  'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.citycoins-dao': {
    name: 'CityCoins DAO',
    stxBalance: 250000.00,
    lastUpdatedBlock: 145228,
  },
};

const MOCK_PROPOSALS: Record<string, Proposal[]> = {
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.bitcoin-devs-dao': [
    { id: 'bd-001', title: 'Fund Ordinals Research Grant', status: 'Passed', daoContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.bitcoin-devs-dao' },
    { id: 'bd-002', title: 'Update DAO Governance Parameters', status: 'Active', daoContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.bitcoin-devs-dao' },
    { id: 'bd-003', title: 'Onboard New Core Developer', status: 'Rejected', daoContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.bitcoin-devs-dao' },
  ],
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.stacks-foundation-dao': [
    { id: 'sf-015', title: 'Q3 2024 Ecosystem Grants Budget', status: 'Active', daoContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.stacks-foundation-dao' },
    { id: 'sf-014', title: 'Sponsor Stacks Developer Meetups', status: 'Passed', daoContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.stacks-foundation-dao' },
  ],
  'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.citycoins-dao': [],
};

const MOCK_PROPOSAL_DETAILS: Record<string, ProposalDetails> = {
  'bd-001': {
    id: 'bd-001',
    title: 'Fund Ordinals Research Grant',
    status: 'Passed',
    daoContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.bitcoin-devs-dao',
    description: 'Allocate 50,000 STX to a research grant focused on improving Ordinals inscription standards and tooling.',
    votes: { yes: 87, no: 3 },
    creationBlock: 142100,
    proposer: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2A971NMV',
  },
  'bd-002': {
    id: 'bd-002',
    title: 'Update DAO Governance Parameters',
    status: 'Active',
    daoContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.bitcoin-devs-dao',
    description: 'Proposal to reduce the quorum threshold from 20% to 15% to increase governance participation.',
    votes: { yes: 45, no: 21 },
    creationBlock: 145150,
    proposer: 'ST50GEW42N5BCSH8B6C05G2D21A6V4740MECGS35',
  },
  'bd-003': {
    id: 'bd-003',
    title: 'Onboard New Core Developer',
    status: 'Rejected',
    daoContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.bitcoin-devs-dao',
    description: 'This proposal was to onboard a new developer but did not meet the required vote threshold.',
    votes: { yes: 40, no: 51 },
    creationBlock: 143500,
    proposer: 'ST3AM1A56AK2C1XAF3KASP4HY5SGN8AJC92G1A9P',
  },
  'sf-015': {
    id: 'sf-015',
    title: 'Q3 2024 Ecosystem Grants Budget',
    status: 'Active',
    daoContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.stacks-foundation-dao',
    description: 'Set the budget for Q3 2024 ecosystem grants to 1,000,000 STX.',
    votes: { yes: 120, no: 5 },
    creationBlock: 145200,
    proposer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5',
  },
  'sf-014': {
    id: 'sf-014',
    title: 'Sponsor Stacks Developer Meetups',
    status: 'Passed',
    daoContractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5.stacks-foundation-dao',
    description: 'Allocate 100,000 STX to sponsor local developer meetups worldwide to foster community growth.',
    votes: { yes: 250, no: 12 },
    creationBlock: 141800,
    proposer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3K0702X2BGO5',
  },
};

const simulateDelay = () => new Promise(res => setTimeout(res, 500));

export async function getKnownDaos(): Promise<KnownDao[]> {
  await simulateDelay();
  return MOCK_DAOS;
}

export async function getDaoTreasury(contractAddress: string): Promise<DaoTreasury | undefined> {
  await simulateDelay();
  return MOCK_TREASURIES[contractAddress];
}

export async function getDaoProposals(contractAddress: string): Promise<Proposal[]> {
  await simulateDelay();
  return MOCK_PROPOSALS[contractAddress] || [];
}

export async function getProposalDetails(proposalId: string): Promise<ProposalDetails | undefined> {
  await simulateDelay();
  return MOCK_PROPOSAL_DETAILS[proposalId];
}
