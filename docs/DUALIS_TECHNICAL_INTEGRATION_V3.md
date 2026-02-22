# Dualis Finance — Technical Integration Spec v3.0
## 5 Stratejik Yenilik: Daml, API, DB, Frontend Entegrasyonu

Bu doküman, Strategic Innovation Document'taki 5 yeniliğin mevcut teknik altyapıya nasıl entegre edileceğini detaylandırır.

---

## BÖLÜM A: YENİ DAML KONTRATLARI

### A.1 — Hybrid Credit Score Kontratları

```daml
-- ═══════════════════════════════════════════════════
-- MODULE: Dualis.Credit.Attestation
-- Off-chain veri için ZK-proof attestation sistemi
-- ═══════════════════════════════════════════════════

module Dualis.Credit.Attestation where

-- Attestation tipleri
data AttestationType
  = CreditBureau        -- Findeks/KKB/Experian
  | IncomeVerification   -- Banka hesap özeti ZK kanıtı
  | BusinessVerification -- Ticaret sicil, vergi levhası
  | KYCCompletion        -- KYC/KYB tamamlama
  | TIFAPerformance      -- TIFA Finance geçmiş performans
  | CrossProtocol        -- Diğer Canton app referansları
  deriving (Eq, Show)

-- ZK Proof wrapper
data ZKProof = ZKProof
  { proofData    : Text          -- Serialized ZK proof
  , verifierKey  : Text          -- Verification key
  , publicInputs : [Text]        -- Halka açık girdiler (skor aralığı gibi)
  , circuit      : Text          -- Hangi circuit kullanıldı
  , generatedAt  : Time
  }

-- Off-chain attestation
data OffChainAttestation = OffChainAttestation
  { attestationType : AttestationType
  , provider        : Text          -- "findeks", "experian", "tifa"
  , claimedRange    : Text          -- "excellent", "good", "above_700"
  , proof           : ZKProof
  , issuedAt        : Time
  , expiresAt       : Time          -- Genelde 90 gün
  , revoked         : Bool
  }

-- Kullanıcının tüm attestation'larını tutan kontrat
template CreditAttestationBundle
  with
    owner          : Party
    operator       : Party
    attestations   : [OffChainAttestation]
    lastVerified   : Time
  where
    signatory operator
    observer owner
    
    key (operator, owner) : (Party, Party)
    maintainer key._1
    
    -- Yeni attestation ekle
    choice AddAttestation : ContractId CreditAttestationBundle
      with
        newAttestation : OffChainAttestation
      controller owner
      do
        -- Proof doğrulama burada yapılır
        create this with
          attestations = newAttestation :: this.attestations
          lastVerified = newAttestation.issuedAt
    
    -- Süresi dolmuş attestation'ları temizle
    choice PruneExpired : ContractId CreditAttestationBundle
      with
        currentTime : Time
      controller operator
      do
        let valid = filter (\a -> a.expiresAt > currentTime && not a.revoked) this.attestations
        create this with attestations = valid

-- ═══════════════════════════════════════════════════
-- MODULE: Dualis.Credit.CompositeScore
-- 3 katmanlı bileşik kredi skoru hesaplama
-- ═══════════════════════════════════════════════════

module Dualis.Credit.CompositeScore where

-- Skor katmanları
data ScoreLayer = ScoreLayer
  { onChainScore     : Decimal    -- max 400
  , offChainScore    : Decimal    -- max 350
  , ecosystemScore   : Decimal    -- max 250
  }

-- On-chain skor bileşenleri
data OnChainBreakdown = OnChainBreakdown
  { loanCompletion      : Decimal  -- max 150: (completed / total) × 150
  , repaymentSpeed      : Decimal  -- max 100: on-time ratio × 100
  , collateralHealth    : Decimal  -- max 80: min(avgHF / 2.0, 1) × 80
  , protocolHistory     : Decimal  -- max 40: min(months / 24, 1) × 40
  , secLendingRecord    : Decimal  -- max 30: completed deals bonus
  }

-- Off-chain skor bileşenleri  
data OffChainBreakdown = OffChainBreakdown
  { creditBureauScore   : Decimal  -- max 150: ZK-proof based
  , incomeVerification  : Decimal  -- max 100: verified income bracket
  , businessVerification: Decimal  -- max 50: legal entity status
  , kycCompletion       : Decimal  -- max 50: full KYC/KYB bonus
  }

-- Ecosystem skor bileşenleri
data EcosystemBreakdown = EcosystemBreakdown
  { tifaPerformance     : Decimal  -- max 100: TIFA repayment history
  , crossProtocolRefs   : Decimal  -- max 80: other Canton app attestations
  , governanceStaking   : Decimal  -- max 70: DUAL staking + voting
  }

-- Bileşik skor kontratı
template CompositeCredit
  with
    owner            : Party
    operator         : Party
    compositeScore   : Decimal          -- 0-1000 toplam
    tier             : CreditTier
    layers           : ScoreLayer
    onChainDetail    : OnChainBreakdown
    offChainDetail   : OffChainBreakdown
    ecosystemDetail  : EcosystemBreakdown
    lastCalculated   : Time
    nextTierThreshold: Decimal          -- Bir üst tier için gereken puan
    nextTierName     : Text
  where
    signatory operator
    observer owner
    
    key (operator, owner) : (Party, Party)
    maintainer key._1
    
    -- Tam skor yeniden hesaplama
    choice RecalculateComposite : ContractId CompositeCredit
      with
        newOnChain    : OnChainBreakdown
        newOffChain   : OffChainBreakdown
        newEcosystem  : EcosystemBreakdown
        calcTime      : Time
      controller operator
      do
        let onTotal  = newOnChain.loanCompletion + newOnChain.repaymentSpeed 
                     + newOnChain.collateralHealth + newOnChain.protocolHistory 
                     + newOnChain.secLendingRecord
        let offTotal = newOffChain.creditBureauScore + newOffChain.incomeVerification
                     + newOffChain.businessVerification + newOffChain.kycCompletion
        let ecoTotal = newEcosystem.tifaPerformance + newEcosystem.crossProtocolRefs
                     + newEcosystem.governanceStaking
        let total    = onTotal + offTotal + ecoTotal
        let newTier  = deriveTier total
        create this with
          compositeScore = total
          tier = newTier
          layers = ScoreLayer onTotal offTotal ecoTotal
          onChainDetail = newOnChain
          offChainDetail = newOffChain
          ecosystemDetail = newEcosystem
          lastCalculated = calcTime

-- Tier belirleme fonksiyonu
deriveTier : Decimal -> CreditTier
deriveTier score
  | score >= 850.0 = Diamond
  | score >= 650.0 = Gold
  | score >= 450.0 = Silver
  | score >= 250.0 = Bronze
  | otherwise      = Unrated

-- Tier'e göre borçlanma parametreleri
data TierLendingParams = TierLendingParams
  { maxLTV           : Decimal   -- Max loan-to-value
  , rateDiscount     : Decimal   -- Faiz indirimi (0.0 - 0.25)
  , minCollateralRatio: Decimal  -- Min teminat oranı
  , liquidationBuffer : Decimal  -- Likidasyona kadar buffer
  }

getTierParams : CreditTier -> TierLendingParams
getTierParams Diamond = TierLendingParams 0.85 0.25 1.15 0.05
getTierParams Gold    = TierLendingParams 0.78 0.15 1.25 0.08
getTierParams Silver  = TierLendingParams 0.70 0.08 1.35 0.10
getTierParams Bronze  = TierLendingParams 0.60 0.00 1.50 0.12
getTierParams Unrated = TierLendingParams 0.50 0.00 1.75 0.15
```

