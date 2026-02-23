'use client';

import { create } from 'zustand';
import type {
  GovernanceProposal,
  GovernanceVote,
  Delegation,
  DualTokenBalance,
  GovernanceConfigData,
  VoteResults,
} from '@dualis/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GovernanceState {
  proposals: GovernanceProposal[];
  currentProposal: GovernanceProposal | null;
  currentVotes: VoteResults | null;
  userVote: GovernanceVote | null;
  delegations: Delegation[];
  votingPower: DualTokenBalance | null;
  config: GovernanceConfigData | null;
  loading: boolean;
  error: string | null;
}

interface GovernanceActions {
  setProposals: (proposals: GovernanceProposal[]) => void;
  setCurrentProposal: (proposal: GovernanceProposal | null) => void;
  setCurrentVotes: (votes: VoteResults | null) => void;
  setUserVote: (vote: GovernanceVote | null) => void;
  setDelegations: (delegations: Delegation[]) => void;
  setVotingPower: (power: DualTokenBalance | null) => void;
  setConfig: (config: GovernanceConfigData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const initialState: GovernanceState = {
  proposals: [],
  currentProposal: null,
  currentVotes: null,
  userVote: null,
  delegations: [],
  votingPower: null,
  config: null,
  loading: false,
  error: null,
};

export const useGovernanceStore = create<GovernanceState & GovernanceActions>(
  (set) => ({
    ...initialState,

    setProposals: (proposals) => set({ proposals }),
    setCurrentProposal: (currentProposal) => set({ currentProposal }),
    setCurrentVotes: (currentVotes) => set({ currentVotes }),
    setUserVote: (userVote) => set({ userVote }),
    setDelegations: (delegations) => set({ delegations }),
    setVotingPower: (votingPower) => set({ votingPower }),
    setConfig: (config) => set({ config }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    reset: () => set(initialState),
  }),
);
