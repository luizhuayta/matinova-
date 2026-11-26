<?php
declare(strict_types=1);

function site_seed_en(): array
{
    $site = site_seed();
    $site['splashTagline'] = 'IT SOLUTIONS THAT TRANSFORM';
    $site['splashLabel'] = 'LOADING…';
    $site['founderRole'] = 'CEO and founder';
    $site['ctaText'] = 'Need a system installed, not a slide deck?';
    $site['ctaButton'] = 'Talk to an expert';
    $site['whatsappMessage'] = 'Hello Matt Innova Solution, I would like more information.';
    $site['whatsappTooltip'] = 'Write to us now';
    $site['cookieText'] = 'We use cookies to keep this site working. If you continue, we assume you accept them.';
    $site['cookieAccept'] = 'Accept';
    $site['cookieReject'] = 'Reject';
    $site['clientsLabel'] = 'Projects';
    $site['nav'] = [
        'inicio' => 'Home',
        'acerca' => 'About',
        'academy' => 'MIS Academy',
        'academyUrl' => 'https://misacademyonline.com/',
        'servicios' => 'Services',
        'contacto' => 'Contact',
    ];
    $site['navServices'] = [
        ['label' => 'SaaS', 'path' => '/servicios/saas'],
        ['label' => 'Hardware', 'path' => '/servicios/hardware'],
        ['label' => 'Software', 'path' => '/servicios/software'],
        ['label' => 'Consulting', 'path' => '/servicios/consultoria'],
        ['label' => 'IT solutions', 'path' => '/servicios/soluciones-ti'],
    ];
    $site['footer'] = array_merge($site['footer'], [
        'desc' => '30 years implementing software, hardware and IT operations for companies and schools in Peru.',
        'quickTitle' => 'Quick links',
        'popularTitle' => 'Popular links',
        'contactTitle' => 'Get in touch',
        'tagline' => 'Head office in San Vicente de Cañete',
        'copyright' => '©2026. Matt Innova Solution',
        'privacy' => 'Privacy policy',
        'terms' => 'Terms and conditions',
    ]);
    return $site;
}

