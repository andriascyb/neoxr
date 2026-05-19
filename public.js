function escapeAttr(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getPublicDocs(appConfig, options = {}) {
    const serverName = (appConfig && appConfig.server_name) ? String(appConfig.server_name) : 'RFPDev';
    const baseUrl = String((options && options.baseUrl) || (appConfig && appConfig.public_base_url) || '').replace(/\/+$/, '');
    const pageTitle = `API Cek Nama Bank & Cek Nama E-Wallet Indonesia - ${serverName}`;
    const pageDescription = `Platform API untuk cek nama bank, cek ID bank, cek nama ewallet, cek ID ewallet (DANA, OVO, GoPay), serta endpoint validasi bisnis real-time.`;
    const canonicalUrl = baseUrl ? `${baseUrl}/` : '/';
    const ogImageUrl = '';
    const seoKeywordList = [
        'cek id ewallet',
        'cek nama ewallet',
        'cek id dana',
        'cek id ovo',
        'cek id gopay',
        'api cek nama ewallet',
        'api cek id ewallet',
        'cek nama bank',
        'cek id bank',
        'cek nama rekening',
        'api cek nama bank',
        'api cek id bank',
        'api cek nama rekening',
        'api cek rekening bank',
        'rest api cek rekening',
        'validasi rekening bank',
        'validasi akun ewallet',
        'api validasi identitas finansial',
        'api ewallet indonesia',
        'cek rekening online indonesia',
        'api foto editor',
        'api generate image indonesia'
    ];
    const seoKeywords = seoKeywordList.join(', ');
    const faqItems = [
        {
            q: 'Apa itu API cek nama bank?',
            a: 'API cek nama bank adalah endpoint untuk memvalidasi kecocokan nama pemilik dari nomor rekening dan kode bank secara otomatis.'
        },
        {
            q: 'Apakah bisa cek ID ewallet dan cek nama ewallet?',
            a: 'Bisa. Endpoint ewallet mendukung cek ID ewallet dan pengambilan nama akun ewallet yang valid pada provider yang tersedia.'
        },
        {
            q: 'Apa beda cek ID bank dan cek nama bank?',
            a: 'Cek ID bank berfokus pada identifikasi kode bank, sedangkan cek nama bank atau cek nama rekening berfokus pada verifikasi nama pemilik rekening.'
        },
        {
            q: 'Apakah tersedia API cek nama ewallet untuk integrasi aplikasi?',
            a: 'Tersedia. Dokumentasi public menyediakan endpoint, parameter, dan contoh response agar mudah diintegrasikan ke sistem Anda.'
        },
        {
            q: 'Apakah endpoint cocok untuk volume request tinggi?',
            a: 'Ya. Arsitektur endpoint dirancang untuk integrasi bisnis dengan pola request terstruktur dan monitoring status layanan.'
        },
        {
            q: 'Apa itu Public Trial dan apakah gratis?',
            a: 'Public Trial adalah mode uji cepat untuk mencoba endpoint. Trial dipakai untuk testing awal, dengan limit tertentu sesuai kebijakan sistem yang aktif.'
        },
        {
            q: 'Bagaimana sistem Premium harga per hit?',
            a: 'Pada mode premium/member, biaya dihitung per hit sukses sesuai jenis layanan (bank, ewallet, WhatsApp, NIK, BPJS, PLN, games, dan Foto Editor). Nilai harga per hit mengikuti konfigurasi aktif di dashboard admin.'
        },
        {
            q: 'Kapan saldo terpotong dan bagaimana konsumsi hit dihitung?',
            a: 'Konsumsi hit dihitung saat request berhasil diproses sesuai aturan layanan. Jika request gagal/invalid, perlakuannya mengikuti kebijakan sistem aktif (termasuk kebijakan hit tidak valid jika diaktifkan admin).'
        },
        {
            q: 'Bagaimana cara cek sisa saldo dan riwayat penggunaan hit?',
            a: 'Member dapat login ke portal untuk melihat saldo saat ini, statistik penggunaan, dan riwayat request. Data ini membantu memantau performa integrasi dan biaya operasional API.'
        }
    ];
    const structuredData = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": serverName,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "url": canonicalUrl || undefined,
        "description": pageDescription,
        "inLanguage": "id-ID",
        "offers": {
            "@type": "Offer",
            "availability": "https://schema.org/InStock",
            "priceCurrency": "IDR"
        },
        "featureList": [
            "REST API cek rekening bank",
            "API cek ID E-Wallet",
            "Validasi NIK",
            "Cek tagihan BPJS",
            "Cek tagihan PLN",
            "Validasi WhatsApp",
            "Validasi ID game",
            "Foto editor image processing"
        ]
    }).replace(/</g, "\\u003c");
    const websiteData = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": `${serverName} API Docs`,
        "url": canonicalUrl || undefined,
        "inLanguage": "id-ID",
        "description": pageDescription
    }).replace(/</g, "\\u003c");
    const breadcrumbData = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": canonicalUrl },
            { "@type": "ListItem", "position": 2, "name": "Docs", "item": baseUrl ? `${baseUrl}/docs` : '/docs' }
        ]
    }).replace(/</g, "\\u003c");
    const faqStructuredData = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map((item) => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.a
            }
        }))
    }).replace(/</g, "\\u003c");

    return `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>${escapeAttr(pageTitle)}</title>
    <meta name="description" content="${escapeAttr(pageDescription)}">
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
    <meta name="keywords" content="${escapeAttr(seoKeywords)}">
    <meta name="author" content="${escapeAttr(serverName)}">
    <meta name="application-name" content="${escapeAttr(serverName)}">
    <meta name="theme-color" content="#3b82f6">
    <link rel="canonical" href="${escapeAttr(canonicalUrl)}">
    <link rel="alternate" hrefLang="id-ID" href="${escapeAttr(canonicalUrl)}">
    <link rel="alternate" hrefLang="x-default" href="${escapeAttr(canonicalUrl)}">
    <meta property="og:locale" content="id_ID">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeAttr(pageTitle)}">
    <meta property="og:description" content="${escapeAttr(pageDescription)}">
    <meta property="og:url" content="${escapeAttr(canonicalUrl)}">
    <meta property="og:site_name" content="${escapeAttr(serverName)}">
    ${ogImageUrl ? `<meta property="og:image" content="${escapeAttr(ogImageUrl)}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeAttr(pageTitle)}">
    <meta name="twitter:description" content="${escapeAttr(pageDescription)}">
    ${ogImageUrl ? `<meta name="twitter:image" content="${escapeAttr(ogImageUrl)}">` : ''}
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=JetBrains+Mono&amp;display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet" />
    <script id="tailwind-config">
                tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "var(--primary)",
                        "primary-container": "var(--primary-container)",
                        "on-primary": "var(--on-primary)",
                        "surface": "var(--surface)",
                        "surface-container-low": "var(--surface-container-low)",
                        "on-surface": "var(--on-surface)",
                        "on-surface-variant": "var(--on-surface-variant)",
                        "outline-variant": "var(--outline-variant)",
                        "background": "var(--background)",
                        "tertiary": "#10b981",
                        "error": "#ef4444"
                    },
                    fontFamily: {
                        "headline": ["Plus Jakarta Sans"],
                        "body": ["Inter"],
                        "mono": ["JetBrains Mono"]
                    }
                },
            },
        }
    </script>
    <style>
        :root {
            --primary: #3b82f6;
            --primary-container: #4d8eff;
            --on-primary: #ffffff;
            --surface: #ffffff;
            --surface-container-low: #f1f5f9;
            --on-surface: #0f172a;
            --on-surface-variant: #475569;
            --outline-variant: #cbd5e1;
            --background: #f8fafc;
        }
        .dark {
            --primary: #adc6ff;
            --primary-container: #4d8eff;
            --on-primary: #002e6a;
            --surface: #171b22;
            --surface-container-low: #1f2530;
            --on-surface: #e2e2e8;
            --on-surface-variant: #c2c6d6;
            --outline-variant: #424754;
            --background: #111318;
        }
        body { background-color: var(--background); color: var(--on-surface); }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .glass-panel { background: rgba(255, 255, 255, 0.82); border: 1px solid rgba(148, 163, 184, 0.22); backdrop-filter: blur(20px); }
        .dark .glass-panel { background: rgba(20, 24, 32, 0.72); border-color: rgba(148, 163, 184, 0.16); }
        .gradient-text {
            background: linear-gradient(135deg, var(--primary) 0%, #60a5fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .card-active { border-color: var(--primary) !important; background: rgba(59, 130, 246, 0.05) !important; box-shadow: 0 0 30px rgba(59, 130, 246, 0.1); }
        .dark .card-active { background: rgba(173, 198, 255, 0.1) !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .service-card { min-height: 220px; }
        .service-card .svc-icon { width: 2.75rem; height: 2.75rem; }
        .service-card .svc-title { font-size: 1.6rem; line-height: 1.2; }
        .service-card .svc-copy { font-size: .875rem; line-height: 1.55; }
        .service-off {
            opacity: .62;
            filter: grayscale(.12);
            cursor: not-allowed !important;
            pointer-events: none;
        }
        .service-off .svc-title,
        .service-off .svc-copy { color: #64748b !important; }
        .service-tab.service-off {
            opacity: .55;
            cursor: not-allowed !important;
        }
        .service-tab .maintenance-inline {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: 4px;
            color: #d97706;
            vertical-align: middle;
        }
        .dark .service-tab .maintenance-inline {
            color: #fbbf24;
        }
        .maintenance-chip {
            position: absolute;
            right: 10px;
            top: 10px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .04em;
            padding: 4px 8px;
            border-radius: 999px;
            border: 1px solid rgba(245, 158, 11, .35);
            background: rgba(245, 158, 11, .14);
            color: #b45309;
            text-transform: uppercase;
            z-index: 2;
        }
        .dark .maintenance-chip {
            border-color: rgba(251, 191, 36, .45);
            background: rgba(251, 191, 36, .16);
            color: #fbbf24;
        }
        @media (max-width: 767px) {
            .service-card { min-height: 0; }
            .service-card .svc-title { font-size: 1.4rem; }
            .service-card .svc-copy { font-size: .82rem; }
        }
    </style>
    <script type="application/ld+json">${structuredData}</script>
    <script type="application/ld+json">${websiteData}</script>
    <script type="application/ld+json">${breadcrumbData}</script>
    <script type="application/ld+json">${faqStructuredData}</script>
</head>
<body class="bg-background text-on-surface font-body selection:bg-primary/30 selection:text-primary transition-colors duration-300">
    <!-- TopNavBar -->
    <header class="bg-white/90 dark:bg-[#111318]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/20 top-0 sticky z-50 transition-colors duration-300">
        <nav class="flex items-center justify-between gap-3 w-full px-4 md:px-12 py-4 md:py-5 max-w-[1920px] mx-auto">
            <div class="flex items-center gap-12">
                <span class="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tighter font-headline">${serverName} Engine</span>
                <div class="hidden md:flex items-center gap-8">
                    <a class="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-slate-100 font-medium px-2 py-1 transition-colors font-headline" href="#docs">Docs</a>
                    <a class="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-slate-100 font-medium px-2 py-1 transition-colors font-headline" href="#playground">Playground</a>
                    <a class="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-slate-100 font-medium px-2 py-1 transition-colors font-headline" href="#faq">FAQ</a>
                    
                    <a class="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-slate-100 font-medium px-2 py-1 transition-colors font-headline" href="/member/register">Member</a>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <button onclick="toggleTheme()" class="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-primary transition-all flex items-center justify-center border border-slate-200 dark:border-white/10" id="theme-toggle">
                    <span class="material-symbols-outlined" id="theme-toggle-icon">light_mode</span>
                </button>
                <a href="/member/login" class="inline-flex items-center justify-center bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-lg shadow-amber-400/30 border border-amber-300/70 whitespace-nowrap">Login Member</a>
                <a href="https://t.me/xyz_yaz" target="_blank" class="bg-gradient-to-br from-primary to-primary-container text-white dark:text-on-primary font-bold px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm transition-transform active:scale-95 shadow-lg shadow-primary/20 whitespace-nowrap">Hubungi Admin</a>
            </div>
        </nav>
    </header>

    <main>
        <!-- Hero Section -->
        <section class="relative pt-24 pb-16 px-6 md:px-12 max-w-[1920px] mx-auto overflow-hidden bg-white dark:bg-surface transition-colors duration-300">
            <div class="relative z-10 max-w-4xl">
                <span class="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-6">Infrastruktur REST API Cek Rekening</span>
                <h1 class="text-5xl md:text-7xl font-headline font-extrabold tracking-tight mb-8 leading-[1.1] text-slate-900 dark:text-white">
                    API <span class="gradient-text">Cek Nama Bank</span> & Cek ID E-Wallet
                </h1>
                <p class="text-lg md:text-xl text-slate-600 dark:text-on-surface-variant max-w-2xl leading-relaxed mb-10">
                    Otomatiskan verifikasi identitas finansial Anda. Layanan cek nama bank, cek ID bank, cek nama ewallet, dan API cek ID ewallet (DANA, GoPay, OVO) siap untuk integrasi bisnis.
                </p>
                <div class="flex flex-wrap gap-4">
                    <a href="#playground" class="bg-gradient-to-br from-primary to-primary-container text-white dark:text-on-primary font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-primary/20">Coba Sekarang</a>
                    <a href="/member/register" class="border border-slate-200 dark:border-outline-variant/30 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/5 font-bold px-8 py-4 rounded-xl transition-all">Daftar Member</a>
                    <a href="#docs" class="border border-slate-200 dark:border-outline-variant/30 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/5 font-bold px-8 py-4 rounded-xl transition-all">Dokumentasi</a>
                </div>
            </div>
            <!-- Decorative Element -->
            <div class="absolute top-0 right-0 -z-10 w-1/2 h-full opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/40 via-transparent to-transparent">
            </div>
        </section>

        <!-- Services Bento Grid -->
        <section class="py-16 md:py-18 px-6 md:px-12 max-w-[1920px] mx-auto bg-slate-50 dark:bg-surface-container-low border-t border-slate-100 dark:border-white/5 transition-colors duration-300">
            <div class="mb-10">
                <h2 class="text-2xl md:text-3xl font-headline font-bold mb-3 text-slate-900 dark:text-white">Solusi Validasi Identitas</h2>
                <p class="text-slate-600 dark:text-on-surface-variant italic">Dari cek nama rekening instan hingga API cek ID eWallet premium.</p>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
                <!-- Bank Account -->
                <button onclick="selectType('bank')" id="card-bank" class="type-card service-card group p-4 md:p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-outline-variant/10 hover:border-primary/30 transition-all text-left shadow-sm hover:shadow-lg dark:shadow-none">
                    <div class="svc-icon flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#282a2e] text-primary mb-4 group-hover:bg-primary group-hover:text-white dark:group-hover:text-on-primary transition-colors">
                        <span class="material-symbols-outlined text-[1.35rem]">account_balance</span>
                    </div>
                    <h3 class="svc-title text-base md:text-lg font-headline font-bold mb-2 text-slate-900 dark:text-white">Cek Rekening Bank</h3>
                    <p class="svc-copy text-slate-600 dark:text-on-surface-variant leading-relaxed">REST API cek nama rekening bank nasional dengan presisi tinggi.</p>
                </button>
                <!-- E-Wallet -->
                <button onclick="selectType('ewallet')" id="card-ewallet" class="type-card service-card group p-4 md:p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-outline-variant/10 hover:border-primary/30 transition-all text-left shadow-sm hover:shadow-lg dark:shadow-none">
                    <div class="svc-icon flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#282a2e] text-primary mb-4 group-hover:bg-primary group-hover:text-white dark:group-hover:text-on-primary transition-colors">
                        <span class="material-symbols-outlined text-[1.35rem]">account_balance_wallet</span>
                    </div>
                    <h3 class="svc-title text-base md:text-lg font-headline font-bold mb-2 text-slate-900 dark:text-white">API Cek ID E-Wallet</h3>
                    <p class="svc-copy text-slate-600 dark:text-on-surface-variant leading-relaxed">Cek ID DANA, GoPay, OVO, dan eWallet lain secara instan.</p>
                </button>
                <!-- WhatsApp -->
                <button onclick="selectType('whatsapp')" id="card-whatsapp" class="type-card service-card group p-4 md:p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-outline-variant/10 hover:border-primary/30 transition-all text-left shadow-sm hover:shadow-lg dark:shadow-none">
                    <div class="svc-icon flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#282a2e] text-primary mb-4 group-hover:bg-primary group-hover:text-white dark:group-hover:text-on-primary transition-colors">
                        <span class="material-symbols-outlined text-[1.35rem]">chat</span>
                    </div>
                    <h3 class="svc-title text-base md:text-lg font-headline font-bold mb-2 text-slate-900 dark:text-white">WhatsApp</h3>
                    <p class="svc-copy text-slate-600 dark:text-on-surface-variant leading-relaxed">Verifikasi status akun WhatsApp dengan cepat.</p>
                </button>
                <!-- NIK -->
                <button onclick="selectType('nik')" id="card-nik" class="type-card service-card group p-4 md:p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-outline-variant/10 hover:border-primary/30 transition-all text-left shadow-sm hover:shadow-lg dark:shadow-none">
                    <div class="svc-icon flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#282a2e] text-primary mb-4 group-hover:bg-primary group-hover:text-white dark:group-hover:text-on-primary transition-colors">
                        <span class="material-symbols-outlined text-[1.35rem]">badge</span>
                    </div>
                    <h3 class="svc-title text-base md:text-lg font-headline font-bold mb-2 text-slate-900 dark:text-white">NIK / Identity</h3>
                    <p class="svc-copy text-slate-600 dark:text-on-surface-variant leading-relaxed">Validasi identitas berbasis data NIK.</p>
                </button>
                <!-- Games -->
                <button onclick="selectType('games')" id="card-games" class="type-card service-card group p-4 md:p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-outline-variant/10 hover:border-primary/30 transition-all text-left shadow-sm hover:shadow-lg dark:shadow-none">
                    <div class="svc-icon flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#282a2e] text-primary mb-4 group-hover:bg-primary group-hover:text-white dark:group-hover:text-on-primary transition-colors">
                        <span class="material-symbols-outlined text-[1.35rem]">sports_esports</span>
                    </div>
                    <h3 class="svc-title text-base md:text-lg font-headline font-bold mb-2 text-slate-900 dark:text-white">Validasi ID Game</h3>
                    <p class="svc-copy text-slate-600 dark:text-on-surface-variant leading-relaxed">Cek nickname & info akun game populer.</p>
                </button>
                <!-- BPJS -->
                <button onclick="selectType('bpjs')" id="card-bpjs" class="type-card service-card group p-4 md:p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-outline-variant/10 hover:border-primary/30 transition-all text-left shadow-sm hover:shadow-lg dark:shadow-none">
                    <div class="svc-icon flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#282a2e] text-primary mb-4 group-hover:bg-primary group-hover:text-white dark:group-hover:text-on-primary transition-colors">
                        <span class="material-symbols-outlined text-[1.35rem]">health_and_safety</span>
                    </div>
                    <h3 class="svc-title text-base md:text-lg font-headline font-bold mb-2 text-slate-900 dark:text-white">Tagihan BPJS</h3>
                    <p class="svc-copy text-slate-600 dark:text-on-surface-variant leading-relaxed">Cek detail tagihan BPJS per nomor pelanggan.</p>
                </button>
                <!-- PLN -->
                <button onclick="selectType('pln')" id="card-pln" class="type-card service-card group p-4 md:p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-outline-variant/10 hover:border-primary/30 transition-all text-left shadow-sm hover:shadow-lg dark:shadow-none">
                    <div class="svc-icon flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#282a2e] text-primary mb-4 group-hover:bg-primary group-hover:text-white dark:group-hover:text-on-primary transition-colors">
                        <span class="material-symbols-outlined text-[1.35rem]">bolt</span>
                    </div>
                    <h3 class="svc-title text-base md:text-lg font-headline font-bold mb-2 text-slate-900 dark:text-white">Tagihan PLN</h3>
                    <p class="svc-copy text-slate-600 dark:text-on-surface-variant leading-relaxed">Cek tarif/daya dan total tagihan PLN.</p>
                </button>
                <!-- AI -->
                <button onclick="selectType('ai')" id="card-ai" class="type-card service-card group p-4 md:p-5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-outline-variant/10 hover:border-primary/30 transition-all text-left shadow-sm hover:shadow-lg dark:shadow-none">
                    <div class="svc-icon flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#282a2e] text-primary mb-4 group-hover:bg-primary group-hover:text-white dark:group-hover:text-on-primary transition-colors">
                        <span class="material-symbols-outlined text-[1.35rem]">auto_awesome</span>
                    </div>
                    <h3 class="svc-title text-base md:text-lg font-headline font-bold mb-2 text-slate-900 dark:text-white">Foto Editor</h3>
                    <p class="svc-copy text-slate-600 dark:text-on-surface-variant leading-relaxed">Edit foto dari URL/upload + prompt teks melalui endpoint Foto Editor.</p>
                </button>
            </div>
        </section>

        <!-- Playground Section -->
        <section id="playground" class="py-24 px-6 md:px-12 max-w-[1920px] mx-auto border-t border-slate-100 dark:border-white/5 bg-white dark:bg-surface transition-colors duration-300">
            <div class="flex flex-col lg:flex-row gap-16">
                <!-- Left: Control Panel -->
                <div class="flex-1">
                    <div class="mb-10">
                        <h2 class="text-4xl font-headline font-extrabold mb-4 tracking-tight text-slate-900 dark:text-white">Interactive <span class="text-primary">Playground</span></h2>
                        <p class="text-slate-600 dark:text-on-surface-variant">Uji endpoint validasi kami secara real-time. Konfigurasi parameter dan lihat hasil langsung.</p>
                    </div>
                    <form onsubmit="runTest(event)" class="space-y-8 max-w-xl">
                        <!-- Service Tabs -->
                        <div class="space-y-3">
                            <label class="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant mb-3">Pilih Jenis Layanan</label>
                            <div class="flex flex-wrap gap-2">
                                <button type="button" onclick="selectType('bank')" id="tab-bank" class="service-tab px-4 py-2.5 rounded-xl border border-slate-200 dark:border-outline-variant/20 bg-slate-50 dark:bg-[#0c0e12] text-xs font-bold text-slate-600 dark:text-on-surface-variant hover:border-primary/50 transition-all flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm">account_balance</span> Bank
                                </button>
                                <button type="button" onclick="selectType('ewallet')" id="tab-ewallet" class="service-tab px-4 py-2.5 rounded-xl border border-slate-200 dark:border-outline-variant/20 bg-slate-50 dark:bg-[#0c0e12] text-xs font-bold text-slate-600 dark:text-on-surface-variant hover:border-primary/50 transition-all flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm">account_balance_wallet</span> E-Wallet
                                </button>
                                <button type="button" onclick="selectType('whatsapp')" id="tab-whatsapp" class="service-tab px-4 py-2.5 rounded-xl border border-slate-200 dark:border-outline-variant/20 bg-slate-50 dark:bg-[#0c0e12] text-xs font-bold text-slate-600 dark:text-on-surface-variant hover:border-primary/50 transition-all flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm">chat</span> WhatsApp
                                </button>
                                <button type="button" onclick="selectType('nik')" id="tab-nik" class="service-tab px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-slate-50 dark:bg-[#0c0e12] text-xs font-bold text-slate-600 dark:text-on-surface-variant hover:border-primary/50 transition-all flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm">badge</span> NIK
                                </button>
                                <button type="button" onclick="selectType('games')" id="tab-games" class="service-tab px-4 py-2.5 rounded-xl border border-slate-200 dark:border-outline-variant/20 bg-slate-50 dark:bg-[#0c0e12] text-xs font-bold text-slate-600 dark:text-on-surface-variant hover:border-primary/50 transition-all flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm">sports_esports</span> Games
                                </button>
                                <button type="button" onclick="selectType('bpjs')" id="tab-bpjs" class="service-tab px-4 py-2.5 rounded-xl border border-slate-200 dark:border-outline-variant/20 bg-slate-50 dark:bg-[#0c0e12] text-xs font-bold text-slate-600 dark:text-on-surface-variant hover:border-primary/50 transition-all flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm">health_and_safety</span> BPJS
                                </button>
                                <button type="button" onclick="selectType('pln')" id="tab-pln" class="service-tab px-4 py-2.5 rounded-xl border border-slate-200 dark:border-outline-variant/20 bg-slate-50 dark:bg-[#0c0e12] text-xs font-bold text-slate-600 dark:text-on-surface-variant hover:border-primary/50 transition-all flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm">bolt</span> PLN
                                </button>
                                <button type="button" onclick="selectType('ai')" id="tab-ai" class="service-tab px-4 py-2.5 rounded-xl border border-slate-200 dark:border-outline-variant/20 bg-slate-50 dark:bg-[#0c0e12] text-xs font-bold text-slate-600 dark:text-on-surface-variant hover:border-primary/50 transition-all flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm">auto_awesome</span> Foto Editor
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant mb-3">API Key <span class="lowercase font-normal opacity-60 ml-1">(opsional)</span></label>
                            <div class="relative">
                                <input id="test-key" class="w-full bg-slate-50 dark:bg-[#0c0e12] border border-slate-200 dark:border-outline-variant/20 rounded-xl px-5 py-4 text-slate-900 dark:text-on-surface focus:ring-2 focus:ring-primary/40 font-mono text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" type="password" placeholder="sk_test_••••••••••••••••" />
                                <span class="absolute right-4 top-4 text-primary cursor-pointer hover:text-primary-container transition-colors" onclick="togglePasswordVisibility('test-key')">
                                    <span class="material-symbols-outlined" id="eye-icon-test-key">visibility_off</span>
                                </span>
                            </div>
                            <div id="apikey-check-pill" class="hidden mt-3 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium">
                                <span id="apikey-check-text" class="text-slate-600 dark:text-slate-300"></span>
                            </div>
                            <button type="button" onclick="checkApiKey()" class="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-2">
                                <span class="material-symbols-outlined text-sm">key</span> Cek Validasi API Key
                            </button>
                        </div>

                        <div id="extra-fields" class="space-y-8">
                            <!-- Dynamic fields (Bank Code etc) -->
                        </div>

                        <div id="ai-url-wrap">
                            <label id="label-number" class="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant mb-3">Target Number / Account</label>
                            <input id="test-number" required class="w-full bg-slate-50 dark:bg-[#0c0e12] border border-slate-200 dark:border-outline-variant/20 rounded-xl px-5 py-4 text-slate-900 dark:text-on-surface focus:ring-2 focus:ring-primary/40 font-mono text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="e.g. 7012344567" type="text" />
                        </div>
                        <div id="ai-upload-wrap" class="hidden">
                            <div id="ai-input-mode-wrap" class="mb-3 hidden">
                                <label class="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant mb-2">Pilih Sumber Gambar</label>
                                <div class="flex gap-2">
                                    <button type="button" id="ai-mode-url" onclick="setAiInputMode('url')" class="px-3 py-2 rounded-lg text-xs font-bold border border-primary bg-primary/10 text-primary">URL</button>
                                    <button type="button" id="ai-mode-upload" onclick="setAiInputMode('upload')" class="px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-outline-variant/20 text-slate-600 dark:text-on-surface-variant">Upload File</button>
                                </div>
                            </div>
                            <label class="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant mb-3">Upload Foto (opsional, JPG/JPEG/PNG max 4MB)</label>
                            <input id="ai-file-input" accept=".jpg,.jpeg,.png,image/jpeg,image/png" class="w-full bg-slate-50 dark:bg-[#0c0e12] border border-slate-200 dark:border-outline-variant/20 rounded-xl px-4 py-3 text-slate-900 dark:text-on-surface text-sm" type="file" />
                            <div class="text-[11px] text-slate-500 dark:text-on-surface-variant mt-2">Jika upload dipakai, file sementara otomatis terhapus dalam 30 detik.</div>
                        </div>

                        <button id="btn-test" type="submit" class="w-full bg-gradient-to-br from-primary to-primary-container text-white dark:text-on-primary font-bold py-5 rounded-xl transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98]">
                            <span class="material-symbols-outlined">bolt</span>
                            Jalankan Validasi
                        </button>
                    </form>
                </div>

                <!-- Right: Response Window -->
                <div class="flex-1">
                    <div class="rounded-xl overflow-hidden bg-slate-900 dark:bg-[#1a1c20] border border-slate-800 dark:border-outline-variant/10 shadow-2xl transition-colors duration-300">
                        <div class="bg-slate-800 dark:bg-[#282a2e] px-6 py-4 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="flex gap-1.5">
                                    <span class="w-3 h-3 rounded-full bg-rose-500/40"></span>
                                    <span class="w-3 h-3 rounded-full bg-amber-500/40"></span>
                                    <span class="w-3 h-3 rounded-full bg-emerald-500/40"></span>
                                </span>
                                <span class="text-xs font-mono text-slate-400 dark:text-on-surface-variant ml-4 tracking-wider uppercase">Live Response (JSON)</span>
                            </div>
                            <div class="flex items-center gap-4">
                                <span id="response-status" class="text-xs font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded hidden">200 OK</span>
                                <button onclick="copyResult()" class="text-slate-400 dark:text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-xs font-bold">
                                    <span class="material-symbols-outlined text-sm">content_copy</span>
                                    Copy
                                </button>
                            </div>
                        </div>
                        <div class="p-8 font-mono text-sm leading-relaxed overflow-x-auto min-h-[400px]">
                            <div id="response-image-wrap" class="hidden mb-4 p-4 rounded-xl border border-slate-700/40 bg-slate-950/50">
                                <div class="flex items-center justify-between mb-3">
                                    <span class="text-[11px] uppercase tracking-wider font-bold text-slate-400">Preview Foto Editor</span>
                                    <span id="response-image-meta" class="text-[11px] text-slate-500"></span>
                                </div>
                                <div class="w-full flex justify-center">
                                    <img id="response-image" alt="Foto editor result" class="max-w-full max-h-[320px] object-contain rounded-lg border border-slate-700/30 bg-slate-900" />
                                </div>
                            </div>
                            <pre id="result-box" class="text-slate-300 dark:text-on-surface-variant no-scrollbar whitespace-pre-wrap">// Menunggu permintaan...</pre>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- API Reference -->
        <section id="docs" class="py-24 px-6 md:px-12 max-w-[1920px] mx-auto border-t border-slate-100 dark:border-outline-variant/10 bg-slate-50 dark:bg-surface-container-low transition-colors duration-300">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h2 class="text-3xl font-headline font-bold mb-4 text-slate-900 dark:text-white">API Reference</h2>
                    <p class="text-slate-600 dark:text-on-surface-variant italic">Pilih tab layanan untuk melihat endpoint, parameter, dan contoh response tanpa memenuhi halaman.</p>
                </div>
                <div class="flex items-center gap-3 bg-white dark:bg-[#1a1c20] p-4 rounded-xl border border-slate-200 dark:border-outline-variant/10 shadow-sm">
                    <span id="doc-method-badge" class="px-3 py-1 bg-primary text-white dark:text-on-primary font-bold text-[10px] rounded-lg">GET / POST</span>
                    <code id="doc-endpoint-path" class="text-primary text-sm font-mono tracking-tight">/api/v3/validate</code>
                </div>
            </div>

            <div class="mb-8 flex flex-wrap gap-2">
                <button type="button" onclick="updateDocs('bank')" id="doc-tab-bank" class="doc-tab-btn px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-outline-variant/20 bg-white dark:bg-[#1a1c20] text-slate-700 dark:text-slate-200">Bank</button>
                <button type="button" onclick="updateDocs('ewallet')" id="doc-tab-ewallet" class="doc-tab-btn px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-outline-variant/20 bg-white dark:bg-[#1a1c20] text-slate-700 dark:text-slate-200">E-Wallet</button>
                <button type="button" onclick="updateDocs('whatsapp')" id="doc-tab-whatsapp" class="doc-tab-btn px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-outline-variant/20 bg-white dark:bg-[#1a1c20] text-slate-700 dark:text-slate-200">WhatsApp</button>
                <button type="button" onclick="updateDocs('nik')" id="doc-tab-nik" class="doc-tab-btn px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-outline-variant/20 bg-white dark:bg-[#1a1c20] text-slate-700 dark:text-slate-200">NIK</button>
                <button type="button" onclick="updateDocs('games')" id="doc-tab-games" class="doc-tab-btn px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-outline-variant/20 bg-white dark:bg-[#1a1c20] text-slate-700 dark:text-slate-200">Games</button>
                <button type="button" onclick="updateDocs('bpjs')" id="doc-tab-bpjs" class="doc-tab-btn px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-outline-variant/20 bg-white dark:bg-[#1a1c20] text-slate-700 dark:text-slate-200">BPJS</button>
                <button type="button" onclick="updateDocs('pln')" id="doc-tab-pln" class="doc-tab-btn px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-outline-variant/20 bg-white dark:bg-[#1a1c20] text-slate-700 dark:text-slate-200">PLN</button>
                <button type="button" onclick="updateDocs('ai')" id="doc-tab-ai" class="doc-tab-btn px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-outline-variant/20 bg-white dark:bg-[#1a1c20] text-slate-700 dark:text-slate-200">Foto Editor</button>
            </div>

            <div class="grid lg:grid-cols-2 gap-12">
                <div>
                    <h3 class="text-xs font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest mb-6 flex items-center gap-2">
                         <span class="material-symbols-outlined text-sm">list_alt</span> Query Parameters
                    </h3>
                    <div class="w-full overflow-hidden rounded-xl bg-white dark:bg-[#1a1c20] border border-slate-200 dark:border-outline-variant/5 shadow-sm">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50 dark:bg-[#282a2e] border-b border-slate-200 dark:border-outline-variant/10">
                                    <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Parameter</th>
                                    <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Deskripsi</th>
                                    <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody id="doc-params" class="divide-y divide-slate-100 dark:divide-outline-variant/5">
                                <!-- Rendered by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
                <div>
                    <h3 class="text-xs font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest mb-6 flex items-center gap-2">
                         <span class="material-symbols-outlined text-sm">code</span> Example Success Response
                    </h3>
                    <pre id="doc-example" class="bg-slate-900 dark:bg-[#0c0e12] rounded-xl p-8 font-mono text-sm text-primary/80 border border-slate-800 dark:border-outline-variant/10 no-scrollbar overflow-x-auto min-h-[300px]"></pre>
                </div>
            </div>

            <!-- Compact Additional Endpoints -->
            <details class="mt-12 rounded-2xl border border-slate-200 dark:border-outline-variant/10 bg-white dark:bg-[#1a1c20] shadow-sm overflow-hidden">
                <summary class="cursor-pointer list-none px-6 py-4 flex items-center justify-between">
                    <span class="text-sm md:text-base font-headline font-bold text-slate-900 dark:text-white">Endpoint Tambahan (Games List & Bank Codes)</span>
                    <span class="text-xs text-slate-500 dark:text-on-surface-variant">Klik untuk buka/tutup</span>
                </summary>
                <div class="px-6 pb-6">
            <!-- Games Endpoint -->
            <div class="mt-2 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-outline-variant/10 bg-white dark:bg-[#1a1c20] shadow-sm">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h3 class="text-xl font-headline font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary">sports_esports</span>
                            Daftar Game yang Didukung
                        </h3>
                        <p class="text-slate-500 dark:text-on-surface-variant text-sm italic">Ambil daftar seluruh game yang tersedia beserta kode service dan informasinya.</p>
                    </div>
                    <div class="flex items-center gap-3 bg-white dark:bg-[#1a1c20] p-4 rounded-xl border border-slate-200 dark:border-outline-variant/10 shadow-sm shrink-0">
                        <span class="px-3 py-1 bg-tertiary text-white font-bold text-[10px] rounded-lg">GET</span>
                        <code class="text-primary text-sm font-mono tracking-tight">/api/v3/games</code>
                    </div>
                </div>
                <div class="grid lg:grid-cols-2 gap-12">
                    <div>
                        <h4 class="text-xs font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">output</span> Response Fields
                        </h4>
                        <div class="w-full overflow-hidden rounded-xl bg-white dark:bg-[#1a1c20] border border-slate-200 dark:border-outline-variant/5 shadow-sm">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-slate-50 dark:bg-[#282a2e] border-b border-slate-200 dark:border-outline-variant/10">
                                        <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Field</th>
                                        <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Deskripsi</th>
                                        <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant text-right">Tipe</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-outline-variant/5">
                                    <tr class="border-b border-outline-variant/5">
                                        <td class="px-6 py-4 font-mono text-primary text-sm font-bold">data[].service</td>
                                        <td class="px-6 py-4 text-on-surface-variant text-sm">Kode service (gunakan sebagai <code class="font-mono text-xs bg-slate-100 dark:bg-white/10 px-1 rounded">game_service</code>)</td>
                                        <td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 text-[10px] font-bold uppercase">String</span></td>
                                    </tr>
                                    <tr class="border-b border-outline-variant/5">
                                        <td class="px-6 py-4 font-mono text-primary text-sm font-bold">data[].name</td>
                                        <td class="px-6 py-4 text-on-surface-variant text-sm">Nama game</td>
                                        <td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 text-[10px] font-bold uppercase">String</span></td>
                                    </tr>
                                    <tr class="border-b border-outline-variant/5">
                                        <td class="px-6 py-4 font-mono text-primary text-sm font-bold">data[].category</td>
                                        <td class="px-6 py-4 text-on-surface-variant text-sm">Publisher / kategori game</td>
                                        <td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 text-[10px] font-bold uppercase">String</span></td>
                                    </tr>
                                    <tr class="border-b border-outline-variant/5">
                                        <td class="px-6 py-4 font-mono text-primary text-sm font-bold">data[].requires_zone_id</td>
                                        <td class="px-6 py-4 text-on-surface-variant text-sm">Apakah parameter <code class="font-mono text-xs bg-slate-100 dark:bg-white/10 px-1 rounded">game_zone_id</code> wajib</td>
                                        <td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase">Boolean</span></td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 font-mono text-primary text-sm font-bold">data[].note</td>
                                        <td class="px-6 py-4 text-on-surface-variant text-sm">Catatan tambahan (opsional)</td>
                                        <td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-slate-200/50 text-slate-500 text-[10px] font-bold uppercase">String?</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p class="mt-4 text-xs text-slate-400 dark:text-on-surface-variant/60 italic">* Tidak memerlukan API Key. Total <strong id="games-count" class="text-slate-600 dark:text-on-surface-variant">16 game</strong> tersedia.</p>
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">code</span> Example Response
                        </h4>
                        <pre id="games-example" class="bg-slate-900 dark:bg-[#0c0e12] rounded-xl p-8 font-mono text-sm border border-slate-800 dark:border-outline-variant/10 no-scrollbar overflow-x-auto"></pre>
                    </div>
                </div>
            </div>

            <!-- Bank Codes Endpoint -->
            <div class="mt-10 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-outline-variant/10 bg-white dark:bg-[#1a1c20] shadow-sm">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h3 class="text-xl font-headline font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                            <span class="material-symbols-outlined text-primary">account_balance</span>
                            Daftar Kode Bank
                        </h3>
                        <p class="text-slate-500 dark:text-on-surface-variant text-sm italic">Ambil daftar seluruh bank yang didukung beserta kode dan nama banknya.</p>
                    </div>
                    <div class="flex items-center gap-3 bg-white dark:bg-[#1a1c20] p-4 rounded-xl border border-slate-200 dark:border-outline-variant/10 shadow-sm shrink-0">
                        <span class="px-3 py-1 bg-tertiary text-white font-bold text-[10px] rounded-lg">GET</span>
                        <code class="text-primary text-sm font-mono tracking-tight">/api/v3/bank-codes</code>
                    </div>
                </div>
                <div class="grid lg:grid-cols-2 gap-12">
                    <div>
                        <h4 class="text-xs font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">output</span> Response Fields
                        </h4>
                        <div class="w-full overflow-hidden rounded-xl bg-white dark:bg-[#1a1c20] border border-slate-200 dark:border-outline-variant/5 shadow-sm">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-slate-50 dark:bg-[#282a2e] border-b border-slate-200 dark:border-outline-variant/10">
                                        <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Field</th>
                                        <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Deskripsi</th>
                                        <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant text-right">Tipe</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-outline-variant/5">
                                    <tr class="border-b border-outline-variant/5">
                                        <td class="px-6 py-4 font-mono text-primary text-sm font-bold">status</td>
                                        <td class="px-6 py-4 text-on-surface-variant text-sm">Status keberhasilan request</td>
                                        <td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase">Boolean</span></td>
                                    </tr>
                                    <tr class="border-b border-outline-variant/5">
                                        <td class="px-6 py-4 font-mono text-primary text-sm font-bold">data[].nama_bank</td>
                                        <td class="px-6 py-4 text-on-surface-variant text-sm">Nama lengkap bank</td>
                                        <td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 text-[10px] font-bold uppercase">String</span></td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 font-mono text-primary text-sm font-bold">data[].codeid</td>
                                        <td class="px-6 py-4 text-on-surface-variant text-sm">Kode numerik bank (digunakan sebagai <code class="font-mono text-xs bg-slate-100 dark:bg-white/10 px-1 rounded">code</code> parameter di /validate)</td>
                                        <td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 text-[10px] font-bold uppercase">String</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p class="mt-4 text-xs text-slate-400 dark:text-on-surface-variant/60 italic">* Tidak memerlukan API Key. Total <strong class="text-slate-600 dark:text-on-surface-variant">187 bank</strong> tersedia.</p>
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">code</span> Example Response
                        </h4>
                        <pre id="bank-codes-example" class="bg-slate-900 dark:bg-[#0c0e12] rounded-xl p-8 font-mono text-sm border border-slate-800 dark:border-outline-variant/10 no-scrollbar overflow-x-auto"></pre>
                    </div>
                </div>
            </div>
                </div>
            </details>
        </section>

        <!-- SEO FAQ Section -->
        <section id="faq" class="py-20 px-6 md:px-12 max-w-[1920px] mx-auto border-t border-slate-100 dark:border-outline-variant/10 bg-white dark:bg-surface transition-colors duration-300">
            <div class="max-w-5xl">
                <h2 class="text-3xl md:text-4xl font-headline font-bold mb-4 text-slate-900 dark:text-white">FAQ API Cek Nama Bank & E-Wallet</h2>
                <p class="text-slate-600 dark:text-on-surface-variant mb-10">Ringkasan cepat untuk kebutuhan pencarian populer seperti cek nama bank, cek ID bank, cek nama ewallet, dan cek ID ewallet.</p>
                <div class="space-y-4">
                    <details class="rounded-2xl border border-slate-200 dark:border-outline-variant/15 bg-slate-50 dark:bg-[#1a1c20] p-5">
                        <summary class="cursor-pointer font-bold text-slate-900 dark:text-white">Apa itu API cek nama bank?</summary>
                        <p class="mt-3 text-slate-600 dark:text-on-surface-variant">API cek nama bank adalah endpoint untuk memvalidasi nama pemilik rekening dari nomor rekening dan kode bank secara otomatis.</p>
                    </details>
                    <details class="rounded-2xl border border-slate-200 dark:border-outline-variant/15 bg-slate-50 dark:bg-[#1a1c20] p-5">
                        <summary class="cursor-pointer font-bold text-slate-900 dark:text-white">Apakah bisa cek ID ewallet dan cek nama ewallet?</summary>
                        <p class="mt-3 text-slate-600 dark:text-on-surface-variant">Bisa. Endpoint ewallet mendukung cek ID ewallet dan pengambilan nama akun ewallet yang valid pada provider yang tersedia.</p>
                    </details>
                    <details class="rounded-2xl border border-slate-200 dark:border-outline-variant/15 bg-slate-50 dark:bg-[#1a1c20] p-5">
                        <summary class="cursor-pointer font-bold text-slate-900 dark:text-white">Apa beda cek ID bank dan cek nama bank?</summary>
                        <p class="mt-3 text-slate-600 dark:text-on-surface-variant">Cek ID bank fokus ke identifikasi kode bank, sedangkan cek nama bank atau cek nama rekening fokus ke verifikasi nama pemilik rekening.</p>
                    </details>
                    <details class="rounded-2xl border border-slate-200 dark:border-outline-variant/15 bg-slate-50 dark:bg-[#1a1c20] p-5">
                        <summary class="cursor-pointer font-bold text-slate-900 dark:text-white">Apakah tersedia API cek nama ewallet untuk integrasi?</summary>
                        <p class="mt-3 text-slate-600 dark:text-on-surface-variant">Tersedia. Dokumentasi public menampilkan endpoint, parameter, dan contoh response agar proses integrasi lebih cepat.</p>
                    </details>
                    <details class="rounded-2xl border border-slate-200 dark:border-outline-variant/15 bg-slate-50 dark:bg-[#1a1c20] p-5">
                        <summary class="cursor-pointer font-bold text-slate-900 dark:text-white">Apa itu Public Trial dan apakah gratis?</summary>
                        <p class="mt-3 text-slate-600 dark:text-on-surface-variant">Public Trial adalah mode uji cepat untuk mencoba endpoint. Trial dipakai untuk testing awal, dengan limit tertentu sesuai kebijakan sistem yang aktif.</p>
                    </details>
                    <details class="rounded-2xl border border-slate-200 dark:border-outline-variant/15 bg-slate-50 dark:bg-[#1a1c20] p-5">
                        <summary class="cursor-pointer font-bold text-slate-900 dark:text-white">Bagaimana sistem Premium harga per hit?</summary>
                        <p class="mt-3 text-slate-600 dark:text-on-surface-variant">Pada mode premium/member, biaya dihitung per hit sukses sesuai jenis layanan. Nilai harga per hit mengikuti konfigurasi aktif di dashboard admin.</p>
                    </details>
                    <details class="rounded-2xl border border-slate-200 dark:border-outline-variant/15 bg-slate-50 dark:bg-[#1a1c20] p-5">
                        <summary class="cursor-pointer font-bold text-slate-900 dark:text-white">Kapan saldo terpotong dan bagaimana konsumsi hit dihitung?</summary>
                        <p class="mt-3 text-slate-600 dark:text-on-surface-variant">Konsumsi hit dihitung saat request berhasil diproses sesuai aturan layanan. Untuk request gagal/invalid, perlakuannya mengikuti kebijakan sistem aktif (termasuk kebijakan hit tidak valid bila diaktifkan).</p>
                    </details>
                </div>
            </div>
        </section>

        <!-- Pricing/Packages Section (disabled: saldo-only mode) -->
        <section id="packages" class="hidden py-24 px-6 md:px-12 max-w-[1920px] mx-auto border-t border-slate-100 dark:border-white/5 bg-white dark:bg-surface transition-colors duration-300">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-headline font-extrabold text-slate-900 dark:text-white mb-4">Pilih <span class="gradient-text">Paket Hemat</span></h2>
                <p class="text-slate-600 dark:text-on-surface-variant max-w-xl mx-auto italic">Solusi tepat untuk kebutuhan bisnis Anda dengan performa tinggi dan uptime terjamin.</p>
            </div>
            <div id="packages-container" class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <!-- Rendered by JS -->
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="w-full py-12 px-6 md:px-12 border-t border-slate-100 dark:border-slate-800/10 bg-slate-50 dark:bg-[#111318] transition-colors duration-300">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6 w-full max-w-[1920px] mx-auto">
            <div class="flex flex-col items-center md:items-start gap-2">
                <span class="text-slate-900 dark:text-slate-100 font-extrabold text-lg tracking-tighter font-headline">${serverName} Engine</span>
                <p class="font-body text-[10px] uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">© 2026 ${serverName} Systems. All Systems Operational.</p>
            </div>
            <div class="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">
                <a class="hover:text-primary transition-colors" href="#playground">Playground</a>
                <a class="hover:text-primary transition-colors" href="#faq">FAQ</a>
                <a class="hover:text-primary transition-colors" href="https://t.me/xyz_yaz" target="_blank">Support</a>
                 </div>
        </div>
    </footer>

    <!-- Toast Component -->
    <div id="toast" class="fixed bottom-6 right-6 z-[100] hidden opacity-0 transition-all duration-300 translate-y-2">
        <div id="toast-inner" class="bg-white dark:bg-[#1a1c20] border border-slate-200 dark:border-outline-variant/20 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-2xl transition-colors">
            <span id="toast-icon" class="material-symbols-outlined text-primary">info</span>
            <div id="toast-text" class="text-sm text-slate-900 dark:text-white font-medium"></div>
        </div>
    </div>

    <!-- Modal Codes -->
    <div id="codesModal" class="fixed inset-0 z-[60] hidden opacity-0 transition-opacity duration-300">
        <div class="absolute inset-0 bg-slate-900/60 dark:bg-[#0c0e12]/80 backdrop-blur-md" onclick="closeCodesModal()"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] px-4">
            <div class="bg-white dark:bg-[#1a1c20] border border-slate-200 dark:border-outline-variant/10 rounded-[2rem] flex flex-col overflow-hidden shadow-3xl transition-colors">
                <div class="p-6 border-b border-slate-100 dark:border-outline-variant/10 flex items-center justify-between bg-slate-50 dark:bg-[#282a2e]">
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3 font-headline">
                        <span class="material-symbols-outlined text-primary">account_balance</span> Daftar Kode Bank
                    </h3>
                    <button onclick="closeCodesModal()" class="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-white/10 transition-colors">
                        <span class="material-symbols-outlined text-sm text-slate-600 dark:text-white">close</span>
                    </button>
                </div>
                <div class="p-6">
                    <div class="relative mb-6">
                        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-on-surface-variant">search</span>
                        <input type="text" id="search-code" onkeyup="filterCodes()" placeholder="Cari nama bank atau kode..." class="w-full bg-slate-50 dark:bg-[#0c0e12] border border-slate-200 dark:border-outline-variant/20 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary transition-all text-sm text-slate-900 dark:text-white">
                    </div>
                    <div class="overflow-auto max-h-[50vh] pr-2 no-scrollbar">
                        <table class="w-full text-left text-sm border-collapse">
                            <thead class="sticky top-0 bg-white dark:bg-[#1a1c20] z-10 border-b border-slate-100 dark:border-outline-variant/10">
                                <tr class="text-slate-500 dark:text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                                    <th class="py-3 px-4">Nama Bank</th>
                                    <th class="py-3 px-4">Parameter Code</th>
                                </tr>
                            </thead>
                            <tbody id="code-list-body" class="divide-y divide-slate-100 dark:divide-outline-variant/5">
                                <!-- Dynamic -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentType = '';
        let allCodes = [];
        let toastTimer = null;
        let runTimerInt = null;
        let aiUploadedTempUrl = '';
        let aiInputMode = 'url';
        let serviceAvailability = {
            bank: true,
            ewallet: true,
            whatsapp: true,
            nik: true,
            games: true,
            bpjs: true,
            pln: true,
            ai: true
        };

        function setServiceMaintenance(type, isOff) {
            const card = document.getElementById('card-' + type);
            const tab = document.getElementById('tab-' + type);
            [card, tab].forEach(function(el) {
                if (!el) return;
                el.classList.toggle('service-off', !!isOff);
                if (el.tagName === 'BUTTON') el.disabled = !!isOff;
                el.setAttribute('aria-disabled', isOff ? 'true' : 'false');
                const isTab = el.classList.contains('service-tab');
                if (isTab) {
                    let mini = el.querySelector('.maintenance-inline');
                    if (isOff) {
                        if (!mini) {
                            mini = document.createElement('span');
                            mini.className = 'material-symbols-outlined maintenance-inline';
                            mini.style.fontSize = '12px';
                            mini.textContent = 'construction';
                            mini.title = 'Maintenance';
                            el.appendChild(mini);
                        }
                    } else if (mini) {
                        mini.remove();
                    }
                    return;
                }

                if (!el.style.position) el.style.position = 'relative';
                let chip = el.querySelector('.maintenance-chip');
                if (isOff) {
                    if (!chip) {
                        chip = document.createElement('span');
                        chip.className = 'maintenance-chip';
                        chip.innerHTML = '<span class="material-symbols-outlined" style="font-size:12px;line-height:1;">construction</span><span>Maintenance</span>';
                        el.appendChild(chip);
                    }
                } else if (chip) {
                    chip.remove();
                }
            });
        }

        function firstAvailableService() {
            const order = ['bank', 'ewallet', 'whatsapp', 'nik', 'games', 'bpjs', 'pln', 'ai'];
            for (const t of order) if (serviceAvailability[t] !== false) return t;
            return 'bank';
        }

        function applyServiceAvailability(map) {
            serviceAvailability = Object.assign({}, serviceAvailability, map || {});
            Object.keys(serviceAvailability).forEach(function(type) {
                setServiceMaintenance(type, serviceAvailability[type] === false);
            });
            if (serviceAvailability[currentType] === false) {
                currentType = firstAvailableService();
                selectType(currentType, true);
            }
        }

        function setAiInputMode(mode) {
            aiInputMode = (mode === 'upload') ? 'upload' : 'url';
            const urlWrap = document.getElementById('ai-url-wrap');
            const uploadWrap = document.getElementById('ai-upload-wrap');
            const modeWrap = document.getElementById('ai-input-mode-wrap');
            const btnUrl = document.getElementById('ai-mode-url');
            const btnUpload = document.getElementById('ai-mode-upload');
            const inputUrl = document.getElementById('test-number');
            const inputFile = document.getElementById('ai-file-input');
            if (modeWrap) modeWrap.classList.remove('hidden');
            if (urlWrap) urlWrap.style.display = (aiInputMode === 'url') ? '' : 'none';
            if (uploadWrap) uploadWrap.classList.remove('hidden');
            if (inputUrl) {
                inputUrl.required = (aiInputMode === 'url');
                if (aiInputMode !== 'url') inputUrl.value = '';
            }
            if (inputFile && aiInputMode !== 'upload') inputFile.value = '';
            if (btnUrl) {
                btnUrl.className = 'px-3 py-2 rounded-lg text-xs font-bold border border-primary bg-primary/10 text-primary';
            }
            if (btnUpload) {
                btnUpload.className = 'px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-outline-variant/20 text-slate-600 dark:text-on-surface-variant';
            }
            if (aiInputMode === 'upload') {
                if (btnUpload) btnUpload.className = 'px-3 py-2 rounded-lg text-xs font-bold border border-primary bg-primary/10 text-primary';
                if (btnUrl) btnUrl.className = 'px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-outline-variant/20 text-slate-600 dark:text-on-surface-variant';
            }
        }

        function fileToDataBase64(file) {
            return new Promise(function(resolve, reject) {
                const reader = new FileReader();
                reader.onload = function() {
                    const raw = String(reader.result || '');
                    const b64 = raw.includes(',') ? raw.split(',').pop() : raw;
                    resolve(b64);
                };
                reader.onerror = function() { reject(new Error('read_failed')); };
                reader.readAsDataURL(file);
            });
        }

        async function uploadAiTempFile(file) {
            const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowed.includes(String(file.type || '').toLowerCase())) {
                throw new Error('format');
            }
            if (Number(file.size || 0) > (4 * 1024 * 1024)) {
                throw new Error('size');
            }
            const dataBase64 = await fileToDataBase64(file);
            const r = await fetch('/api/v3/upload-image-temp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name || '',
                    mime: file.type || '',
                    data_base64: dataBase64
                })
            });
            const out = await r.json();
            if (!r.ok || !out || !out.status || !out.data || !out.data.image_url) {
                throw new Error((out && out.message) ? out.message : 'upload_failed');
            }
            return out.data.image_url;
        }

        function toggleTheme() {
            const html = document.documentElement;
            const icon = document.getElementById('theme-toggle-icon');
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                icon.textContent = 'light_mode';
            } else {
                html.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                icon.textContent = 'dark_mode';
            }
        }

        function initTheme() {
            const savedTheme = localStorage.getItem('theme');
            const html = document.documentElement;
            const icon = document.getElementById('theme-toggle-icon');
            if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                html.classList.add('dark');
                if (icon) icon.textContent = 'dark_mode';
            } else {
                html.classList.remove('dark');
                if (icon) icon.textContent = 'light_mode';
            }
        }

        function showToast(msg, type = 'info') {
            const toast = document.getElementById('toast');
            const text = document.getElementById('toast-text');
            const icon = document.getElementById('toast-icon');
            if (!toast || !text) return;
            
            text.textContent = msg;
            icon.textContent = type === 'error' ? 'error' : (type === 'success' ? 'check_circle' : 'info');
            icon.className = 'material-symbols-outlined ' + (type === 'error' ? 'text-rose-500' : (type === 'success' ? 'text-emerald-500' : 'text-primary'));
            
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('opacity-100', 'translate-y-0'), 10);
            
            if (toastTimer) clearTimeout(toastTimer);
            toastTimer = setTimeout(() => {
                toast.classList.remove('opacity-100', 'translate-y-0');
                setTimeout(() => toast.classList.add('hidden'), 300);
            }, 4000);
        }

        function togglePasswordVisibility(id) {
            const input = document.getElementById(id);
            const icon = document.getElementById('eye-icon-' + id);
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = 'visibility';
            } else {
                input.type = 'password';
                icon.textContent = 'visibility_off';
            }
        }

        function selectType(type, skipToast) {
            if (serviceAvailability[type] === false) {
                if (!skipToast) showToast('Layanan sedang maintenance. Coba layanan lain.', 'error');
                return;
            }
            currentType = type;
            // Update cards
            document.querySelectorAll('.type-card').forEach(c => c.classList.remove('card-active'));
            const activeCard = document.getElementById('card-' + type);
            if (activeCard) activeCard.classList.add('card-active');

            // Update tabs
            document.querySelectorAll('.service-tab').forEach(t => {
                t.classList.remove('border-primary', 'bg-primary/10', 'text-primary');
                t.classList.add('border-slate-200', 'dark:border-outline-variant/20', 'bg-slate-50', 'dark:bg-[#0c0e12]', 'text-slate-600', 'dark:text-on-surface-variant');
            });
            const activeTab = document.getElementById('tab-' + type);
            if (activeTab) {
                activeTab.classList.remove('border-slate-200', 'dark:border-outline-variant/20', 'bg-slate-50', 'dark:bg-[#0c0e12]', 'text-slate-600', 'dark:text-on-surface-variant');
                activeTab.classList.add('border-primary', 'bg-primary/10', 'text-primary');
            }

            const extra = document.getElementById('extra-fields');
            const labelNum = document.getElementById('label-number');
            const mainInput = document.getElementById('test-number');
            const aiUploadWrap = document.getElementById('ai-upload-wrap');
            const aiFileInput = document.getElementById('ai-file-input');
            const aiModeWrap = document.getElementById('ai-input-mode-wrap');
            if (aiUploadWrap) aiUploadWrap.classList.add('hidden');
            if (aiModeWrap) aiModeWrap.classList.add('hidden');
            if (type !== 'ai') aiUploadedTempUrl = '';
            if (aiFileInput && type !== 'ai') aiFileInput.value = '';

            if (type === 'bank') {
                if (mainInput) mainInput.placeholder = 'Contoh: 1234567890';
                labelNum.textContent = 'Nomor Rekening';
                extra.innerHTML = 
                    '<div class="space-y-3 relative">' +
                        '<label class="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Code Bank</label>' +
                        '<div class="relative">' +
                            '<input type="text" id="bank-code-search" autocomplete="off" onfocus="openBankDropdown()" oninput="filterBankDropdown()" placeholder="Cari bank... (contoh: BCA, BRI, 014)" class="w-full bg-slate-50 dark:bg-[#0c0e12] border border-slate-200 dark:border-outline-variant/20 rounded-xl px-5 py-4 text-slate-900 dark:text-on-surface focus:ring-2 focus:ring-primary/40 font-mono text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600">' +
                            '<span class="material-symbols-outlined absolute right-4 top-4 text-slate-400 dark:text-on-surface-variant pointer-events-none">search</span>' +
                        '</div>' +
                        '<input type="hidden" id="test-code" value="">' +
                        '<div id="bank-code-dropdown" class="hidden absolute z-50 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-slate-200 dark:border-outline-variant/20 bg-white dark:bg-[#1a1c20] shadow-2xl no-scrollbar"></div>' +
                        '<div class="flex items-center justify-between text-[10px] text-slate-500 dark:text-on-surface-variant font-medium">' +
                            '<span>Wajib diisi</span>' +
                            '<button type="button" onclick="openCodesModal()" class="text-primary hover:underline">Daftar Semua Bank</button>' +
                        '</div>' +
                    '</div>';
            } else if (type === 'ewallet') {
                if (mainInput) mainInput.placeholder = 'Contoh: 081234567890';
                labelNum.textContent = 'Nomor HP Akun';
                const options = ['dana', 'gopay', 'shopeepay', 'ovo', 'linkaja', 'grab'].map(opt => '<option value="' + opt + '">' + opt.toUpperCase() + '</option>').join('');
                extra.innerHTML = 
                    '<div class="space-y-3">' +
                        '<label class="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Provider E-Wallet</label>' +
                        '<select id="test-code" class="w-full bg-slate-50 dark:bg-[#0c0e12] border border-slate-200 dark:border-outline-variant/20 rounded-xl px-5 py-4 text-slate-900 dark:text-on-surface focus:ring-2 focus:ring-primary/40 font-mono text-sm appearance-none cursor-pointer">' +
                            options +
                        '</select>' +
                    '</div>';
            } else if (type === 'games') {
                if (mainInput) mainInput.placeholder = 'Contoh: 7194234362 / username';
                labelNum.textContent = 'User ID / Username Akun Game';
                const ZONE_GAMES = ['region-ml','mlbb-bundle','mlcreate','first-topup','first-mcgg'];
                extra.innerHTML =
                    '<div class="space-y-3">' +
                        '<label class="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Pilih Game</label>' +
                        '<select id="game-service" onchange="toggleZoneField()" class="w-full bg-slate-50 dark:bg-[#0c0e12] border border-slate-200 dark:border-outline-variant/20 rounded-xl px-5 py-4 text-slate-900 dark:text-on-surface focus:ring-2 focus:ring-primary/40 font-mono text-sm cursor-pointer">' +
                            '<optgroup label="Mobile Legends">' +
                                '<option value="region-ml">Mobile Legends – Region (+ Zone ID)</option>' +
                                '<option value="mlbb-bundle">Mobile Legends – Bundle (+ Zone ID)</option>' +
                                '<option value="mlcreate">Mobile Legends – Create Date (+ Zone ID)</option>' +
                                '<option value="first-topup">Mobile Legends – First Topup (+ Zone ID)</option>' +
                                '<option value="first-mcgg">Magic Chess Go Go – First Topup (+ Zone ID)</option>' +
                            '</optgroup>' +
                            '<optgroup label="Garena">' +
                                '<option value="free-fire">Free Fire</option>' +
                                '<option value="undawn">Garena Undawn</option>' +
                            '</optgroup>' +
                            '<optgroup label="Tencent / Activision">' +
                                '<option value="pubg">PUBG Mobile</option>' +
                                '<option value="codm">Call of Duty Mobile</option>' +
                            '</optgroup>' +
                            '<optgroup label="HoYoverse">' +
                                '<option value="genshin">Genshin Impact</option>' +
                                '<option value="hsr">Honkai: Star Rail</option>' +
                                '<option value="zenless">Zenless Zone Zero</option>' +
                            '</optgroup>' +
                            '<optgroup label="Lainnya">' +
                                '<option value="hok">Honor of Kings</option>' +
                                '<option value="blood-strike">Blood Strike</option>' +
                                '<option value="valorant">Valorant (format: name#tag)</option>' +
                                '<option value="roblox">Roblox (username)</option>' +
                            '</optgroup>' +
                        '</select>' +
                    '</div>' +
                    '<div id="zone-field-wrap" class="space-y-3">' +
                        '<label class="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Zone ID <span class="ml-1 px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">Wajib ML</span></label>' +
                        '<input id="game-zone-id" type="text" placeholder="Contoh: 15661" class="w-full bg-slate-50 dark:bg-[#0c0e12] border border-slate-200 dark:border-outline-variant/20 rounded-xl px-5 py-4 text-slate-900 dark:text-on-surface focus:ring-2 focus:ring-primary/40 font-mono text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600">' +
                    '</div>';
                setTimeout(function() { if (typeof toggleZoneField === 'function') toggleZoneField(); }, 0);
            } else if (type === 'ai') {
                if (mainInput) mainInput.placeholder = 'Contoh: https://example.com/foto.jpg (boleh kosong jika upload)';
                labelNum.textContent = 'Image URL Sumber (opsional)';
                setAiInputMode('url');
                extra.innerHTML =
                    '<div class="space-y-3">' +
                        '<label class="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-on-surface-variant">Prompt Foto Editor (max 100 karakter)</label>' +
                        '<input id="test-code" type="text" maxlength="100" placeholder="Contoh: ubah ke gaya anime, pertajam wajah" class="w-full bg-slate-50 dark:bg-[#0c0e12] border border-slate-200 dark:border-outline-variant/20 rounded-xl px-5 py-4 text-slate-900 dark:text-on-surface focus:ring-2 focus:ring-primary/40 font-mono text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600">' +
                        '<div class="text-[11px] text-slate-500 dark:text-on-surface-variant">Gunakan teks singkat, tanpa karakter berlebihan. Maksimal 100 karakter.</div>' +
                    '</div>';
            } else {
                if (type === 'whatsapp') labelNum.textContent = 'Nomor WhatsApp (08xxxx)';
                else if (type === 'bpjs') labelNum.textContent = 'Nomor Pelanggan BPJS';
                else if (type === 'pln') labelNum.textContent = 'Nomor Pelanggan PLN';
                else labelNum.textContent = 'Nomor Induk Kependudukan (16 digit)';
                if (mainInput) {
                    if (type === 'whatsapp') mainInput.placeholder = 'Contoh: 081234567890';
                    else if (type === 'bpjs') mainInput.placeholder = 'Contoh: 0003507157135';
                    else if (type === 'pln') mainInput.placeholder = 'Contoh: 146802199352';
                    else mainInput.placeholder = 'Contoh: 327601xxxxxxxxxx';
                }
                extra.innerHTML = '';
            }
            updateDocs(type);
        }

        function openBankDropdown() {
            const dropdown = document.getElementById('bank-code-dropdown');
            if (dropdown) {
                dropdown.classList.remove('hidden');
                filterBankDropdown();
            }
        }

        function closeBankDropdown() {
            const dropdown = document.getElementById('bank-code-dropdown');
            if (dropdown) dropdown.classList.add('hidden');
        }

        function setBankCode(code, name) {
            const hidden = document.getElementById('test-code');
            const input = document.getElementById('bank-code-search');
            if (hidden) hidden.value = code;
            if (input) input.value = name + ' — ' + code;
            closeBankDropdown();
        }

        function filterBankDropdown() {
            const input = document.getElementById('bank-code-search');
            const dropdown = document.getElementById('bank-code-dropdown');
            if (!input || !dropdown) return;
            const q = input.value.toLowerCase().trim();
            const filtered = allCodes.filter(item => (item.name || '').toLowerCase().includes(q) || (item.code || '').toLowerCase().includes(q));
            let html = '';
            if (filtered.length === 0) {
                html = '<div class="p-4 text-xs text-on-surface-variant italic">Tidak ditemukan...</div>';
            } else {
                filtered.slice(0, 50).forEach(item => {
                    let safeName = item.name.replace(/'/g, "\\\\'");
                    let code = item.codeid || item.code;
                    let safeCode = code.replace(/'/g, "\\\\'");
                    html += '<button type="button" onclick="setBankCode(\\'' + safeCode + '\\', \\'' + safeName + '\\')" class="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between border-b border-slate-100 dark:border-white/5 last:border-none">' +
                        '<span class="text-sm text-slate-900 dark:text-on-surface font-medium">' + item.name + '</span>' +
                        '<span class="text-xs font-mono text-primary font-bold">' + code + '</span>' +
                        '</button>';
                });
            }
            dropdown.innerHTML = html;
        }

        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('bank-code-dropdown');
            const input = document.getElementById('bank-code-search');
            if (dropdown && !dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && e.target !== input) {
                closeBankDropdown();
            }
        });

        function updateDocs(type) {
            const paramsBody = document.getElementById('doc-params');
            const exampleBox = document.getElementById('doc-example');
            const endpointPath = document.getElementById('doc-endpoint-path');
            const methodBadge = document.getElementById('doc-method-badge');
            if (!paramsBody || !exampleBox) return;

            document.querySelectorAll('.doc-tab-btn').forEach(btn => {
                btn.classList.remove('bg-primary', 'text-white', 'border-primary');
                btn.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
            });
            const activeBtn = document.getElementById('doc-tab-' + type);
            if (activeBtn) {
                activeBtn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
                activeBtn.classList.add('bg-primary', 'text-white', 'border-primary');
            }

            if (endpointPath && methodBadge) {
                if (type === 'games') {
                    endpointPath.textContent = '/api/v3/validate?type=games';
                    methodBadge.textContent = 'GET / POST';
                } else if (type === 'bpjs') {
                    endpointPath.textContent = '/api/v3/validate?type=bpjs';
                    methodBadge.textContent = 'GET / POST';
                } else if (type === 'pln') {
                    endpointPath.textContent = '/api/v3/validate?type=pln';
                    methodBadge.textContent = 'GET / POST';
                } else if (type === 'ai') {
                    endpointPath.textContent = '/api/v3/validate?type=ai';
                    methodBadge.textContent = 'GET / POST';
                } else {
                    endpointPath.textContent = '/api/v3/validate';
                    methodBadge.textContent = 'GET / POST';
                }
            }

            let paramsHtml = '<tr class="border-b border-outline-variant/5"><td class="px-6 py-4 font-mono text-primary text-sm font-bold">type</td><td class="px-6 py-4 text-on-surface-variant text-sm italic">"' + type + '"</td><td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">Required</span></td></tr>';
            if (type === 'bank' || type === 'ewallet') {
                paramsHtml += '<tr class="border-b border-outline-variant/5"><td class="px-6 py-4 font-mono text-primary text-sm font-bold">code</td><td class="px-6 py-4 text-on-surface-variant text-sm">' + (type === 'bank' ? 'Kode bank (014, 002, dll)' : 'Provider (dana, gopay, dll)') + '</td><td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">Required</span></td></tr>';
            }
            if (type === 'games') {
                paramsHtml += '<tr class="border-b border-outline-variant/5"><td class="px-6 py-4 font-mono text-primary text-sm font-bold">game_service</td><td class="px-6 py-4 text-on-surface-variant text-sm">Kode game: free-fire, pubg, region-ml, dll</td><td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">Required</span></td></tr>';
                paramsHtml += '<tr class="border-b border-outline-variant/5"><td class="px-6 py-4 font-mono text-primary text-sm font-bold">game_user_id</td><td class="px-6 py-4 text-on-surface-variant text-sm">ID / username akun game</td><td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">Required</span></td></tr>';
                paramsHtml += '<tr class="border-b border-outline-variant/5"><td class="px-6 py-4 font-mono text-primary text-sm font-bold">game_zone_id</td><td class="px-6 py-4 text-on-surface-variant text-sm">Zone ID (wajib untuk Mobile Legends)</td><td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase">Cond.</span></td></tr>';
            } else if (type === 'nik') {
                paramsHtml += '<tr class="border-b border-outline-variant/5"><td class="px-6 py-4 font-mono text-primary text-sm font-bold">nik</td><td class="px-6 py-4 text-on-surface-variant text-sm">16 Digit NIK KTP</td><td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">Required</span></td></tr>';
            } else if (type === 'ai') {
                paramsHtml += '<tr class="border-b border-outline-variant/5"><td class="px-6 py-4 font-mono text-primary text-sm font-bold">image</td><td class="px-6 py-4 text-on-surface-variant text-sm">URL gambar sumber (http/https). Bisa dari upload sementara (auto-hapus 30 detik).</td><td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">Required</span></td></tr>';
                paramsHtml += '<tr class="border-b border-outline-variant/5"><td class="px-6 py-4 font-mono text-primary text-sm font-bold">q</td><td class="px-6 py-4 text-on-surface-variant text-sm">Prompt edit (teks/angka), maksimal 100 karakter</td><td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">Required</span></td></tr>';
            } else {
                let desc = 'Nomor target';
                if (type === 'whatsapp') desc = 'Nomor WhatsApp (Contoh: 0812...)';
                else if (type === 'bpjs') desc = 'Nomor pelanggan BPJS';
                else if (type === 'pln') desc = 'Nomor pelanggan PLN';
                paramsHtml += '<tr class="border-b border-outline-variant/5"><td class="px-6 py-4 font-mono text-primary text-sm font-bold">accountNumber</td><td class="px-6 py-4 text-on-surface-variant text-sm">' + desc + '</td><td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold uppercase">Required</span></td></tr>';
            }
            paramsHtml += '<tr><td class="px-6 py-4 font-mono text-primary text-sm font-bold">api_key</td><td class="px-6 py-4 text-on-surface-variant text-sm">API Key Anda</td><td class="px-6 py-4 text-right"><span class="px-2 py-0.5 rounded bg-on-surface-variant/10 text-on-surface-variant text-[10px] font-bold uppercase">Optional</span></td></tr>';
            paramsBody.innerHTML = paramsHtml;

            let successJson = { status: true, message: "Success", data: { pesan: "Validasi Berhasil" }, user_details: { id: 123, member_id: "MBR000123", name: "Premium Web", balance: 50000 }, provider: "s1", execution_time: 0.25 };
            if (type === 'bank') successJson.data = { bank_code: "014", account_number: "1234567890", account_name: "ANDRIAS", bank_name: "BCA" };
            else if (type === 'ewallet') successJson.data = { ewallet_code: "dana", account_number: "081234xxx", account_name: "ANDRIAS", ewallet_name: "DANA" };
            else if (type === 'whatsapp') successJson.data = { phone_number: "081234xxx", is_whatsapp: true, pesan: "Nomor terdaftar di WhatsApp." };
            else if (type === 'nik') successJson.data = { nik: "123456...", nama: "ANDRIAS", alamat: "..." };
            else if (type === 'games') { delete successJson.provider; successJson.service = 'free-fire'; successJson.data = { brand: "Free Fire", nickname: "PlayerXXX", id: "7194234362", country: "Indonesia", country_code: "ID" }; }
            else if (type === 'bpjs') successJson.data = { service: 'bpjs', account_number: '0003507157135', customer_name: 'NAMA PELANGGAN', participant_name: 'NAMA PESERTA', participant_count: '1', bill_period: '2026-05', total_bill: '100000', admin_fee: '2500', total_pay: '102500' };
            else if (type === 'pln') successJson.data = { service: 'pln', account_number: '146802199352', customer_name: 'NAMA PELANGGAN', tariff_power: 'R1/1300', meter_stand: '000123-000456', bill_period: '05/26', total_bill: '250000', admin_fee: '2500', total_pay: '252500' };
            else if (type === 'ai') successJson.data = { code: "bKY75m", bytes: 1053802, expired_at: 1778335172161, downloadUrl: "https://domain-anda.com/get/ai?code=bKY75m" };
            exampleBox.innerHTML = syntaxHighlight(successJson);
        }

        async function runTest(e) {
            e.preventDefault();
            const btn = document.getElementById('btn-test');
            const pre = document.getElementById('result-box');
            const statusSpan = document.getElementById('response-status');
            const imgWrap = document.getElementById('response-image-wrap');
            const imgEl = document.getElementById('response-image');
            const imgMeta = document.getElementById('response-image-meta');
            const num = document.getElementById('test-number').value.trim();
            const code = document.getElementById('test-code') ? document.getElementById('test-code').value.trim() : '';
            const apikey = document.getElementById('test-key').value.trim();
            const aiFileInput = document.getElementById('ai-file-input');

            if ((currentType === 'bank' || currentType === 'ewallet') && !code) {
                showToast('Silakan pilih kode/vendor terlebih dahulu.', 'error');
                return;
            }
            if (currentType === 'ai') {
                if (!code) { showToast('Prompt Foto Editor wajib diisi.', 'error'); return; }
                if (code.length > 100) { showToast('Prompt Foto Editor maksimal 100 karakter.', 'error'); return; }
                const hasFile = !!(aiFileInput && aiFileInput.files && aiFileInput.files[0]);
                if (aiInputMode === 'url') {
                    if (!num) {
                        showToast('Mode URL dipilih: isi URL gambar terlebih dahulu.', 'error');
                        return;
                    }
                    try {
                        const u = new URL(num);
                        if (!/^https?:$/i.test(u.protocol)) throw new Error('invalid');
                    } catch (_) {
                        showToast('Image URL harus valid (http/https).', 'error');
                        return;
                    }
                } else {
                    if (!hasFile) {
                        showToast('Mode Upload dipilih: pilih file gambar terlebih dahulu.', 'error');
                        return;
                    }
                }
            }
            if (currentType === 'games') {
                const gsvc = document.getElementById('game-service') ? document.getElementById('game-service').value.trim() : '';
                const gzone = document.getElementById('game-zone-id') ? document.getElementById('game-zone-id').value.trim() : '';
                const ZONE_GAMES = ['region-ml','mlbb-bundle','mlcreate','first-topup','first-mcgg'];
                if (!gsvc) { showToast('Pilih game terlebih dahulu.', 'error'); return; }
                if (ZONE_GAMES.includes(gsvc) && !gzone) { showToast('Zone ID wajib untuk game ini.', 'error'); return; }
            }

            const orig = btn.innerHTML;
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Memproses...';
            btn.disabled = true;
            let startAt = Date.now();
            pre.textContent = '// Menghubungi infrastruktur... 0.0s';
            if (runTimerInt) clearInterval(runTimerInt);
            runTimerInt = setInterval(function() {
                var sec = ((Date.now() - startAt) / 1000).toFixed(1);
                pre.textContent = '// Menghubungi infrastruktur... ' + sec + 's';
            }, 100);
            statusSpan.classList.add('hidden');
            if (imgWrap) imgWrap.classList.add('hidden');
            if (imgEl) imgEl.removeAttribute('src');
            if (imgMeta) imgMeta.textContent = '';

            let url;
            if (currentType === 'games') {
                const gameService = document.getElementById('game-service') ? document.getElementById('game-service').value.trim() : '';
                const zoneId = document.getElementById('game-zone-id') ? document.getElementById('game-zone-id').value.trim() : '';
                url = '/api/v3/validate?type=games&game_service=' + encodeURIComponent(gameService) + '&game_user_id=' + encodeURIComponent(num);
                if (zoneId) url += '&game_zone_id=' + encodeURIComponent(zoneId);
                if (apikey) url += '&api_key=' + encodeURIComponent(apikey);
            } else {
                url = '/api/v3/validate?type=' + currentType + '&accountNumber=' + encodeURIComponent(num);
                if (code) url += '&code=' + encodeURIComponent(code);
                if (apikey) url += '&api_key=' + encodeURIComponent(apikey);
                if (currentType === 'nik') {
                    url = '/api/v3/validate?type=nik&nik=' + encodeURIComponent(num);
                    if (apikey) url += '&api_key=' + encodeURIComponent(apikey);
                } else if (currentType === 'ai') {
                    url = '/api/v3/validate?type=ai&image=' + encodeURIComponent(num) + '&q=' + encodeURIComponent(code);
                    if (apikey) url += '&api_key=' + encodeURIComponent(apikey);
                }
            }

            try {
                if (currentType === 'ai' && aiInputMode === 'upload' && aiFileInput && aiFileInput.files && aiFileInput.files[0]) {
                    pre.textContent = '// Upload file sementara...';
                    aiUploadedTempUrl = await uploadAiTempFile(aiFileInput.files[0]);
                }
                if (currentType === 'ai') {
                    const imageSource = aiInputMode === 'upload' ? aiUploadedTempUrl : num;
                    url = '/api/v3/validate?type=ai&image=' + encodeURIComponent(imageSource) + '&q=' + encodeURIComponent(code);
                    if (apikey) url += '&api_key=' + encodeURIComponent(apikey);
                }

                const r = await fetch(url);
                const data = await r.json();
                pre.innerHTML = syntaxHighlight(data);
                var aiImageUrl = data && data.data && (data.data.downloadUrl || data.data.url);
                if (currentType === 'ai' && data && data.status && aiImageUrl && imgWrap && imgEl) {
                    fetch('/api/v3/image-base64?url=' + encodeURIComponent(String(aiImageUrl)))
                        .then(function(r){ return r.json(); })
                        .then(function(imgRes){
                            if (imgRes && imgRes.status && imgRes.data && imgRes.data.data_uri) {
                                imgEl.src = imgRes.data.data_uri;
                                imgWrap.classList.remove('hidden');
                                if (imgMeta) {
                                    var kb = data && data.data && data.data.bytes ? Math.round(Number(data.data.bytes || 0) / 1024) : 0;
                                    var code = data && data.data && data.data.code ? String(data.data.code) : '-';
                                    imgMeta.textContent = 'Code: ' + code + (kb > 0 ? (' • ' + kb + ' KB') : '');
                                }
                            }
                        })
                        .catch(function(){});
                }
                statusSpan.textContent = data.status ? '200 OK' : 'ERROR';
                statusSpan.className = 'text-xs font-bold ' + (data.status ? 'text-tertiary bg-tertiary/10' : 'text-error bg-error/10') + ' px-2 py-0.5 rounded';
                statusSpan.classList.remove('hidden');
                showToast(data.message || (data.status ? 'Berhasil diproses.' : 'Terjadi kesalahan.'), data.status ? 'success' : 'error');
            } catch (err) {
                pre.textContent = '// Network Error: Gagal menghubungi server.';
                showToast((err && err.message) ? String(err.message) : 'Gagal menghubungi infrastruktur.', 'error');
            } finally {
                if (runTimerInt) { clearInterval(runTimerInt); runTimerInt = null; }
                btn.innerHTML = orig;
                btn.disabled = false;
            }
        }

        function checkApiKey() {
            const input = document.getElementById('test-key');
            const pill = document.getElementById('apikey-check-pill');
            const text = document.getElementById('apikey-check-text');
            const apikey = (input.value || '').trim();
            if (!apikey) {
                showToast('Masukkan API Key terlebih dahulu.', 'error');
                return;
            }
            pill.classList.remove('hidden');
            pill.className = 'mt-3 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium';
            text.textContent = 'Mengecek...';

            fetch('/api/v3/check-apikey?api_key=' + encodeURIComponent(apikey))
                .then(r => r.json())
                .then(res => {
                    if (res && res.valid) {
                        pill.className = 'mt-3 px-4 py-2 rounded-xl bg-tertiary/10 border border-tertiary/20 text-xs font-bold text-tertiary';
                        text.textContent = 'API Key Valid' + (res.data?.expiry ? ' • Exp: ' + res.data.expiry.slice(0, 10) : '');
                        showToast('Otentikasi berhasil!', 'success');
                    } else {
                        pill.className = 'mt-3 px-4 py-2 rounded-xl bg-error/10 border border-error/20 text-xs font-bold text-error';
                        text.textContent = res.message || 'API Key tidak valid';
                        showToast(text.textContent, 'error');
                    }
                })
                .catch(() => {
                    pill.classList.add('hidden');
                    showToast('Gagal menghubungi server.', 'error');
                });
        }

        function syntaxHighlight(json) {
            if (typeof json !== 'string') json = JSON.stringify(json, undefined, 4);
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\"|[^"])*"(\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)/g, function (match) {
                let cls = 'text-primary';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) cls = 'text-slate-500 dark:text-on-surface-variant';
                    else cls = 'text-tertiary';
                } else if (/true|false/.test(match)) cls = 'text-secondary';
                else if (/null/.test(match)) cls = 'text-slate-400 dark:text-slate-500';
                return '<span class="' + cls + '">' + match + '</span>';
            });
        }

        function toggleZoneField() {
            var ZONE_GAMES = ['region-ml','mlbb-bundle','mlcreate','first-topup','first-mcgg'];
            var svc = document.getElementById('game-service');
            var wrap = document.getElementById('zone-field-wrap');
            if (svc && wrap) wrap.style.display = ZONE_GAMES.includes(svc.value) ? '' : 'none';
        }

        function copyResult() {
            const text = document.getElementById('result-box').innerText;
            navigator.clipboard.writeText(text);
            showToast('Disalin ke clipboard.', 'success');
        }

        function openCodesModal() {
            const modal = document.getElementById('codesModal');
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('opacity-100'), 10);
        }

        function closeCodesModal() {
            const modal = document.getElementById('codesModal');
            modal.classList.remove('opacity-100');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }

        function renderCodeTable(data) {
            const body = document.getElementById('code-list-body');
            if (!body) return;
            let html = '';
            if (!data || data.length === 0) {
                html = '<tr><td class="py-10 text-center text-on-surface-variant italic" colspan="2">Data tidak ditemukan.</td></tr>';
            } else {
                data.forEach(item => {
                    html += '<tr class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-outline-variant/5"><td class="px-4 py-4 text-slate-900 dark:text-white font-medium">' + item.name + '</td><td class="px-4 py-4 font-mono text-primary text-xs font-bold">' + (item.codeid || item.code) + '</td></tr>';
                });
            }
            body.innerHTML = html;
        }

        function filterCodes() {
            const search = document.getElementById('search-code').value.toLowerCase();
            const filtered = allCodes.filter(c => c.name.toLowerCase().includes(search) || (c.codeid || c.code).toLowerCase().includes(search));
            renderCodeTable(filtered);
        }

        function loadPackages() {
            const container = document.getElementById('packages-container');
            if (!container) return;
            fetch('/api/v3/public/packages')
                .then(r => r.json())
                .then(res => {
                    if (res && res.status && res.data?.length > 0) {
                        let html = '';
                        res.data.forEach(pkg => {
                            const features = (pkg.features ? pkg.features.split(',') : []).map(f => '<li class="flex items-center gap-3 text-sm text-slate-600 dark:text-on-surface-variant"><span class="material-symbols-outlined text-sm text-tertiary">verified</span> ' + f.trim() + '</li>').join('');
                            html += 
                                '<div class="p-8 rounded-[2rem] bg-slate-50 dark:bg-[#1a1c20] border border-slate-200 dark:border-outline-variant/10 flex flex-col relative hover:border-primary/30 transition-all shadow-sm hover:shadow-xl dark:shadow-none">' +
                                    '<h3 class="text-2xl font-headline font-extrabold text-slate-900 dark:text-white mb-2">' + pkg.name + '</h3>' +
                                    '<p class="text-xs text-slate-500 dark:text-on-surface-variant mb-8">' + (pkg.description || '') + '</p>' +
                                    '<div class="mb-10"><span class="text-4xl font-extrabold text-slate-900 dark:text-white">Rp' + parseInt(pkg.price).toLocaleString('id-ID') + '</span><span class="text-slate-500 dark:text-on-surface-variant text-xs">/pkt</span></div>' +
                                    '<ul class="space-y-4 mb-10 flex-grow">' + features + '</ul>' +
                                    '<a href="https://t.me/xyz_yaz" target="_blank" class="w-full text-center py-4 rounded-xl bg-slate-200 dark:bg-white/5 text-slate-900 dark:text-white font-bold text-sm transition-all hover:bg-primary hover:text-white dark:hover:text-on-primary">Beli Sekarang</a>' +
                                '</div>';
                        });
                        container.innerHTML = html;
                    }
                });
        }

        function renderBankCodesExample() {
            const el = document.getElementById('bank-codes-example');
            if (!el) return;
            const example = {
                status: true,
                data: [
                    { nama_bank: "Bank Central Asia (BCA)", codeid: "014" },
                    { nama_bank: "Bank Rakyat Indonesia (BRI)", codeid: "002" },
                    { nama_bank: "Bank Mandiri", codeid: "008" },
                    { nama_bank: "...", codeid: "..." }
                ]
            };
            el.innerHTML = syntaxHighlight(example);
        }

        function renderGamesExample(data) {
            const el = document.getElementById('games-example');
            if (!el) return;
            const example = {
                status: true,
                total: data ? data.length : 16,
                data: data ? data.slice(0, 3).concat([{ '...': '...' }]) : [
                    { service: 'free-fire', name: 'Free Fire', category: 'Garena', requires_zone_id: false },
                    { service: 'region-ml', name: 'Mobile Legends – Region', category: 'Mobile Legends', requires_zone_id: true },
                    { '...': '...' }
                ]
            };
            el.innerHTML = syntaxHighlight(example);
        }

        window.onload = () => {
            initTheme();
            fetch('/api/v3/services-status')
                .then(r => r.json())
                .then(res => {
                    if (res && res.status && res.data) applyServiceAvailability(res.data);
                })
                .catch(() => {});
            fetch('/api/v3/codes')
                .then(r => r.json())
                .then(res => {
                    if (res && res.status) {
                        allCodes = res.data || [];
                        renderCodeTable(allCodes);
                    }
                });
            
            selectType('bank');
            renderBankCodesExample();
            fetch('/api/v3/games')
                .then(r => r.json())
                .then(res => {
                    if (res && res.status) {
                        renderGamesExample(res.data);
                        const countEl = document.getElementById('games-count');
                        if (countEl) countEl.textContent = (res.total || res.data.length) + ' game';
                    } else { renderGamesExample(null); }
                })
                .catch(() => renderGamesExample(null));
        };
    </script>
</body>
</html>`;
}

module.exports = { getPublicDocs };