### A.2 — Productive Lending Kontratları

```daml
-- ═══════════════════════════════════════════════════
-- MODULE: Dualis.Productive.Core
-- Gerçek ekonomi proje finansmanı
-- ═══════════════════════════════════════════════════

module Dualis.Productive.Core where

-- Proje kategorileri
data ProjectCategory
  = SolarEnergy        -- GES
  | WindEnergy         -- Rüzgar
  | BatteryStorage     -- Batarya depolama
  | DataCenter         -- Veri merkezi
  | SupplyChain        -- Tedarik zinciri (TIFA ile)
  | ExportFinance      -- İhracat finansmanı
  | EquipmentLeasing   -- Ekipman kiralama
  | RealEstate         -- Ticari gayrimenkul
  | AgriInfra          -- Tarımsal altyapı
  | TelecomInfra       -- Telekom altyapısı
  deriving (Eq, Show)

-- Proje durumu
data ProjectStatus
  = Proposed           -- Başvuru yapıldı
  | UnderReview        -- Değerlendirmede
  | Approved           -- Onaylandı
  | Funded             -- Fonlandı
  | InConstruction     -- İnşaat aşamasında (grace period)
  | Operational        -- Çalışıyor, gelir üretiyor
  | Repaying           -- Geri ödeme yapıyor
  | Completed          -- Kredi tamamlandı
  | Defaulted          -- Temerrüt
  deriving (Eq, Show)

-- Proje metadata
data ProjectMetadata = ProjectMetadata
  { location         : Text            -- "Konya, Turkey"
  , capacity         : Optional Text   -- "500 kW"
  , offTaker         : Optional Text   -- Enerji alıcısı
  , insurancePolicy  : Optional Text   -- Sigorta poliçe no
  , independentValue : Decimal         -- Bağımsız değerleme (USD)
  , expectedIRR      : Decimal         -- Beklenen iç verim oranı
  , constructionPeriod: Int            -- Ay cinsinden inşaat süresi
  , operationalLife  : Int             -- Yıl cinsinden operasyonel ömür
  , esgRating        : ESGRating       -- A/B/C/Unrated
  , iotFeedId        : Optional Text   -- IoT veri feed ID (GES üretimi vb.)
  }

data ESGRating = ESG_A | ESG_B | ESG_C | ESG_Unrated
  deriving (Eq, Show)

-- Nakit akışı takvimi
data CashflowEntry = CashflowEntry
  { expectedDate    : Time
  , expectedAmount  : Decimal        -- USD
  , actualAmount    : Optional Decimal
  , source          : Text           -- "energy_sales", "lease_income", "export_revenue"
  , status          : CashflowStatus
  }

data CashflowStatus = Projected | Received | Partial | Missed | Overdue
  deriving (Eq, Show)

-- Hibrit teminat yapısı
data HybridCollateral = HybridCollateral
  { cryptoCollateral  : Decimal      -- USDC/wBTC/ETH değeri (USD)
  , projectAssetValue : Decimal      -- Fiziksel proje varlığı değeri (USD)
  , tifaCollateral    : Decimal      -- TIFA alacak tokenları değeri (USD)
  , totalValue        : Decimal      -- Toplam teminat (USD)
  , cryptoRatio       : Decimal      -- Kripto oranı (0.0-1.0)
  }

-- ═══════════════════════════════════════════════════
-- Ana proje varlığı kontratı
-- ═══════════════════════════════════════════════════

template ProductiveProject
  with
    projectId       : Text
    owner           : Party           -- Proje sahibi (SPV)
    operator        : Party
    category        : ProjectCategory
    status          : ProjectStatus
    metadata        : ProjectMetadata
    attestations    : [Text]          -- Attestation kontrat ID'leri
    requestedAmount : Decimal         -- İstenen kredi tutarı (USD)
    fundedAmount    : Decimal         -- Fonlanan tutar
    createdAt       : Time
  where
    signatory operator
    observer owner
    
    key (operator, projectId) : (Party, Text)
    maintainer key._1
    
    -- Proje durumunu güncelle
    choice UpdateProjectStatus : ContractId ProductiveProject
      with
        newStatus : ProjectStatus
      controller operator
      do create this with status = newStatus
    
    -- IoT verisi ile üretim attestation'ı ekle
    choice AddProductionAttestation : ContractId ProductiveProject
      with
        attestationId : Text
      controller operator
      do create this with attestations = attestationId :: this.attestations

-- ═══════════════════════════════════════════════════
-- Productive lending havuzu
-- ═══════════════════════════════════════════════════

template ProductiveLendingPool
  with
    poolId          : Text
    operator        : Party
    category        : ProjectCategory
    totalDeposited  : Decimal
    totalLent       : Decimal
    activeProjects  : Int
    avgReturn       : Decimal         -- Ortalama getiri (APY)
    defaultRate     : Decimal         -- Temerrüt oranı
    rateDiscount    : Decimal         -- Productive lending bonus indirimi
    esgBonus        : Decimal         -- ESG ek indirimi
    minCreditTier   : CreditTier      -- Minimum gereken tier
  where
    signatory operator
    
    key (operator, poolId) : (Party, Text)
    maintainer key._1

-- ═══════════════════════════════════════════════════
-- Productive borç pozisyonu
-- ═══════════════════════════════════════════════════

template ProductiveBorrow
  with
    borrowId         : Text
    borrower         : Party
    operator         : Party
    project          : ContractId ProductiveProject
    poolId           : Text
    loanAmount       : Decimal
    outstandingDebt  : Decimal
    interestRate     : Decimal        -- Yıllık (productive discount uygulanmış)
    collateral       : HybridCollateral
    cashflowSchedule : [CashflowEntry]
    gracePeriodEnd   : Time           -- İnşaat süresi sonu
    maturityDate     : Time
    status           : ProductiveBorrowStatus
    createdAt        : Time
  where
    signatory operator
    observer borrower
    
    -- Nakit akışından otomatik geri ödeme
    choice CashflowRepayment : ContractId ProductiveBorrow
      with
        entryIndex   : Int
        actualAmount : Decimal
        repayTime    : Time
      controller operator
      do
        -- Ödenen tutarı borçtan düş
        let newDebt = this.outstandingDebt - actualAmount
        -- Cashflow schedule güncelle
        create this with
          outstandingDebt = newDebt
          status = if newDebt <= 0.0 then PB_Completed else PB_Repaying
    
    -- IoT verisi ile proje sağlığı kontrolü
    choice CheckProjectHealth : ContractId ProductiveBorrow
      with
        productionData : Decimal   -- Gerçek üretim (kWh, gelir, vb.)
        expectedData   : Decimal   -- Beklenen üretim
      controller operator
      do
        let ratio = productionData / expectedData
        -- %80 altındaysa uyarı, %50 altındaysa teminat artışı çağrısı
        create this  -- Duruma göre status güncellemesi

data ProductiveBorrowStatus
  = PB_Active | PB_GracePeriod | PB_Repaying | PB_Completed 
  | PB_Warning | PB_CollateralCall | PB_Defaulted
  deriving (Eq, Show)
```

