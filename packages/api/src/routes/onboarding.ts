import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { ApiResponse, InstitutionalOnboardingStatus, ComplianceDocumentData } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { getDb, schema } from '../db/client.js';
import { createChildLogger } from '../config/logger.js';
import { nanoid } from 'nanoid';

const log = createChildLogger('onboarding-routes');

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const kybSubmitSchema = z.object({
  companyLegalName: z.string().max(256).optional(),
  registrationNumber: z.string().max(128).optional(),
  taxId: z.string().max(128).optional(),
  companyType: z.string().max(64).optional(),
  jurisdiction: z.string().min(2).max(8),
  website: z.string().max(512).optional(),
  addressLine1: z.string().max(256).optional(),
  addressLine2: z.string().max(256).optional(),
  city: z.string().max(128).optional(),
  state: z.string().max(128).optional(),
  postalCode: z.string().max(32).optional(),
  country: z.string().max(8).optional(),
  repFirstName: z.string().min(1).max(256),
  repLastName: z.string().min(1).max(256),
  repTitle: z.string().min(1).max(256),
  repEmail: z.string().email(),
  repPhone: z.string().max(32).optional(),
});

const kybUpdateStepSchema = z.object({
  step: z.number().min(1).max(7),
  data: z.record(z.string(), z.unknown()),
});

const documentUploadSchema = z.object({
  documentType: z.string().min(1).max(64),
  fileName: z.string().min(1).max(256),
  mimeType: z.string().min(1).max(128),
  sizeBytes: z.number().min(1).max(10_485_760), // 10MB
  storageKey: z.string().min(1).max(512),
});

