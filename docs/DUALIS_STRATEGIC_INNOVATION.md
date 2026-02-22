# Dualis Finance — Strategic Innovation & Differentiation Document
## "DeFi'yi Gerçek Ekonomiye Bağlayan Protokol"

> Bu doküman Dualis Finance'ı mevcut DeFi lending protokollerinden temelden ayıran 5 stratejik yeniliği detaylandırır. Her bölüm problemi, mevcut çözümleri, Dualis'in farklı yaklaşımını ve teknik mimariyi içerir.

---

## 1. HİBRİT KREDİ SKORU SİSTEMİ — On-Chain + Off-Chain Birleşimi

### Problem
DeFi bugün iki uçta sıkışmış durumda:
- **Aave/Compound:** Tamamen over-collateralized (150-200% teminat). Kredi skoru yok. $100 borç almak için $150+ kilitliyorsun. Sermaye verimsiz.
- **Goldfinch/TrueFi:** Under-collateralized ama sadece off-chain güvene dayalı. "Auditor" oylama mekanizması, gerçek zamanlı risk değerlendirmesi yok.

Mevcut on-chain kredi skorlama girişimleri (Credora, Cred Protocol, Spectral):
- Sadece on-chain wallet davranışını analiz eder
- Off-chain finansal geçmişi göremez
- Kurumsal ve bireysel kullanıcıları aynı şekilde değerlendirir
- Canton Network'ün gizlilik özelliklerinden yararlanmaz

### Dualis Yaklaşımı: "Composite Credit Score" (CCS)

**Üç katmanlı skor sistemi:**

```
┌─────────────────────────────────────────────────┐
│              COMPOSITE CREDIT SCORE              │
│                  (0-1000 puan)                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  KATMAN 1: On-Chain Skor (max 400 puan)         │
│  ├─ Borç geri ödeme geçmişi (150p)              │
│  ├─ Geri ödeme hızı (100p)                      │
│  ├─ Teminat sağlık geçmişi (80p)               │
│  ├─ Protokol etkileşim süresi/hacmi (40p)       │
│  └─ Sec lending deal tamamlama (30p)            │
│                                                  │
│  KATMAN 2: Off-Chain Attestation (max 350 puan) │
│  ├─ Kredi notu attestation'ı (150p)             │
│  │   ZK-proof: "Skorum X'ten büyük" kanıtı     │
│  │   Veri kaynağı: KKB/Findeks (TR), Experian   │
│  ├─ Gelir doğrulama attestation'ı (100p)        │
│  │   Banka hesap özeti ZK kanıtı                │
│  ├─ İş doğrulama attestation'ı (50p)            │
│  │   Ticaret sicil, vergi levhası kanıtı        │
│  └─ KYC/KYB completion bonus (50p)              │
│                                                  │
│  KATMAN 3: Ecosystem Reputation (max 250 puan)  │
│  ├─ TIFA Finance skor entegrasyonu (100p)       │
│  │   Alacak tokenizasyonu geçmişi               │
│  ├─ Cross-protocol referans (80p)               │
│  │   Diğer Canton app'lerden gelen attestation   │
│  └─ Governance katılımı + staking (70p)         │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Neden Farklı:**

1. **Opt-in Privacy ile Off-Chain Veri:** Kullanıcı kendi geleneksel kredi skorunu ZK-proof olarak paylaşabilir. "Findeks skorum 1400'ün üstünde" gibi bir kanıt sunar — gerçek skoru veya kişisel bilgileri açığa çıkarmadan. Canton'un sub-transaction privacy'si bu verinin sadece kredi değerlendirme kontratına görünür olmasını sağlar.

2. **Dinamik Tier Sistemi:** Skor statik değil — her geri ödeme, her teminat yönetimi kararı, her attestation ile gerçek zamanlı güncellenir. Tier yükseldikçe somut faydalar:

| Tier | Min Skor | Max LTV | Rate İndirimi | Min Teminat |
|------|----------|---------|---------------|-------------|
| Diamond | 850+ | 85% | -25% | 115% |
| Gold | 650-849 | 78% | -15% | 125% |
| Silver | 450-649 | 70% | -8% | 135% |
| Bronze | 250-449 | 60% | 0% | 150% |
| Unrated | 0-249 | 50% | 0% | 175% |

3. **TIFA Bridge Bonusu:** Türkiye'de TIFA Finance üzerinden alacak tokenizasyonu yapan firmalar, ödeme geçmişlerini Dualis'e attestation olarak aktarabilir. Bu, gerçek dünya ticari performansını DeFi kredibilitesine dönüştürür.

4. **Canton-Native Gizlilik:** Kredi skoru detayları sadece borçlu ve borç veren arasında paylaşılır. Diğer kullanıcılar sadece tier'i görür (Diamond/Gold/Silver), gerçek skoru veya off-chain attestation detaylarını göremez.

### Teknik Mimari

```
Off-Chain Attestation Flow:
                                                    
  [Kullanıcı]                                       
      │                                              
      ├──→ [ZK Attestation Provider]                 
      │     (Findeks/KKB API → ZK circuit)           
      │     Çıktı: ZK-proof "skor > X"              
      │                                              
      ├──→ [Canton: CreditProfile kontratı]          
      │     attestations: [                          
      │       { type: "credit_bureau",               
      │         proof: ZKProof,                      
      │         claimedRange: "excellent",           
      │         expiry: 90 days }                    
      │     ]                                        
      │                                              
      └──→ [Dualis Scoring Engine]                   
            Katman 1 (on-chain) + Katman 2 (ZK)      
            + Katman 3 (ecosystem) = CCS              
            → CreditTier belirleme                   
            → Daml kontratına yazılma                