### A.3 — Securities Lending Yenilikleri

```daml
-- ═══════════════════════════════════════════════════
-- MODULE: Dualis.SecLending.Advanced
-- Fraksiyonel, dinamik fee, netting
-- ═══════════════════════════════════════════════════

module Dualis.SecLending.Advanced where

-- Fraksiyonel offer (büyük pozisyonu parçalayarak sunma)
template FractionalOffer
  with
    offerId          : Text
    lender           : Party
    operator         : Party
    security         : Asset
    totalAmount      : Decimal
    remainingAmount  : Decimal
    minAcceptAmount  : Decimal       -- Retail: $100, Institutional: $100K
    maxSlices        : Int           -- Max parça sayısı
    activeDeals      : [Text]        -- Aktif deal ID'leri
    feeModel         : FeeModel
    acceptedCollateral: [InstrumentType]
    isRecallable     : Bool
    recallNoticeDays : Int
    createdAt        : Time
    expiresAt        : Optional Time
  where
    signatory operator
    observer lender
    
    key (operator, offerId) : (Party, Text)
    maintainer key._1
    
    -- Kısmi kabul (fraksiyonel)
    choice AcceptFraction : (ContractId FractionalOffer, ContractId SecLendingDeal)
      with
        borrower      : Party
        acceptAmount  : Decimal
        collateral    : [CollateralPosition]
      controller operator
      do
        -- Min amount kontrolü
        assertMsg "Below minimum" (acceptAmount >= this.minAcceptAmount)
        assertMsg "Exceeds remaining" (acceptAmount <= this.remainingAmount)
        
        -- Fee hesapla
        let fee = calculateDynamicFee this.feeModel this.security acceptAmount
        
        -- Deal oluştur
        dealId <- create SecLendingDeal with ...
        
        -- Offer güncelle
        updatedOffer <- create this with
          remainingAmount = this.remainingAmount - acceptAmount
          activeDeals = show dealId :: this.activeDeals
          
        return (updatedOffer, dealId)

-- Dinamik fee modeli
data FeeModel = FeeModel
  { baseFee          : Decimal   -- bps cinsinden
  , feeType          : FeeType   -- Fixed | Dynamic | Negotiated
  , demandMultiplier : Decimal   -- Piyasa talep çarpanı (0.5-3.0)
  , durationFactor   : Decimal   -- Vade çarpanı
  , creditDiscount   : Decimal   -- Kredi tier indirimi
  }

data FeeType = FixedFee | DynamicFee | NegotiatedFee
  deriving (Eq, Show)

-- Dinamik fee hesaplama
calculateDynamicFee : FeeModel -> Asset -> Decimal -> Decimal
calculateDynamicFee model security amount =
  model.baseFee * model.demandMultiplier * model.durationFactor * model.creditDiscount

-- Corporate action handler
template CorporateActionHandler
  with
    dealId           : Text
    operator         : Party
    lender           : Party
    borrower         : Party
    actionType       : CorporateActionType
    recordDate       : Time
    paymentDate      : Time
    amount           : Decimal       -- Temettü/kupon tutarı per unit
    totalUnits       : Decimal
    status           : CAStatus
  where
    signatory operator
    observer lender, borrower
    
    -- Manufactured dividend: borrower'dan lender'a ödeme
    choice ProcessCorporateAction : ContractId CorporateActionHandler
      with
        processTime : Time
      controller operator
      do
        let totalPayment = this.amount * this.totalUnits
        -- Borrower collateral'ından düş, lender'a öde (atomik)
        create this with status = CA_Processed

data CorporateActionType = Dividend | CouponPayment | StockSplit | RightsIssue
  deriving (Eq, Show)
data CAStatus = CA_Pending | CA_Processed | CA_Failed
  deriving (Eq, Show)

-- Netting anlaşması
template NettingAgreement
  with
    nettingId        : Text
    partyA           : Party
    partyB           : Party
    operator         : Party
    deals            : [Text]        -- Deal ID'leri
    netExposures     : [(Text, Decimal)]  -- (Asset, Net miktar)
    netFees          : Decimal       -- Net fee
    status           : NettingStatus
    calculatedAt     : Time
  where
    signatory operator
    observer partyA, partyB
    
    -- Net pozisyonları hesapla ve mevcut deal'leri tek deal'e sıkıştır
    choice ExecuteNetting : ContractId NettingAgreement
      controller operator
      do
        -- Karşılıklı pozisyonları netleştir
        -- Eski deal'leri kapat, yeni net deal oluştur
        create this with status = Netted

data NettingStatus = Proposed | Accepted | Netted | Rejected
  deriving (Eq, Show)
```