function pages_seed_en(): array
{
    $privacy = <<<HTML
<h2>1. Information we collect</h2>
<p>Matt Innova Solution collects personal data you provide through contact forms, the claims book, and other interactions on this website.</p>
<h3>1.1 Personal data</h3>
<ul><li>Full name</li><li>Email</li><li>Phone number</li><li>Physical address</li><li>Identity document number (DNI, CE, RUC, passport)</li></ul>
<h2>2. How we use it</h2>
<p>We use your data to answer requests, process claims under Peruvian Law 29571, improve services, send communications with consent, and meet legal duties.</p>
<h2>3. Protection</h2>
<p>Under Law 29733 we apply technical and organizational measures against unauthorized access, alteration, disclosure, or destruction.</p>
<h2>4. Sharing</h2>
<p>We do not sell or rent your data for third-party marketing, except with your consent, to fulfill a request, or when the law requires it.</p>
<h2>5. Your rights</h2>
<p>You may access, rectify, erase, object, or withdraw consent regarding your personal data.</p>
<h2>6. Cookies</h2>
<p>This site uses cookies to improve browsing. You can refuse them in your browser; some features may stop working.</p>
<h2>7. Contact</h2>
<p><strong>Email:</strong> contacto@mattinnovasolution.com<br><strong>Phone:</strong> (+51) 992 422 219<br><strong>Address:</strong> Urb. Libertad Mz.I Lt.5 Calle Las Moras S/N San Vicente - Cañete - Lima - Peru</p>
HTML;

    $terms = <<<HTML
<h2>1. Acceptance</h2>
<p>By using the Matt Innova Solution website you accept these terms. If you disagree, do not use the site.</p>
<h2>2. Use of the site</h2>
<p>Content is for general information. We may suspend or withdraw access without notice.</p>
<h2>3. Intellectual property</h2>
<p>Text, graphics, logos, images, and software on this site belong to Matt Innova Solution or its licensors.</p>
<h2>4. Services</h2>
<p>We describe services as accurately as we can. Descriptions may contain errors and products may differ from images.</p>
<h2>5. Liability</h2>
<p>To the extent allowed by law, Matt Innova Solution is not liable for damages arising from use or inability to use this site.</p>
<h2>6. Third-party links</h2>
<p>We do not control linked third-party sites or their privacy practices.</p>
<h2>7. Claims book</h2>
<p>Under Law 29571 we provide a virtual claims book for complaints about our products or services.</p>
<h2>8. Data protection</h2>
<p>Personal data is treated under our Privacy Policy and Law 29733.</p>
<h2>9. Changes</h2>
<p>We may update these terms. Changes apply when published on this site.</p>
<h2>10. Governing law</h2>
<p>These terms follow the laws of Peru. Disputes are subject to Peruvian courts.</p>
<h2>11. Contact</h2>
<p><strong>Email:</strong> contacto@mattinnovasolution.com<br><strong>Phone:</strong> (+51) 992 422 219<br><strong>Address:</strong> Urb. Libertad Mz.I Lt.5 Calle Las Moras S/N San Vicente - Cañete - Lima - Peru</p>
HTML;

    $clients = cms_clients_page_document();
    $clients['seo']['title'] = 'Clients';
    $clients['seo']['description'] = 'Companies, schools, and alliances that work with Matt Innova Solution.';
    if (isset($clients['blocks'][0]['props'])) {
        $clients['blocks'][0]['props']['title'] = 'Institutions and companies already operating with us.';
        $clients['blocks'][0]['props']['text'] = 'Schools, institutes and companies in Cañete and Peru. Demo URLs are not linked.';
    }
    if (isset($clients['blocks'][1]['props'])) {
        $clients['blocks'][1]['props']['title'] = 'By sector';
        $clients['blocks'][1]['props']['text'] = 'Pick a sector. Until a client authorizes a logo, we show the sector icon.';
    }
    if (isset($clients['blocks'][2]['props'])) {
        $clients['blocks'][2]['props']['title'] = 'Want to work with us?';
        $clients['blocks'][2]['props']['text'] = 'Tell us about your project and we will show similar cases.';
        $clients['blocks'][2]['props']['button'] = 'Contact us';
    }

    return [
        'inicio' => [
            'title' => 'Home',
            'content' => [
                'slides' => [
                    ['badge' => 'TECHNOLOGY · INNOVATION · SOLUTIONS', 'title' => 'Technology that drives your business growth.', 'titleAccent' => 'growth', 'image' => '/images/redesign/hero-laptop.webp'],
                    ['badge' => 'TECHNOLOGY · INNOVATION · SOLUTIONS', 'title' => 'Technology that drives your business growth.', 'titleAccent' => 'growth', 'image' => '/images/redesign/hero-laptop.webp'],
                    ['badge' => 'TECHNOLOGY · INNOVATION · SOLUTIONS', 'title' => 'Technology that drives your business growth.', 'titleAccent' => 'growth', 'image' => '/images/redesign/hero-laptop.webp'],
                ],
                'subtitle' => 'We develop software, web platforms and IT solutions that simplify processes and connect opportunities.',
                'heroSubtitle' => 'We develop software, web platforms and IT solutions that simplify processes and connect opportunities.',
                'heroCta' => 'Explore our services',
                'heroCtaLink' => '/servicios',
                'heroStats' => [
                    ['icon' => 'users', 'number' => '30+', 'label' => 'Years of experience'],
                    ['icon' => 'handshake', 'number' => '4,127', 'label' => 'Clients served'],
                    ['icon' => 'laptop', 'number' => '5', 'label' => 'IT service lines'],
                    ['icon' => 'calendar', 'number' => '24/7', 'label' => 'Online support'],
                ],
                'heroSecondaryCta' => 'View presentation',
                'heroSecondaryLink' => '/acerca-de',
                'about' => [
                    'tag' => '',
                    'title' => 'Custom systems, not a generic package',
                    'text' => 'We implement software, hardware, hosting and consulting for companies and schools. Work is remote across Latin America, with a physical office in San Vicente de Cañete.',
                    'image' => 'about-image.webp',
                    'imageAlt' => 'Professional working in a data center',
                    'cta' => 'About MIS',
                    'ctaLink' => '/acerca-de',
                    'features' => [
                        'Implementation included, not just the license',
                        'Support after go-live',
                        'Contracts and vouchers under SUNAT rules',
                    ],
                ],
                'contactCards' => [
                    ['title' => 'Legal address', 'text' => 'Urb. Libertad Mz. I Lt. 5, Calle Las Moras, San Vicente de Cañete, Lima, Peru', 'icon' => 'bi-geo-alt'],
                    ['title' => 'Email', 'text' => 'contacto@mattinnovasolution.com', 'icon' => 'bi-envelope'],
                    ['title' => 'WhatsApp', 'text' => '+51 992 422 219', 'icon' => 'bi-whatsapp'],
                ],
                'services' => [
                    'tag' => '',
                    'title' => 'Six IT service lines',
                    'text' => 'Technology solutions designed to grow your business',
                    'titleAccent' => 'service',
                    'cards' => [
                        ['img' => 'imac.jpg', 'alt' => 'IT consulting', 'title' => 'IT consulting', 'text' => 'Diagnosis, architecture and an implementation plan with owners, dates and follow-through.', 'icon' => 'bi-briefcase', 'link' => '/servicios/consultoria'],
                        ['img' => 'imas.jpg', 'alt' => 'Information technology', 'title' => 'Information technology', 'text' => 'Networks, servers, backups and monitoring so Lima and the provinces keep running.', 'icon' => 'bi-hdd-network', 'link' => '/servicios/soluciones-ti'],
                        ['img' => 'imat.jpg', 'alt' => 'Management consulting', 'title' => 'Management consulting', 'text' => 'We align processes, indicators and systems so leadership sees the operation without shadow spreadsheets.', 'icon' => 'bi-graph-up', 'link' => '/servicios/consultoria'],
                        ['img' => 'saas.jpg', 'alt' => 'SaaS solutions', 'title' => 'SaaS solutions', 'text' => 'ERP, mail and cloud tools, with go-live, training and support afterwards.', 'icon' => 'bi-cloud', 'link' => '/servicios/saas'],
                        ['img' => 'hardware2026.webp', 'alt' => 'Hardware and infrastructure', 'title' => 'Hardware and infrastructure', 'text' => 'Servers, PCs and cabling sized for each site, installed and left running.', 'icon' => 'bi-pc-display', 'link' => '/servicios/hardware'],
                        ['img' => 'software.webp', 'alt' => 'Custom software development', 'title' => 'Custom software development', 'text' => 'Angular systems and APIs for processes a generic product does not cover in Peru.', 'icon' => 'bi-code-slash', 'link' => '/servicios/software'],
                    ],
                ],
                'innovative' => [
                    'tag' => '',
                    'title' => 'Our services',
                    'text' => 'From web design and systems to automation and information security.',
                    'cta' => 'Discover more',
                    'items' => [
                        ['title' => 'IT solutions', 'desc' => 'Infrastructure and platforms for daily work.', 'img' => 'sol_ti.jpg'],
                        ['title' => 'SaaS', 'desc' => 'Software you run in the browser so you can focus on the business.', 'img' => 'saas.jpg'],
                        ['title' => 'Hardware', 'desc' => 'Servers and workstations sized for the job.', 'img' => 'hardware2026.webp'],
                        ['title' => 'Software', 'desc' => 'Custom software for your processes.', 'img' => 'software.webp'],
                        ['title' => 'Consulting', 'desc' => 'IT consultants for networks, cloud, and security.', 'img' => 'consultoria.jpg'],
                    ],
                ],
                'testimonials' => [
                    'tag' => '',
                    'title' => 'What clients say after an implementation',
                    'text' => 'Named institutions in Cañete that run systems we installed.',
                    'cta' => 'Learn more',
                    'items' => [
                        ['text' => 'A professional team that understands our needs and solves problems quickly.', 'client' => 'IEI Nº 449 San Luis – Cañete', 'logo' => 'sanluis.jpg', 'role' => 'Client', 'company' => 'Matt Innova Solution', 'rating' => 5],
                        ['text' => 'Matt Innova Solution improved our IT infrastructure and offers exceptional support.', 'client' => 'IESTP TECNOCOM', 'logo' => 'tecnocom.jpg', 'role' => 'Client', 'company' => 'Matt Innova Solution', 'rating' => 5],
                        ['text' => 'The ERP and other solutions optimized our processes and increased efficiency.', 'client' => 'IESTP WORLDNET', 'logo' => 'worldnet.jpg', 'role' => 'Client', 'company' => 'Matt Innova Solution', 'rating' => 5],
                    ],
                ],
                'faq' => function_exists('cms_studio_faq_items') ? cms_studio_faq_items('en') : [
                    'title' => 'Questions from finance and IT',
                    'items' => [],
                ],
            ],
        ],
        'acerca-de' => [
            'title' => 'About',
            'content' => [
                'heroBadge' => '',
                'heroTitle' => 'A team in Cañete, operations across Peru.',
                'heroTitleAccent' => 'Cañete',
                'heroText' => '30 years installing software, hardware and networks. Remote work across Latin America, head office in San Vicente de Cañete.',
                'heroCta' => 'Talk to an expert',
                'heroImage' => 'expertos.webp',
                'stats' => [
                    ['icon' => 'bi-calendar3', 'number' => '30+', 'label' => 'Years of experience'],
                    ['icon' => 'bi-people', 'number' => '4,127', 'label' => 'Clients served'],
                    ['icon' => 'bi-layers', 'number' => '5', 'label' => 'IT service lines'],
                    ['icon' => 'bi-headset', 'number' => '24/7', 'label' => 'Support in Lima and the provinces'],
                ],
                'aboutTag' => '',
                'aboutTitle' => 'IT solutions that change how businesses work',
                'aboutText' => 'We help companies grow with technology. The team is based in San Vicente de Cañete and works remotely across Latin America.',
                'aboutImage' => 'about-image.webp',
                'aboutImageAlt' => 'Professional working in a data center',
                'aboutCta' => 'Talk to an expert',
                'features' => [
                    'Experience on complex projects',
                    'Work scoped to each client',
                    'Ongoing support after go-live',
                ],
                'teamTag' => '',
                'teamTitle' => 'The people at MIS',
                'teamText' => 'Engineers and consultants who install and run the systems',
                'team' => [
                    ['name' => 'Giovanni Risco Collazos', 'role' => 'Web development', 'image' => 'giovani.jpg', 'linkedin' => '', 'github' => ''],
                    ['name' => 'Pedro Alex Taya Yactayo', 'role' => 'CEO and founder', 'image' => 'taya.jpg', 'linkedin' => '', 'github' => ''],
                ],
                'contactCards' => [
                    ['title' => 'Head office', 'text' => "Urb. Libertad Mz.I Lt.5 Calle Las Moras S/N\nSan Vicente - Cañete - Lima - Peru", 'icon' => 'bi-geo-alt'],
                    ['title' => 'Email', 'text' => 'contacto@mattinnovasolution.com', 'icon' => 'bi-envelope'],
                    ['title' => 'WhatsApp', 'text' => '+51 992 422 219', 'icon' => 'bi-whatsapp'],
                ],
                'videosTag' => '',
                'videosTitle' => 'Latest on YouTube',
                'videosText' => 'Technical walkthroughs from the company channel',
                'videos' => [
                    ['embed' => 'https://www.youtube.com/embed/RtNdTuCxWoI', 'user' => '@mattinnovasolution', 'title' => 'Local Microsoft partner relationship and Microsoft 365 tenant'],
                    ['embed' => 'https://www.youtube.com/embed/RtNdTuCxWoI', 'user' => '@mattinnovasolution', 'title' => 'Local Microsoft partner relationship and Microsoft 365 tenant'],
                ],
            ],
        ],
        'servicios' => [
            'title' => 'Services',
            'content' => [
                'heroImage' => 'INFRAESTRUCTURAIT.webp',
                'heroTitle' => 'Six lines, each one through go-live.',
                'heroText' => 'Software, hardware, SaaS, consulting, management and infrastructure. We quote with owners and dates, not a license catalog.',
                'subtitle' => '',
                'title' => 'What we implement',
                'cards' => [
                    ['path' => '/servicios/consultoria', 'img' => 'imac.jpg', 'title' => 'IT consulting', 'text' => 'Diagnosis, architecture and an implementation plan with owners, dates and follow-through.', 'link' => 'View consulting'],
                    ['path' => '/contacto', 'img' => 'imat.jpg', 'title' => 'Management consulting', 'text' => 'We align processes, indicators and systems so leadership sees the operation without shadow spreadsheets.', 'link' => 'Ask about it'],
                    ['path' => '/servicios/soluciones-ti', 'img' => 'imas.jpg', 'title' => 'Information technology', 'text' => 'Networks, servers, backups and monitoring so Lima and the provinces keep running.', 'link' => 'View IT solutions'],
                    ['path' => '/servicios/saas', 'img' => 'saas.jpg', 'title' => 'SaaS solutions', 'text' => 'ERP, mail and cloud tools, with go-live, training and support afterwards.', 'link' => 'View SaaS'],
                    ['path' => '/servicios/hardware', 'img' => 'hardware2026.webp', 'title' => 'Hardware and infrastructure', 'text' => 'Servers, PCs and cabling sized for each site, installed and left running.', 'link' => 'View hardware'],
                    ['path' => '/servicios/software', 'img' => 'software.webp', 'title' => 'Custom software development', 'text' => 'Angular systems and APIs for processes a generic product does not cover in Peru.', 'link' => 'View software'],
                ],
                'ctaTitle' => 'Tell us the system that is not closing',
                'ctaText' => 'An expert reviews the case and answers with scope, not a template.',
                'ctaButton' => 'Talk to an expert',
            ],
        ],
        'servicios-software' => [
            'title' => 'Software',
            'content' => service_page_seed(
                '/software-banner.webp',
                'Software banner',
                '/software.webp',
                'Person programming',
                'Service',
                'Software',
                'We design and implement custom software: ERP, research repositories, ecommerce, and Microsoft 365 workplaces.',
                [
                    ['img' => '/microsoft3651.webp', 'title' => 'Microsoft 365', 'text' => 'Implementations of collaborative digital workplaces with Microsoft 365.'],
                    ['img' => '/dspace.jpg', 'title' => 'Research repository', 'text' => 'DSpace on VPS, aligned with RENATI and CONCYTEC, with SOLR search and AWStat.'],
                    ['img' => '/erp.jpg', 'title' => 'ERP software', 'text' => 'Commercial ERP for multiple companies, users, and branches.'],
                    ['img' => 'ecommerce.jpeg', 'title' => 'Ecommerce site', 'text' => 'Online store with hosting, domain, payment gateways, and an admin panel.'],
                    ['img' => '/windows.jpg', 'title' => 'Windows Server 2022', 'text' => 'Secure-core servers for critical workloads, managed with Windows Admin Center and Azure Arc.'],
                    ['img' => '/windows-server-azure-arc.jpg', 'title' => 'Windows Server and Azure Arc', 'text' => 'Extend the datacenter to Azure and manage servers from one control plane.'],
                ],
                'en'
            ),
        ],
        'servicios-saas' => [
            'title' => 'SaaS',
            'content' => service_page_seed(
                '/saas2026.webp',
                'SaaS banner',
                '/saas.jpg',
                'SaaS',
                'Service',
                'SaaS (Software as a Service)',
                'Cloud software without local installs. We host, update, and support the system so you can run the business.',
                [
                    ['img' => '/microsoft3651.webp', 'title' => 'Microsoft 365', 'text' => 'Collaborative digital workplaces with Microsoft 365.'],
                    ['img' => '/dspace.jpg', 'title' => 'Research repository', 'text' => 'DSpace on VPS with RENATI and CONCYTEC alignment.'],
                    ['img' => '/creacion.jpg', 'title' => 'Website creation', 'text' => 'Plans that include domain, subdomains, and corporate email.'],
                    ['img' => '/infreaestructura.jpg', 'title' => 'Technology infrastructure', 'text' => 'Code on Bitbucket and GitHub, cloud on DigitalOcean, security with Cloudflare.'],
                    ['img' => '/erp.jpg', 'title' => 'ERP software', 'text' => 'Commercial ERP for multiple companies, users, and branches.'],
                    ['img' => '/modulos.jpg', 'title' => 'General modules', 'text' => 'Sales, purchasing, cash, products, warehouse, and reports.'],
                ],
                'en'
            ),
        ],
        'servicios-hardware' => [
            'title' => 'Hardware',
            'content' => service_page_seed(
                '/hardware2026.webp',
                'Hardware banner',
                '/hardware2026.webp',
                'Hardware',
                'Service',
                'Hardware',
                'Servers and workstations sized for each client, from HPE ProLiant to Lenovo ThinkSystem.',
                [
                    ['img' => '/ServidoresHPE.jpg', 'title' => 'HPE ProLiant servers', 'text' => 'Compute for hybrid environments, including AI workloads.'],
                    ['img' => '/INFRAESTRUCTURAIT.jpg', 'title' => 'Lenovo IT infrastructure', 'text' => 'Lenovo ThinkSystem servers for reliable uptime.'],
                ],
                'en'
            ),
        ],
        'servicios-consultoria' => [
            'title' => 'Consulting',
            'content' => service_page_seed(
                '/consultoria.webp',
                'Consulting banner',
                '/consultoria.jpg',
                'IT consulting',
                'Service',
                'Consulting',
                'IT consultants who identify improvements and run the implementation: projects, networks, cloud, and security.',
                [
                    ['img' => '/expertos.jpg', 'title' => 'IT specialists', 'text' => 'More than 30 years installing networks, systems and processes in Peru.'],
                    ['img' => '/personalizado.jpg', 'title' => 'Scope per site', 'text' => 'Owners, dates and follow-through; consulting does not end with the report.'],
                    ['img' => '/resultados.jpg', 'title' => 'Go-live', 'text' => 'The plan closes when the change is in operation, not in a slide deck.'],
                ],
                'en'
            ),
        ],
        'servicios-soluciones-ti' => [
            'title' => 'IT solutions',
            'content' => service_page_seed(
                '/soluciones.webp',
                'IT solutions banner',
                '/sol_ti.jpg',
                'IT solutions',
                'Service',
                'IT solutions',
                'Networks, Microsoft 365, Google Workspace, and collaborative platforms installed as a working system, not a slide deck.',
                [
                    ['img' => '/integridad.jpg', 'title' => 'Coverage', 'text' => 'Networks, mail and backups in one implementation plan.'],
                    ['img' => '/adaptabilidad.jpg', 'title' => 'Room to grow', 'text' => 'Infrastructure scales with branches, not with emergency recabling.'],
                    ['img' => '/transformacion_digital.jpg', 'title' => 'Digital operations', 'text' => 'Microsoft 365 or Workspace on the network you already have.'],
                ],
                'en'
            ),
        ],
        'contacto' => [
            'title' => 'Contact',
            'content' => [
                'badge' => '',
                'title' => 'Write with the problem, not an empty brief.',
                'heroTitleAccent' => 'problem',
                'text' => 'Head office in San Vicente de Cañete. WhatsApp and email answered the same business day.',
                'heroImage' => 'expertos.webp',
                'cards' => [
                    ['title' => 'Head office', 'text' => 'Urb. Libertad Mz. I Lt. 5, Calle Las Moras, San Vicente de Cañete, Lima, Peru', 'icon' => 'bi-geo-alt'],
                    ['title' => 'Email', 'text' => 'contacto@mattinnovasolution.com', 'icon' => 'bi-envelope'],
                    ['title' => 'WhatsApp', 'text' => '+51 992 422 219', 'icon' => 'bi-whatsapp'],
                ],
                'submitLabel' => 'Send message',
                'fields' => [
                    'name' => true,
                    'email' => true,
                    'phone' => true,
                    'subject' => true,
                    'message' => true,
                ],
                'placeholders' => [
                    'name' => 'Your name',
                    'email' => 'Your email',
                    'phone' => 'Phone (9 digits)',
                    'subject' => 'Subject',
                    'message' => 'Message',
                ],
                'destinationEmail' => 'contacto@mattinnovasolution.com',
            ],
        ],
        'privacidad' => [
            'title' => 'Privacy',
            'content' => [
                'title' => 'Privacy policy',
                'lastUpdated' => 'September 2026',
                'body' => $privacy,
            ],
        ],
        'terminos' => [
            'title' => 'Terms',
            'content' => [
                'title' => 'Terms and conditions',
                'lastUpdated' => 'September 2026',
                'body' => $terms,
            ],
        ],
        'libro-reclamaciones' => [
            'title' => 'Claims book',
            'content' => [
                'title' => 'Virtual claims book',
                'company' => 'Matt Innova Solution',
                'subtitle' => 'Under the Consumer Protection and Defense Code (Law 29571) and its regulation.',
                'logo' => 'logo.svg',
                'ruc' => '20612286745',
                'destinationEmail' => 'libroreclamaciones@mattinnovasolution.com',
                'disclaimer1' => 'Filing a claim here does not block other dispute paths and is not a requirement before complaining to INDECOPI.',
                'disclaimer2' => 'Under Law 29733, registered data is treated confidentially to manage and answer your complaint within the legal term.',
                'submitLabel' => 'Send virtual claim',
            ],
        ],
        'clientes' => [
            'title' => 'Clients',
            'show_in_menu' => false,
            'content' => $clients,
        ],
    ];
}