```

**Yeni Daml Kontratları:**
- `CreditAttestation` — ZK proof'ları tutan kontrat, expiry ile
- `AttestationVerifier` — Proof doğrulama choice'u
- `CompositeScoreCalculator` — 3 katmanı birleştiren hesaplama
- `CreditPolicy` — Tier'e göre borçlanma parametrelerini belirleyen politika kontratı

---

## 2. GERÇEK EKONOMİ FİNANSMANI — "Productive Lending" Modeli

### Problem
Bugün DeFi'de döngüsel finans yapılıyor:
- ETH teminat ver → USDC borç al → daha fazla ETH al → tekrar teminat ver
- Para sistemin içinde dönüyor, gerçek dünyada hiçbir değer üretilmiyor
- Aave'de $18B TVL var ama bunun %0'a yakını gerçek ekonomik faaliyet finanse ediyor

Frigg.eco ve Goldfinch gibi projeler bunu çözmeye çalışıyor ama:
- Goldfinch: Sadece gelişmekte olan ülkelerde mikro kredi, altyapı yok
- Frigg: İsviçre merkezli, dar odak, ölçeklenme sorunu
- Hiçbiri Canton Network'ün kurumsal güvenilirliğini kullanmıyor

### Dualis Yaklaşımı: "Productive Lending Pools"

**Kavram:** DeFi likiditesini gerçek dünya projelerine yönlendiren özel havuzlar. Borçlanan kişi/kurum, fonları somut üretim projelerine kullanır ve proje geliri ile geri öder.

**Desteklenen Proje Kategorileri:**

```
┌──────────────────────────────────────────────────────┐
│              PRODUCTIVE LENDING POOLS                 │
├──────────────────────────────────────────────────────┤
│                                                       │
│  🔋 ENERJİ ALTYAPISI                                │
│  ├─ Güneş enerjisi santralleri (GES)                 │
│  ├─ Rüzgar türbinleri                                │
│  ├─ Enerji depolama (batarya) tesisleri              │
│  └─ Veri merkezi enerji altyapısı                    │
│                                                       │
│  🏭 ÜRETIM & TİCARET                                │
│  ├─ Tedarik zinciri finansmanı                       │
│  │   (TIFA Finance alacak tokenizasyonu ile)         │
│  ├─ İhracat finansmanı                               │
│  ├─ Stok finansmanı                                  │
│  └─ Ekipman leasing                                  │
│                                                       │
│  🏗️ GAYRİMENKUL & ALTYAPI                           │
│  ├─ Ticari gayrimenkul geliştirme                    │
│  ├─ Lojistik depo finansmanı                         │
│  └─ Tarımsal altyapı                                 │
│                                                       │
│  💻 TEKNOLOJİ                                        │
│  ├─ AI/ML compute altyapısı                          │
│  ├─ Blockchain mining/staking altyapısı              │
│  └─ Telekom altyapısı                                │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Nasıl Çalışıyor — GES Örneği:**