### A.4 — Institutional Track Kontratları

```daml
-- ═══════════════════════════════════════════════════
-- MODULE: Dualis.Institutional.Core
-- KYC/KYB, verified entity, institutional pool
-- ═══════════════════════════════════════════════════

module Dualis.Institutional.Core where

-- KYB (Know Your Business) durumu
data KYBStatus = KYB_Pending | KYB_InReview | KYB_Verified | KYB_Expired | KYB_Rejected
  deriving (Eq, Show)

data KYBLevel = KYB_Basic | KYB_Enhanced | KYB_Full
  deriving (Eq, Show)

-- Kurumsal risk profili
data InstitutionalRiskProfile = InstitutionalRiskProfile
  { riskCategory     : Text          -- "low", "medium", "high"
  , maxSingleExposure: Decimal       -- Tek pozisyon limiti
  , maxTotalExposure : Decimal       -- Toplam limit
  , allowedProducts  : [Text]        -- ["lending", "sec_lending", "productive"]
  , jurisdictionRules: [Text]        -- Uygulanacak yetki alanı kuralları
  }

-- Doğrulanmış kurum kontratı
template VerifiedInstitution
  with
    institution      : Party
    operator         : Party
    legalName        : Text
    registrationNo   : Text          -- Ticaret sicil no
    jurisdiction     : Text          -- "TR", "US", "CH"
    kybStatus        : KYBStatus
    kybLevel         : KYBLevel
    verifiedAt       : Time
    expiresAt        : Time          -- Yıllık yenileme
    riskProfile      : InstitutionalRiskProfile
    complianceOfficer: Optional Party
    subAccounts      : [Party]       -- Alt hesaplar
    apiKeyHashes     : [Text]        -- API key hash'leri
  where
    signatory operator
    observer institution
    
    key (operator, institution) : (Party, Party)
    maintainer key._1
    
    -- Alt hesap ekle
    choice AddSubAccount : ContractId VerifiedInstitution
      with
        subAccount : Party
      controller institution
      do create this with subAccounts = subAccount :: this.subAccounts
    
    -- KYB yenileme
    choice RenewKYB : ContractId VerifiedInstitution
      with
        newExpiry : Time
      controller operator
      do create this with 
          expiresAt = newExpiry
          kybStatus = KYB_Verified

-- Kurumsal özel havuz
template InstitutionalPool
  with
    poolId           : Text
    operator         : Party
    requiredKYBLevel : KYBLevel
    minDeposit       : Decimal       -- Minimum deposit ($100K+)
    customFeeSchedule: [(Decimal, Decimal)]  -- (volume_threshold, fee_rate)
    eligibleCollateral: [InstrumentType]
    totalDeposited   : Decimal
    participants     : [Party]       -- Verified institutions only
  where
    signatory operator
    
    key (operator, poolId) : (Party, Text)
    maintainer key._1

-- Toplu işlem kontratı
template BulkOperation
  with
    opId             : Text
    institution      : Party
    operator         : Party
    operations       : [SingleOp]    -- İşlem listesi
    status           : BulkStatus
    submittedAt      : Time
  where
    signatory operator
    observer institution

data SingleOp = SingleOp
  { opType : Text       -- "deposit", "withdraw", "borrow"
  , poolId : Text
  , amount : Decimal
  }

data BulkStatus = Bulk_Pending | Bulk_Processing | Bulk_Completed | Bulk_PartialFail
  deriving (Eq, Show)
```

### A.5 — Privacy Toggle Kontratları

