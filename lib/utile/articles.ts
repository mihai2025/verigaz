// lib/utile/articles.ts
// 20 pagini SEO /utile pentru verificari-gaze.ro — pozitionare pe cuvinte-cheie
// cu volum mare in RO: verificari instalatii gaze, ANRE Ord. 179/2015, centrala
// termica, detectoare, etc.
//
// Fiecare articol e self-contained cu titlu, meta, structura H2 + paragrafe,
// CTA-uri si linkuri interne catre celelalte articole + listing-uri firme.

export type ArticleSection = {
  heading?: string             // H2 al sectiunii (omis pentru intro)
  paragraphs: (string | { type: "list"; items: string[] } | { type: "quote"; text: string })[]
}

export type ArticleCTA = {
  label: string
  href: string
  variant: "primary" | "ghost"
}

export type Article = {
  slug: string
  title: string                // H1
  metaTitle: string            // <60 chars
  metaDescription: string      // 140-160 chars
  keywords: string[]
  category: "ghid-verificare" | "ghid-revizie" | "centrala-termica" | "detector" | "legal" | "siguranta" | "preturi" | "asociatii"
  publishedAt: string          // ISO date
  intro: string                // paragraf introductiv
  sections: ArticleSection[]
  ctas: ArticleCTA[]
  relatedSlugs: string[]       // alte articole utile
}

