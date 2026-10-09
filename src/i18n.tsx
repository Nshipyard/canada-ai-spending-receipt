"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "fr";

const en = {
  banner: {
    line: "An open-source civic project. Not affiliated with the Government of Canada.",
    badge: "Open source",
    repo: "GitHub repo",
  },
  nav: {
    receipt: "The receipt",
    explorer: "Vendors",
    methodology: "Methodology",
    developers: "Developers",
    data: "Data",
    back: "All projects",
  },
  hero: {
    kicker: "Open Nshipyard · Federal AI spending",
    title: "Where Ottawa's AI money went.",
    sub: "Ottawa has spent more than $800M on AI since 2023, from ChatGPT subscriptions to a $350M payroll contract. The Canadian Press published the topline; nobody compiled the vendor list. This project matches every verifiable contract to its real owner, Canadian or foreign, and says exactly what it cannot show.",
    cta1: "See the receipt",
    cta2: "Read the methodology",
  },
  stats: [
    { value: "", label: "in tracked federal AI contracts and investments, 2023-2026 (the $800M+ topline is the context; this is the verifiable portion)" },
    { value: "", label: "of tracked dollars to Canadian-owned vendors" },
    { value: "", label: "of tracked dollars to foreign-owned vendors" },
    { value: "", label: "verifiable contracts compiled from Order Paper responses, CanadaBuys, and press records" },
  ],
  receipt: {
    kicker: "The receipt",
    title: "Every vendor, one treemap.",
    body: "Each block is a vendor, sized by dollars, colored by who really owns it. The $350M Dayforce payroll contract and the $240M Cohere investment dominate; the tail is where the Buy Canadian Policy gets tested.",
    treemapLabel: "Treemap of tracked federal AI spending by vendor, colored by ownership",
    legendCanadian: "Canadian-owned",
    legendForeign: "Foreign-owned",
    legendUncertain: "Ownership uncertain",
    tailCanadian: "smaller Canadian vendors",
    tailForeign: "smaller foreign vendors",
    tailUncertain: "smaller vendors, ownership uncertain",
    topTitle: "Top vendors by tracked dollars",
    topSub: "Canadian-owned in red, foreign-owned in ink. HQ country is the legal headquarters, not the billing address on the contract.",
    contractsWord: "contracts",
    procuraKicker: "The anchor case",
    procuraTitle: "$1.2M, three US firms, listed as Ottawa-based.",
    procuraBody: "PSPC's Procura chatbot ran on five contracts: Teksystems at $609,761, Infosys Public Services at $145,218, and PwC at $248,529, all listed as Ottawa-based in the response to written question Q-1229. PSPC later said two firms have registered Ottawa addresses and PwC's is in Toronto. The Wire Report, Oct 1, 2026.",
    procuraLink: "Read the investigation",
    policyNote: "The Buy Canadian Policy took effect December 2025. This is what the money did.",
    caveatsKicker: "What this does not show",
    caveatsTitle: "Read this before you share the chart.",
    caveats: [
      "This is a compiled sample of verifiable contracts, not the full $800M+. It covers the portion of the topline that could be verified from public sources at build time. The $800M+ figure itself comes from the Canadian Press, May 13, 2026.",
      "The $240M Cohere item is a strategic investment in a Canadian company, not a procurement contract. Totals are reported both ways: combined for the full picture, and procurement-only when testing the Buy Canadian Policy against actual awards.",
      "CSE and CSIS declined the MP's information request; the RCMP had no centralized data. The vendor split inherits this coverage gap, and anything those agencies signed is missing from both the topline and this receipt.",
      "Vendor ownership coding is judgment-heavy. Every coding links to its evidence; vendors coded uncertain are shown separately and excluded from the Canadian and foreign shares.",
      "Cohere used the federal investment to commission American-owned CoreWeave to build and operate its Canadian data centre (the Wire Report). Canadian ownership of the vendor does not mean every dollar stayed in Canada.",
    ],
  },
  explorer: {
    kicker: "Vendors",
    title: "Search every vendor.",
    search: "Search by vendor name…",
    showing: "Showing",
    of: "of",
    noResult: "No vendors match.",
    empty: "Search by vendor name above to browse the canonical vendor file. Each vendor carries its ownership coding, HQ country, and the evidence link behind the coding.",
    spend: "Tracked spend",
    contracts: "contracts",
    departments: "Departments",
    variants: "name variants merged",
    hq: "HQ",
    evidence: "ownership evidence",
    vendorId: "Vendor ID",
    back: "Back to results",
    contractsTitle: "Contracts",
    department: "Department",
    year: "Fiscal year",
    kind: "Type",
    source: "Source",
    procurement: "Procurement",
    investment: "Investment",
  },
  methodology: {
    kicker: "Methodology",
    title: "How the receipt was built, and where it is weak.",
    items: [
      "Sources: the Canadian Press topline (May 13, 2026, from MP Jagsharan Singh Mahal's written question to all departments, agencies, and Crown corporations); parliamentary Order Paper written-question responses; CanadaBuys contract award notices; and the Wire Report's Q-1229 investigation (Oct 1, 2026). Every contract row cites its source URL.",
      "Vendor entity resolution is deterministic and documented: names are uppercased, punctuation stripped, legal suffixes (Ltd, Inc, Corp and others) dropped, then exact-matched on the normalized key. Free-text variants from Order Paper tables merge into one canonical vendor; the merge table ships in vendors.csv.",
      "Ownership coding: each canonical vendor is coded Canadian-owned, foreign-owned, or uncertain by ultimate headquarters, with a public evidence link per vendor. Registered billing addresses on contracts are not ownership; the Procura case is why the distinction matters.",
      "The counting rule: the $240M Cohere item is an investment, not a procurement contract. The site reports the combined total and the procurement-only total side by side, so the Buy Canadian Policy test uses awards only.",
      "Amounts are award or announced values as published, not audited final payments. Multi-year awards appear in full in the award year.",
      "Coverage: this is the verifiable portion of the $800M+ topline, compiled from public sources at build time. It is a floor, not a census. Any AI contract not in a public response or notice is missing, including everything at CSE, CSIS, and the RCMP.",
      "Uncertain-ownership vendors are listed separately with their dollars, and excluded from both shares. The vendor table is versioned; new Order Paper responses will update it.",
    ],
  },
  developers: {
    kicker: "For developers",
    title: "Query it from code, or from an agent.",
    body: "Three consumption paths, same canonical data. REST for applications, OpenAPI for integration, MCP tools over streamable HTTP for AI agents.",
    endpoints: "Endpoints",
    tryIt: "Try it",
    openapi: "OpenAPI spec",
    mcpTitle: "MCP server",
    mcpBody: "One streamable-HTTP endpoint. Tools: vendor_lookup, vendor_search, contracts_list, spend_summary.",
  },
  mcp: {
    kicker: "Connect your agent",
    title: "Put this data to work inside your AI tools.",
    body: "Pick your harness, copy the prompt, send it to your agent. Your agent runs the setup itself.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Other" },
    cardTitle: "Copy and send this to {tab}",
    copy: "Copy",
    copied: "Copied",
    chatgptNote: "ChatGPT connects through the documented REST API rather than MCP directly.",
    pChatgpt:
      "I want to use the {displayName} through its API.\n- OpenAPI spec: {origin}/api/openapi.json\n- REST base: {origin}/api/v1\nFirst tell me in two sentences what this API offers, then {exampleLower}, and show me the result.",
    pClaude:
      "In Claude (claude.ai), open Settings, then Connectors, and add a custom connector:\n- Name: {displayName}\n- URL: {origin}/mcp\nThen list the available tools, {exampleLower}, and show me the result.",
    pClaudeCode:
      "Set up the {displayName} MCP server so I can query it from here.\n1. Run: claude mcp add --transport http {slug} {origin}/mcp\n2. Run `claude mcp list` to confirm it connected.\n3. {example}, and show me the result.",
    pCli:
      "# MCP endpoint (streamable HTTP)\n{origin}/mcp\n\n# List the available tools\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Everything else",
    otherBody: "Any harness that speaks MCP over streamable HTTP, or plain REST.",
    mcpEndpoint: "MCP endpoint",
    openapiSpec: "OpenAPI spec",
    restBase: "REST base",
  },
  downloads: {
    kicker: "Data",
    title: "Take the files.",
    body: "The contract list, the canonical vendor table with ownership coding, and the aggregate summary, MIT licensed.",
    files: [
      { name: "contracts.csv", desc: "Contract-by-contract list with vendor IDs, source URLs, and procurement vs investment flags" },
      { name: "vendors.csv", desc: "Canonical vendors with ownership coding, HQ country, evidence links, and merged name variants" },
      { name: "summary.json", desc: "Headline aggregates with the counting rule and caveats" },
    ],
    download: "Download",
  },
  footer: {
    line: "An open-source civic project. Not affiliated with the Government of Canada.",
    sources: "Sources: Canadian Press reporting (May 13, 2026); parliamentary Order Paper written-question responses; CanadaBuys award notices; the Wire Report (Oct 1, 2026).",
  },
};

