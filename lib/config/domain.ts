// lib/config/domain.ts
// Single source of truth pentru toată terminologia platformei Verigaz.
// Schimbă acest fișier pentru a adapta copy-ul/SEO pe un alt vertical.

export const DOMAIN = {
  // ── Brand ──
  brandName: "verificari-gaze.ro",
  domain: "verificari-gaze.ro",
  baseUrl: "https://verificari-gaze.ro",
  cdnDomain: "media.ghidulfunerar.ro", // R2 bucket partajat, folder verigaz/
  contactEmail: "contact@verificari-gaze.ro",
  facebookUrl: "https://www.facebook.com/verigaz",

  // ── Terminologie domeniu ──
  serviceType: "verificări și revizii gaze",
  serviceTypeSingular: "verificare instalație gaze",
  serviceTypeCapitalized: "Verificări și revizii gaze",
  firmType: "firme autorizate ANRE",
  firmTypeCapitalized: "Firme autorizate ANRE",
  firmTypeSingular: "firmă autorizată ANRE",
  firmTypeVerified: "firme autorizate ANRE verificate",
  domainAdjective: "gaze",
  domainAdjectivePlural: "gaze",

  // ── Metadata (root layout) ──
  metaTitleDefault: "Firme autorizate ANRE pentru verificări și revizii gaze în România",
  metaTitleTemplate: "%s – verificari-gaze.ro",
  metaDescription:
    "Găsește firme autorizate ANRE pentru verificare instalație gaze, revizie la 10 ani, montaj detectoare și service centrală termică. Programare rapidă, documente digitale, reminder-e automate.",

  metaOgDescription:
    "Verifică-ți instalația de gaze la zi: firme autorizate ANRE, programare rapidă, certificat digital, reminder-e când expiră verificarea.",
  metaTwitterDescription:
    "verificari-gaze.ro — găsește firmă autorizată ANRE, programează rapid verificarea sau revizia instalației de gaze. Documente digitale + reminder-e.",

  // ── Hero ──
  heroTitle: "Instalația ta de gaze, la zi. Oriunde în România.",
  heroSubtitle:
    "Firme autorizate ANRE pentru verificări, revizii, montaj detectoare și reparații. Programare rapidă, certificat digital, reminder când expiră.",
  heroSubtitleMobile:
    "Găsești firmă autorizată, programezi rapid și primești certificat digital.",
  heroMobileToggle: "Caută firmă pentru gaze",
  heroMobileToggleOpen: "Căutare avansată",

  // ── Header / Footer ──
  headerTagline: "Verificări, revizii, detectoare gaze • România",
  footerDescription:
    "Platformă națională pentru verificări și revizii instalații gaze, montaj detectoare și service centrală termică. Firme autorizate ANRE, programare online, documente digitale.",

  // ── Texte servicii ──
  servicesPageTitle: "Servicii pentru instalații de gaze",
  servicesPageDesc:
    "Găsește servicii pentru gaze: verificare obligatorie la 2 ani, revizie la 10 ani, montaj detector, reparații. Filtrează după județ și localitate.",
  servicesFilteredTitle: "Servicii pentru gaze – căutare și filtrare",
  servicesFilteredDesc:
    "Caută și filtrează firme autorizate ANRE pentru verificări, revizii și montaj detectoare gaze. Compară rapid și programează direct.",
  servicesBreadcrumb: "Servicii gaze",

  // ── Firm card default ──
  firmDefaultDescription:
    "Firmă autorizată ANRE pentru verificări, revizii, montaj detectoare și reparații instalații de gaze.",
  firmDefaultDescriptionShort:
    "Firmă autorizată ANRE, programări rapide și documente emise pe loc.",

  // ── Schema.org JSON-LD ──
  schemaName: "Verigaz",
  schemaDescription:
    "Platformă online pentru verificări și revizii instalații gaze în România. Găsește firme autorizate ANRE, programează rapid și primește certificat digital.",

  // ── Pagini dinamice (template-uri) ──
  countyPageTitle: (county: string) =>
    `Verificări și revizii gaze în ${county} — firme autorizate ANRE`,
  countyPageDesc: (county: string) =>
    `Găsește firme autorizate ANRE din județul ${county} pentru verificarea instalației de gaze la 2 ani, revizia la 10 ani și montaj detectoare. Programare rapidă.`,
  countyPageH1: (county: string) =>
    `Verificări și revizii gaze în județul ${county}`,
  countyPageIntro: (county: string) =>
    `Aici găsești rapid <strong>firme autorizate ANRE</strong> din județul ${county} care execută verificarea periodică a instalațiilor de gaze (la 2 ani) și revizia obligatorie (la 10 ani). Programare online, fără drumuri la sediu.`,
  countyPageServicesNote: (county: string) =>
    `Verificare, revizie, montaj detector, reparații, service detector, verificare și revizie centrală termică. Filtrează și programează rapid în ${county}.`,
  countyPageInfoTitle: (county: string) =>
    `Siguranță gaze în ${county}: firme, scadențe, documente`,
  countyPageInfoDesc: (county: string) =>
    `Pagina județului ${county} grupează firmele autorizate ANRE, prețuri orientative și termene legale (verificare 24 luni, revizie 120 luni) conform ANRE Ord. 179/2015.`,

  countyServicesTitle: (county: string) =>
    `Servicii gaze în ${county}`,
  countyServicesDesc: (county: string) =>
    `Caută servicii autorizate ANRE în județul ${county}: verificare, revizie, montaj detector, reparație. Compară prețuri și programează.`,

  countyFirmsTitle: (county: string) =>
    `Firme autorizate ANRE în ${county}`,
  countyFirmsDesc: (county: string) =>
    `Lista firmelor autorizate ANRE din județul ${county}. Compară profilul, serviciile, recenziile și contactează direct.`,
  countyFirmsH1: (county: string) =>
    `Firme autorizate ANRE în ${county}`,
  countyFirmsIntro: (county: string) =>
    `Firme autorizate ANRE din județul <strong>${county}</strong>, cu autorizația validă, profil complet și date de contact verificate.`,
  countyFirmsCta: (county: string) =>
    `Reprezinți o firmă autorizată ANRE din ${county}? Înscrie-te și primește clienți din zonă.`,
  countyFirmsHowTo: "Cum alegi o firmă autorizată ANRE, fără bătăi de cap",

  localityServicesTitle: (locality: string, county: string) =>
    `Servicii gaze în ${locality}, ${county}`,
  localityServicesDesc: (locality: string, county: string) =>
    `Verificare, revizie, montaj detector și reparații gaze în ${locality}, ${county}. Firme autorizate ANRE, programare rapidă.`,

  localityPageTitle: (locality: string, county: string) =>
    `Verificări și revizii gaze în ${locality}, ${county}`,
  localityPageDesc: (locality: string, county: string) =>
    `Găsește firme autorizate ANRE în ${locality}, ${county}. Verificare 2 ani, revizie 10 ani, montaj detectoare, reparații.`,
  localityPageIntro: (locality: string, county: string) =>
    `Explorează firmele autorizate ANRE din ${locality}, ${county}, și programează direct verificarea sau revizia instalației.`,

  localityFirmsTitle: (locality: string, county: string) =>
    `Firme autorizate ANRE în ${locality}, ${county} — contact direct`,
  localityFirmsDesc: (locality: string, county: string) =>
    `Firme autorizate ANRE din ${locality}, ${county}: profil, contacte, recenzii verificate. Programează online.`,
  localityFirmsH1Prefix: "Firme autorizate ANRE în",
  localityFirmsIntro: (locality: string) =>
    `Aici găsești firme autorizate ANRE din ${locality} și zona apropiată, cu autorizația validă și date de contact la vedere.`,
  localityFirmsHowTo: (locality: string) =>
    `Cum alegi o firmă autorizată ANRE în ${locality}`,

  // ── Categorii path-based ──
  catNationalH1: (cat: string) => `${cat} în România`,
  catNationalIntro: (cat: string) =>
    `Cauți ${cat} la nivel național? Vezi firmele autorizate ANRE care oferă acest serviciu în fiecare județ și contactează direct firma potrivită.`,
  catCountyH1: (cat: string, county: string) =>
    `${cat} în județul ${county}`,
  catCountyIntro: (cat: string, county: string) =>
    `Cauți ${cat} în județul ${county}? Mai jos găsești firmele autorizate ANRE care oferă acest serviciu. Compară și programează direct.`,
  catLocalityH1: (cat: string, locality: string) =>
    `${cat} în ${locality}`,
  catLocalityIntro: (cat: string, locality: string, county: string) =>
    `Cauți ${cat} în ${locality}, ${county}? Vezi firmele autorizate ANRE locale și programează rapid. Certificat digital emis pe loc.`,

  // ── Firm page ──
  firmFaqPackage: "Ce include verificarea instalației de gaze?",
  firmFaqPackageAnswer:
    "Inspecție vizuală, test de etanșeitate, verificare aparate consumatoare, fișă tehnică ANRE, încărcarea documentului la operatorul de distribuție (Distrigaz/Delgaz). Prețul standard 150–260 lei, conform firmei.",

  // ── How-to tips ──
  howToCompareServices: "compară prețul final (nu doar 'de la'): include fișa tehnică + raportarea la distribuitor",
  howToAskPackage: "întreabă explicit dacă include fișa ANRE, termenul de execuție și eventualele lucrări auxiliare",

  // ── Firma SEO local section ──
  firmSeoLocalTitle: (locality: string, county: string) =>
    locality && county
      ? `Verificări și revizii gaze în ${locality}, ${county}`
      : county
        ? `Verificări și revizii gaze în ${county}`
        : `Verificări și revizii gaze în ${locality}`,
  firmSeoLocalIntro: (firmName: string, locality: string, county: string) =>
    `${firmName} execută verificări și revizii instalații gaze ${locality ? `în ${locality}` : ""}${county ? `${locality ? ", " : ""}${county}` : ""}, ca firmă autorizată ANRE.`,

  // ── Despre pagina ──
  aboutTitle: "Despre Verigaz",
  aboutSubtitle:
    "Platformă națională pentru verificări și revizii gaze. Firme autorizate ANRE, programare online, documente digitale și reminder-e pentru scadențe.",
  aboutIntroLead:
    "Verigaz s-a născut pentru a simplifica un proces confuz și fragmentat. Clienții caută la întâmplare firme autorizate ANRE, iar asociațiile de proprietari pierd timp cu telefoane multiple pentru programări. Nu există încredere că firma chemată e autorizată și la zi.",
  aboutIntroBody:
    "Am creat această platformă pentru a concentra într-un singur loc: firme autorizate ANRE verificate, programare rapidă, certificat digital emis automat și reminder-e când expiră verificarea (2 ani) sau revizia (10 ani).",
  aboutPlatformNote:
    "Platforma facilitează contactul și programarea. Nu executăm servicii noi înșine — serviciile sunt prestate de firme autorizate ANRE listate.",
  aboutDirectoryDesc:
    "Director național firme autorizate ANRE",
  aboutDirectoryDescFull:
    "Firme cu autorizația ANRE validă, din fiecare județ. Acoperirea crește odată cu înscrierea firmelor din teren.",
  aboutForFirmsTitle: "Pentru firme autorizate ANRE",
  aboutForFirmsDesc:
    "Dacă ești firmă autorizată ANRE, te invităm să te înscrii. Un profil complet (descriere + categorii servicii + zonă acoperire + recenzii) îți crește cererile de programare.",
  aboutDirectorNotProvider:
    "Platforma nu prestează servicii de verificare/revizie și nu este parte contractuală între client și firmă. Responsabilitatea tehnică revine firmei contactate.",
  aboutFaqIsFirm:
    "Nu. Verigaz este un director + sistem de programare. Te ajută să găsești firma și să-ți programezi rapid.",
  aboutTrustLine:
    "Verigaz validează autorizația ANRE a fiecărei firme înainte de listare și ține evidența scadențelor.",

  // ── Adauga firma ──
  addFirmTitle: "Înscrie firma ta în Verigaz",
  addFirmSubtitle:
    "Fii găsit de clienții care caută firmă autorizată ANRE. Profil complet, cereri de programare directe, planuri pentru orice buget.",
  addFirmNote:
    "Verigaz este un director + sistem de programare. Nu intermediem servicii și nu percepem comision pe client.",
  addFirmVisibility:
    "Înscrie-ți firma autorizată ANRE în directorul Verigaz și primește cereri de programare din zona ta.",
  addFirmEmailNotification:
    "Ai primit o solicitare nouă de înscriere în <strong>Verigaz</strong>.",
  addFirmPlaceholder: "Ex: SC Instal Gaz Pro SRL",
  addFirmPlaceholderDashboard: "Ex: Instal Gaz Pro",

  // ── Help bottom CTA ──
  helpBottomCta: "Programează verificarea gazelor în câteva minute.",
  helpBottomCtaBtn: "Caută firmă autorizată",

  // ── Abonamente ──
  subscriptionsTitle: "Abonamente pentru firme autorizate ANRE",
  subscriptionsDesc: (domain: string) =>
    `Alege planul potrivit (Start, Plus, Premium) pentru listarea firmei tale: profil complet, vizibilitate prioritară și cereri directe pe ${domain}.`,
  subscriptionsHook:
    "În sezonul de iarnă, scadențele ANRE aduc cele mai multe cereri. Profilurile complete și prezența pe județul tău capturează volumul.",

  // ── Contact ──
  contactMetaDesc: "Contactează echipa Verigaz pentru întrebări, sugestii sau parteneriate.",
  contactFirmQuestion: "Ești firmă autorizată ANRE?",

  // ── Articole ──
  articlesTitle: "Articole și ghiduri pentru siguranța gazelor",
  articlesDesc:
    "Ghiduri practice despre verificarea gazelor în România: scadențe ANRE, detectoare, costuri, pași, documente.",
  articlesIntro:
    "Resurse utile pentru a ține instalația ta de gaze la zi: scadențe, documente, prețuri, bune practici.",
  articlesCta: "Caută firmă autorizată",

  // ── Login ──
  loginTagline:
    "Platforma pentru administrarea și promovarea firmei tale autorizate ANRE.",

  // ── Județe index ──
  countiesTitle: "Județe din România – Verificări și revizii gaze",
  countiesDesc:
    "Director național al județelor cu firme autorizate ANRE pentru gaze. Alege județul și programează rapid verificarea sau revizia.",
  countiesH1: "Județe din România – firme autorizate ANRE pentru gaze",
  countiesIntro:
    "Verigaz este un director național cu firme autorizate ANRE pentru verificări, revizii, montaj detectoare și reparații instalații gaze. Alege județul pentru a vedea firmele disponibile.",
  countiesCardSuffix: "firme autorizate ANRE.",
  countiesNationalTitle: "Servicii pentru gaze la nivel național",
  countiesNationalIntro:
    "Indiferent de județ, Verigaz te ajută să găsești rapid o firmă autorizată ANRE care execută verificarea de 2 ani sau revizia de 10 ani obligatorii.",

  // ── Localități index ──
  localitiesTitle: "Localități – Verificări și revizii gaze",
  localitiesDesc:
    "Explorează localitățile din România și găsește firme autorizate ANRE pentru gaze în zona ta.",
  localitiesIntro:
    "Selectează o localitate pentru a vedea firmele autorizate ANRE disponibile.",

  // ── Ajutor ──
  helpCallFirmAdvice: "Programează direct o <strong>firmă autorizată ANRE</strong> — ei completează fișa tehnică și o depun la distribuitor.",
  helpStep2Title: "Programează o firmă autorizată ANRE",
  helpCostQuestion: "Cât costă o verificare sau revizie gaze?",
  helpCremationAnswer:
    "Verificarea periodică costă de obicei 150–260 lei. Revizia la 10 ani costă 200–600 lei. Montaj detector automat: 350–500 lei. Prețul depinde de firmă, localitate și complexitatea instalației.",
  helpDirectoryTitle: "Director firme autorizate ANRE",
  helpDirectoryIntro: "Găsește rapid o firmă autorizată ANRE în zona ta.",
  helpDirectoryCta: "Caută firme pentru gaze",

  // ── Legal pages ──
  legalTitleSuffix: "Verigaz",
  termsDesc:
    "Termeni și condiții de utilizare pentru verificari-gaze.ro – reguli, responsabilități, abonamente, proprietate intelectuală și limitarea răspunderii.",
  termsDisclaimer:
    "Nu executăm verificări/revizii de gaze direct — facilităm programarea cu firme autorizate ANRE.",
  termsPlatformDesc:
    "este un director online + sistem de programare pentru firme autorizate ANRE din România.",
  termsPlatformRole:
    "Platforma are rol informativ și facilitează programarea. Serviciile tehnice sunt prestate de firmele listate.",
  termsListingItem: "listarea firmelor autorizate ANRE;",
  termsAlert:
    "Platforma NU execută verificări/revizii tehnice, NU este parte contractuală între utilizatori și firmele listate.",

  cookiesDesc:
    "Politica de Cookies pentru verificari-gaze.ro – ce cookie-uri folosim, cum îți gestionezi consimțământul și cum le dezactivezi.",
  cookiesAnalytics: (domain: string) =>
    `Pe ${domain} folosim <strong>Google Analytics</strong> pentru a înțelege, la nivel agregat, cum este utilizată`,

  privacyDesc:
    "Politica de confidențialitate verificari-gaze.ro – ce date colectăm, de ce, cum le folosim și drepturile tale conform GDPR.",
  privacyPlatformDesc: (domain: string) =>
    `Platforma <span class="doc-strong">${domain}</span> este un director + sistem de programare pentru firme autorizate ANRE.`,

  // ── SEO form placeholders ──
  seoTitlePlaceholder: "Ex: Verificare instalație gaze București – Nume Firmă",
  seoDescPlaceholder: "Ex: Verificare, revizie, montaj detector, reparații. ANRE autorizat. Programare 24/7.",

  // ── 404 ──
  notFoundDesc:
    "Pagina pe care o cauți nu există sau a fost mutată. Găsești rapid firme autorizate ANRE, prețuri și ghiduri pe Verigaz.",
  notFoundSub:
    "Ne pare rău — pagina nu mai există sau adresa s-a schimbat. Îți arătăm cum să găsești ce ai nevoie.",
  notFoundSearchLabel: "Caută firmă autorizată pentru gaze",
  notFoundSearchDesc:
    "Găsește firme autorizate ANRE pentru verificare, revizie, montaj detector sau reparații în zona ta.",
  notFoundFirmDesc:
    "Firma pe care o cauți s-ar putea să fie ștearsă sau mutată. Caută alte firme autorizate ANRE mai jos.",
  notFoundFirmCta: "Caută firmă pentru gaze",

  // ── Locality "all services" link ──
  allServicesIn: (locality: string) =>
    `Toate serviciile pentru gaze în ${locality}`,

  // ── Funnel /servicii-gaze ──
  funnelBasePackageDesc:
    "Verificarea standard include: inspecție vizuală, test de etanșeitate, verificare aparate consumatoare, fișa tehnică ANRE și depunerea la distribuitor. Durează ~30-60 minute.",
  funnelTimelinePackageNote:
    "Clarifică ce include prețul: doar manopera sau și fișa tehnică + raportarea la distribuitor. Întreabă despre reparații suplimentare descoperite la inspecție.",
  funnelQuestionsPackageText:
    'Cere detaliile: verificarea include fișa ANRE + transmiterea la distribuitor? Dacă apar probleme minore (garnitură, robinet), le remediază pe loc sau necesită altă programare?',
  funnelQuestionsNegotiateText:
    "Poți alege firma după preț, proximitate sau recenzii. Prețul final poate varia dacă apar lucrări suplimentare — cere confirmare înainte.",
  funnelCostCountyBase: (name: string) =>
    `Verificarea costă de obicei 150–260 lei în ${name}. Revizia la 10 ani: 200–600 lei. Montaj detector: 350–500 lei. Prețul depinde de instalație și firmă.`,
  funnelCostCountyIncludes: () =>
    `De regulă include: inspecția, testul de etanșeitate, verificarea aparatelor, fișa tehnică ANRE și depunerea la distribuitor.`,
  funnelCostCountyCompare:
    "Compară cel puțin două firme. Verifică recenziile, includerea fișei ANRE în preț și timpul până la programare.",
  funnelCostCountyAskQuote:
    "Ce include exact prețul (fișă ANRE, raportare distribuitor, garnituri, lucrări minore)",
  funnelHubCalcDesc:
    "Estimare orientativă a costurilor: verificare periodică, revizie, montaj detector, service centrală și piese.",
} as const
