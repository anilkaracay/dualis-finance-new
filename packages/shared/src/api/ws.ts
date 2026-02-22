/** WebSocket message types */
export type WsMessageType =
  | 'auth'
  | 'auth:success'
  | 'auth:error'
  | 'subscribe'
  | 'unsubscribe'
  | 'subscribed'
  | 'unsubscribed'
  | 'data'
  | 'error'
  | 'ping'
  | 'pong';

/** Base WebSocket message */
export interface WsMessage {
  type: WsMessageType;
}

/** Auth request */
export interface WsAuthMessage extends WsMessage {
  type: 'auth';
  token: string;
}

/** Auth success response */
export interface WsAuthSuccess extends WsMessage {
  type: 'auth:success';
  partyId: string;
}

/** Auth error response */
export interface WsAuthError extends WsMessage {
  type: 'auth:error';
  message: string;
}

/** Subscribe to channel */
export interface WsSubscribeMessage extends WsMessage {
  type: 'subscribe';
  channel: string;
}

/** Unsubscribe from channel */
export interface WsUnsubscribeMessage extends WsMessage {
  type: 'unsubscribe';
  channel: string;
}

/** Subscription confirmation */
export interface WsSubscribedMessage extends WsMessage {
  type: 'subscribed';
  channel: string;
}

/** Unsubscription confirmation */
export interface WsUnsubscribedMessage extends WsMessage {
  type: 'unsubscribed';
  channel: string;
}

/** Data message from a channel */
export interface WsDataMessage<T = unknown> extends WsMessage {
  type: 'data';
  channel: string;
  payload: T;
}

/** Error message */
export interface WsErrorMessage extends WsMessage {
  type: 'error';
  message: string;
  code?: string;
}

/** Ping message */
export interface WsPingMessage extends WsMessage {
  type: 'ping';
}

/** Pong response */
export interface WsPongMessage extends WsMessage {
  type: 'pong';
  ts: string;
}

/** Union type for all client-to-server messages */
export type WsClientMessage =
  | WsAuthMessage
  | WsSubscribeMessage
  | WsUnsubscribeMessage
  | WsPingMessage;

/** Union type for all server-to-client messages */
export type WsServerMessage =
  | WsAuthSuccess
  | WsAuthError
  | WsSubscribedMessage
  | WsUnsubscribedMessage
  | WsDataMessage
  | WsErrorMessage
  | WsPongMessage;

/** Price update payload */
export interface WsPricePayload {
  asset: string;
  price: number;
  change: number;
  ts: string;
}

/** Pool update payload */
export interface WsPoolPayload {
  poolId: string;
  totalSupply: number;
  totalBorrow: number;
  utilization: number;
  supplyAPY: number;
  borrowAPY: number;
  ts: string;
}

/** Position health update payload */
export interface WsPositionPayload {
  positionId: string;
  healthFactor: number;
  collateralValueUSD: number;
  borrowValueUSD: number;
  ts: string;
}

/** Liquidation event payload */
export interface WsLiquidationPayload {
  borrower: string;
  poolId: string;
  amount: number;
  tier: string;
  ts: string;
}

/** Sec lending offer payload */
export interface WsSecLendingOfferPayload {
  offerId: string;
  security: string;
  fee: number;
  ts: string;
}

/** Sec lending deal update payload */
export interface WsSecLendingDealPayload {
  dealId: string;
  status: string;
  feeAccrued: number;
  ts: string;
}

/** Governance vote update payload */
export interface WsGovernancePayload {
  proposalId: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  ts: string;
}

/** Notification payload */
export interface WsNotificationPayload {
  type: string;
  title: string;
  message: string;
  positionId?: string;
  healthFactor?: number;
  ts: string;
}

/** WebSocket channel definitions */
export type WsChannel =
  | `prices:${string}`
  | `pool:${string}`
  | `position:${string}`
  | 'liquidations'
  | 'sec-lending:offers'
  | `sec-lending:deal:${string}`
  | 'governance:votes'
  | `notifications:${string}`;