export type Dict = typeof en;

const fr: Dict = {
  banner: {
    line: "Un projet civique à code source ouvert. Sans affiliation avec le gouvernement du Canada.",
    badge: "Code source ouvert",
    repo: "Dépôt GitHub",
  },
  nav: {
    receipt: "Le reçu",
    explorer: "Fournisseurs",
    methodology: "Méthodologie",
    developers: "Développeurs",
    data: "Données",
    back: "Tous les projets",
  },
  hero: {
    kicker: "Open Nshipyard · Dépenses fédérales en IA",
    title: "Où est allé l'argent de l'IA à Ottawa.",
    sub: "Ottawa a dépensé plus de 800 M$ en IA depuis 2023, d'abonnements ChatGPT à un contrat de paie de 350 M$. La Presse canadienne a publié le total; personne n'a compilé la liste des fournisseurs. Ce projet relie chaque contrat vérifiable à son véritable propriétaire, canadien ou étranger, et dit exactement ce qu'il ne peut pas montrer.",
    cta1: "Voir le reçu",
    cta2: "Lire la méthodologie",
  },
  stats: [
    { value: "", label: "de contrats et d'investissements fédéraux en IA suivis, 2023-2026 (le total de 800 M$+ est le contexte; ceci est la portion vérifiable)" },
    { value: "", label: "des dollars suivis vers des fournisseurs canadiens" },
    { value: "", label: "des dollars suivis vers des fournisseurs étrangers" },
    { value: "", label: "contrats vérifiables compilés à partir des réponses aux questions inscrites, d'AchatsCanada et de la presse" },
  ],
  receipt: {
    kicker: "Le reçu",
    title: "Chaque fournisseur, une carte.",
    body: "Chaque bloc est un fournisseur, dimensionné en dollars, coloré selon son véritable propriétaire. Le contrat de paie de 350 M$ de Dayforce et l'investissement de 240 M$ dans Cohere dominent; la longue traîne est là où la Politique d'achat canadien est mise à l'épreuve.",
    treemapLabel: "Carte des dépenses fédérales en IA par fournisseur, colorée selon la propriété",
    legendCanadian: "Propriété canadienne",
    legendForeign: "Propriété étrangère",
    legendUncertain: "Propriété incertaine",
    tailCanadian: "petits fournisseurs canadiens",
    tailForeign: "petits fournisseurs étrangers",
    tailUncertain: "petits fournisseurs, propriété incertaine",
    topTitle: "Principaux fournisseurs par dollars suivis",
    topSub: "Propriété canadienne en rouge, étrangère en encre. Le pays du siège social est le siège légal, pas l'adresse de facturation du contrat.",
    contractsWord: "contrats",
    procuraKicker: "Le cas d'ancrage",
    procuraTitle: "1,2 M$, trois firmes américaines, listées comme basées à Ottawa.",
    procuraBody: "Le robot conversationnel Procura de SPAC reposait sur cinq contrats : Teksystems à 609 761 $, Infosys Public Services à 145 218 $ et PwC à 248 529 $, tous listés comme basés à Ottawa dans la réponse à la question écrite Q-1229. SPAC a ensuite précisé que deux firmes ont une adresse enregistrée à Ottawa et que celle de PwC est à Toronto. The Wire Report, 1er oct. 2026.",
    procuraLink: "Lire l'enquête",
    policyNote: "La Politique d'achat canadien est entrée en vigueur en décembre 2025. Voici ce qu'a fait l'argent.",
    caveatsKicker: "Ce que ceci ne montre pas",
    caveatsTitle: "Lisez ceci avant de partager le graphique.",
    caveats: [
      "Il s'agit d'un échantillon compilé de contrats vérifiables, et non du total de 800 M$+. Il couvre la portion du total qui a pu être vérifiée à partir de sources publiques au moment de la construction. Le chiffre de 800 M$+ vient lui-même de la Presse canadienne, 13 mai 2026.",
      "L'élément de 240 M$ pour Cohere est un investissement stratégique dans une entreprise canadienne, pas un contrat d'approvisionnement. Les totaux sont présentés des deux façons : combinés pour le portrait complet, et approvisionnement seulement pour tester la Politique d'achat canadien contre les attributions réelles.",
      "Le CST et le SCRS ont refusé la demande d'information du député; la GRC n'avait pas de données centralisées. La répartition par fournisseur hérite de cette lacune, et tout contrat signé par ces organismes manque à la fois au total et à ce reçu.",
      "Le codage de la propriété des fournisseurs repose largement sur le jugement. Chaque codage est lié à sa preuve; les fournisseurs au statut incertain sont présentés séparément et exclus des parts canadienne et étrangère.",
      "Cohere a utilisé l'investissement fédéral pour confier à l'américaine CoreWeave la construction et l'exploitation de son centre de données canadien (The Wire Report). La propriété canadienne du fournisseur ne signifie pas que chaque dollar est resté au Canada.",
    ],
  },
  explorer: {
    kicker: "Fournisseurs",
    title: "Recherchez chaque fournisseur.",
    search: "Rechercher par nom de fournisseur…",
    showing: "Affichage de",
    of: "sur",
    noResult: "Aucun fournisseur ne correspond.",
    empty: "Recherchez par nom de fournisseur ci-dessus pour parcourir le fichier canonique. Chaque fournisseur porte son codage de propriété, son pays de siège et le lien de preuve derrière le codage.",
    spend: "Dépenses suivies",
    contracts: "contrats",
    departments: "Ministères",
    variants: "variantes de nom fusionnées",
    hq: "Siège",
    evidence: "preuve de propriété",
    vendorId: "ID fournisseur",
    back: "Retour aux résultats",
    contractsTitle: "Contrats",
    department: "Ministère",
    year: "Exercice",
    kind: "Type",
    source: "Source",
    procurement: "Approvisionnement",
    investment: "Investissement",
  },
  methodology: {
    kicker: "Méthodologie",
    title: "Comment le reçu a été construit, et où il est faible.",
    items: [
      "Sources : le total de la Presse canadienne (13 mai 2026, issu de la question écrite du député Jagsharan Singh Mahal à tous les ministères, organismes et sociétés d'État); les réponses aux questions écrites inscrites au Feuilleton; les avis d'attribution d'AchatsCanada; et l'enquête Q-1229 de The Wire Report (1er oct. 2026). Chaque ligne de contrat cite son URL source.",
      "La résolution d'entités est déterministe et documentée : les noms sont mis en majuscules, la ponctuation retirée, les suffixes juridiques (Ltd, Inc, Corp et autres) supprimés, puis appariés à l'identique sur la clé normalisée. Les variantes en texte libre des tableaux du Feuilleton fusionnent en un fournisseur canonique; la table de fusion est livrée dans vendors.csv.",
      "Codage de la propriété : chaque fournisseur canonique est codé propriété canadienne, étrangère ou incertaine selon son siège ultime, avec un lien de preuve public par fournisseur. Les adresses de facturation enregistrées sur les contrats ne sont pas la propriété; le cas Procura explique pourquoi la distinction compte.",
      "La règle de comptage : l'élément de 240 M$ pour Cohere est un investissement, pas un contrat d'approvisionnement. Le site présente le total combiné et le total approvisionnement seulement côte à côte, pour que le test de la Politique d'achat canadien n'utilise que les attributions.",
      "Les montants sont des valeurs d'attribution ou annoncées telles que publiées, pas des paiements finaux audités. Les contrats pluriannuels apparaissent en entier l'année d'attribution.",
      "Couverture : il s'agit de la portion vérifiable du total de 800 M$+, compilée à partir de sources publiques au moment de la construction. C'est un plancher, pas un recensement. Tout contrat d'IA absent d'une réponse ou d'un avis public manque, y compris tout ce qui relève du CST, du SCRS et de la GRC.",
      "Les fournisseurs à propriété incertaine sont listés séparément avec leurs dollars, et exclus des deux parts. La table des fournisseurs est versionnée; les nouvelles réponses au Feuilleton la mettront à jour.",
    ],
  },
  developers: {
    kicker: "Pour les développeurs",
    title: "Interrogez-la depuis du code, ou depuis un agent.",
    body: "Trois façons de consommer les mêmes données canoniques. REST pour les applications, OpenAPI pour l'intégration, outils MCP en HTTP continu pour les agents IA.",
    endpoints: "Points de terminaison",
    tryIt: "Essayer",
    openapi: "Spécification OpenAPI",
    mcpTitle: "Serveur MCP",
    mcpBody: "Un point de terminaison HTTP continu. Outils : vendor_lookup, vendor_search, contracts_list, spend_summary.",
  },
  mcp: {
    kicker: "Connectez votre agent",
    title: "Exploitez ces données dans vos outils d'IA.",
    body: "Choisissez votre plateforme, copiez l'invite, envoyez-la à votre agent. Votre agent exécute la configuration lui-même.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Autre" },
    cardTitle: "Copiez et envoyez ceci à {tab}",
    copy: "Copier",
    copied: "Copié",
    chatgptNote: "ChatGPT se connecte via l'API REST documentée plutôt que directement en MCP.",
    pChatgpt:
      "Je veux utiliser {displayName} via son API.\n- Spécification OpenAPI : {origin}/api/openapi.json\n- Base REST : {origin}/api/v1\nD'abord, dis-moi en deux phrases ce que cette API offre, puis {exampleLower}, et montre-moi le résultat.",
    pClaude:
      "Dans Claude (claude.ai), ouvre les paramètres, puis Connecteurs, et ajoute un connecteur personnalisé :\n- Nom : {displayName}\n- URL : {origin}/mcp\nEnsuite, liste les outils disponibles, {exampleLower}, et montre-moi le résultat.",
    pClaudeCode:
      "Configure le serveur MCP {displayName} pour que je puisse l'interroger d'ici.\n1. Exécute : claude mcp add --transport http {slug} {origin}/mcp\n2. Exécute `claude mcp list` pour confirmer la connexion.\n3. {example}, et montre-moi le résultat.",
    pCli:
      "# Point de terminaison MCP (HTTP continu)\n{origin}/mcp\n\n# Lister les outils disponibles\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Tout le reste",
    otherBody: "Toute plateforme qui parle MCP en HTTP continu, ou REST tout court.",
    mcpEndpoint: "Point de terminaison MCP",
    openapiSpec: "Spécification OpenAPI",
    restBase: "Base REST",
  },
  downloads: {
    kicker: "Données",
    title: "Prenez les fichiers.",
    body: "La liste des contrats, la table canonique des fournisseurs avec codage de propriété, et le résumé des agrégats, sous licence MIT.",
    files: [
      { name: "contracts.csv", desc: "Liste contrat par contrat avec ID fournisseur, URL sources et drapeaux approvisionnement/investissement" },
      { name: "vendors.csv", desc: "Fournisseurs canoniques avec codage de propriété, pays du siège, liens de preuve et variantes de nom fusionnées" },
      { name: "summary.json", desc: "Agrégats principaux avec la règle de comptage et les mises en garde" },
    ],
    download: "Télécharger",
  },
  footer: {
    line: "Un projet civique à code source ouvert. Sans affiliation avec le gouvernement du Canada.",
    sources: "Sources : reportage de la Presse canadienne (13 mai 2026); réponses aux questions écrites inscrites au Feuilleton; avis d'attribution d'AchatsCanada; The Wire Report (1er oct. 2026).",
  },
};

const dicts: Record<Lang, Dict> = { en, fr };

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "en",
  setLang: () => {},
  t: en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t: dicts[lang] }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