const _ARTICLES: Article[] = [
  // ── 1 ─────────────────────────────────────────────────────────────
  {
    slug: "cat-costa-verificarea-instalatiei-de-gaze-2026",
    title: "Cât costă o verificare a instalației de gaze în 2026",
    metaTitle: "Cât costă verificarea gazelor 2026 — prețuri reale RO",
    metaDescription: "Prețuri verificare instalație gaze 2026: 80–250 lei pentru apartament, 150–400 lei pentru casă. Ce influențează costul + sfaturi de economisire.",
    keywords: ["pret verificare gaze", "cost verificare instalatie gaze 2026", "tarif verificare ANRE", "cat costa verificarea gaze"],
    category: "preturi",
    publishedAt: "2026-04-14",
    intro:
      "Verificarea instalației de gaze e obligatorie la maxim 2 ani conform ANRE Ord. 179/2015 și costă, în 2026, între 80 și 250 lei pentru un apartament obișnuit. Prețul depinde de oraș, complexitate și firma aleasă. Mai jos găsești defalcarea reală a costurilor + sfaturi pentru a evita supraplata.",
    sections: [
      {
        heading: "Prețuri orientative pe tip de proprietate",
        paragraphs: [
          { type: "list", items: [
            "Apartament 2-3 camere: 80–150 lei",
            "Apartament 4+ camere sau cu instalație complexă: 150–250 lei",
            "Casă cu 1 nivel: 150–250 lei",
            "Casă cu 2+ niveluri sau anexe: 200–400 lei",
            "Asociație de proprietari (verificare comună): 50–80 lei/apartament",
          ] },
          "Prețurile includ deplasarea în localitatea ta și emiterea procesului-verbal. Pentru intervenții suplimentare (reparații, înlocuire piese), se adaugă tariful pentru manoperă + materiale.",
        ],
      },
      {
        heading: "Ce face verificarea costul mai mare",
        paragraphs: [
          { type: "list", items: [
            "Distanța — firmele din afara orașului adaugă km",
            "Urgența — programări sub 48h pot avea suprataxă 50%",
            "Aparate consumatoare multiple (centrală + plită + boiler)",
            "Defecte găsite care necesită remediere imediată",
            "Eliberare urgentă a procesului-verbal (ex: pentru asigurare)",
          ] },
        ],
      },
      {
        heading: "Cum să eviți supraplata",
        paragraphs: [
          "Programează verificarea cu cel puțin 2 săptămâni înainte să expire scadența. Compara minimum 3 firme pe verificari-gaze.ro înainte de a te decide.",
          "Atenție la ofertele sub 70 lei — pot fi semnal de firmă neautorizată sau verificare superficială. Cere întotdeauna autorizația ANRE și procesul-verbal oficial.",
        ],
      },
      {
        heading: "Ce primești la final",
        paragraphs: [
          "După verificare, primești obligatoriu: procesul-verbal cu rezultatul, factura fiscală, declarația de conformitate (dacă instalația trece testul). Pe verigaz, primești și certificat digital cu QR code pentru verificare online.",
        ],
      },
    ],
    ctas: [
      { label: "Vezi prețurile firmelor din zona ta →", href: "/servicii-gaze", variant: "primary" },
      { label: "Programează verificarea acum", href: "/programare", variant: "ghost" },
    ],
    relatedSlugs: [
      "cum-se-face-verificarea-instalatiei-de-gaze",
      "diferenta-verificare-vs-revizie-gaze",
      "amenzi-verificare-gaze-neefectuata",
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────
  {
    slug: "cum-se-face-verificarea-instalatiei-de-gaze",
    title: "Cum se face verificarea instalației de gaze — pas cu pas",
    metaTitle: "Cum se face verificarea instalației de gaze — pas cu pas",
    metaDescription: "Procedura completă de verificare instalație gaze: test etanșeitate, control aparate, ventilare, măsurători. Durează 30-60 min, ANRE Ord. 179/2015.",
    keywords: ["cum se face verificarea gaze", "procedura verificare instalatie gaze", "test etanseitate gaze", "ce verifica instalator gaze"],
    category: "ghid-verificare",
    publishedAt: "2026-04-14",
    intro:
      "Verificarea tehnică a instalației de gaze e o procedură standardizată ANRE care durează între 30 și 60 minute pentru un apartament. Tehnicianul autorizat parcurge un check-list complet — etanșeitate, aparate, ventilare, presiune. Iată exact ce face și ce trebuie să se vadă.",
    sections: [
      {
        heading: "1. Inspecția vizuală a traseului",
        paragraphs: [
          "Tehnicianul urmărește vizibil tot traseul de la contor până la fiecare aparat consumator. Caută conducte ruginite, fittinguri vechi, robineți defecți, izolații deteriorate.",
          "Verifică să nu existe modificări neautorizate: derivații suplimentare, segmente acoperite cu vopsea care ascund coroziunea, racorduri improvizate.",
        ],
      },
      {
        heading: "2. Testul de etanșeitate",
        paragraphs: [
          "Cea mai importantă probă. Tehnicianul închide robineții aparatelor și măsoară presiunea. Dacă presiunea scade peste un prag stabilit (sub 1 mbar/3 minute), instalația are pierderi.",
          "Pentru detectarea exactă a punctului de scurgere se folosește spray special cu spumă sau detector electronic. NU se folosește flacără.",
        ],
      },
      {
        heading: "3. Verificarea aparatelor consumatoare",
        paragraphs: [
          "Centrala termică, plita, boilerul de gaz — fiecare e testat individual pentru:",
          { type: "list", items: [
            "Aprindere corectă fără întârzieri",
            "Flacără albastră, stabilă, fără limbi galbene",
            "Funcționare corectă a senzorilor de gaze și CO",
            "Evacuare corectă a gazelor arse",
          ] },
        ],
      },
      {
        heading: "4. Ventilarea spațiului",
        paragraphs: [
          "Tehnicianul verifică prezența și starea grilelor de ventilare obligatorii în bucătărie + spațiul cu centrală. Lipsa ventilării e principala cauză de neconformitate.",
        ],
      },
      {
        heading: "5. Procesul-verbal + concluzia",
        paragraphs: [
          "La final, tehnicianul completează procesul-verbal cu: data verificării, parametrii măsurați, observații, concluzia (CONFORMĂ / NECONFORMĂ).",
          "Dacă instalația e conformă, primești și declarația de conformitate. Valabilitate: 2 ani.",
          "Dacă e neconformă, ai termen de remediere a defectelor + reverificare obligatorie.",
        ],
      },
    ],
    ctas: [
      { label: "Programează un instalator autorizat ANRE", href: "/programare", variant: "primary" },
      { label: "Vezi firmele din județul tău", href: "/servicii-gaze", variant: "ghost" },
    ],
    relatedSlugs: [
      "cat-costa-verificarea-instalatiei-de-gaze-2026",
      "documente-necesare-verificare-gaze",
      "cum-iti-pregatesti-locuinta-pentru-verificare",
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────
  {
    slug: "documente-necesare-verificare-gaze",
    title: "Documente necesare pentru verificarea instalației de gaze",
    metaTitle: "Documente verificare gaze 2026 — ce trebuie să ai",
    metaDescription: "Lista completă documente verificare instalație gaze: ultima verificare, contract Distrigaz/Delgaz, planul instalației. Ghid pentru proprietari.",
    keywords: ["documente verificare gaze", "ce documente trebuie pentru verificare ANRE", "acte verificare instalatie gaze"],
    category: "ghid-verificare",
    publishedAt: "2026-04-14",
    intro:
      "Pentru ca verificarea instalației de gaze să decurgă rapid, ai nevoie de câteva documente la îndemână. Lipsa lor nu blochează verificarea, dar întârzie procesul cu 1-2 zile. Iată exact ce să pregătești înainte.",
    sections: [
      {
        heading: "Documente obligatorii",
        paragraphs: [
          { type: "list", items: [
            "Actul de identitate al proprietarului (sau împuternicire dacă e altcineva acasă)",
            "Procesul-verbal al ultimei verificări (dacă există)",
            "Contractul cu operatorul de distribuție (Distrigaz Sud, Delgaz Grid, etc.)",
          ] },
        ],
      },
      {
        heading: "Documente opționale dar utile",
        paragraphs: [
          { type: "list", items: [
            "Procesul-verbal de revizie (dacă revizia la 10 ani s-a făcut între timp)",
            "Cărțile tehnice ale aparatelor consumatoare (centrală, plită, boiler)",
            "Plan instalație (dacă există) — ajută tehnicianul să identifice rapid traseul",
            "Facturile / certificatele aparatelor noi instalate de la ultima verificare",
            "Declarația detector gaze (dacă ai instalat unul după ultima verificare)",
          ] },
        ],
      },
      {
        heading: "Ce primești de la firma ANRE",
        paragraphs: [
          "După verificare, firma autorizată îți emite:",
          { type: "list", items: [
            "Procesul-verbal de verificare (cu rezultatul + parametri măsurați)",
            "Declarația de conformitate (dacă instalația trece)",
            "Factura fiscală pentru servicii",
            "Pe verificari-gaze.ro: certificat PDF cu QR pentru verificare online",
          ] },
        ],
      },
      {
        heading: "Cât timp trebuie păstrate",
        paragraphs: [
          "Procesele-verbale trebuie păstrate minim 10 ani — sunt necesare în caz de incident, vânzare imobil, control ANRE sau cerere asigurare.",
          "Recomandare: scanează-le și păstrează-le digital + tipărit într-un dosar dedicat.",
        ],
      },
    ],
    ctas: [
      { label: "Programează verificarea online", href: "/programare", variant: "primary" },
      { label: "Caută firmă în județul tău", href: "/servicii-gaze", variant: "ghost" },
    ],
    relatedSlugs: [
      "cum-se-face-verificarea-instalatiei-de-gaze",
      "cum-iti-pregatesti-locuinta-pentru-verificare",
      "anre-ord-179-2015-explicat-pe-intelesul-tuturor",
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────
  {
    slug: "cat-dureaza-verificarea-revizia-instalatiei-gaze",
    title: "Cât durează verificarea și revizia instalației de gaze",
    metaTitle: "Cât durează verificarea gaze — apartament vs casă",
    metaDescription: "Verificare gaze: 30-60 min pentru apartament, 1-2 ore casă. Revizia la 10 ani: 2-4 ore. Ce factori prelungesc intervenția — ghid 2026.",
    keywords: ["cat dureaza verificarea gaze", "timp verificare instalatie gaze", "cat dureaza revizia gaze"],
    category: "ghid-verificare",
    publishedAt: "2026-04-14",
    intro:
      "Verificarea standard a unui apartament durează 30-60 minute. Revizia completă la 10 ani durează 2-4 ore. Diferența vine din numărul de teste — verificarea e periodică, revizia e check-up complet. Detalii pe tip de proprietate mai jos.",
    sections: [
      {
        heading: "Verificarea la 2 ani — durata pe tip de proprietate",
        paragraphs: [
          { type: "list", items: [
            "Apartament 2-3 camere: 30-45 minute",
            "Apartament 4+ camere: 45-60 minute",
            "Casă cu 1 nivel: 60-90 minute",
            "Casă cu 2+ niveluri: 1.5-2 ore",
            "Spațiu comercial cu instalație complexă: 2-3 ore",
          ] },
        ],
      },
      {
        heading: "Revizia la 10 ani — durata",
        paragraphs: [
          "Revizia e mai detaliată: include curățarea componentelor, verificarea fiecărui fitting, testul presiunii la 1.5x normalul, calibrarea senzorilor.",
          { type: "list", items: [
            "Apartament: 2-3 ore",
            "Casă cu 1 nivel: 3-4 ore",
            "Casă cu 2+ niveluri: 4-6 ore",
          ] },
        ],
      },
      {
        heading: "Ce prelungește intervenția",
        paragraphs: [
          { type: "list", items: [
            "Defecte găsite — remediere imediată adaugă 30-90 min",
            "Aparate consumatoare multiple (plită + centrală + boiler + șemineu)",
            "Acces dificil la traseu (conducte mascate, plafoane suspendate)",
            "Necesitatea izolării unei porțiuni vechi",
            "Înlocuire robineți rigizi sau corodați",
          ] },
        ],
      },
      {
        heading: "Cum să planifici timpul",
        paragraphs: [
          "Programează verificarea într-un interval de 2-3 ore — chiar dacă durează 45 min, lasă marjă pentru întârzierea firmei sau detalii suplimentare.",
          "Pentru revizie la 10 ani, ține cont că poți fi nevoit să închizi gazul pentru câteva ore. Plănuiește-o într-o zi când nu ai musafiri sau gătești.",
        ],
      },
    ],
    ctas: [
      { label: "Programează în intervalul preferat", href: "/programare", variant: "primary" },
      { label: "Vezi firmele disponibile", href: "/servicii-gaze", variant: "ghost" },
    ],
    relatedSlugs: [
      "cum-se-face-verificarea-instalatiei-de-gaze",
      "diferenta-verificare-vs-revizie-gaze",
      "cum-iti-pregatesti-locuinta-pentru-verificare",
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────
  {
    slug: "amenzi-verificare-gaze-neefectuata",
    title: "Amenzi și sancțiuni pentru verificarea gazelor neefectuată",
    metaTitle: "Amenzi verificare gaze 2026 — ce risc dacă întârzii",
    metaDescription: "Amenzile pentru verificare gaze neefectuată: până la 5000 lei + suspendare furnizare. Distrigaz/Delgaz pot opri gazul. Ghid legal complet.",
    keywords: ["amenda verificare gaze", "sanctiuni gaze neverificate", "ce risc daca nu fac verificarea", "distrigaz amenda"],
    category: "legal",
    publishedAt: "2026-04-14",
    intro:
      "Dacă nu ai făcut verificarea instalației de gaze la termenul ANRE, riști amendă de la 1000 la 5000 lei și suspendarea furnizării de către operatorul de distribuție. Mai grav, în caz de incident, asigurarea nu te despăgubește. Iată cadrul legal complet.",
    sections: [
      {
        heading: "Amenzile prevăzute de ANRE",
        paragraphs: [
          "Conform Ord. ANRE 179/2015 și Legii 123/2012:",
          { type: "list", items: [
            "1000-3000 lei pentru persoane fizice care depășesc termenul de verificare",
            "3000-5000 lei pentru proprietari care folosesc instalația cu grave neconformități",
            "5000-15.000 lei pentru asociații de proprietari care nu fac verificarea părților comune",
            "30.000+ lei pentru operatori economici (firme cu spații comerciale)",
          ] },
        ],
      },
      {
        heading: "Suspendarea furnizării de către Distrigaz / Delgaz",
        paragraphs: [
          "Operatorul de distribuție are dreptul (și obligația, în cazuri grave) să întrerupă furnizarea de gaz când:",
          { type: "list", items: [
            "Verificarea/revizia depășește termenul cu mai mult de 6 luni",
            "Există suspiciuni de scurgere",
            "Nu se prezintă procesul-verbal valabil la cerere",
          ] },
          "Reluarea furnizării necesită verificare nouă + plată reconectare (200-500 lei) + dovada eliminării neconformităților.",
        ],
      },
      {
        heading: "Implicații pe asigurare",
        paragraphs: [
          "În caz de explozie, incendiu sau intoxicație CO, asigurarea de locuință cere obligatoriu procesul-verbal valabil al ultimei verificări. Fără el, polița NU plătește daunele.",
          "Mai mult, în caz de victime, proprietarul răspunde penal pentru ucidere din culpă sau vătămare corporală — chiar fără verificare = fără protecție legală.",
        ],
      },
      {
        heading: "Cum eviți totul",
        paragraphs: [
          "Programează verificarea cu cel puțin 30 zile înainte să expire scadența. Costă 80-250 lei și îți asigură liniștea pe 2 ani.",
          "Dacă deja ai depășit termenul, fă verificarea ASTĂZI — încă nu e prea târziu, dar fiecare zi adăugată mărește riscul de control.",
        ],
      },
    ],
    ctas: [
      { label: "Programează urgent — firmele răspund în 24h", href: "/programare", variant: "primary" },
      { label: "Caută firmă autorizată ANRE", href: "/servicii-gaze", variant: "ghost" },
    ],
    relatedSlugs: [
      "anre-ord-179-2015-explicat-pe-intelesul-tuturor",
      "cat-costa-verificarea-instalatiei-de-gaze-2026",
      "siguranta-instalatie-gaze-acasa-ghid-complet",
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────
  {
    slug: "diferenta-verificare-vs-revizie-gaze",
    title: "Diferența dintre verificarea și revizia instalației de gaze",
    metaTitle: "Verificare vs revizie gaze — care e diferența?",
    metaDescription: "Verificarea se face la 2 ani, revizia la 10 ani. Verificarea = test rapid, revizia = check-up complet cu curățare și calibrare. Ghid 2026.",
    keywords: ["diferenta verificare vs revizie gaze", "verificare la 2 ani revizie la 10 ani", "ce este revizia gaze"],
    category: "ghid-revizie",
    publishedAt: "2026-04-14",
    intro:
      "Verificarea și revizia sunt două operațiuni complet diferite. Verificarea e un test rapid, periodic, la 2 ani. Revizia e un check-up complet, la 10 ani. Confuzia între ele te poate costa amenzi sau intervenții incorecte. Iată tabelul comparativ.",
    sections: [
      {
        heading: "Verificarea — test periodic la 2 ani",
        paragraphs: [
          { type: "list", items: [
            "Periodicitate: maxim 24 luni",
            "Durată: 30-60 minute",
            "Cost: 80-250 lei",
            "Conține: test etanșeitate, inspecție vizuală traseu, verificare aparate consumatoare",
            "NU conține: curățare componente, înlocuire piese, calibrări",
            "Document emis: proces-verbal verificare + declarație conformitate",
          ] },
        ],
      },
      {
        heading: "Revizia — check-up complet la 10 ani",
        paragraphs: [
          { type: "list", items: [
            "Periodicitate: maxim 120 luni (10 ani)",
            "Durată: 2-6 ore",
            "Cost: 300-800 lei",
            "Conține: tot ce face verificarea + curățarea componentelor + calibrarea senzorilor + testul presiunii la 1.5x + verificarea anozilor + înlocuire fittinguri uzate",
            "Document emis: proces-verbal revizie (separat de verificare)",
          ] },
        ],
      },
      {
        heading: "Tabel comparativ",
        paragraphs: [
          "Pe scurt: verificarea verifică starea actuală, revizia restabilește starea optimă. Ambele sunt obligatorii — verificarea înlocuiește revizia doar parțial.",
          "Atenție: dacă revizia se face exact când expiră și verificarea, primești ambele documente — dar n-ai voie să o eviți pe verificare numai pentru că ai făcut revizia recent.",
        ],
      },
      {
        heading: "Cazuri speciale",
        paragraphs: [
          "Dacă cumperi o casă veche, ANRE recomandă revizie completă chiar dacă nu a expirat termenul. La fel după modificări majore (extensie, mutare aparate).",
          "Dacă ai centrală termică sau detector gaze, acestea au scadențe proprii — verificare anuală pentru centrală, calibrare anuală pentru detector.",
        ],
      },
    ],
    ctas: [
      { label: "Programează ce ai nevoie — verificare sau revizie", href: "/programare", variant: "primary" },
      { label: "Vezi firme cu ambele autorizări", href: "/servicii-gaze", variant: "ghost" },
    ],
    relatedSlugs: [
      "cat-costa-verificarea-instalatiei-de-gaze-2026",
      "cat-dureaza-verificarea-revizia-instalatiei-gaze",
      "anre-ord-179-2015-explicat-pe-intelesul-tuturor",
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────
  {
    slug: "anre-ord-179-2015-explicat-pe-intelesul-tuturor",
    title: "ANRE Ord. 179/2015 explicat pe înțelesul tuturor",
    metaTitle: "ANRE Ord. 179/2015 — verificarea gazelor explicată simplu",
    metaDescription: "Ce spune Ord. ANRE 179/2015 despre verificarea instalațiilor de gaze: termene, obligații proprietari, sancțiuni. Ghid complet în limbaj simplu.",
    keywords: ["ANRE Ord 179 2015", "norma tehnica gaze ANRE", "obligatii proprietari instalatie gaze"],
    category: "legal",
    publishedAt: "2026-04-14",
    intro:
      "Ordinul ANRE 179/2015 e principalul cadru legal pentru verificarea și revizia instalațiilor de gaze naturale din România. Are 80+ pagini de termeni tehnici. Iată traducerea pentru proprietari în 5 minute.",
    sections: [
      {
        heading: "Cine e obligat să verifice",
        paragraphs: [
          "Toți consumatorii finali de gaz natural — persoane fizice (apartament, casă), asociații de proprietari (părți comune + plus apartament dacă au consum), persoane juridice (firme cu spații comerciale).",
          "Indiferent dacă instalația e nouă sau veche, dacă folosești gaz din rețea, ești obligat să faci verificare la 2 ani și revizie la 10 ani.",
        ],
      },
      {
        heading: "Cine are voie să verifice",
        paragraphs: [
          "Doar firmele autorizate ANRE pentru clasa de lucrări corespunzătoare — cele mai comune autorizări:",
          { type: "list", items: [
            "EDIB — execuție și exploatare instalații utilizare gaz",
            "EDSB — execuție și exploatare distribuție gaz",
            "IS — instalator gaze",
          ] },
          "Lista completă pe registrul ANRE. Pe verificari-gaze.ro toate firmele listate au autorizația validată manual de echipa noastră.",
        ],
      },
      {
        heading: "Termenele cheie",
        paragraphs: [
          { type: "list", items: [
            "Verificare: maxim 24 luni (2 ani) de la ultima verificare/revizie",
            "Revizie: maxim 120 luni (10 ani) de la punerea în funcțiune sau ultima revizie",
            "Înlocuirea instalației vechi: după 30+ ani recomandare ANRE",
          ] },
          "Termenele se calculează de la data exactă a documentului anterior, nu de la sfârșitul anului.",
        ],
      },
      {
        heading: "Ce conține verificarea (conform Ord. 179)",
        paragraphs: [
          { type: "list", items: [
            "Inspecția vizuală a traseului interior",
            "Testul de etanșeitate la presiunea de utilizare",
            "Verificarea funcționării aparatelor consumatoare",
            "Verificarea ventilării",
            "Verificarea evacuării gazelor de ardere",
          ] },
        ],
      },
      {
        heading: "Sancțiuni",
        paragraphs: [
          "Pentru detalii vezi articolul nostru despre amenzi. Pe scurt: 1000-5000 lei pentru persoane fizice + suspendare furnizare gaz + responsabilitate penală în caz de incident.",
        ],
      },
    ],
    ctas: [
      { label: "Caută firmă autorizată ANRE conform Ord. 179", href: "/servicii-gaze", variant: "primary" },
      { label: "Programează verificarea acum", href: "/programare", variant: "ghost" },
    ],
    relatedSlugs: [
      "amenzi-verificare-gaze-neefectuata",
      "cum-aleg-firma-autorizata-anre",
      "diferenta-verificare-vs-revizie-gaze",
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────
  {
    slug: "cum-aleg-firma-autorizata-anre",
    title: "Cum aleg o firmă autorizată ANRE pentru verificarea gazelor",
    metaTitle: "Cum aleg firmă autorizată ANRE — 7 criterii esențiale",
    metaDescription: "Ghid: cum verifici autorizația ANRE, cum compari prețuri, ce întrebări să pui. Evită firmele neautorizate care nu emit documente valabile.",
    keywords: ["firma autorizata ANRE", "cum aleg instalator gaze", "verificare autorizatie ANRE", "lista firme autorizate gaze"],
    category: "ghid-verificare",
    publishedAt: "2026-04-14",
    intro:
      "Alegerea firmei greșite poate însemna verificare invalidă, documente neacceptate de Distrigaz, sau în cel mai rău caz — risc real de explozie. Iată 7 criterii pentru a alege corect.",
    sections: [
      {
        heading: "1. Verifică autorizația ANRE",
        paragraphs: [
          "Cere numărul autorizației ANRE și verifică-l pe site-ul oficial ANRE (registru public). Autorizația trebuie să fie validă la data verificării.",
          "Pe verificari-gaze.ro, toate firmele listate au autorizația verificată manual de echipa noastră — economisește timp.",
        ],
      },
      {
        heading: "2. Caută firme cu sediu în județul tău",
        paragraphs: [
          "Firmele locale cunosc particularitățile zonei (presiune Distrigaz/Delgaz, tip de instalații frecvente). Și taxele de deplasare sunt mai mici.",
          "Excepție: pentru reparații complexe sau aparate rare, poți alege specialist din alt județ.",
        ],
      },
      {
        heading: "3. Compară minimum 3 oferte",
        paragraphs: [
          "Diferența între cea mai ieftină și cea mai scumpă firmă din același oraș poate fi de 200%. Compară: preț de bază, deplasare inclusă/separată, urgența disponibilă.",
          "Atenție la prețurile sub 70 lei — pot fi neserioase sau ascunse alte taxe.",
        ],
      },
      {
        heading: "4. Citește recenzii reale",
        paragraphs: [
          "Pe verigaz, recenziile sunt de la clienți verificați (au făcut programare prin platformă). Caută recenzii recente, nu doar număr de stele.",
        ],
      },
      {
        heading: "5. Întreabă despre program și disponibilitate",
        paragraphs: [
          { type: "list", items: [
            "Cât durează de la programare la intervenție?",
            "Există program de weekend?",
            "Cum funcționează urgențele?",
            "Cât rămâne valabil prețul ofertat?",
          ] },
        ],
      },
      {
        heading: "6. Verifică ce documente emite",
        paragraphs: [
          "Firma trebuie să emită: proces-verbal de verificare + declarație de conformitate + factură fiscală. Refuză orice firmă care îți spune \"facem verificarea fără hârtii\".",
          "Pe verigaz, primești și certificat digital cu QR de autentificare online.",
        ],
      },
      {
        heading: "7. Pune întrebări tehnice de control",
        paragraphs: [
          "Întreabă: \"Ce presiune normală ar trebui să indice manometru?\" sau \"Ce intervenții faceți dacă găsiți coroziune pe robineți?\". Răspunsurile evazive sunt semnal de alarmă.",
        ],
      },
    ],
    ctas: [
      { label: "Vezi firmele autorizate ANRE pe județe", href: "/servicii-gaze", variant: "primary" },
      { label: "Programează direct cu firmă verificată", href: "/programare", variant: "ghost" },
    ],
    relatedSlugs: [
      "ce-intrebi-instalator-gaze-inainte-de-programare",
      "anre-ord-179-2015-explicat-pe-intelesul-tuturor",
      "preturi-orientative-servicii-gaze-2026",
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────
  {
    slug: "preturi-orientative-servicii-gaze-2026",
    title: "Prețuri orientative servicii gaze 2026 — toate intervențiile",
    metaTitle: "Prețuri servicii gaze 2026 RO — verificare, revizie, reparații",
    metaDescription: "Tabel complet prețuri 2026: verificare 80-250 lei, revizie 300-800 lei, reparații, montaj detector, VTP centrală. Ce influențează costurile.",
    keywords: ["preturi gaze 2026", "tarif verificare gaze", "cost reparatii instalatie gaze", "preturi montaj centrala"],
    category: "preturi",
    publishedAt: "2026-04-14",
    intro:
      "Prețurile pentru servicii gaze în 2026 variază mult între județe și firme. Iată tabelul complet — verificare, revizie, reparații, montaj detector, VTP centrală — cu intervalele realiste pe care le poți compara când primești ofertă.",
    sections: [
      {
        heading: "Verificare instalație gaze (la 2 ani)",
        paragraphs: [
          { type: "list", items: [
            "Apartament: 80-250 lei",
            "Casă 1 nivel: 150-300 lei",
            "Casă 2+ niveluri: 200-400 lei",
            "Asociație de proprietari: 50-80 lei/apartament",
          ] },
        ],
      },
      {
        heading: "Revizie instalație gaze (la 10 ani)",
        paragraphs: [
          { type: "list", items: [
            "Apartament: 300-500 lei",
            "Casă 1 nivel: 400-700 lei",
            "Casă 2+ niveluri: 500-900 lei",
          ] },
          "Revizia poate include înlocuirea unor componente uzate (robineți, fittinguri) — costul materialelor se adaugă separat.",
        ],
      },
      {
        heading: "Reparații instalație gaze",
        paragraphs: [
          { type: "list", items: [
            "Schimbare robineți: 80-150 lei/buc + materiale",
            "Reparație etanșeitate (pe loc): 100-300 lei",
            "Înlocuire conductă (per metru): 50-100 lei + manoperă",
            "Mutare aparat consumator: 150-400 lei",
          ] },
        ],
      },
      {
        heading: "Centrală termică (VTP ISCIR)",
        paragraphs: [
          { type: "list", items: [
            "Verificare anuală (VTP): 150-300 lei",
            "Revizie completă centrală: 250-500 lei",
            "Curățare schimbător de căldură: 200-400 lei",
            "Înlocuire vas expansiune: 200-400 lei + materiale",
          ] },
        ],
      },
      {
        heading: "Detector gaze",
        paragraphs: [
          { type: "list", items: [
            "Montaj detector simplu: 250-450 lei (cu detector inclus)",
            "Montaj detector cu electrovalvă automată: 400-700 lei",
            "Service anual + calibrare: 80-150 lei",
          ] },
        ],
      },
      {
        heading: "Detector + sigiliu Distrigaz/Delgaz",
        paragraphs: [
          "Pentru sigiliul electrovalvei (necesar la cerere operator distribuție): 200-400 lei suplimentar.",
        ],
      },
    ],
    ctas: [
      { label: "Compară prețurile firmelor din zona ta", href: "/servicii-gaze", variant: "primary" },
      { label: "Cere ofertă personalizată", href: "/programare", variant: "ghost" },
    ],
    relatedSlugs: [
      "cat-costa-verificarea-instalatiei-de-gaze-2026",
      "diferenta-verificare-vs-revizie-gaze",
      "verificare-vtp-centrala-termica-iscir",
    ],
  },

  // ── 10 ────────────────────────────────────────────────────────────
  {
    slug: "detector-gaze-cum-functioneaza-cum-il-aleg",
    title: "Detector de gaze: cum funcționează și cum îl alegi",
    metaTitle: "Detector gaze 2026 — cum aleg detectorul potrivit",
    metaDescription: "Ghid complet detectoare gaze: tipuri, cum funcționează, certificare EN50194, cu/fără electrovalvă. Cum eviți modelele neserioase și economisești.",
    keywords: ["detector gaze", "detector metan", "electrovalva gaze", "EN50194", "detector gaze cu electrovalva"],
    category: "detector",
    publishedAt: "2026-04-14",
    intro:
      "Detectorul de gaze e cea mai bună investiție pentru siguranța casei tale — costă 200-700 lei și salvează vieți. Detectorul real are senzor catalitic sau semiconductor + standard EN50194 + posibilitate conectare la electrovalvă. Iată ce să cauți.",
    sections: [
      {
        heading: "Cum funcționează un detector",
        paragraphs: [
          "Detectorul are un senzor calibrat care declanșează alarma când concentrația de gaze metan (CH4) sau monoxid de carbon (CO) depășește un prag (de obicei 10% LIE = limita inferioară de explozie).",
          "Modelele bune au și electrovalvă conectată — la alarmă, închid automat alimentarea cu gaz, eliminând riscul de explozie chiar dacă nu ești acasă.",
        ],
      },
      {
        heading: "Tipuri de detectoare",
        paragraphs: [
          { type: "list", items: [
            "Doar metan (gaz natural) — pentru bucătărie + spațiu centrală",
            "Doar CO (monoxid de carbon) — pentru dormitor, cameră zi (gaz fără miros, mortal)",
            "Combinat metan + CO — recomandat pentru locuință completă",
            "Cu electrovalvă — închide gazul automat la detecție",
            "Cu modul Wi-Fi/SMS — alertă pe telefon",
          ] },
        ],
      },
      {
        heading: "Certificările care contează",
        paragraphs: [
          { type: "list", items: [
            "EN50194 — standardul european pentru detectoare gaze combustibile",
            "EN50291 — pentru detectoare CO",
            "CE — marcaj obligatoriu UE",
            "Verifică prezența numărului de notificare al organismului certificator pe etichetă",
          ] },
        ],
      },
      {
        heading: "Unde se montează corect",
        paragraphs: [
          { type: "list", items: [
            "Metan (mai ușor decât aerul) — la 30-50 cm sub plafon, în bucătărie + cameră centrală",
            "CO (densitate similară aerului) — la 1.5 m de podea, în zone de dormit",
            "NU în bucătăria cu hotă cu evacuare directă (alarmare falsă)",
            "NU lângă fereastră deschisă, ventilator, aragaz în funcționare",
          ] },
        ],
      },
      {
        heading: "Cât rezistă",
        paragraphs: [
          "Senzorul detectorului are durată de viață 5-10 ani. După acest interval, sensibilitatea scade — chiar dacă alarma sună la test, poate să nu detecteze concentrațiile reale.",
          "Recomandare: înlocuiește detectorul la 7 ani sau când producătorul indică expirarea senzorului.",
        ],
      },
    ],
    ctas: [
      { label: "Vezi detectoare certificate în magazin", href: "/magazin", variant: "primary" },
      { label: "Programează montaj cu firmă autorizată", href: "/programare", variant: "ghost" },
    ],
    relatedSlugs: [
      "siguranta-instalatie-gaze-acasa-ghid-complet",
      "preturi-orientative-servicii-gaze-2026",
      "cum-aleg-firma-autorizata-anre",
    ],
  },

  // ── 11 ────────────────────────────────────────────────────────────
  {
    slug: "verificare-vtp-centrala-termica-iscir",
    title: "Verificare VTP centrală termică ISCIR — ghid complet",
    metaTitle: "VTP centrală termică 2026 — ghid ISCIR + prețuri",
    metaDescription: "Verificare tehnică periodică (VTP) ISCIR centrală termică: ce conține, cât costă, cât durează, ce documente primești. Ghid 2026.",
    keywords: ["VTP centrala termica", "verificare ISCIR centrala", "verificare anuala centrala termica", "service centrala termica"],
    category: "centrala-termica",
    publishedAt: "2026-04-14",
    intro:
      "Verificarea Tehnică Periodică (VTP) a centralei termice e impusă de ISCIR pentru toate centralele cu putere peste 30 kW. Pentru centralele de apartament (<30 kW) e recomandată anual de toți producătorii pentru menținerea garanției. Iată ce trebuie să știi.",
    sections: [
      {
        heading: "Ce e VTP și cine o face",
        paragraphs: [
          "VTP = Verificare Tehnică Periodică, definită de ISCIR (Inspecția de Stat pentru Controlul Cazanelor). Se face de firme autorizate ISCIR (autorizație separată față de cea ANRE).",
          "Pentru centrale rezidențiale <30 kW, formal nu e obligatorie — dar e recomandată anual pentru menținerea garanției și prevenirea accidentelor CO.",
        ],
      },
      {
        heading: "Ce conține o verificare VTP",
        paragraphs: [
          { type: "list", items: [
            "Verificare arzător (curățare, calibrare flacără)",
            "Test schimbător de căldură (eficiență transfer)",
            "Verificare presiune și vas expansiune",
            "Curățare filtre apă",
            "Verificare senzori temperatură + presostat",
            "Test sistem evacuare (tiraj, etanșeitate)",
            "Măsurare emisii CO + raport oxigen",
            "Verificare anozi (la centralele cu boiler)",
          ] },
        ],
      },
      {
        heading: "Cât costă în 2026",
        paragraphs: [
          { type: "list", items: [
            "Verificare anuală (VTP) standard: 150-300 lei",
            "Revizie completă cu curățare schimbător: 250-500 lei",
            "Înlocuire vas expansiune: +200-400 lei",
            "Înlocuire pompă: +300-600 lei",
            "Diagnoză cu analizor combustie certificat: +100-150 lei",
          ] },
        ],
      },
      {
        heading: "Cât durează",
        paragraphs: [
          "Verificarea standard: 1-2 ore. Revizia completă cu curățare: 3-4 ore.",
          "În timpul intervenției, centrala e oprită — programează cu o zi în care nu ai nevoie de apă caldă/încălzire.",
        ],
      },
      {
        heading: "Ce documente primești",
        paragraphs: [
          { type: "list", items: [
            "Raport tehnic VTP (cu măsurătorile efectuate)",
            "Etichetă cu data + următoarea scadență (lipită pe centrală)",
            "Factură pentru servicii",
            "Pe verigaz: PDF cu QR de verificare online",
          ] },
          "Aceste documente sunt necesare pentru: garanție producător, asigurare, vânzare imobil.",
        ],
      },
    ],
    ctas: [
      { label: "Programează VTP centrala ta", href: "/verificari-centrala", variant: "primary" },
      { label: "Vezi firme cu autorizație ISCIR", href: "/servicii-gaze", variant: "ghost" },
    ],
    relatedSlugs: [
      "preturi-orientative-servicii-gaze-2026",
      "diferenta-verificare-vs-revizie-gaze",
      "siguranta-instalatie-gaze-acasa-ghid-complet",
    ],
  },

  // ── 12 ────────────────────────────────────────────────────────────
  {
    slug: "cum-iti-pregatesti-locuinta-pentru-verificare",
    title: "Cum îți pregătești locuința pentru verificarea gazelor",
    metaTitle: "Cum pregătesc casa pentru verificare gaze — checklist",
    metaDescription: "Checklist înainte de verificare gaze: acces la traseu, ventilare deschisă, robineți accesibili, documente pregătite. Ghid pentru proprietari.",
    keywords: ["cum pregatesc casa pentru verificare gaze", "checklist verificare gaze", "ce fac inainte de instalator gaze"],
    category: "ghid-verificare",
    publishedAt: "2026-04-14",
    intro:
      "Verificarea gazelor durează cu 30% mai puțin dacă tehnicianul nu pierde timp căutând robineți blocați sau planuri pierdute. 10 minute de pregătire înainte îți economisesc o oră și posibil costuri suplimentare. Iată checklist-ul.",
    sections: [
      {
        heading: "Cu o zi înainte",
        paragraphs: [
          { type: "list", items: [
            "Caută procesul-verbal al ultimei verificări — îl arăți tehnicianului",
            "Pregătește contractul cu Distrigaz/Delgaz",
            "Notează aparatele cu probleme (\"plita arde galben\", \"centrala face zgomot\")",
            "Asigură-te că vei fi acasă în intervalul programat",
          ] },
        ],
      },
      {
        heading: "Cu 1 oră înainte",
        paragraphs: [
          { type: "list", items: [
            "Eliberează accesul la traseul de gaze (mută mobila dacă acoperă conducte)",
            "Deschide grilele de ventilare — chiar dacă nu sunt curățate, asigură-te că nu sunt blocate cu izolație",
            "Stinge centrala termică (dacă funcționează)",
            "Pregătește o lanternă (în caz de control în pod / subsol)",
          ] },
        ],
      },
      {
        heading: "În timpul verificării",
        paragraphs: [
          { type: "list", items: [
            "Stai aproape de tehnician — pune întrebări dacă vezi ceva ciudat",
            "Notează observațiile pentru istoricul tău",
            "Cere recomandări de îmbunătățire (chiar dacă instalația trece, tehnicianul vede potențiale probleme viitoare)",
          ] },
        ],
      },
      {
        heading: "Greșeli de evitat",
        paragraphs: [
          { type: "list", items: [
            "NU porni gătitul în timpul verificării (tehnicianul oprește oricum aparatele)",
            "NU bloca accesul la contor sau la electrovalva detectorului",
            "NU folosi spray-uri sau parfumuri lângă tehnician (afectează măsurătorile)",
            "NU \"strânge\" robineții singur înainte (poți crea scurgeri)",
          ] },
        ],
      },
      {
        heading: "După verificare",
        paragraphs: [
          "Verifică pe loc procesul-verbal: data, parametrii măsurați, rezultatul. Cere clarificări dacă ceva nu e clar.",
          "Scanează documentul și salvează-l în cloud — îl pierzi greu, e necesar la următoarea verificare peste 2 ani.",
        ],
      },
    ],
    ctas: [
      { label: "Programează cu 30 zile înainte de scadență", href: "/programare", variant: "primary" },
      { label: "Vezi firme cu rating mare", href: "/servicii-gaze", variant: "ghost" },
    ],
    relatedSlugs: [
      "cum-se-face-verificarea-instalatiei-de-gaze",
      "documente-necesare-verificare-gaze",
      "ce-intrebi-instalator-gaze-inainte-de-programare",
    ],
  },

  // ── 13 ────────────────────────────────────────────────────────────
  {
    slug: "ce-intrebi-instalator-gaze-inainte-de-programare",
    title: "Ce întrebări să pui instalatorului de gaze înainte de programare",
    metaTitle: "Ce întrebi instalator gaze — 10 întrebări esențiale",
    metaDescription: "Lista de întrebări de filtrare pentru firme autorizate ANRE: autorizație, preț final, durată, garanție, documente emise. Ghid alegere instalator.",
    keywords: ["intrebari instalator gaze", "ce intreb firma autorizata ANRE", "filtrare firme verificare gaze"],
    category: "ghid-verificare",
    publishedAt: "2026-04-14",
    intro:
      "10 minute de întrebări înainte de programare îți economisesc supărări de ore. Iată cele 10 întrebări esențiale care îți spun dacă firma e serioasă sau încearcă să te tragă pe sfoară.",
    sections: [
      {
        heading: "Întrebări despre autorizare",
        paragraphs: [
          { type: "list", items: [
            "Care e numărul autorizației ANRE? (verifică pe ANRE registru)",
            "Pentru ce categorie sunteți autorizați? (EDIB, EDSB, IS)",
            "Tehnicianul care vine are autorizație personală ANRE?",
            "Aveți și autorizație ISCIR pentru centrală termică?",
          ] },
        ],
      },
      {
        heading: "Întrebări despre preț",
        paragraphs: [
          { type: "list", items: [
            "Care e prețul final, inclusiv deplasare + emitere documente?",
            "Există costuri suplimentare dacă găsiți defecte?",
            "Acceptați plata cu cardul / OP / numerar?",
            "Cât e prețul în weekend / urgență?",
          ] },
        ],
      },
      {
        heading: "Întrebări despre execuție",
        paragraphs: [
          { type: "list", items: [
            "Cât durează verificarea pentru apartamentul/casa mea?",
            "Cu cât timp înainte trebuie să programez?",
            "Cum aflu data exactă și ora?",
            "Pot reprograma fără cost?",
          ] },
        ],
      },
      {
        heading: "Întrebări despre documente",
        paragraphs: [
          { type: "list", items: [
            "Ce documente emiteți la final?",
            "Procesul-verbal e digital sau doar pe hârtie?",
            "Pot primi copii electronice prin email?",
            "Cât rezistă valabilitatea procesului-verbal?",
          ] },
        ],
      },
      {
        heading: "Întrebări despre garanție",
        paragraphs: [
          { type: "list", items: [
            "Dacă instalația trece verificarea și o săptămână mai târziu apare o scurgere, ce faceți?",
            "Aveți asigurare de răspundere civilă profesională?",
            "Cum se gestionează o reclamație?",
          ] },
        ],
      },
      {
        heading: "Semnale de alarmă",
        paragraphs: [
          "Dacă firma:",
          { type: "list", items: [
            "Nu poate da numărul autorizației ANRE → REFUZ",
            "Cere plata în avans 100% → SUSPECT",
            "Spune \"facem fără hârtii\" → ILEGAL",
            "Refuză să dea factură → RAPORTEAZĂ ANAF",
            "Are preț cu 50% sub piață → probabil neprofesional",
          ] },
        ],
      },
    ],
    ctas: [
      { label: "Filtrează firmele cu autorizație validată", href: "/servicii-gaze", variant: "primary" },
      { label: "Programează cu firmă verificată", href: "/programare", variant: "ghost" },
    ],
    relatedSlugs: [
      "cum-aleg-firma-autorizata-anre",
      "documente-necesare-verificare-gaze",
      "preturi-orientative-servicii-gaze-2026",
    ],
  },

  // ── 14 ────────────────────────────────────────────────────────────
  {
    slug: "siguranta-instalatie-gaze-acasa-ghid-complet",
    title: "Siguranța instalației de gaze acasă — ghid complet",
    metaTitle: "Siguranța gazelor acasă 2026 — prevenire accidente",
    metaDescription: "Ghid complet siguranță instalație gaze: detectoare, ventilare, semne de scurgere, ce fac în caz de urgență. Numerele utile Distrigaz/Delgaz.",
    keywords: ["siguranta gaze acasa", "scurgere gaz semne", "ce fac scurgere gaz", "detector gaze obligatoriu"],
    category: "siguranta",
    publishedAt: "2026-04-14",
    intro:
      "În România au loc anual 50-80 incidente cu gaze cu victime — majoritatea evitabile cu măsuri elementare. Acest ghid acoperă tot: prevenire, detectare, reacție în urgență, contacte utile.",
    sections: [
      {
        heading: "Semnele unei scurgeri de gaz",
        paragraphs: [
          { type: "list", items: [
            "Miros caracteristic (\"de ouă stricate\" — adăugat artificial gazului natural)",
            "Sunet de șuierat lângă conducte / robineți",
            "Plante uscate localizat (gazul neagră rădăcinile)",
            "Flacără care arde galben/portocaliu (normal e albastru)",
            "Stare de rău, dureri de cap, amețeli (intoxicație CO)",
            "Detectorul sună",
          ] },
        ],
      },
      {
        heading: "Ce faci în caz de scurgere — în 60 secunde",
        paragraphs: [
          { type: "list", items: [
            "1. NU aprinde lumina, NU folosi telefonul în casă",
            "2. Închide robinetul general de gaz (de obicei lângă contor)",
            "3. Deschide ferestre + uși pentru ventilare",
            "4. Evacuează toți din casă",
            "5. Sună de afară Distrigaz: 0 800 877 778 sau Delgaz: 0 800 800 928 (gratuit, 24/7)",
            "6. NU folosi aparate electrice până nu vine echipa de intervenție",
          ] },
        ],
      },
      {
        heading: "Prevenirea — măsuri obligatorii",
        paragraphs: [
          { type: "list", items: [
            "Verificare ANRE la 2 ani — nu rata termenul",
            "Detector gaze certificat EN50194 montat corect",
            "Ventilare neacoperită — păstrează grilele curate",
            "Robineți individuali pe fiecare aparat (nu doar cel general)",
            "Evacuare gaze de ardere funcțională (coș + tiraj)",
          ] },
        ],
      },
      {
        heading: "Prevenirea — bune practici zilnice",
        paragraphs: [
          { type: "list", items: [
            "NU lăsa flacără aprinsă fără supraveghere",
            "Testează detectorul lunar (buton TEST)",
            "Curăță plita săptămânal (resturi pot bloca arzătoarele)",
            "Educă copiii că gazul nu e jucărie",
            "Notează scadența verificării în calendar",
          ] },
        ],
      },
      {
        heading: "Numere utile (24/7 gratuite)",
        paragraphs: [
          { type: "list", items: [
            "Distrigaz Sud: 0 800 877 778",
            "Delgaz Grid: 0 800 800 928",
            "ISU (pompieri): 112",
            "Salvare: 112",
          ] },
        ],
      },
    ],
    ctas: [
      { label: "Cumpără detector EN50194 din magazin", href: "/magazin", variant: "primary" },
      { label: "Programează verificare urgentă", href: "/programare", variant: "ghost" },
    ],
    relatedSlugs: [
      "detector-gaze-cum-functioneaza-cum-il-aleg",
      "amenzi-verificare-gaze-neefectuata",
      "reparatii-instalatie-gaze-cand-chemi-specialistul",
    ],
  },

  // ── 15 ────────────────────────────────────────────────────────────
  {
    slug: "reparatii-instalatie-gaze-cand-chemi-specialistul",
    title: "Reparații instalație gaze — când chemi specialistul",
    metaTitle: "Reparații gaze 2026 — când chem urgent specialist",
    metaDescription: "Lista completă probleme instalație gaze care necesită urgent firmă autorizată ANRE: scurgeri, robineți blocați, presiune mică, miros.",
    keywords: ["reparatii instalatie gaze", "scurgere gaz reparatie", "robinet gaz blocat", "specialist gaze urgent"],
    category: "ghid-verificare",
    publishedAt: "2026-04-14",
    intro:
      "Unele probleme la instalația de gaze sunt urgențe absolute (scurgeri, miros), altele pot aștepta o programare normală (robineți tari, presiune scăzută). Iată cum diferențiezi și când să suni urgent.",
    sections: [
      {
        heading: "Urgențe — sună acum (sau 0 800 877 778)",
        paragraphs: [
          { type: "list", items: [
            "Miros de gaz oriunde în casă",
            "Detector gaze sună",
            "Flacără verde/galbenă în loc de albastră",
            "Sunet de șuierat lângă contor sau aparate",
            "Stare de rău + miros (potențială intoxicație CO)",
            "Robinet rupt sau care nu se mai poate închide",
          ] },
          "Pentru toate astea, nu chemi firma — suni operatorul de distribuție 24/7. Apoi, după rezolvarea urgenței, programezi firmă pentru reparație.",
        ],
      },
      {
        heading: "Probleme serioase — programează în 24-48h",
        paragraphs: [
          { type: "list", items: [
            "Centrala se oprește des sau face zgomote noi",
            "Presiunea apei calde fluctuează puternic",
            "Plita se aprinde greu sau cu pocnituri",
            "Vezi vizibil rugină pe robineți sau fittinguri",
            "Senzorul detectorului dă alarmă fără cauză aparentă (calibrare necesară)",
          ] },
        ],
      },
      {
        heading: "Probleme normale — programare standard",
        paragraphs: [
          { type: "list", items: [
            "Robineți tari de mult timp dar funcționali",
            "Centrala mai veche care vrea înlocuit vasul de expansiune",
            "Plită cu aprindere automată defectă (poți folosi chibrit între timp)",
            "Mutare aparat consumator dintr-un colț în altul",
          ] },
        ],
      },
      {
        heading: "Reparații pe care NU le faci singur",
        paragraphs: [
          { type: "list", items: [
            "Înlocuirea oricărei conducte de gaz",
            "Strângerea fittingurilor (poți deteriora etanșeitatea)",
            "Modificarea traseului",
            "Conectarea unui aparat nou",
            "Mutarea contorului",
          ] },
          "Toate astea cer autorizație ANRE. Dacă faci singur, ești în ilegalitate + amendă ANRE + risc de incident.",
        ],
      },
    ],
    ctas: [
      { label: "Caută firmă cu intervenții rapide", href: "/servicii-gaze", variant: "primary" },
      { label: "Programează reparația", href: "/programare", variant: "ghost" },
    ],
    relatedSlugs: [
      "siguranta-instalatie-gaze-acasa-ghid-complet",
      "preturi-orientative-servicii-gaze-2026",
      "cum-aleg-firma-autorizata-anre",
    ],
  },

  // ── 16 ────────────────────────────────────────────────────────────
  {
    slug: "inlocuire-contor-gaze-cum-se-face",
    title: "Înlocuirea contorului de gaze — proceduri și costuri",
    metaTitle: "Înlocuire contor gaze 2026 — proceduri Distrigaz/Delgaz",
    metaDescription: "Ghid înlocuire contor gaz: cine plătește, cât costă, cât durează, ce documente. Diferențe Distrigaz Sud vs Delgaz Grid.",
    keywords: ["inlocuire contor gaz", "schimbare contor gaze", "contor gaz uzat distrigaz delgaz"],
    category: "ghid-verificare",
    publishedAt: "2026-04-14",
    intro:
      "Contorul de gaz are durată de viață 10-15 ani. La expirare, operatorul de distribuție (Distrigaz Sud sau Delgaz Grid) îl înlocuiește gratuit dacă uzura e normală. Iată procedura completă și ce să faci dacă apar contestări.",
    sections: [
      {
        heading: "Cine inițiază înlocuirea",
        paragraphs: [
          "În 95% din cazuri, operatorul de distribuție programează automat înlocuirea când expiră metrologic contorul (10-15 ani). Primești notificare cu 30 zile înainte.",
          "Tu poți cere înlocuirea dacă: contorul afișează valori incorecte, e blocat fizic, are scurgeri vizibile, e deteriorat de inundație/incendiu.",
        ],
      },
      {
        heading: "Cine plătește",
        paragraphs: [
          { type: "list", items: [
            "Înlocuire metrologică planificată: GRATIS (operator)",
            "Defect normal de uzură: GRATIS",
            "Defect cauzat de proprietar (lovire, supraîncărcare): plătește proprietarul",
            "Mutare contor la cerere proprietar: plătește proprietarul (300-700 lei)",
          ] },
        ],
      },
      {
        heading: "Procedura înlocuirii planificate",
        paragraphs: [
          { type: "list", items: [
            "1. Primești scrisoare/SMS cu data programată (1-2 ore interval)",
            "2. În ziua respectivă, asigură accesul la contor",
            "3. Echipa închide gazul, scoate contorul vechi, montează cel nou (15-30 min)",
            "4. Reia furnizarea + face test de etanșeitate",
            "5. Primești proces-verbal cu indexul vechi + indexul nou",
          ] },
        ],
      },
      {
        heading: "Cum reacționezi dacă suspectezi citire greșită",
        paragraphs: [
          { type: "list", items: [
            "Sună operatorul de distribuție și cere verificare metrologică",
            "Dacă verificarea confirmă deviația >2%, înlocuirea e gratuită + se reglează factura ultimelor 6 luni",
            "Dacă deviația e <2% (normal), tu plătești 80-150 lei pentru verificare",
          ] },
        ],
      },
      {
        heading: "Atenție — cine NU schimbă contorul",
        paragraphs: [
          "Înlocuirea contorului e EXCLUSIV operatorul de distribuție (Distrigaz/Delgaz). Nicio firmă privată nu are voie să schimbe contorul — chiar dacă e autorizată ANRE.",
          "Dacă vine cineva care zice că o face, REFUZĂ și raportează la operatorul de distribuție.",
        ],
      },
    ],
    ctas: [
      { label: "Vezi firmele care fac verificare după înlocuire", href: "/servicii-gaze", variant: "primary" },
      { label: "Programează verificare ANRE", href: "/programare", variant: "ghost" },
    ],
    relatedSlugs: [
      "anre-ord-179-2015-explicat-pe-intelesul-tuturor",
      "bransament-nou-gaze-pasi-costuri",
      "siguranta-instalatie-gaze-acasa-ghid-complet",
    ],
  },

  // ── 17 ────────────────────────────────────────────────────────────
  {
    slug: "bransament-nou-gaze-pasi-costuri",
    title: "Branșament nou la rețeaua de gaz — pași și costuri 2026",
    metaTitle: "Branșament nou gaze 2026 — costuri reale + termene",
    metaDescription: "Ghid complet branșare nouă gaz natural: aviz operator, proiect, execuție, costuri 4000-15000 lei, termene 3-6 luni. Ce documente, ce firme.",
    keywords: ["bransament nou gaz", "racordare gaze cost", "cum bransez la gaz", "aviz distrigaz pentru bransament"],
    category: "legal",
    publishedAt: "2026-04-14",
    intro:
      "Branșarea unei case noi la rețeaua de gaz natural durează 3-6 luni și costă între 4.000 și 15.000 lei, în funcție de distanța la rețea. Procedura are 7 pași clari — iată ghidul complet.",
    sections: [
      {
        heading: "Pasul 1 — Cerere aviz tehnic",
        paragraphs: [
          "Depui la operatorul de distribuție (Distrigaz Sud, Delgaz Grid, alți operatori locali) o cerere de aviz tehnic. Documente: cerere tip + carte funciară + autorizație construcție + plan locație.",
          "Operatorul răspunde în 30 zile cu avizul tehnic + condițiile de racordare. Costul: 100-300 lei taxă administrativă.",
        ],
      },
      {
        heading: "Pasul 2 — Proiect de execuție",
        paragraphs: [
          "Cu avizul în mână, contractezi un proiectant autorizat ANRE pentru proiectul branșamentului + instalației interioare. Cost proiect: 600-1500 lei.",
          "Proiectul include: traseu conductă, dimensionare, materiale, plan tehnic, plan de încadrare în zonă.",
        ],
      },
      {
        heading: "Pasul 3 — Aprobare proiect",
        paragraphs: [
          "Proiectul se depune la operatorul de distribuție pentru aprobare. Verifică conformitatea cu standardele și avizul inițial. Durată: 30 zile.",
        ],
      },
      {
        heading: "Pasul 4 — Execuție branșament (lucrare operator)",
        paragraphs: [
          "Operatorul execută branșamentul de la rețeaua publică până la limita proprietății + montaj contor + post de reglare-măsurare.",
          "Cost: 2000-5000 lei (depinde de distanță). Plătit operatorului direct, dar deductibil din facturile viitoare conform legii.",
        ],
      },
      {
        heading: "Pasul 5 — Execuție instalație interioară",
        paragraphs: [
          "Aici contractezi firma autorizată ANRE care îți va realiza traseul de la contor la fiecare aparat consumator (centrala termică, plită, boiler).",
          "Cost: 80-150 lei/metru linear conductă + 200-500 lei pentru fiecare punct de racord aparat. Total mediu: 1500-4000 lei.",
        ],
      },
      {
        heading: "Pasul 6 — Verificare + recepție",
        paragraphs: [
          "Firma execută testul de etanșeitate, emite procesul-verbal de verificare. Apoi operatorul de distribuție face recepția + sigilarea contorului.",
        ],
      },
      {
        heading: "Pasul 7 — Contract furnizare gaz",
        paragraphs: [
          "Semnezi contractul de furnizare cu un furnizor (Engie, E.ON, etc.) — separat de operatorul de distribuție. Activarea: 5-15 zile.",
        ],
      },
      {
        heading: "Total costuri 2026",
        paragraphs: [
          { type: "list", items: [
            "Aviz tehnic: 100-300 lei",
            "Proiect: 600-1500 lei",
            "Branșament operator: 2000-5000 lei",
            "Instalație interioară: 1500-4000 lei",
            "Verificare + recepție: 200-400 lei",
            "TOTAL: 4400-11200 lei",
          ] },
        ],
      },
    ],
    ctas: [
      { label: "Caută firmă autorizată pentru instalație nouă", href: "/servicii-gaze", variant: "primary" },
      { label: "Cere ofertă personalizată", href: "/programare", variant: "ghost" },
    ],
    relatedSlugs: [
      "anre-ord-179-2015-explicat-pe-intelesul-tuturor",
      "preturi-orientative-servicii-gaze-2026",
      "inlocuire-contor-gaze-cum-se-face",
    ],
  },

  // ── 18 ────────────────────────────────────────────────────────────
  {
    slug: "asociatii-proprietari-obligatii-verificare-gaze",
    title: "Asociații de proprietari — obligațiile pentru verificarea gazelor",
    metaTitle: "Asociație proprietari verificare gaze — obligații 2026",
    metaDescription: "Ghid asociații proprietari: cum se face verificarea comună gaze, cine plătește, ce documente, sancțiuni. Ord. ANRE 179/2015.",
    keywords: ["asociatie proprietari verificare gaze", "verificare gaze parti comune", "obligatii administrator bloc gaze"],
    category: "asociatii",
    publishedAt: "2026-04-14",
    intro:
      "Asociațiile de proprietari răspund pentru verificarea părților comune ale instalației de gaze (coloane principale, regulator presiune, contor general). Lipsa verificării poate aduce amendă de 5000-15000 lei + suspendarea furnizării întregului bloc. Iată ghidul administratorului.",
    sections: [
      {
        heading: "Ce intră în răspunderea asociației",
        paragraphs: [
          { type: "list", items: [
            "Coloana principală de gaz până la fiecare apartament",
            "Regulatorul de presiune comun (dacă există)",
            "Contorul general (dacă blocul nu are contoare individuale)",
            "Robineții generali pe scări / coloane",
            "Ventilarea spațiilor comune (subsol cu echipamente termice)",
          ] },
        ],
      },
      {
        heading: "Cine plătește verificarea părților comune",
        paragraphs: [
          "Costul se distribuie între toți proprietarii proporțional cu cota-parte indiviza, exact ca celelalte cheltuieli comune.",
          "Cost mediu pentru un bloc cu 20 apartamente: 800-1500 lei total = 40-75 lei/apartament. Sub costul unei verificări individuale.",
        ],
      },
      {
        heading: "Cum organizezi verificarea — ghid administrator",
        paragraphs: [
          { type: "list", items: [
            "1. Cere oferte de la 3 firme autorizate ANRE din zonă",
            "2. Adoptă în Comitetul Asociației sau AGA decizia de contractare",
            "3. Comunică data verificării către locatari (afișare la avizier + grup WhatsApp)",
            "4. Asigură acces la subsol / casa scării în ziua respectivă",
            "5. Plata facturii din contul asociației",
            "6. Arhivează procesul-verbal în dosarul de mentenanță (păstrare 10 ani)",
          ] },
        ],
      },
      {
        heading: "Verificarea apartamentelor individuale",
        paragraphs: [
          "Fiecare proprietar e responsabil pentru verificarea apartamentului propriu. Asociația poate FACILITA programarea comună (ex: aceeași firmă în aceeași zi pentru toate apartamentele) cu reducere de 30-50% la cost.",
          "Asociația NU poate forța proprietarii să folosească o anumită firmă, dar poate sublinia obligația legală.",
        ],
      },
      {
        heading: "Sancțiuni pentru asociație",
        paragraphs: [
          { type: "list", items: [
            "5000-15000 lei pentru asociație dacă nu efectuează verificarea părților comune",
            "Răspundere personală a administratorului pentru nerespectarea obligațiilor",
            "Suspendare furnizare gaz pentru tot blocul în caz extrem (foarte rar)",
          ] },
        ],
      },
      {
        heading: "Recomandări proactive",
        paragraphs: [
          { type: "list", items: [
            "Planifică verificarea comună cu 60 zile înainte de scadență",
            "Negociază contract anual cu firma — preț stabil + prioritate intervenții",
            "Montează detector gaze în spațiile comune (scara cu apartamente)",
            "Educa locatarii să raporteze imediat orice miros de gaz",
          ] },
        ],
      },
    ],
    ctas: [
      { label: "Cere ofertă pentru verificare comună", href: "/programare", variant: "primary" },
      { label: "Vezi firme cu experiență în asociații", href: "/servicii-gaze", variant: "ghost" },
    ],
    relatedSlugs: [
      "amenzi-verificare-gaze-neefectuata",
      "anre-ord-179-2015-explicat-pe-intelesul-tuturor",
      "siguranta-instalatie-gaze-acasa-ghid-complet",
    ],
  },

  // ── 19 ────────────────────────────────────────────────────────────
  {
    slug: "verificare-gaze-apartament-vs-casa-diferente",
    title: "Verificare gaze: apartament vs casă — diferențe esențiale",
    metaTitle: "Verificare gaze apartament vs casă — diferențe 2026",
    metaDescription: "Comparație verificare gaze apartament vs casă: preț, durată, complexitate, ventilare, evacuare gaze, responsabilități. Ghid 2026 RO.",
    keywords: ["verificare gaze apartament", "verificare gaze casa", "diferenta verificare gaze apartament casa"],
    category: "ghid-verificare",
    publishedAt: "2026-04-14",
    intro:
      "Verificarea gazelor într-un apartament și într-o casă urmează aceleași norme ANRE, dar diferă semnificativ în complexitate, preț și durată. Casele au mai multe puncte de risc — coș fum, traseu lung, multiple aparate. Iată comparația.",
    sections: [
      {
        heading: "Apartament — ce e specific",
        paragraphs: [
          { type: "list", items: [
            "Traseu scurt (sub 10 m de la contor la cel mai îndepărtat aparat)",
            "Aparate consumatoare standard: plită + centrală + opțional boiler",
            "Coloana de evacuare comună (responsabilitate asociație)",
            "Ventilare prin grile fixe în bucătărie + spațiu centrală",
            "Verificare standard: 30-60 min, 80-250 lei",
          ] },
        ],
      },
      {
        heading: "Casă — ce e specific",
        paragraphs: [
          { type: "list", items: [
            "Traseu lung (poate depăși 30-50 m)",
            "Aparate multiple: plită, centrală, boiler, șemineu pe gaz, grătar exterior",
            "Coș de fum propriu (verificare separată — coșar autorizat)",
            "Conductele pot trece prin pod, pivniță, garaj — verificare mai detaliată",
            "Verificare standard: 60-120 min, 150-400 lei",
          ] },
        ],
      },
      {
        heading: "Ce e mai dificil într-o casă",
        paragraphs: [
          { type: "list", items: [
            "Verificarea coșului de fum (necesită coșar autorizat — separat ANRE)",
            "Acces la traseu prin pod sau spații înguste",
            "Verificare ventilare la spații cu centrală în pivniță (necesar grilă inferioară + superioară)",
            "Aparate de exterior cu protecție la intemperii",
            "Eventuale extensii / racorduri pentru anexe (garaj, șopron)",
          ] },
        ],
      },
      {
        heading: "Responsabilități",
        paragraphs: [
          { type: "list", items: [
            "Apartament: proprietarul răspunde pentru instalația apartamentului; asociația pentru părțile comune",
            "Casă: proprietarul răspunde 100% pentru tot — nu există entitate intermediară",
          ] },
        ],
      },
      {
        heading: "Recomandări",
        paragraphs: [
          { type: "list", items: [
            "Pentru casă, alege firmă cu experiență dovedită pe locuințe individuale (recenzii)",
            "Cere verificare combinată gaze + coș fum dacă firma are autorizație",
            "Pentru casă cu sistem de încălzire complex, programează revizia la 10 ani 2 luni înainte de iarnă",
            "Pentru apartament, coordonează cu asociația dacă scadența verificării părților comune e apropiată",
          ] },
        ],
      },
    ],
    ctas: [
      { label: "Caută firmă pentru tipul tău de proprietate", href: "/servicii-gaze", variant: "primary" },
      { label: "Programează acum", href: "/programare", variant: "ghost" },
    ],
    relatedSlugs: [
      "cat-costa-verificarea-instalatiei-de-gaze-2026",
      "asociatii-proprietari-obligatii-verificare-gaze",
      "cum-iti-pregatesti-locuinta-pentru-verificare",
    ],
  },

  // ── 20 ────────────────────────────────────────────────────────────
  {
    slug: "distrigaz-delgaz-vs-firma-autorizata-anre",
    title: "Distrigaz/Delgaz vs firmă autorizată ANRE — cine ce face",
    metaTitle: "Distrigaz vs firmă ANRE — cine face ce 2026",
    metaDescription: "Diferența clară între operatorul de distribuție (Distrigaz/Delgaz) și firme private autorizate ANRE: cine face contoare, branșamente, verificări, reparații.",
    keywords: ["distrigaz vs firma autorizata", "delgaz vs anre", "cine face verificarea gaze", "diferenta operator distributie firma autorizata"],
    category: "ghid-verificare",
    publishedAt: "2026-04-14",
    intro:
      "Confuzia între operatorul de distribuție (Distrigaz Sud, Delgaz Grid) și firmele autorizate ANRE e cel mai frecvent motiv pentru care oamenii sună la cine nu trebuie. Iată cine face exact ce — și cum nu pierzi timp.",
    sections: [
      {
        heading: "Operatorul de distribuție — Distrigaz Sud / Delgaz Grid",
        paragraphs: [
          "Operatorul deține rețeaua publică de gaz până la limita proprietății tale + contorul. Responsabilitățile lui:",
          { type: "list", items: [
            "Branșarea casei la rețea (instalează conducta de pe stradă până la limita proprietății)",
            "Montarea + sigilarea contorului",
            "Înlocuirea contorului la expirare metrologică",
            "Citirea contorului + facturare distribuție",
            "Intervenții urgente la rețeaua publică (24/7 gratuit)",
            "Sigilarea / desigilarea contorului la cerere",
            "Sistarea/reluarea furnizării în caz de plată restantă sau neconformitate",
          ] },
        ],
      },
      {
        heading: "Firma autorizată ANRE — privată",
        paragraphs: [
          "Firma autorizată ANRE răspunde de instalația de la contor în interior + de toate aparatele tale. Responsabilitățile:",
          { type: "list", items: [
            "Verificarea periodică (la 2 ani) + revizia (la 10 ani)",
            "Execuția instalației interioare la branșament nou",
            "Reparații conducte interioare, robineți, fittinguri",
            "Mutarea / înlocuirea aparatelor consumatoare",
            "Montaj detector gaze + electrovalvă",
            "Service centrală termică (dacă au și autorizație ISCIR)",
            "Emiterea proceselor-verbale + declarațiilor de conformitate",
          ] },
        ],
      },
      {
        heading: "Tabel rapid — la cine sun",
        paragraphs: [
          { type: "list", items: [
            "Miros de gaz urgent → Operator distribuție (gratuit, 24/7)",
            "Verificare la 2 ani → Firmă autorizată ANRE",
            "Înlocuire contor → Operator distribuție (gratuit dacă e expirat metrologic)",
            "Centrala face zgomote → Firmă autorizată ANRE/ISCIR",
            "Branșament casă nouă → Operator + firmă privată (în paralel)",
            "Plătesc factura → Furnizor (nu distribuitor — sunt entități diferite)",
          ] },
        ],
      },
      {
        heading: "Furnizor de gaz — al treilea actor",
        paragraphs: [
          "Furnizorul (Engie, E.ON, MET Group, etc.) îți vinde gazul. NU întreține instalația, NU face verificări tehnice. Doar facturează consumul.",
          "Poți schimba furnizorul oricând fără cost — distribuitorul + instalația rămân aceleași.",
        ],
      },
      {
        heading: "Numere utile (24/7 gratuit)",
        paragraphs: [
          { type: "list", items: [
            "Distrigaz Sud (București, sud-Muntenia, Dobrogea, sud-Oltenia): 0 800 877 778",
            "Delgaz Grid (Moldova, Banat, Crișana, Maramureș, Transilvania): 0 800 800 928",
            "ISU (urgențe): 112",
          ] },
        ],
      },
    ],
    ctas: [
      { label: "Caută firmă autorizată ANRE în județul tău", href: "/servicii-gaze", variant: "primary" },
      { label: "Programează verificarea online", href: "/programare", variant: "ghost" },
    ],
    relatedSlugs: [
      "anre-ord-179-2015-explicat-pe-intelesul-tuturor",
      "siguranta-instalatie-gaze-acasa-ghid-complet",
      "inlocuire-contor-gaze-cum-se-face",
    ],
  },
]

export const ARTICLES: Article[] = _ARTICLES
export const ARTICLES_BY_SLUG: Map<string, Article> = new Map(ARTICLES.map((a) => [a.slug, a]))

export function getArticle(slug: string): Article | null {
  return ARTICLES_BY_SLUG.get(slug) ?? null
}

export function getRelated(slugs: string[]): Article[] {
  return slugs
    .map((s) => ARTICLES_BY_SLUG.get(s))
    .filter((a): a is Article => !!a)
}