```daml
-- ═══════════════════════════════════════════════════
-- MODULE: Dualis.Privacy.Config
-- Kullanıcı privacy konfigürasyonu
-- ═══════════════════════════════════════════════════

module Dualis.Privacy.Config where

-- Privacy seviyeleri
data PrivacyLevel = PL_Public | PL_Selective | PL_Maximum
  deriving (Eq, Show)

-- Disclosure veri kapsamı
data DataScope 
  = DS_Positions        -- Pozisyon bilgileri
  | DS_Transactions     -- İşlem geçmişi
  | DS_CreditScore      -- Kredi skoru detayı
  | DS_SecLendingDeals  -- Sec lending anlaşmaları
  | DS_All              -- Tüm veriler
  deriving (Eq, Show)

-- Disclosure kuralı
data DisclosureRule = DisclosureRule
  { discloseTo   : Party          -- Gösterilecek taraf
  , dataScope    : DataScope
  , purpose      : Text           -- "SEC quarterly reporting"
  , expiresAt    : Optional Time  -- Süre sınırı
  , isActive     : Bool
  }

-- Privacy konfigürasyon kontratı
template PrivacyConfig
  with
    user             : Party
    operator         : Party
    privacyLevel     : PrivacyLevel
    disclosureRules  : [DisclosureRule]
    auditTrailEnabled: Bool
    lastUpdated      : Time
  where
    signatory operator
    observer user
    
    key (operator, user) : (Party, Party)
    maintainer key._1
    
    -- Privacy seviyesini değiştir
    choice SetPrivacyLevel : ContractId PrivacyConfig
      with
        newLevel : PrivacyLevel
        updateTime : Time
      controller user
      do create this with 
          privacyLevel = newLevel
          lastUpdated = updateTime
    
    -- Disclosure kuralı ekle (regülatör, auditor)
    choice AddDisclosure : ContractId PrivacyConfig
      with
        rule : DisclosureRule
        updateTime : Time
      controller user
      do create this with
          disclosureRules = rule :: this.disclosureRules
          lastUpdated = updateTime
    
    -- Disclosure kuralını kaldır
    choice RemoveDisclosure : ContractId PrivacyConfig
      with
        partyToRemove : Party
        updateTime : Time
      controller user
      do
        let filtered = filter (\r -> r.discloseTo /= partyToRemove) this.disclosureRules
        create this with
          disclosureRules = filtered
          lastUpdated = updateTime
    
    -- Veri erişim kontrolü
    -- Bu fonksiyon her veri okuma işleminde çağrılır
    nonconsuming choice CheckAccess : Bool
      with
        requester : Party
        scope     : DataScope
      controller operator
      do
        if requester == this.user 
          then return True  -- Kullanıcı kendi verisini her zaman görür
          else case this.privacyLevel of
            PL_Public    -> return True   -- Herkes görebilir (aggregated)
            PL_Selective -> 
              let matching = filter (\r -> r.discloseTo == requester 
                                       && (r.dataScope == scope || r.dataScope == DS_All)
                                       && r.isActive) this.disclosureRules
              in return (not (null matching))
            PL_Maximum   ->
              let matching = filter (\r -> r.discloseTo == requester 
                                       && (r.dataScope == scope || r.dataScope == DS_All)
                                       && r.isActive) this.disclosureRules
              in return (not (null matching))
```

---

## BÖLÜM B: YENİ API ENDPOINT'LERİ

### B.1 — Credit Attestation API

```
POST   /v1/credit/attestation           — Yeni off-chain attestation ekle
GET    /v1/credit/attestations           — Kullanıcının tüm attestation'ları
DELETE /v1/credit/attestation/:id        — Attestation iptal et
GET    /v1/credit/composite-score        — 3 katmanlı bileşik skor
GET    /v1/credit/composite-breakdown    — Her katmanın detaylı bileşenleri
GET    /v1/credit/tier-benefits          — Mevcut tier'in sağladığı faydalar
POST   /v1/credit/simulate-score        — "Bu attestation'ı eklersem skorum ne olur?"
```

**POST /v1/credit/attestation Request:**
```json
{
  "type": "credit_bureau",        // credit_bureau | income | business | kyc
  "provider": "findeks",          // findeks | experian | transunion
  "proof": {
    "proofData": "0x...",         // ZK proof bytes
    "verifierKey": "0x...",
    "publicInputs": ["range:excellent", "min:700"],
    "circuit": "credit_range_v1"
  }
}
```

**GET /v1/credit/composite-score Response:**
```json
{
  "data": {
    "compositeScore": 742,
    "tier": "Gold",
    "layers": {
      "onChain": { "score": 320, "max": 400 },
      "offChain": { "score": 248, "max": 350 },
      "ecosystem": { "score": 174, "max": 250 }
    },
    "nextTier": {
      "name": "Diamond",
      "threshold": 850,
      "pointsNeeded": 108,
      "progressPercent": 28
    },
    "benefits": {
      "maxLTV": 0.78,
      "rateDiscount": 0.15,
      "minCollateralRatio": 1.25
    },
    "lastCalculated": "2026-02-22T10:00:00Z"
  }
}
```

### B.2 — Productive Lending API

```
GET    /v1/productive/projects           — Aktif proje listesi
GET    /v1/productive/projects/:id       — Proje detayı
POST   /v1/productive/projects           — Yeni proje başvurusu
PUT    /v1/productive/projects/:id       — Proje güncelleme
GET    /v1/productive/pools              — Productive lending havuzları
GET    /v1/productive/pools/:id          — Havuz detayı
POST   /v1/productive/borrow             — Productive borrow başvurusu
GET    /v1/productive/borrows            — Kullanıcının productive borçları
POST   /v1/productive/cashflow-repayment — Nakit akışı bazlı geri ödeme
GET    /v1/productive/analytics          — Productive lending istatistikleri
GET    /v1/productive/iot/:projectId     — IoT üretim verileri
```

**POST /v1/productive/projects Request:**
```json
{
  "category": "SolarEnergy",
  "metadata": {
    "location": "Konya, Turkey",
    "capacity": "500 kW",
    "offTaker": "Konya Elektrik Dağıtım",
    "expectedIRR": 18.5,
    "constructionPeriod": 6,
    "operationalLife": 25,
    "esgRating": "A"
  },
  "requestedAmount": "2000000",
  "collateral": {
    "cryptoAmount": "800000",
    "projectAssetValue": "800000",
    "tifaCollateralAmount": "400000"
  },
  "cashflowSchedule": [
    { "month": 7, "expectedAmount": "35000", "source": "energy_sales" },
    { "month": 8, "expectedAmount": "38000", "source": "energy_sales" }
  ],
  "attestations": ["valuation_report_id", "insurance_policy_id"]
}
```