```
SENARYO: 500 kW güneş enerjisi santrali finansmanı

1. PROJE TOKENİZASYONU
   - Proje sahibi SPV (Special Purpose Vehicle) kurar
   - SPV, Canton üzerinde "ProjectAsset" kontratı oluşturur
   - Proje detayları: konum, kapasite, beklenen üretim, off-taker anlaşması
   - Bağımsız değerleme raporu attestation olarak eklenir

2. TEMINAT YAPISI (Hibrit)
   - %40 kripto teminat (USDC/wBTC) — anlık likidasyona tabi
   - %40 proje varlığı token'ı — fiziksel ekipman + arazi
   - %20 TIFA alacak token'ları — enerji satış alacakları
   - Toplam teminat değeri: projenin %130'u

3. KREDİ YAPILANDIRMASI
   - Toplam: $2M USDC
   - Faiz: %8.5 yıllık (kredi skoru Gold, productive lending indirimi)
   - Vade: 5 yıl
   - Grace period: 6 ay (inşaat süresi)
   - Geri ödeme: Aylık, enerji satış gelirinden otomatik

4. GERİ ÖDEME MEKANİZMASI
   - Enerji satış geliri USDC'ye çevrilir
   - Akıllı kontrat otomatik olarak:
     → Aylık taksiti öder
     → Fazla geliri "reserve fund"a aktarır
     → Reserve fund dolduğunda kripto teminatı serbest bırakır
   
5. RİSK YÖNETİMİ
   - Oracle: enerji fiyat feed'i (günlük güncelleme)
   - IoT entegrasyonu: santral üretim verisi on-chain attestation
   - Erken uyarı: üretim %20 altına düşerse teminat artırma çağrısı
   - Sigorta: proje sigortası attestation olarak bağlı
```

**Neden Devrimsel:**
- DeFi tarihinde ilk kez bir lending protokolü **güneş paneli finanse edebilir**
- Üretilen elektrik, hizmet ve gelir → finans doğrudan ekonomiyi büyütüyor
- Canton'un kurumsal ortakları (Goldman Sachs, DTCC) zaten altyapı projelerine yatırım yapıyor
- Türkiye özelinde: yüksek enerji maliyeti + güneş potansiyeli = güçlü use case

**Productive Lending İndirimi:**
Gerçek ekonomi projeleri finanse eden borçlular ek faiz indirimi alır:
- Enerji projeleri: -2% APY indirimi
- Üretim/ticaret: -1.5% APY indirimi  
- Teknoloji altyapısı: -1% APY indirimi
- Sebep: Bu krediler gerçek nakit akışı üretir, risk profili saf kripto spekülasyonundan düşüktür

### Teknik Mimari

**Yeni Daml Kontratları:**
```
module Dualis.Productive.Project

-- Proje varlığı token'ı
template ProjectAsset
  with
    projectId: Text
    owner: Party
    operator: Party
    projectType: ProjectCategory  -- Solar, Wind, Battery, DataCenter, Trade, ...
    valuation: Decimal            -- Bağımsız değerleme (USD)
    metadata: ProjectMetadata     -- Konum, kapasite, off-taker, sigorta
    attestations: [Attestation]   -- Değerleme raporu, çevresel izin, sigorta
    cashflowSchedule: [CashflowEntry]  -- Beklenen gelir takvimi

-- Productive Lending Pool
template ProductiveLendingPool
  with
    poolId: Text
    projectCategory: ProjectCategory
    totalFunded: Decimal
    activeLoans: Int
    defaultRate: Decimal
    avgReturn: Decimal
    rateDiscount: Decimal  -- Productive lending bonus indirimi
    
-- Productive Borrow Position  
template ProductiveBorrow
  with
    borrower: Party
    projectAsset: ContractId ProjectAsset
    loanAmount: Decimal
    cryptoCollateral: [CollateralPosition]
    projectCollateral: Decimal     -- Proje varlık değeri
    tifaCollateral: Decimal        -- TIFA alacak değeri
    cashflowRepayments: [RepaymentEntry]  -- Gerçekleşen gelir-bazlı ödemeler
    gracePeriod: RelTime
    ioTFeed: Optional Text         -- IoT üretim verisi feed ID
```