const uboDeclarationSchema = z.object({
  beneficialOwners: z.array(
    z.object({
      firstName: z.string().min(1).max(256),
      lastName: z.string().min(1).max(256),
      dateOfBirth: z.string().optional(),
      nationality: z.string().max(8).optional(),
      ownershipPercent: z.number().min(0).max(100),
      isPEP: z.boolean(),
      idDocumentType: z.string().max(32).optional(),
    }),
  ).min(1).max(10),
  confirmationChecked: z.boolean(),
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function requireDb() {
  const db = getDb();
  if (!db) throw new AppError('INTERNAL_ERROR', 'Database not available', 500);
  return db;
}

async function getInstitutionByUserId(userId: string) {
  const db = requireDb();
  const rows = await db
    .select()
    .from(schema.institutions)
    .where(eq(schema.institutions.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function onboardingRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /onboarding/kyb/submit (auth required)
  fastify.post(
    '/onboarding/kyb/submit',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = kybSubmitSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid KYB data', 400, parsed.error.flatten());
      }

      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const db = requireDb();
      const institution = await getInstitutionByUserId(userId);
      if (!institution) {
        throw new AppError('NOT_FOUND', 'No institution found for this user', 404);
      }

      const data = parsed.data;
      await db.update(schema.institutions).set({
        companyLegalName: data.companyLegalName,
        registrationNumber: data.registrationNumber,
        taxId: data.taxId,
        companyType: data.companyType,
        jurisdiction: data.jurisdiction,
        website: data.website,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        repFirstName: data.repFirstName,
        repLastName: data.repLastName,
        repTitle: data.repTitle,
        repEmail: data.repEmail,
        repPhone: data.repPhone,
        kybStatus: 'documents_submitted',
        onboardingStep: 3,
        kybSubmittedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(schema.institutions.institutionId, institution.institutionId));

      // Update user status
      await db.update(schema.users).set({
        accountStatus: 'pending_verification',
        updatedAt: new Date(),
      }).where(eq(schema.users.userId, userId));

      log.info({ userId, institutionId: institution.institutionId }, 'KYB submitted');

      const response: ApiResponse<{ status: string; step: number }> = {
        data: { status: 'documents_submitted', step: 3 },
      };
      return reply.status(200).send(response);
    },
  );

  // PUT /onboarding/kyb/update (auth required)
  fastify.put(
    '/onboarding/kyb/update',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = kybUpdateStepSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid KYB update', 400, parsed.error.flatten());
      }

      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const db = requireDb();
      const institution = await getInstitutionByUserId(userId);
      if (!institution) {
        throw new AppError('NOT_FOUND', 'No institution found for this user', 404);
      }

      await db.update(schema.institutions).set({
        onboardingStep: parsed.data.step,
        updatedAt: new Date(),
      }).where(eq(schema.institutions.institutionId, institution.institutionId));

      const response: ApiResponse<{ step: number }> = {
        data: { step: parsed.data.step },
      };
      return reply.status(200).send(response);
    },
  );

  // GET /onboarding/kyb/status (auth required)
  fastify.get(
    '/onboarding/kyb/status',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const db = requireDb();
      const institution = await getInstitutionByUserId(userId);
      if (!institution) {
        throw new AppError('NOT_FOUND', 'No institution found for this user', 404);
      }

      // Get documents
      const docs = await db
        .select()
        .from(schema.complianceDocuments)
        .where(eq(schema.complianceDocuments.institutionId, institution.institutionId));

      // Get user for KYC status
      const userRows = await db.select().from(schema.users).where(eq(schema.users.userId, userId)).limit(1);

      const status: InstitutionalOnboardingStatus = {
        currentStep: institution.onboardingStep,
        totalSteps: 7,
        institution: {
          institutionId: institution.institutionId,
          userId: institution.userId,
          companyName: institution.companyName,
          companyLegalName: institution.companyLegalName,
          registrationNumber: institution.registrationNumber,
          taxId: institution.taxId,
          jurisdiction: institution.jurisdiction,
          companyType: institution.companyType,
          website: institution.website,
          addressLine1: institution.addressLine1,
          addressLine2: institution.addressLine2,
          city: institution.city,
          state: institution.state,
          postalCode: institution.postalCode,
          country: institution.country,
          repFirstName: institution.repFirstName,
          repLastName: institution.repLastName,
          repTitle: institution.repTitle,
          repEmail: institution.repEmail,
          repPhone: institution.repPhone,
          kybStatus: institution.kybStatus as InstitutionalOnboardingStatus['kybStatus'],
          onboardingStep: institution.onboardingStep,
          createdAt: institution.createdAt.toISOString(),
        },
        documents: docs.map((d) => ({
          id: d.documentId,
          documentType: d.documentType,
          fileName: d.fileName,
          mimeType: d.mimeType,
          sizeBytes: d.sizeBytes,
          status: d.status as ComplianceDocumentData['status'],
          uploadedAt: d.uploadedAt.toISOString(),
          reviewedAt: d.reviewedAt?.toISOString() ?? null,
        })),
        beneficialOwners: (institution.beneficialOwners ?? []).map((bo: Record<string, unknown>) => ({
          id: (bo.id as string) ?? '',
          firstName: (bo.firstName as string) ?? '',
          lastName: (bo.lastName as string) ?? '',
          dateOfBirth: (bo.dateOfBirth as string) ?? null,
          nationality: (bo.nationality as string) ?? null,
          ownershipPercent: (bo.ownershipPercent as number) ?? 0,
          isPEP: (bo.isPEP as boolean) ?? false,
          idDocumentType: (bo.idDocumentType as string) ?? null,
          idVerified: (bo.idVerified as boolean) ?? false,
        })),
        kybStatus: institution.kybStatus as InstitutionalOnboardingStatus['kybStatus'],
        kycStatus: (userRows[0]?.kycStatus ?? 'not_started') as InstitutionalOnboardingStatus['kycStatus'],
      };

      const response: ApiResponse<InstitutionalOnboardingStatus> = { data: status };
      return reply.status(200).send(response);
    },
  );

  // POST /onboarding/kyb/documents (auth required)
  fastify.post(
    '/onboarding/kyb/documents',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = documentUploadSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid document data', 400, parsed.error.flatten());
      }

      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const db = requireDb();
      const institution = await getInstitutionByUserId(userId);
      if (!institution) {
        throw new AppError('NOT_FOUND', 'No institution found for this user', 404);
      }

      const documentId = `doc_${nanoid(16)}`;
      await db.insert(schema.complianceDocuments).values({
        documentId,
        institutionId: institution.institutionId,
        documentType: parsed.data.documentType,
        fileName: parsed.data.fileName,
        mimeType: parsed.data.mimeType,
        sizeBytes: parsed.data.sizeBytes,
        storageKey: parsed.data.storageKey,
        status: 'pending',
      });

      log.info({ documentId, institutionId: institution.institutionId, type: parsed.data.documentType }, 'Document uploaded');

      const response: ApiResponse<{ documentId: string; status: string }> = {
        data: { documentId, status: 'pending' },
      };
      return reply.status(201).send(response);
    },
  );

  // POST /onboarding/kyb/ubo (auth required)
  fastify.post(
    '/onboarding/kyb/ubo',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = uboDeclarationSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid UBO data', 400, parsed.error.flatten());
      }

      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const db = requireDb();
      const institution = await getInstitutionByUserId(userId);
      if (!institution) {
        throw new AppError('NOT_FOUND', 'No institution found for this user', 404);
      }

      const ubos = parsed.data.beneficialOwners.map((bo) => ({
        ...bo,
        id: nanoid(12),
        idVerified: false,
      }));

      await db.update(schema.institutions).set({
        beneficialOwners: ubos,
        onboardingStep: Math.max(institution.onboardingStep, 6),
        updatedAt: new Date(),
      }).where(eq(schema.institutions.institutionId, institution.institutionId));

      log.info({ institutionId: institution.institutionId, count: ubos.length }, 'UBO declaration saved');

      const response: ApiResponse<{ count: number }> = {
        data: { count: ubos.length },
      };
      return reply.status(200).send(response);
    },
  );

  // POST /onboarding/kyb/review-submit (auth required) — final submission
  fastify.post(
    '/onboarding/kyb/review-submit',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const db = requireDb();
      const institution = await getInstitutionByUserId(userId);
      if (!institution) {
        throw new AppError('NOT_FOUND', 'No institution found for this user', 404);
      }

      await db.update(schema.institutions).set({
        kybStatus: 'under_review',
        onboardingStep: 7,
        kybSubmittedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(schema.institutions.institutionId, institution.institutionId));

      log.info({ institutionId: institution.institutionId }, 'KYB application submitted for review');

      const response: ApiResponse<{ status: string; applicationId: string }> = {
        data: {
          status: 'under_review',
          applicationId: `DUA-${new Date().getFullYear()}-${institution.institutionId.slice(-5).toUpperCase()}`,
        },
      };
      return reply.status(200).send(response);
    },
  );

  // POST /onboarding/kyc/initiate (auth required) — placeholder for KYC
  fastify.post(
    '/onboarding/kyc/initiate',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const db = requireDb();
      await db.update(schema.users).set({
        kycStatus: 'identity_submitted',
        updatedAt: new Date(),
      }).where(eq(schema.users.userId, userId));

      log.info({ userId }, 'KYC initiated (mock)');

      // In production: create Sumsub/Onfido session and return widget URL
      const response: ApiResponse<{ status: string; widgetUrl: string | null }> = {
        data: {
          status: 'identity_submitted',
          widgetUrl: null, // Would be Sumsub/Onfido widget URL in production
        },
      };
      return reply.status(200).send(response);
    },
  );

  // GET /onboarding/kyc/status (auth required)
  fastify.get(
    '/onboarding/kyc/status',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const db = requireDb();
      const rows = await db.select().from(schema.users).where(eq(schema.users.userId, userId)).limit(1);

      const response: ApiResponse<{ status: string }> = {
        data: { status: rows[0]?.kycStatus ?? 'not_started' },
      };
      return reply.status(200).send(response);
    },
  );
}