### B.3 — Advanced Securities Lending API

```
POST   /v1/sec-lending/fractional-offer  — Fraksiyonel offer oluştur
POST   /v1/sec-lending/accept-fraction   — Kısmi kabul
GET    /v1/sec-lending/fee-estimate      — Dinamik fee tahmini
POST   /v1/sec-lending/netting/propose   — Netting önerisi
POST   /v1/sec-lending/netting/accept    — Netting kabul
GET    /v1/sec-lending/netting/:id       — Netting detayı
GET    /v1/sec-lending/corporate-actions  — Bekleyen corporate action'lar
POST   /v1/sec-lending/corporate-actions/:id/process — CA işle
```

### B.4 — Institutional API

```
POST   /v1/institutional/onboard         — Kurumsal onboarding başlat
GET    /v1/institutional/status           — KYB durumu
POST   /v1/institutional/kyb/submit      — KYB dokümanları gönder
POST   /v1/institutional/api-keys        — API key oluştur
DELETE /v1/institutional/api-keys/:id    — API key iptal
POST   /v1/institutional/bulk-deposit    — Toplu deposit
POST   /v1/institutional/bulk-withdraw   — Toplu çekim
GET    /v1/institutional/risk-report     — Konsolide risk raporu
GET    /v1/institutional/compliance-export— Raporlama (CSV/XML)
POST   /v1/institutional/sub-accounts    — Alt hesap oluştur
GET    /v1/institutional/fee-schedule    — Özel fee yapısı
POST   /v1/institutional/otc-request     — OTC büyük işlem
```

### B.5 — Privacy API

```
GET    /v1/privacy/config                — Mevcut privacy konfigürasyonu
PUT    /v1/privacy/level                 — Privacy seviyesi değiştir
POST   /v1/privacy/disclosure            — Disclosure kuralı ekle
DELETE /v1/privacy/disclosure/:partyId   — Disclosure kaldır
GET    /v1/privacy/audit-log             — Veri erişim audit log'u
POST   /v1/privacy/check-access          — Erişim kontrolü
```

---

## BÖLÜM C: YENİ VERİTABANI TABLOLARI

