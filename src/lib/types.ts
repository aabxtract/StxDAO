export interface KnownDao {
  name: string;
  contractAddress: string;
}

export interface DaoTreasury {
  name:string;
  stxBalance: number;
  lastUpdatedBlock: number;
}

export type ProposalStatus = 'Active' | 'Passed' | 'Rejected';

export interface Proposal {
  id: string;
  title: string;
  status: ProposalStatus;
  daoContractAddress: string;
}

export interface ProposalDetails extends Proposal {
  description: string;
  votes: {
    yes: number;
    no: number;
  };
  creationBlock: number;
  proposer: string;
}
