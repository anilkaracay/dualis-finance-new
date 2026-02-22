export type AttestationType =
  | 'credit_bureau'
  | 'income_verification'
  | 'business_verification'
  | 'kyc_completion'
  | 'tifa_performance'
  | 'cross_protocol';

export interface ZKProof {
  proofData: string;
  verifierKey: string;
  publicInputs: string[];
  circuit: string;
  generatedAt: string; // ISO 8601
}

export interface OffChainAttestation {
  id: string;
  type: AttestationType;
  provider: string; // findeks, experian, transunion, tifa
  claimedRange: string; // excellent, good, above_700
  proof: ZKProof;
  issuedAt: string;
  expiresAt: string;
  revoked: boolean;
  verified: boolean;
}

export interface AttestationBundle {
  partyId: string;
  attestations: OffChainAttestation[];
  lastVerified: string;
}