```sql
-- 1. credit_attestations — Off-chain ZK attestation'lar
CREATE TABLE credit_attestations (
  id              SERIAL PRIMARY KEY,
  party_id        VARCHAR(255) NOT NULL,
  attestation_type VARCHAR(50) NOT NULL,    -- credit_bureau, income, business, kyc
  provider        VARCHAR(100) NOT NULL,     -- findeks, experian, transunion
  claimed_range   VARCHAR(50),               -- excellent, good, above_700
  proof_hash      VARCHAR(255) NOT NULL,     -- ZK proof hash
  verified        BOOLEAN DEFAULT false,
  issued_at       TIMESTAMP NOT NULL,
  expires_at      TIMESTAMP NOT NULL,
  revoked         BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_attest_party ON credit_attestations(party_id);
CREATE INDEX idx_attest_expiry ON credit_attestations(expires_at);

-- 2. composite_scores — 3 katmanlı bileşik skorlar
CREATE TABLE composite_scores (
  id              SERIAL PRIMARY KEY,
  party_id        VARCHAR(255) UNIQUE NOT NULL,
  composite_score DECIMAL(10,2) NOT NULL,
  tier            VARCHAR(20) NOT NULL,
  on_chain_score  DECIMAL(10,2),
  off_chain_score DECIMAL(10,2),
  ecosystem_score DECIMAL(10,2),
  on_chain_detail JSONB,              -- OnChainBreakdown
  off_chain_detail JSONB,             -- OffChainBreakdown
  ecosystem_detail JSONB,             -- EcosystemBreakdown
  last_calculated TIMESTAMP NOT NULL,
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- 3. productive_projects — Gerçek ekonomi projeleri
CREATE TABLE productive_projects (
  id              SERIAL PRIMARY KEY,
  project_id      VARCHAR(255) UNIQUE NOT NULL,
  owner_party_id  VARCHAR(255) NOT NULL,
  category        VARCHAR(50) NOT NULL,
  status          VARCHAR(50) NOT NULL DEFAULT 'Proposed',
  metadata        JSONB NOT NULL,
  requested_amount DECIMAL(20,2),
  funded_amount   DECIMAL(20,2) DEFAULT 0,
  esg_rating      VARCHAR(10),
  attestations    JSONB DEFAULT '[]',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_proj_category ON productive_projects(category);
CREATE INDEX idx_proj_status ON productive_projects(status);

-- 4. productive_borrows — Productive kredi pozisyonları
CREATE TABLE productive_borrows (
  id              SERIAL PRIMARY KEY,
  borrow_id       VARCHAR(255) UNIQUE NOT NULL,
  borrower_party  VARCHAR(255) NOT NULL,
  project_id      VARCHAR(255) REFERENCES productive_projects(project_id),
  pool_id         VARCHAR(255),
  loan_amount     DECIMAL(20,2) NOT NULL,
  outstanding_debt DECIMAL(20,2) NOT NULL,
  interest_rate   DECIMAL(6,4) NOT NULL,
  crypto_collateral DECIMAL(20,2),
  project_collateral DECIMAL(20,2),
  tifa_collateral DECIMAL(20,2),
  total_collateral DECIMAL(20,2),
  grace_period_end TIMESTAMP,
  maturity_date   TIMESTAMP,
  status          VARCHAR(30) NOT NULL DEFAULT 'Active',
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 5. productive_cashflows — Proje nakit akışları
CREATE TABLE productive_cashflows (
  id              SERIAL PRIMARY KEY,
  project_id      VARCHAR(255) REFERENCES productive_projects(project_id),
  borrow_id       VARCHAR(255),
  expected_date   TIMESTAMP NOT NULL,
  expected_amount DECIMAL(20,2),
  actual_amount   DECIMAL(20,2),
  source          VARCHAR(50),          -- energy_sales, lease_income, export_revenue
  status          VARCHAR(20) DEFAULT 'Projected',
  recorded_at     TIMESTAMP DEFAULT NOW()
);

-- 6. iot_readings — IoT proje verileri
CREATE TABLE iot_readings (
  id              SERIAL PRIMARY KEY,
  project_id      VARCHAR(255) NOT NULL,
  feed_id         VARCHAR(255),
  metric_type     VARCHAR(50),          -- energy_production_kwh, revenue_daily
  value           DECIMAL(20,4),
  unit            VARCHAR(20),
  timestamp       TIMESTAMP NOT NULL,
  source          VARCHAR(100)
);
CREATE INDEX idx_iot_project ON iot_readings(project_id, timestamp);

-- 7. fractional_offers — Fraksiyonel sec lending offer'ları
CREATE TABLE fractional_offers (
  id              SERIAL PRIMARY KEY,
  offer_id        VARCHAR(255) UNIQUE NOT NULL,
  lender_party    VARCHAR(255) NOT NULL,
  security_type   VARCHAR(50),
  total_amount    DECIMAL(20,2),
  remaining_amount DECIMAL(20,2),
  min_accept_amount DECIMAL(20,2),
  max_slices      INT,
  fee_model       JSONB,
  is_recallable   BOOLEAN DEFAULT false,
  expires_at      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 8. netting_agreements — Netting anlaşmaları
CREATE TABLE netting_agreements (
  id              SERIAL PRIMARY KEY,
  netting_id      VARCHAR(255) UNIQUE NOT NULL,
  party_a         VARCHAR(255) NOT NULL,
  party_b         VARCHAR(255) NOT NULL,
  deal_ids        JSONB,
  net_exposures   JSONB,
  net_fee         DECIMAL(20,6),
  status          VARCHAR(20) DEFAULT 'Proposed',
  calculated_at   TIMESTAMP,
  executed_at     TIMESTAMP
);

-- 9. corporate_actions — Corporate action kayıtları
CREATE TABLE corporate_actions (
  id              SERIAL PRIMARY KEY,
  deal_id         VARCHAR(255),
  action_type     VARCHAR(30),          -- dividend, coupon, stock_split
  record_date     TIMESTAMP,
  payment_date    TIMESTAMP,
  amount_per_unit DECIMAL(20,8),
  total_units     DECIMAL(20,4),
  total_payment   DECIMAL(20,2),
  status          VARCHAR(20) DEFAULT 'Pending',
  processed_at    TIMESTAMP
);

-- 10. verified_institutions — KYC/KYB geçmiş kurumlar
CREATE TABLE verified_institutions (
  id              SERIAL PRIMARY KEY,
  institution_party VARCHAR(255) UNIQUE NOT NULL,
  legal_name      VARCHAR(500) NOT NULL,
  registration_no VARCHAR(100),
  jurisdiction    VARCHAR(10) NOT NULL,
  kyb_status      VARCHAR(20) DEFAULT 'Pending',
  kyb_level       VARCHAR(20),
  risk_profile    JSONB,
  custom_limits   JSONB,
  sub_accounts    JSONB DEFAULT '[]',
  verified_at     TIMESTAMP,
  expires_at      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 11. institutional_api_keys — Kurumsal API key yönetimi
CREATE TABLE institutional_api_keys (
  id              SERIAL PRIMARY KEY,
  key_hash        VARCHAR(255) UNIQUE NOT NULL,
  institution_party VARCHAR(255) NOT NULL,
  name            VARCHAR(200),
  permissions     JSONB,
  rate_limit      INT DEFAULT 1000,
  is_active       BOOLEAN DEFAULT true,
  last_used_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  expires_at      TIMESTAMP
);

-- 12. privacy_configs — Kullanıcı privacy ayarları
CREATE TABLE privacy_configs (
  id              SERIAL PRIMARY KEY,
  party_id        VARCHAR(255) UNIQUE NOT NULL,
  privacy_level   VARCHAR(20) DEFAULT 'Public',
  disclosure_rules JSONB DEFAULT '[]',
  audit_trail_enabled BOOLEAN DEFAULT false,
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- 13. privacy_audit_log — Veri erişim log'u
CREATE TABLE privacy_audit_log (
  id              SERIAL PRIMARY KEY,
  party_id        VARCHAR(255) NOT NULL,  -- Veri sahibi
  requester_party VARCHAR(255) NOT NULL,  -- Erişim isteyen
  data_scope      VARCHAR(30),
  granted         BOOLEAN NOT NULL,
  reason          TEXT,
  timestamp       TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_audit_party ON privacy_audit_log(party_id, timestamp);
```

---

## BÖLÜM D: YENİ FRONTEND BİLEŞENLERİ

### D.1 — Yeni Sayfalar

```
src/app/(dashboard)/credit/attestations/page.tsx  — Attestation yönetimi
src/app/(dashboard)/productive/page.tsx           — Productive lending ana sayfa
src/app/(dashboard)/productive/[projectId]/page.tsx — Proje detayı
src/app/(dashboard)/productive/apply/page.tsx     — Yeni proje başvurusu
src/app/(dashboard)/sec-lending/netting/page.tsx  — Netting dashboard
src/app/(dashboard)/institutional/page.tsx         — Institutional dashboard
src/app/(dashboard)/institutional/onboard/page.tsx — Onboarding flow
src/app/(dashboard)/settings/privacy/page.tsx     — Privacy toggle sayfası
```

### D.2 — Yeni Bileşenler