---

## 3. YENİ NESİL SECURITIES LENDING

### Problem
Geleneksel securities lending $2.8 trilyon büyüklüğünde bir pazar ama:
- Aracılar (prime broker'lar) %30-40 fee alıyor
- T+2 settlement (2 gün bekleme)
- Karşı taraf riski büyük — 2008'de Lehman Brothers çöktüğünde sec lending pozisyonları haftalarca çözülemedi
- Opacity: borçlu varlığı ne için kullandığını bilmiyorsun
- Küçük kurumlar market'e erişemiyor (minimum lot büyüklükleri)

Mevcut DeFi sec lending girişimleri (EquiLend on-chain, sLender):
- Sadece kurumsal, retail erişim yok
- Karmaşık onboarding
- Canton'un privacy özelliklerini kullanmıyor

### Dualis Yenilikleri

**3.1 — Peer-to-Peer Sec Lending (Aracısız)**
```
GELENEKSel:
  Lender → Prime Broker (fee) → Borrower
  Settlement: T+2, opak

DUALIS:
  Lender → [Smart Contract] → Borrower
  Settlement: Atomik (anlık), şeffaf
  Fee: Doğrudan lender'a, protokol sadece %5 fee alır (vs %30-40 broker)
```

**3.2 — Fraksiyonel Securities Lending**
Büyük bir pozisyonu parçalara bölerek birden fazla borrower'a sunma:
```
ÖRNEK:
  Goldman Sachs, $100M SPY-2026 token'ını lending'e sunuyor
  
  → $30M → Hedge Fund A (45 bps, 30 gün)
  → $50M → Market Maker B (35 bps, 7 gün, recallable)
  → $20M → Retail pool (55 bps, 90 gün)
  
  Her parça bağımsız Daml kontratı, bağımsız collateral
```

**3.3 — Dynamic Fee Mekanizması**
Sabit fee yerine piyasa koşullarına göre dinamik fee:
```
Fee = BaseFee × DemandMultiplier × DurationFactor × CreditDiscount

Nerede:
- BaseFee: asset tipine göre temel oran (T-Bill: 10bps, Equity: 40bps)
- DemandMultiplier: (aktif borrow talebi / mevcut supply) oranına göre 0.5x - 3.0x
- DurationFactor: uzun vade = daha yüksek fee (7d: 1.0x, 30d: 1.2x, 90d: 1.5x)
- CreditDiscount: borrower'ın credit tier'ine göre (Diamond: 0.8x, Gold: 0.9x, Bronze: 1.0x)
```

**3.4 — Corporate Action Handling (Temettü/Kupon)**
Tokenized securities'in en büyük sorunu corporate action'lar:
```
SENARYO: SPY-2026 lend edilmiş durumda, temettü dağıtım günü geldi

1. Oracle, corporate action event'ini bildirir
2. Smart contract otomatik olarak:
   a. Temettü tutarını hesaplar (manufactured dividend)
   b. Borrower'ın collateral'ından düşer
   c. Lender'a öder
   d. Tüm bunlar atomik — tek transaction'da

KUPON ÖDEMELERİ (T-BILL):
- Kupon tarihleri kontrata gömülü
- Otomatik accrued interest hesaplama
- Gün bazında pro-rata dağıtım
```

**3.5 — Netting & Compression**
Birden fazla karşılıklı deal'i netleştirme:
```
ÖNCE:
  A → B: 1000 SPY (45 bps)
  B → A: 500 SPY (40 bps)
  Net exposure: A'nın B'ye 500 SPY borcu

SONRA (Smart Netting):
  Tek kontrat: A → B: 500 SPY (ağırlıklı ort. 43 bps)
  Collateral ihtiyacı %50 azalır
  Karşı taraf riski %50 azalır
```

### Teknik Mimari

**Yeni Daml Kontratları:**
```
-- Fraksiyonel Offer
template FractionalOffer
  with
    totalAmount: Decimal
    remainingAmount: Decimal
    minAcceptAmount: Decimal     -- Minimum lot (retail: $100, institutional: $100K)
    acceptedDeals: [ContractId SecLendingDeal]
    
-- Dynamic Fee hesaplama
template FeeOracle
  with
    baseFees: Map InstrumentType Decimal
    currentDemand: Map Text Decimal
    currentSupply: Map Text Decimal
    
-- Netting Engine
template NettingAgreement
  with
    parties: (Party, Party)
    deals: [ContractId SecLendingDeal]
    netExposure: Map Text Decimal  -- Asset bazında net pozisyon
```

---

## 4. İKİ KULLANICI TİPİ: INSTITUTIONAL vs RETAIL

### Problem
Mevcut DeFi protokolleri herkese aynı arayüzü sunuyor. Bu hem kurumlar hem bireyler için sorun:
- **Kurumlar:** KYC/KYB zorunluluğu, compliance raporlama, bulk operasyonlar, API erişimi, risk limitleri
- **Bireyler:** Basit cüzdan bağlantısı, hızlı erişim, anlaşılır arayüz

Aave V3 "permissioned pool" konseptini denedi ama gerçek bir institutional deneyim değil.

### Dualis Yaklaşımı: Çift Katmanlı Erişim

```
┌───────────────────────────────────────────────────────┐
│                  DUALIS FINANCE                        │
├───────────────────────┬───────────────────────────────┤
│   RETAIL TRACK        │   INSTITUTIONAL TRACK          │
├───────────────────────┼───────────────────────────────┤
│                       │                                │
│ Onboarding:           │ Onboarding:                    │
│ • Cüzdan bağla        │ • KYC/KYB süreci               │
│ • Hemen işlem yap     │ • Compliance dokümantasyonu     │
│                       │ • Legal entity doğrulama        │
│                       │ • API key tahsisi               │
│                       │                                │
│ Erişim:               │ Erişim:                        │
│ • Web arayüzü         │ • Web arayüzü (gelişmiş)       │
│ • Standart havuzlar   │ • API (REST + WebSocket)       │
│ • Max $1M pozisyon    │ • Özel havuzlar (permissioned)  │
│                       │ • Sınırsız pozisyon             │
│                       │ • Bulk operasyonlar             │
│                       │                                │
│ Oranlar:              │ Oranlar:                       │
│ • Standart APY        │ • Volume-based indirim          │
│ • Standart fee        │ • Özel fee yapısı               │
│                       │ • Negotiated rates              │
│                       │                                │
│ Teminat:              │ Teminat:                       │
│ • Kripto varlıklar    │ • Kripto + T-Bill + RWA         │
│ • TIFA alacakları     │ • TIFA alacakları               │
│                       │ • Tokenized equities            │
│                       │ • Custom collateral onboarding  │
│                       │                                │
│ Sec Lending:          │ Sec Lending:                   │
│ • Mini lot ($100+)    │ • Büyük lot ($100K+)           │
│ • Fraksiyonel erişim  │ • Direct negotiation           │
│ • Fixed fee           │ • Dynamic + negotiated fee      │
│                       │ • Netting & compression         │
│                       │                                │
│ Privacy:              │ Privacy:                       │
│ • Temel privacy       │ • Tam selective disclosure      │
│ • Pozisyon gizliliği  │ • Regülatör disclosure          │
│                       │ • Audit trail                   │
│                       │ • Compliance reporting API      │
│                       │                                │
│ Risk Mgmt:            │ Risk Mgmt:                     │
│ • Otomatik likid.     │ • Özel risk parametreleri       │
│ • Standart threshold  │ • Portfolio-level risk mgmt     │
│                       │ • Sub-account yapısı            │
│                       │ • Özel alarm eşikleri           │
│                       │                                │
│ Kredi Skoru:          │ Kredi Skoru:                   │
│ • On-chain + opt-in   │ • On-chain + off-chain zorunlu  │
│   off-chain           │ • Moody's/S&P eşlemesi          │
│                       │ • Özel risk rating              │
│                       │                                │
│ Governance:           │ Governance:                    │
│ • 1 token = 1 oy      │ • Ağırlıklı oy (stake × tier)  │
│                       │ • Proposal oluşturma hakkı      │
│                       │ • Protocol parameter review     │
│                       │                                │
└───────────────────────┴───────────────────────────────┘
```

**Institutional Onboarding Flow:**

```
1. APPLICATION
   → Firma bilgileri, legal entity yapısı, ülke
   → Beklenen işlem hacmi, kullanım senaryosu

2. KYC/KYB DOĞRULAMA
   → Üçüncü parti KYC provider (Jumio, Onfido, Sumsub)
   → Şirket: ticaret sicil, vergi kimlik, beneficial ownership
   → Yöneticiler: kimlik doğrulama, PEP/sanctions tarama
   → Sonuç: Canton üzerinde "VerifiedEntity" attestation'ı
   
3. COMPLIANCE SETUP
   → Risk profili belirleme
   → İşlem limitleri
   → Regulatory reporting konfigürasyonu
   → İlgili jurisdiksiyon kuralları

4. TEKNİK ENTEGRASYON
   → API key oluşturma (RSA-2048 imzalı)
   → Webhook konfigürasyonu
   → Sandbox test ortamı erişimi
   → SDK entegrasyonu (Python, TypeScript, Java)

5. AKTİVASYON
   → Compliance team onayı
   → İlk deposit (minimum $100K)
   → Institutional pool erişimi açılır
```

**Institutional API Ekstra Endpoint'ler:**
```
POST /v1/institutional/bulk-deposit      — Tek çağrıda birden fazla pool'a deposit
POST /v1/institutional/bulk-withdraw     — Toplu çekim
GET  /v1/institutional/risk-report       — Konsolide risk raporu (PDF)
GET  /v1/institutional/compliance-export — Regulatory raporlama (CSV/XML)
POST /v1/institutional/sub-accounts      — Alt hesap yönetimi
GET  /v1/institutional/fee-schedule      — Özel fee yapısı
POST /v1/institutional/otc-request       — OTC büyük işlem talebi
```

### Teknik Mimari

**Yeni Daml Kontratları:**
```
-- Doğrulanmış kurumsal entity
template VerifiedInstitution
  with
    institution: Party
    legalName: Text
    jurisdiction: Text
    kybStatus: KYBStatus          -- Pending, Verified, Expired, Rejected
    verificationDate: Time
    expiryDate: Time              -- Yıllık yenileme
    riskProfile: InstitutionalRisk
    customLimits: LimitConfig
    subAccounts: [Party]          -- Alt hesaplar
    
-- Kurumsal havuz (sadece verified entity erişebilir)
template InstitutionalPool
  with
    poolId: Text
    requiredKYBLevel: KYBLevel    -- Basic, Enhanced, Full
    minDeposit: Decimal
    customFeeSchedule: FeeSchedule
    eligibleCollateral: [InstrumentType]
```

---

## 5. PRIVACY TOGGLE — Canton Selective Disclosure

### Problem
Mevcut DeFi'de iki uç var:
- **Ethereum/Solana:** Her şey şeffaf. Pozisyonların, stratejilerin, bakiyelerin herkes tarafından görünür. Front-running ve MEV saldırıları yaygın.
- **Tornado Cash tarzı:** Tam gizlilik ama regülatör erişimi yok. Kara para aklama riski. ABD'de yasaklandı.

Kurumlar için hiçbiri çalışmaz. "Ben Goldman Sachs'ım, $500M collateral pozisyonumun rakiplerime görünmesini istemiyorum ama regülatörüm istediğinde görebilmeli" diyorlar.

### Dualis Yaklaşımı: "Configurable Privacy"

Canton Network'ün sub-transaction privacy'sini kullanıcıya anlaşılır bir şekilde sunuyoruz.

**Privacy Seviyeleri (Kullanıcı Seçimli):**

```
┌────────────────────────────────────────────────────────┐
│                    PRIVACY TOGGLE                       │
├────────────────────────────────────────────────────────┤
│                                                         │
│  SEVIYE 1: PUBLIC (Retail default)                      │
│  ├─ Pool'lar toplam TVL, APY görünür                   │
│  ├─ Bireysel pozisyonlar: sadece kullanıcı görür       │
│  ├─ Transaction hash'ler halka açık                     │
│  └─ Protocol analytics: aggregated data açık            │
│                                                         │
│  SEVIYE 2: SELECTIVE (Institutional default)            │
│  ├─ Pozisyon detayları: sadece karşı taraf + kullanıcı  │
│  ├─ Borç miktarları: gizli (sadece tier bilgisi açık)  │
│  ├─ Sec lending deal'leri: sadece taraflar görür        │
│  ├─ Regülatör disclosure: opt-in, audit trail ile       │
│  └─ Aggregated veriler: protokole anonim olarak akar    │
│                                                         │
│  SEVIYE 3: MAXIMUM (Premium / Institutional)            │
│  ├─ Tüm pozisyonlar tamamen gizli                      │
│  ├─ Transaction metadata bile gizli                     │
│  ├─ Sadece taraflar ve atanmış auditor görebilir        │
│  ├─ Canton sub-transaction privacy tam aktif            │
│  └─ Compliance: seçilen regülatöre selective disclosure  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Pratik Kullanım Senaryoları:**

```
SENARYO 1: Hedge Fund Collateral Yönetimi
  - Fund, $200M teminat pozisyonu açıyor
  - Privacy: MAXIMUM
  - Rakipler: hiçbir şey göremez
  - Lending protokolü: sadece teminat yeterliliğini doğrulayabilir
  - Regülatör: Fund'ın atadığı SEC raporlama aracı, pozisyonu görebilir
  - Canton'un DvP mekanizması: banka sadece cash leg'i, custodian sadece asset leg'i görür

SENARYO 2: Türk KOBİ Borçlanması
  - TIFA alacaklarını teminat göstererek borçlanıyor
  - Privacy: SELECTIVE
  - Alacak detayları: sadece borç veren ve KOBİ görür
  - Borçlanma tutarı: üçüncü taraflara gizli
  - BDDK/SPK: seçilen regülatör disclosure ile denetleyebilir

SENARYO 3: Retail Kullanıcı
  - $10K USDC deposit ediyor
  - Privacy: PUBLIC (default)
  - Pozisyonu sadece kendisi görür (zaten Canton'da default)
  - Pool istatistikleri: aggregated olarak halka açık
  - İsterse SELECTIVE'e geçebilir (premium özellik)
```

**Privacy Toggle UI Tasarımı:**

```
Settings → Privacy sayfasında:

┌─────────────────────────────────────┐
│  🔒 Privacy Level                    │
│                                      │
│  ○ Public      — Standard privacy    │
│  ◉ Selective   — Enhanced privacy    │  ← Seçili
│  ○ Maximum     — Full privacy        │
│                                      │
│  ─────────────────────────────────── │
│                                      │
│  📋 Disclosure Rules                 │
│                                      │
│  Regülatör Erişimi:                  │
│  [+ Add Regulator Party ID]         │
│                                      │
│  Auditor Erişimi:                    │
│  [+ Add Auditor Party ID]           │
│                                      │
│  Aktif Disclosure'lar:               │
│  • SEC Reporting → 0x7a2f... ✓      │
│  • KPMG Audit → 0x3b8c... ✓        │
│                                      │
└─────────────────────────────────────┘
```

### Teknik Mimari

Canton'da privacy Daml smart contract seviyesinde programlanır:

```
-- Privacy konfigürasyon kontratı
template PrivacyConfig
  with
    user: Party
    operator: Party
    privacyLevel: PrivacyLevel        -- Public | Selective | Maximum
    disclosureRules: [DisclosureRule]  -- Kim neyi görebilir
    auditTrail: Bool                  -- Audit log tutulsun mu
    
-- Disclosure kuralı
data DisclosureRule = DisclosureRule
  { discloseTo: Party           -- Gösterilecek taraf
  , dataScope: DataScope        -- Positions | Transactions | CreditScore | All
  , expiry: Optional Time       -- Süre sınırı
  , purpose: Text               -- "SEC quarterly reporting"
  }

-- Canton Sub-Transaction Privacy uygulama
-- Her transaction'da:
--   1. Borçlu: tüm pozisyon detaylarını görür
--   2. Borç veren: teminat yeterliliğini görür, borçlunun diğer pozisyonlarını GÖRMEZ
--   3. Oracle: sadece fiyat feed'ini sağlar, pozisyon detaylarını GÖRMEZ
--   4. Regülatör (disclosure ile): atanan kapsamı görür
--   5. Diğer kullanıcılar: HİÇBİR ŞEY görmez
```

---

## 6. EK İNOVASYONLAR — Araştırmadan Çıkan Fırsatlar

### 6.1 — Flash Loan ile Productive Lending Bootstrapping
Flash loan'ları sadece arbitraj için değil, productive lending havuzlarını başlatmak için kullan:
- Flash loan ile büyük bir productive pool oluştur
- İlk büyük depositor'a bonus APY ver
- Pool yeterli büyüklüğe ulaşınca flash loan geri öde
- Sonuç: Sıfır sermayeyle büyük havuz bootstrapping

### 6.2 — Cross-Protocol Credit Portability
Canton Network'ün composability'sini kullanarak:
- Dualis'te kazanılan kredi skoru, diğer Canton app'lerinde de geçerli
- TIFA Finance'ta iyi performans → Dualis'te bonus puan
- Canton ekosistem genelinde "Dualis Credit Passport"

### 6.3 — ESG Scoring Entegrasyonu
Productive lending projeleri için ESG skoru:
- Yeşil enerji projeleri: ESG-A (ek %1 APY indirimi)
- Üretim/ticaret: ESG-B (ek %0.5 indirimi)
- ESG skorlu projeler → kurumsal ESG raporlamasına dahil edilebilir
- Bu, ESG-focused institutional capital'i çeker

### 6.4 — Tokenized Insurance Pool
Productive lending riskleri için merkeziyetsiz sigorta:
- Kullanıcılar sigorta havuzuna likidite sağlar
- Proje default olursa havuzdan tazminat
- Sigorta sağlayıcılar: sigorta APY kazanır
- Risk çeşitlendirmesi: farklı proje kategorileri

### 6.5 — AI-Powered Risk Engine
Credit scoring ve risk yönetiminde AI:
- ML modeli: wallet davranışı + off-chain data → default probability
- Anomaly detection: ani büyük transferler, liquidation cascade riski
- Dynamic interest rate: AI-optimized rate curve (Gauntlet tarzı)
- Canton'da ZK ile: AI modeli off-chain çalışır, sonuç attestation olarak on-chain'e gelir

---

## RAKIP ANALİZİ: Dualis vs Mevcut Protokoller

| Özellik | Aave V3 | Goldfinch | Maple | EquiLend | **Dualis** |
|---------|---------|-----------|-------|----------|------------|
| **Teminat Modeli** | Over-coll (150%+) | Under-coll (auditor güven) | Under-coll (pool delegate) | N/A | **Hibrit (kredi skoru bazlı, 115-175%)** |
| **Credit Scoring** | Yok | Off-chain auditor | Pool delegate kararı | Geleneksel | **3 katmanlı: on-chain + ZK off-chain + ecosystem** |
| **Productive Lending** | Yok | Mikro kredi (gelişen pazar) | Kurumsal kredi | Yok | **Proje bazlı: enerji, üretim, altyapı** |
| **Securities Lending** | Yok | Yok | Yok | Kurumsal only | **Fraksiyonel, P2P, dynamic fee, kurumsal+retail** |
| **Privacy** | Yok (Ethereum şeffaf) | Minimal | Minimal | Özel ağ | **Canton sub-transaction, 3 seviye toggle** |
| **Inst. vs Retail** | Aynı arayüz | Kurumsal odaklı | Kurumsal odaklı | Sadece kurumsal | **Ayrı track'ler, KYC/KYB, özel API** |
| **RWA Collateral** | sınırlı | Yok | Yok | N/A | **TIFA alacak + proje varlık + T-Bill** |
| **Blockchain** | Ethereum | Ethereum | Ethereum/Solana | Özel | **Canton Network ($6T tokenized asset)** |
| **Regülatör Uyumu** | Düşük | Orta | Orta | Yüksek | **Yüksek (Canton compliance + selective disclosure)** |

---

## SONRAKI ADIMLAR

1. **Bu dokümanı onaylama** — 5 yenilik üzerinde anlaşma
2. **Teknik spesifikasyonu güncelleme** — Yeni Daml kontratları, API endpoint'leri, DB şemaları
3. **UI/UX'e yansıtma** — Productive lending sayfası, privacy toggle, institutional dashboard
4. **Pitch deck güncelleme** — Yenilikler, rakip karşılaştırma, market opportunity
5. **Kod implementasyonu** — Yeni mega prompt'lar