function seed_english_locale(): void
{
    $pdo = db();
    $siteCount = (int) $pdo->query("SELECT COUNT(*) FROM site_settings WHERE locale = 'en'")->fetchColumn();
    if ($siteCount === 0) {
        $ins = $pdo->prepare('INSERT INTO site_settings (locale, content) VALUES (?, ?)');
        $ins->execute(['en', json_encode(migrate_cms_document(site_seed_en(), 'sitio'), JSON_UNESCAPED_UNICODE)]);
    }
    $pages = pages_seed_en();
    $check = $pdo->prepare('SELECT slug FROM pages WHERE slug = ? AND locale = ?');
    $ins = $pdo->prepare('INSERT INTO pages (slug, locale, title, content, path, show_in_menu, menu_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $order = 10;
    $known = cms_known_page_paths();
    foreach ($pages as $slug => $page) {
        $check->execute([$slug, 'en']);
        if ($check->fetch()) {
            $order += 10;
            continue;
        }
        $content = $slug === 'clientes'
            ? $page['content']
            : migrate_cms_document($page['content'], $slug);
        if ($slug === 'contacto' && is_array($content['blocks'] ?? null)) {
            $content['blocks'] = array_values(array_filter(
                $content['blocks'],
                static fn ($block) => !in_array($block['type'] ?? '', ['faq', 'map'], true)
            ));
            $content['blocks'] = array_merge($content['blocks'], cms_contacto_support_blocks('en'));
        }
        $path = cms_page_path_for($slug, $known[$slug] ?? null);
        $show = !empty($page['show_in_menu']) ? 1 : 0;
        $ins->execute([$slug, 'en', $page['title'], json_encode($content, JSON_UNESCAPED_UNICODE), $path, $show, $order]);
        $order += 10;
    }
}