```
src/components/credit/
  ├─ CompositeScoreRing.tsx      — 3 katmanlı skor görseli (iç içe halkalar)
  ├─ AttestationCard.tsx         — Attestation durumu kartı
  ├─ AttestationForm.tsx         — ZK proof yükleme formu
  ├─ TierBenefitsComparison.tsx  — Tier karşılaştırma (güncellenen)
  └─ ScoreSimulator.tsx          — "Bu attestation'ı eklersem skorum?"

src/components/productive/
  ├─ ProjectCard.tsx             — Proje özet kartı (kategori icon, durum, ESG badge)
  ├─ ProjectDetailPanel.tsx      — Proje detay paneli (metadata, cashflow, IoT)
  ├─ CashflowTimeline.tsx        — Nakit akışı zaman çizelgesi
  ├─ HybridCollateralView.tsx    — 3 parçalı teminat görseli (kripto/proje/TIFA)
  ├─ ProductionMonitor.tsx       — IoT üretim veri dashboard'u
  ├─ ProjectApplicationForm.tsx  — Çok adımlı başvuru formu
  ├─ ESGBadge.tsx                — ESG rating badge (A/B/C)
  └─ ProductiveLendingStats.tsx  — Toplam istatistikler

src/components/sec-lending/
  ├─ FractionalOfferCard.tsx     — Fraksiyonel offer (kalan miktar göstergesi)
  ├─ DynamicFeeCalculator.tsx    — Gerçek zamanlı fee hesaplama
  ├─ NettingProposal.tsx         — Netting öneri ve kabul kartı
  ├─ CorporateActionBanner.tsx   — Bekleyen corporate action bildirimi
  └─ DealTimeline.tsx            — Deal yaşam döngüsü görseli

src/components/institutional/
  ├─ OnboardingWizard.tsx        — Çok adımlı KYB wizard
  ├─ InstitutionalDashboard.tsx  — Kurumsal ana panel
  ├─ BulkOperationPanel.tsx      — Toplu işlem paneli
  ├─ SubAccountManager.tsx       — Alt hesap yönetimi
  ├─ ComplianceExport.tsx        — Raporlama araçları
  └─ APIKeyManager.tsx           — API key oluşturma/yönetim

src/components/privacy/
  ├─ PrivacyToggle.tsx           — 3 seviyeli privacy selector
  ├─ DisclosureRuleManager.tsx   — Disclosure kural yönetimi
  ├─ AuditLogViewer.tsx          — Erişim log görüntüleyici
  └─ PrivacyLevelExplainer.tsx   — Her seviyenin ne yaptığını açıklayan
```

### D.3 — Yeni Zustand Store'lar

```
src/stores/
  ├─ useAttestationStore.ts      — Attestation yönetimi
  ├─ useCompositeScoreStore.ts   — 3 katmanlı skor (mevcut credit store'u genişletir)
  ├─ useProductiveStore.ts       — Projeler, havuzlar, productive borçlar
  ├─ useInstitutionalStore.ts    — KYB durumu, sub-accounts, API keys
  └─ usePrivacyStore.ts          — Privacy config, disclosure rules
```

### D.4 — Yeni Shared Types

```
packages/shared/src/types/
  ├─ attestation.types.ts        — ZKProof, OffChainAttestation, AttestationType
  ├─ compositeCredit.types.ts    — CompositeScore, ScoreLayer, breakdowns
  ├─ productive.types.ts         — ProjectCategory, ProjectMetadata, HybridCollateral
  ├─ institutional.types.ts      — VerifiedInstitution, KYBStatus, BulkOperation
  └─ privacy.types.ts            — PrivacyLevel, DisclosureRule, DataScope
```

---

## BÖLÜM E: GÜNCELLENMESİ GEREKEN MEVCUT BİLEŞENLER

### E.1 — Sidebar Navigasyonu
```
Mevcut:                          Yeni:
├─ Dashboard                     ├─ Dashboard
├─ Markets                       ├─ Markets
├─ Borrow                        ├─ Borrow
├─ Sec Lending                   ├─ Productive Lending  ← YENİ
├─ Credit Score                  ├─ Sec Lending (Advanced)
├─ Governance                    ├─ Credit Score (Composite)
├─ Staking                       ├─ Governance
├─ Portfolio                     ├─ Staking
                                 ├─ Portfolio
                                 ├─ Institutional ← YENİ (sadece KYB'li)
```

### E.2 — Dashboard Overview
- KPI'lara ekle: "Productive Lending APY", "ESG Portfolio Score"
- Position tab'larına ekle: "Productive Positions" tab'ı
- Composite score widget'ı (3 halkalı mini görsel)

### E.3 — Credit Score Sayfası
- Mevcut tek skor → 3 katmanlı composite score'a dönüştür
- Attestation yönetimi bölümü ekle
- Score simulator ekle

### E.4 — Sec Lending Sayfası
- Fractional offer desteği
- Dynamic fee calculator
- Netting dashboard
- Corporate action bildirimleri

### E.5 — Settings Sayfası
- Privacy toggle ekle
- Institutional settings bölümü (KYB durumu, API keys)

---

## BÖLÜM F: UYGULAMA SIRASI

### Mega Prompt 8: Shared Types + DB Schema + Backend Services
1. Yeni shared type dosyaları (5 dosya)
2. DB schema güncellemesi (13 yeni tablo)
3. Yeni backend service'ler:
   - attestation.service.ts
   - compositeCredit.service.ts
   - productive.service.ts
   - institutional.service.ts
   - privacy.service.ts
4. Yeni route modülleri (5 dosya)
5. Mevcut credit.service.ts güncellemesi
6. Mevcut secLending.service.ts güncellemesi

### Mega Prompt 9: Frontend — Bileşenler + Sayfalar
1. Yeni bileşenler (25+ dosya)
2. Yeni sayfalar (8 sayfa)
3. Yeni store'lar (5 dosya)
4. Mevcut sayfa güncellemeleri
5. Sidebar/navigation güncellemesi
6. Landing page "5 yenilik" bölümü

### Mega Prompt 10: Entegrasyon + Test + Polish
1. Frontend ↔ Backend yeni endpoint bağlantıları
2. Yeni API hook'ları
3. Test'ler (yeni service + component test'leri)
4. Mock data güncellemeleri
5. Final typecheck + build
