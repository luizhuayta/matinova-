<?php
declare(strict_types=1);

if (!function_exists('cms_clients_page_document')) {
    require_once __DIR__ . '/clients-catalog.php';
}
require_once __DIR__ . '/seed-en.php';

function site_seed(): array
{
    return [
        'logo' => 'logo.svg',
        'logoAlt' => 'Matt Innova Solution',
        'showSplash' => true,
        'splashSeconds' => 3,
        'splashImages' => [
            ['image' => 'splash/mis-academy.webp', 'alt' => 'MIS Academy'],
            ['image' => 'splash/matt-innova.webp', 'alt' => 'Matt Innova Solution'],
        ],
        'splashTagline' => 'SOLUCIONES TI QUE TRANSFORMAN',
        'splashLabel' => 'CARGANDO…',
        'founderName' => 'Ing. Pedro Alex Taya Yactayo',
        'founderRole' => 'CEO y fundador',
        'founderImage' => 'taya.jpg',
        'showCtaBanner' => true,
        'ctaText' => '¿Necesitas una solución web para tu negocio?',
        'ctaEmail' => 'contacto@mattinnovasolution.com',
        'ctaButton' => 'Contáctanos',
        'showWhatsapp' => true,
        'whatsappNumber' => '51992422219',
        'whatsappMessage' => 'Hola Matt Innova Solution, quisiera recibir más información.',
        'whatsappTooltip' => 'Escríbenos ahora',
        'showChatbot' => true,
        'chatbotMode' => 'clasico',
        'aiProvider' => 'openrouter',
        'aiModel' => 'openai/gpt-4o-mini',
        'aiBaseUrl' => 'https://openrouter.ai/api/v1',
        'defaultLocale' => 'es',
        'locales' => ['es', 'en'],
        'cookieText' => 'Usamos cookies para asegurar que te damos la mejor experiencia en nuestra web. Si continúas usando este sitio, asumiremos que estás de acuerdo con ello.',
        'cookieAccept' => 'Aceptar',
        'cookieReject' => 'Rechazar',
        'showClientsToggle' => true,
        'clientsLabel' => 'Proyectos',
        'animateCarousels' => true,
        'nav' => [
            'inicio' => 'Inicio',
            'acerca' => 'Nosotros',
            'academy' => 'MIS Academy',
            'academyUrl' => 'https://misacademyonline.com/',
            'servicios' => 'Servicios',
            'contacto' => 'Contacto',
        ],
        'navServices' => [
            ['label' => 'SAAS', 'path' => '/servicios/saas'],
            ['label' => 'Hardware', 'path' => '/servicios/hardware'],
            ['label' => 'Software', 'path' => '/servicios/software'],
            ['label' => 'Consultoría', 'path' => '/servicios/consultoria'],
            ['label' => 'Soluciones TI', 'path' => '/servicios/soluciones-ti'],
        ],
        'footer' => [
            'desc' => '30 años implementando software, hardware y operación TI para empresas y entidades educativas en Perú.',
            'quickTitle' => 'Enlaces rápidos',
            'popularTitle' => 'Enlaces populares',
            'contactTitle' => 'Contacto',
            'tagline' => 'Casa matriz en San Vicente de Cañete',
            'address' => 'Urb. Libertad - Calle Las Moras',
            'phone' => '(+51) 992 422 219',
            'email' => 'contacto@mattinnovasolution.com',
            'copyright' => '©2026. Matt Innova Solution - Soluciones TI que Transforman',
            'privacy' => 'Política de Privacidad',
            'terms' => 'Términos y Condiciones',
            'libroImage' => 'libro.jpg',
            'youtube' => 'https://www.youtube.com/@mattinnovasolution',
            'facebook' => 'https://www.facebook.com/share/1ENnqk4FuT/',
            'linkedin' => 'https://www.linkedin.com/company/mattinnovasolution/',
            'instagram' => 'https://www.instagram.com/mattinnovasolution?igsh=eHRqdTU5NTJzcHg0',
        ],
    ];
}

function pages_seed(): array
{
    $privacidad = <<<HTML
<h2>1. Información que Recopilamos</h2>
<p>En Matt Innova Solution, recopilamos información personal que usted nos proporciona voluntariamente a través de nuestros formularios de contacto, libro de reclamaciones y otras interacciones en nuestro sitio web.</p>
<h3>1.1 Datos Personales</h3>
<ul><li>Nombre completo</li><li>Correo electrónico</li><li>Número de teléfono</li><li>Dirección física</li><li>Número de documento de identidad (DNI, CE, RUC, Pasaporte)</li></ul>
<h2>2. Uso de la Información</h2>
<p>Utilizamos su información personal para:</p>
<ul><li>Responder a sus consultas y solicitudes de información</li><li>Procesar sus reclamaciones de acuerdo con la Ley N° 29571</li><li>Mejorar nuestros servicios y productos</li><li>Enviarle comunicaciones sobre nuestros servicios (con su consentimiento)</li><li>Cumplir con obligaciones legales</li></ul>
<h2>3. Protección de Datos</h2>
<p>De conformidad con la Ley N° 29733 de Protección de Datos Personales, implementamos medidas de seguridad técnicas y organizativas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.</p>
<h2>4. Compartición de Información</h2>
<p>No vendemos, alquilamos ni compartimos su información personal con terceros para sus fines de marketing, excepto cuando:</p>
<ul><li>Tenemos su consentimiento explícito</li><li>Es necesario para procesar sus solicitudes</li><li>Lo exige la ley</li></ul>
<h2>5. Sus Derechos</h2>
<p>De acuerdo con la Ley N° 29733, usted tiene derecho a:</p>
<ul><li>Acceder a sus datos personales</li><li>Rectificar datos inexactos o incompletos</li><li>Solicitar la eliminación de sus datos</li><li>Oponerse al tratamiento de sus datos</li><li>Revocar su consentimiento</li></ul>
<h2>6. Cookies</h2>
<p>Nuestro sitio web utiliza cookies para mejorar su experiencia de navegación. Puede configurar su navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades del sitio.</p>
<h2>7. Contacto</h2>
<p>Para ejercer sus derechos o realizar consultas sobre esta política de privacidad, contáctenos a:</p>
<p><strong>Email:</strong> contacto@mattinnovasolution.com<br><strong>Teléfono:</strong> (+51) 992 422 219<br><strong>Dirección:</strong> Urb. Libertad Mz.I Lt.5 Calle Las Moras S/N San Vicente - Cañete - Lima - Perú</p>
HTML;

    $terminos = <<<HTML
<h2>1. Aceptación de Términos</h2>
<p>Al acceder y utilizar el sitio web de Matt Innova Solution, usted acepta cumplir con estos términos y condiciones. Si no está de acuerdo con alguno de estos términos, por favor no utilice nuestro sitio web.</p>
<h2>2. Uso del Sitio Web</h2>
<p>El contenido de este sitio web es solo para su información general. Nos reservamos el derecho de suspender o retirar el acceso al sitio sin previo aviso.</p>
<h2>3. Propiedad Intelectual</h2>
<p>Todo el contenido de este sitio web, incluyendo texto, gráficos, logotipos, imágenes y software, es propiedad de Matt Innova Solution o sus licenciantes y está protegido por las leyes de propiedad intelectual.</p>
<h2>4. Servicios y Productos</h2>
<p>Nos esforzamos por describir con precisión nuestros servicios y productos. Sin embargo, no garantizamos que las descripciones sean completamente libres de errores o que los productos sean idénticos a las imágenes mostradas.</p>
<h2>5. Limitación de Responsabilidad</h2>
<p>En la máxima medida permitida por la ley, Matt Innova Solution no será responsable por ningún daño directo, indirecto, incidental o consecuente que resulte del uso o la incapacidad de usar nuestro sitio web.</p>
<h2>6. Enlaces a Terceros</h2>
<p>Nuestro sitio web puede contener enlaces a sitios web de terceros. No tenemos control sobre estos sitios y no somos responsables de su contenido o prácticas de privacidad.</p>
<h2>7. Libro de Reclamaciones</h2>
<p>De conformidad con la Ley N° 29571, ponemos a disposición el Libro de Reclamaciones Virtual para atender cualquier disconformidad relacionada con nuestros productos o servicios.</p>
<h2>8. Protección de Datos</h2>
<p>El tratamiento de sus datos personales se rige por nuestra Política de Privacidad, la cual recomendamos leer detenidamente. Cumplimos con la Ley N° 29733 de Protección de Datos Personales.</p>
<h2>9. Modificaciones</h2>
<p>Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en el sitio web.</p>
<h2>10. Ley Aplicable</h2>
<p>Estos términos y condiciones se rigen por las leyes del Perú. Cualquier disputa estará sujeta a la jurisdicción exclusiva de los tribunales peruanos.</p>
<h2>11. Contacto</h2>
<p>Para cualquier pregunta sobre estos términos y condiciones, contáctenos a:</p>
<p><strong>Email:</strong> contacto@mattinnovasolution.com<br><strong>Teléfono:</strong> (+51) 992 422 219<br><strong>Dirección:</strong> Urb. Libertad Mz.I Lt.5 Calle Las Moras S/N San Vicente - Cañete - Lima - Perú</p>
HTML;

    return [
        'inicio' => [
            'title' => 'Inicio',
            'content' => [
                'slides' => [
                    ['badge' => 'TECNOLOGÍA · INNOVACIÓN · SOLUCIONES', 'title' => 'Tecnología que impulsa el crecimiento de tu negocio.', 'titleAccent' => 'crecimiento', 'image' => '/images/redesign/hero-laptop.webp'],
                    ['badge' => 'TECNOLOGÍA · INNOVACIÓN · SOLUCIONES', 'title' => 'Tecnología que impulsa el crecimiento de tu negocio.', 'titleAccent' => 'crecimiento', 'image' => '/images/redesign/hero-laptop.webp'],
                    ['badge' => 'TECNOLOGÍA · INNOVACIÓN · SOLUCIONES', 'title' => 'Tecnología que impulsa el crecimiento de tu negocio.', 'titleAccent' => 'crecimiento', 'image' => '/images/redesign/hero-laptop.webp'],
                ],
                'subtitle' => 'Desarrollamos software, plataformas web y soluciones TI que simplifican procesos y conectan oportunidades.',
                'heroSubtitle' => 'Desarrollamos software, plataformas web y soluciones TI que simplifican procesos y conectan oportunidades.',
                'heroCta' => 'Conoce nuestros servicios',
                'heroCtaLink' => '/servicios',
                'about' => [
                    'tag' => '',
                    'title' => 'Sistemas a medida, no un paquete genérico',
                    'text' => 'Impulsamos empresas e instituciones con software, hardware, hosting y consultoría. El trabajo es remoto en Latinoamérica, con dirección física en San Vicente de Cañete y un equipo que acompaña la puesta en marcha.',
                    'image' => 'about-image.webp',
                    'imageAlt' => 'Profesional trabajando en un centro de datos',
                    'cta' => 'Conocer a MIS',
                    'ctaLink' => '/acerca-de',
                    'features' => [
                        'Implementación incluida, no solo la licencia',
                        'Soporte después de la puesta en marcha',
                        'Contratos y comprobantes según SUNAT',
                    ],
                ],
                'contactCards' => [
                    ['title' => 'Domicilio legal', 'text' => 'Urb. Libertad Mz.I Lt.5 Calle Las Moras S/N San Vicente - Cañete - Lima - Perú', 'icon' => 'bi-geo-alt'],
                    ['title' => 'Correo', 'text' => 'contacto@mattinnovasolution.com', 'icon' => 'bi-envelope'],
                    ['title' => 'WhatsApp', 'text' => '+51 992 422 219', 'icon' => 'bi-whatsapp'],
                ],
                'services' => [
                    'tag' => '',
                    'title' => 'Cinco líneas de servicio TI',
                    'text' => 'Soluciones tecnológicas diseñadas para hacer crecer tu empresa',
                    'titleAccent' => 'servicio',
                    'cards' => [
                        ['img' => 'imac.jpg', 'alt' => 'Consultoría', 'title' => 'Consultoría', 'text' => 'Diagnóstico, arquitectura y plan de implementación, con procesos e indicadores alineados para que gerencia vea la operación.', 'icon' => 'bi-briefcase', 'link' => '/servicios/consultoria'],
                        ['img' => 'imas.jpg', 'alt' => 'Tecnología de la información', 'title' => 'Tecnología de la información', 'text' => 'Redes, servidores, copias y monitoreo para que Lima y provincias no se detengan.', 'icon' => 'bi-hdd-network', 'link' => '/servicios/soluciones-ti'],
                        ['img' => 'saas.jpg', 'alt' => 'Soluciones SaaS', 'title' => 'Soluciones SaaS', 'text' => 'ERP, correo y herramientas en la nube, con puesta en marcha, capacitación y soporte posterior.', 'icon' => 'bi-cloud', 'link' => '/servicios/saas'],
                        ['img' => 'hardware2026.webp', 'alt' => 'Hardware e infraestructura', 'title' => 'Hardware e infraestructura', 'text' => 'Servidores, PCs y cableado dimensionados para tu sede, instalados y dejados operando.', 'icon' => 'bi-pc-display', 'link' => '/servicios/hardware'],
                        ['img' => 'software.webp', 'alt' => 'Desarrollo de software a medida', 'title' => 'Desarrollo de software a medida', 'text' => 'Sistemas Angular y APIs para procesos que un producto genérico no cubre en el Perú.', 'icon' => 'bi-code-slash', 'link' => '/servicios/software'],
                    ],
                ],
                'innovative' => [
                    'tag' => 'Cinco líneas de trabajo',
                    'title' => 'Software, hardware y la operación que los sostiene',
                    'text' => 'Diseño web, sistemas, automatización y seguridad de la información. Cada línea llega hasta la implementación, no hasta la diapositiva.',
                    'cta' => 'Ver servicios',
                    'ctaLink' => '/servicios',
                    'items' => [
                        ['title' => 'Soluciones TI', 'desc' => 'Redes, colaboración y la infraestructura para trabajar todos los días.', 'img' => 'sol_ti.jpg'],
                        ['title' => 'SaaS', 'desc' => 'Software en la nube para que el negocio se concentre en operar.', 'img' => 'saas.jpg'],
                        ['title' => 'Hardware', 'desc' => 'Equipos y servidores dimensionados para el trabajo real de cada sede.', 'img' => 'hardware2026.webp'],
                        ['title' => 'Software', 'desc' => 'Desarrollo a medida para procesos que un producto genérico no cubre.', 'img' => 'software.webp'],
                        ['title' => 'Consultoría', 'desc' => 'Diagnóstico e implementación con el mismo equipo que luego da soporte.', 'img' => 'consultoria.jpg'],
                    ],
                ],
                'testimonials' => [
                    'tag' => 'Instituciones que ya operan con MIS',
                    'title' => 'Lo que cambió después de implementar',
                    'text' => 'Los colegios e institutos de Cañete no pedían una web más: pedían sistemas que aguantaran el día a día.',
                    'cta' => 'Escribir a MIS',
                    'ctaLink' => '/contacto',
                    'items' => [
                        ['text' => 'Un equipo que entiende lo que necesitamos y resuelve sin dar vueltas. El soporte llega cuando la operación no puede esperar.', 'client' => 'IEI Nº 449 San Luis – Cañete', 'logo' => 'sanluis.jpg', 'role' => 'Institución educativa', 'company' => 'Matt Innova Solution', 'rating' => 5],
                        ['text' => 'Mejoraron la infraestructura TI y el soporte se quedó. No fue un proyecto que se entregó y desapareció.', 'client' => 'IESTP TECNOCOM', 'logo' => 'tecnocom.jpg', 'role' => 'Instituto superior', 'company' => 'Matt Innova Solution', 'rating' => 5],
                        ['text' => 'Los procesos entre áreas estaban dispersos. El ERP y el acompañamiento de Matt Innova Solution dejaron la operación más clara y eficiente.', 'client' => 'IESTP WORLDNET', 'logo' => 'worldnet.jpg', 'role' => 'Instituto superior', 'company' => 'Matt Innova Solution', 'rating' => 5],
                    ],
                ],
                'faq' => function_exists('cms_studio_faq_items') ? cms_studio_faq_items('es') : [
                    'title' => 'Preguntas de finanzas y TI',
                    'items' => [
                        ['question' => '¿Aplican detracción SUNAT a los servicios de TI?', 'answer' => 'Si el contrato califica en el SPOT, aplicamos la tasa vigente sobre el comprobante electrónico. El CIIU y el porcentaje se confirman en la cotización, antes de iniciar el trabajo.'],
                        ['question' => '¿Emiten factura electrónica y registran en SIRE?', 'answer' => 'Sí. Emitimos comprobantes electrónicos y declaramos las operaciones en el SIRE de SUNAT. El RUC va en cada factura; no cerramos un trabajo sin voucher válido.'],
                        ['question' => '¿Cuáles son los tiempos de soporte?', 'answer' => 'Incidencias críticas de servidores: respuesta en menos de 15 minutos en horario de operación. El resto se agenda el mismo día hábil. El SLA queda escrito en el contrato, no en el chat.'],
                        ['question' => '¿Pueden contratar con el Estado en un acuerdo marco?', 'answer' => 'Trabajamos con entidades educativas y públicas. Cada convocatoria o acuerdo marco se revisa contra el expediente. Envíenos el número de procedimiento y confirmamos si calzamos antes de postular.'],
                    ],
                ],
            ],
        ],
        'acerca-de' => [
            'title' => 'Acerca de',
            'content' => [
                'heroBadge' => '',
                'heroTitle' => 'Equipo en Cañete, operación en todo el Perú.',
                'heroTitleAccent' => 'Cañete',
                'heroText' => '30 años instalando software, hardware y redes. Trabajamos remoto en Latinoamérica, con casa matriz en San Vicente de Cañete.',
                'heroCta' => 'Hablar con un experto',
                'heroImage' => 'expertos.webp',
                'stats' => [
                    ['icon' => 'bi-calendar3', 'number' => '30+', 'label' => 'Años de experiencia'],
                    ['icon' => 'bi-people', 'number' => '4,127', 'label' => 'Clientes atendidos'],
                    ['icon' => 'bi-layers', 'number' => '5', 'label' => 'Líneas de servicio TI'],
                    ['icon' => 'bi-headset', 'number' => '24/7', 'label' => 'Soporte en Lima y provincias'],
                ],
                'aboutTag' => '',
                'aboutTitle' => 'Sistemas a medida, no un paquete genérico',
                'aboutText' => 'Impulsamos empresas e instituciones con software, hardware, hosting y consultoría. El trabajo es remoto en Latinoamérica, con dirección física en San Vicente de Cañete y un equipo que acompaña la puesta en marcha.',
                'aboutImage' => 'about-image.webp',
                'aboutImageAlt' => 'Profesional trabajando en un centro de datos',
                'aboutCta' => 'Hablar con un experto',
                'features' => [
                    'Implementación incluida, no solo la licencia',
                    'Soporte después de la puesta en marcha',
                    'Contratos y comprobantes según SUNAT',
                ],
                'teamTag' => '',
                'teamTitle' => 'Quién responde cuando el sistema no arranca',
                'teamText' => 'Nombres reales, cargos reales. El mismo equipo que cotiza también implementa.',
                'team' => [
                    ['name' => 'Giovanni Risco Collazos', 'role' => 'Desarrollo web', 'image' => 'giovani.jpg', 'linkedin' => '', 'github' => ''],
                    ['name' => 'Pedro Alex Taya Yactayo', 'role' => 'CEO y fundador', 'image' => 'taya.jpg', 'linkedin' => '', 'github' => ''],
                ],
                'contactCards' => [
                    ['title' => 'Casa matriz', 'text' => "Urb. Libertad Mz.I Lt.5 Calle Las Moras S/N\nSan Vicente - Cañete - Lima - Perú", 'icon' => 'bi-geo-alt'],
                    ['title' => 'Correo', 'text' => 'contacto@mattinnovasolution.com', 'icon' => 'bi-envelope'],
                    ['title' => 'WhatsApp', 'text' => '+51 992 422 219', 'icon' => 'bi-whatsapp'],
                ],
                'videosTag' => '',
                'videosTitle' => 'Sesiones técnicas en YouTube',
                'videosText' => 'Microsoft 365, partners locales y la operación de cada sede.',
                'videos' => [
                    ['embed' => 'https://www.youtube.com/embed/RtNdTuCxWoI', 'user' => '@mattinnovasolution', 'title' => 'Relacionamiento con Partner Microsoft Local y Tenant Microsoft 365'],
                    ['embed' => 'https://www.youtube.com/embed/zAW2X2805Qw', 'user' => '@mattinnovasolution', 'title' => 'Matt Innova Solution'],
                ],
            ],
        ],
        'servicios' => [
            'title' => 'Servicios',
            'content' => [
                'heroImage' => 'INFRAESTRUCTURAIT.webp',
                'heroTitle' => 'Cinco líneas, cada una hasta la puesta en marcha.',
                'heroText' => 'Software, hardware, SaaS, consultoría e infraestructura. Cotizamos con responsables y fechas, no con un catálogo de licencias.',
                'subtitle' => '',
                'title' => 'Qué implementamos',
                'cards' => [
                    ['path' => '/servicios/consultoria', 'img' => 'imac.jpg', 'title' => 'Consultoría', 'text' => 'Diagnóstico, arquitectura y plan de implementación, con procesos e indicadores alineados para que gerencia vea la operación.', 'link' => 'Ver consultoría'],
                    ['path' => '/servicios/soluciones-ti', 'img' => 'imas.jpg', 'title' => 'Tecnología de la información', 'text' => 'Redes, servidores, copias y monitoreo para que Lima y provincias no se detengan.', 'link' => 'Ver soluciones TI'],
                    ['path' => '/servicios/saas', 'img' => 'saas.jpg', 'title' => 'Soluciones SaaS', 'text' => 'ERP, correo y herramientas en la nube, con puesta en marcha, capacitación y soporte posterior.', 'link' => 'Ver SaaS'],
                    ['path' => '/servicios/hardware', 'img' => 'hardware2026.webp', 'title' => 'Hardware e infraestructura', 'text' => 'Servidores, PCs y cableado dimensionados para tu sede, instalados y dejados operando.', 'link' => 'Ver hardware'],
                    ['path' => '/servicios/software', 'img' => 'software.webp', 'title' => 'Desarrollo de software a medida', 'text' => 'Sistemas Angular y APIs para procesos que un producto genérico no cubre en el Perú.', 'link' => 'Ver software'],
                ],
                'ctaTitle' => 'Cuéntanos el sistema que no está cerrando',
                'ctaText' => 'Un experto revisa el caso y te responde con alcance, no con una plantilla.',
                'ctaButton' => 'Hablar con un experto',
            ],
        ],
        'servicios-software' => [
            'title' => 'Software',
            'content' => service_page_seed(
                '/software-banner.webp',
                'Banner de Software',
                '/software.webp',
                'Persona programando',
                'Servicio',
                'Software',
                'El software es el proceso que hoy está en Excel o en un sistema que ya no aguanta. Desarrollamos Angular y APIs a medida, o implementamos ERP y repositorios (DSpace, Microsoft 365) hasta que el equipo los usa sin nosotros en la sala.',
                [
                    ['img' => '/microsoft3651.webp', 'title' => 'Microsoft 365', 'text' => 'Nuestros profesionales son expertos en Microsoft 365 y cuentan con experiencia en proyectos de implementación de ecosistemas colaborativos digitales.'],
                    ['img' => '/dspace.jpg', 'title' => 'Repositorio de Investigación', 'text' => 'Ofrecemos instalación de DSpace en VPS, cumpliendo normativas RENATI y CONCYTEC, con personalización, búsquedas avanzadas SOLR, y estadísticas AWStat.'],
                    ['img' => '/erp.jpg', 'title' => 'Software ERP', 'text' => 'Ofrecemos software de ERP de gestión comercial, multiempresa, multiusuario y multisucursales. Todo lo que necesitas para comenzar a vender y crecer de inmediato.'],
                    ['img' => 'ecommerce.jpeg', 'title' => 'Página Ecommerce para tu negocio', 'text' => 'Diseñamos y desarrollamos tu tienda virtual a medida. Incluye hosting, dominio, pasarelas de pago seguras y un panel autoadministrable para que gestiones tus productos y vendas en línea sin complicaciones.'],
                    ['img' => '/windows.jpg', 'title' => 'Windows Server 2022', 'text' => 'Protegemos contra amenazas con un servidor de núcleo seguro y gestionamos cargas críticas con 48 TB de memoria y 2048 núcleos. Administra con Windows Admin Center y Azure Arc.'],
                    ['img' => '/windows-server-azure-arc.jpg', 'title' => 'Windows Server y Azure Arc', 'text' => 'Extendemos tu centro de datos a Azure para mejorar la eficiencia. Administramos servidores y modernizamos aplicaciones con Azure Kubernetes Service en Azure Stack HCI.'],
                ]
            ),
        ],
        'servicios-saas' => [
            'title' => 'SaaS',
            'content' => service_page_seed(
                '/saas2026.webp',
                'Banner de SaaS',
                '/saas.jpg',
                'SAAS',
                'Servicio',
                'SAAS (Software as a Service)',
                'SaaS aquí significa correo, ERP y repositorios en la nube con puesta en marcha. Nosotros instalamos, capacitamos y dejamos el soporte; no entregamos un usuario y desaparecemos.',
                [
                    ['img' => '/microsoft3651.webp', 'title' => 'Microsoft 365', 'text' => 'Nuestros profesionales son expertos en Microsoft 365 y cuentan con experiencia en proyectos de implementación de ecosistemas colaborativos digitales.'],
                    ['img' => '/dspace.jpg', 'title' => 'Repositorio de Investigación', 'text' => 'Ofrecemos instalación de DSpace en VPS, cumpliendo normativas RENATI y CONCYTEC, con personalización, búsquedas avanzadas SOLR, y estadísticas AWStat.'],
                    ['img' => '/creacion.jpg', 'title' => 'Creación de página web', 'text' => 'Ofrecemos planes para crear tu página web, con dominio incluido y funciones como subdominios y correos corporativos ilimitados, adaptados a tus necesidades.'],
                    ['img' => '/infreaestructura.jpg', 'title' => 'Infraestructura tecnológica', 'text' => 'Se apoya en plataformas líderes como Bitbucket y GitHub para la gestión de código, DigitalOcean para soluciones en la nube, y Cloudflare para optimizar la seguridad.'],
                    ['img' => '/erp.jpg', 'title' => 'Software ERP', 'text' => 'Ofrecemos software de ERP de gestión comercial, multiempresa, multiusuario y multisucursales. Todo lo que necesitas para comenzar a vender y crecer de inmediato.'],
                    ['img' => '/modulos.jpg', 'title' => 'Módulos Generales', 'text' => 'Brindamos módulos completos para Ventas, Compras, Caja, Productos, Almacén y Reportes. Administra eficientemente cada área y personaliza según tus necesidades.'],
                ]
            ),
        ],
        'servicios-hardware' => [
            'title' => 'Hardware',
            'content' => service_page_seed(
                '/hardware2026.webp',
                'Banner de Hardware',
                '/hardware2026.webp',
                'Hardware',
                'Servicio',
                'Hardware',
                'Servidores HPE ProLiant y Lenovo ThinkSystem, PCs y cableado dimensionados para cada sede. El equipo se instala, se prueba y se deja operando; no es un catálogo con flete.',
                [
                    ['img' => '/ServidoresHPE.jpg', 'title' => 'Servidores HPE ProLiant', 'text' => 'Contamos con computación diseñada para tu mundo híbrido, ya que se puede acelerar los resultados de inteligencia artificial que proporcionan información e innovación.'],
                    ['img' => '/INFRAESTRUCTURAIT.jpg', 'title' => 'Servidores Infraestructura de IT Lenovo', 'text' => 'Ofrecemos servidores Lenovo ThinkSystem, líderes en fiabilidad y tiempo de actividad. Pon tu confianza en nuestra infraestructura de TI para un servicio confiable y eficiente.'],
                ]
            ),
        ],
        'servicios-consultoria' => [
            'title' => 'Consultoría',
            'content' => service_page_seed(
                '/consultoria.webp',
                'Banner de Consultoría',
                '/consultoria.jpg',
                'Consultoría TI',
                'Servicio',
                'Consultoría',
                'Diagnóstico de redes, sistemas y procesos, con un plan de implementación, responsables y fechas. La consultoría termina cuando el cambio está en operación, no cuando se envía el informe.',
                [
                    ['img' => '/expertos.jpg', 'title' => 'Expertos en TI', 'text' => 'Más de 30 años instalando redes, sistemas y procesos en el Perú.'],
                    ['img' => '/personalizado.jpg', 'title' => 'Alcance por sede', 'text' => 'Responsables, fechas y seguimiento; la consultoría no termina en el informe.'],
                    ['img' => '/resultados.jpg', 'title' => 'Puesta en marcha', 'text' => 'El plan cierra cuando el cambio está en operación, no en una presentación.'],
                ]
            ),
        ],
        'servicios-soluciones-ti' => [
            'title' => 'Soluciones TI',
            'content' => service_page_seed(
                '/soluciones.webp',
                'Banner de Soluciones TI',
                '/sol_ti.jpg',
                'Soluciones TI',
                'Servicio',
                'Soluciones TI',
                'Redes, Microsoft 365, Google Workspace y la infraestructura para trabajar todos los días. Integramos lo que ya tienes y dejamos monitoreo y copias funcionando.',
                [
                    ['img' => '/integridad.jpg', 'title' => 'Cobertura', 'text' => 'Redes, correo y copias en un solo plan de implementación.'],
                    ['img' => '/adaptabilidad.jpg', 'title' => 'Espacio para crecer', 'text' => 'La infraestructura escala con sucursales, no con un recableado de emergencia.'],
                    ['img' => '/transformacion_digital.jpg', 'title' => 'Operación digital', 'text' => 'Microsoft 365 o Workspace sobre la red que ya tienes en cada sede.'],
                ]
            ),
        ],
        'contacto' => [
            'title' => 'Contacto',
            'content' => [
                'badge' => '',
                'title' => 'Escríbenos con el problema, no con un briefing vacío.',
                'heroTitleAccent' => 'problema',
                'text' => 'Casa matriz en San Vicente de Cañete. WhatsApp y correo con respuesta el mismo día hábil.',
                'heroImage' => 'expertos.webp',
                'cards' => [
                    ['title' => 'Casa matriz', 'text' => 'Urb. Libertad Mz. I Lt. 5, Calle Las Moras, San Vicente de Cañete, Lima, Perú', 'icon' => 'bi-geo-alt'],
                    ['title' => 'Correo', 'text' => 'contacto@mattinnovasolution.com', 'icon' => 'bi-envelope'],
                    ['title' => 'WhatsApp', 'text' => '+51 992 422 219', 'icon' => 'bi-whatsapp'],
                ],
                'submitLabel' => 'Enviar mensaje',
                'fields' => [
                    'name' => true,
                    'email' => true,
                    'phone' => true,
                    'subject' => true,
                    'message' => true,
                ],
                'placeholders' => [
                    'name' => 'Su nombre',
                    'email' => 'Su correo electrónico',
                    'phone' => 'Teléfono (9 dígitos)',
                    'subject' => 'Asunto',
                    'message' => 'Mensaje',
                ],
                'destinationEmail' => 'contacto@mattinnovasolution.com',
            ],
        ],
        'privacidad' => [
            'title' => 'Privacidad',
            'content' => [
                'title' => 'Política de Privacidad',
                'lastUpdated' => 'Septiembre 2026',
                'body' => $privacidad,
            ],
        ],
        'terminos' => [
            'title' => 'Términos',
            'content' => [
                'title' => 'Términos y Condiciones',
                'lastUpdated' => 'Septiembre 2026',
                'body' => $terminos,
            ],
        ],
        'libro-reclamaciones' => [
            'title' => 'Libro de reclamaciones',
            'content' => [
                'title' => 'Libro de reclamaciones virtual — Ley 29571.',
                'company' => 'Matt Innova Solution',
                'subtitle' => 'Conforme a lo establecido en el Código de Protección y Defensa del Consumidor (Ley N° 29571) y su Reglamento.',
                'logo' => 'logo.svg',
                'ruc' => '20612286745',
                'destinationEmail' => 'libroreclamaciones@mattinnovasolution.com',
                'disclaimer1' => 'La formulación del reclamo en esta hoja no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.',
                'disclaimer2' => 'De conformidad con la Ley N° 29733 de Protección de Datos Personales, los datos registrados serán tratados con absoluta confidencialidad únicamente para la gestión y respuesta de su disconformidad dentro del plazo legal.',
                'submitLabel' => 'Enviar Reclamación Virtual',
            ],
        ],
        'clientes' => [
            'title' => 'Clientes',
            'show_in_menu' => false,
            'content' => cms_clients_page_document(),
        ],
        'sitio' => [
            'title' => 'Apariencia del sitio',
            'content' => site_seed(),
        ],
    ];
}

function service_page_seed(string $hero, string $heroAlt, string $image, string $imageAlt, string $label, string $title, string $text, array $reasons, string $locale = 'es'): array
{
    $isEn = $locale === 'en';
    foreach ($reasons as $i => $reason) {
        if (!is_array($reason)) {
            continue;
        }
        if (!isset($reason['alt']) || trim((string) $reason['alt']) === '') {
            $reasons[$i]['alt'] = (string) ($reason['title'] ?? ($isEn ? 'Reason' : 'Motivo'));
        }
    }
    return [
        'heroImage' => $hero,
        'heroAlt' => $heroAlt,
        'image' => $image,
        'imageAlt' => $imageAlt,
        'label' => $label,
        'title' => $title,
        'text' => $text,
        'cta' => $isEn ? 'Talk to an expert' : 'Hablar con un experto',
        'reasonsSubtitle' => '',
        'reasonsTitle' => $isEn ? 'What gets installed' : 'Qué queda instalado',
        'reasons' => $reasons,
    ];
}

function seed_database(): void
{
    $pdo = db();

    $user = cfg('ADMIN_USER', 'admin');
    $pass = cfg('ADMIN_PASSWORD', 'admin123');
    $exists = $pdo->prepare('SELECT id FROM users WHERE username = ?');
    $exists->execute([$user]);
    if (!$exists->fetch()) {
        $ins = $pdo->prepare('INSERT INTO users (username, password_hash, role, active) VALUES (?, ?, ?, 1)');
        $ins->execute([$user, password_hash($pass, PASSWORD_DEFAULT), 'admin']);
    }

    $editor = cfg('EDITOR_USER', '');
    $editorPass = cfg('EDITOR_PASSWORD', '');
    if ($editor !== '' && $editorPass !== '') {
        $exists->execute([$editor]);
        if (!$exists->fetch()) {
            $ins = $pdo->prepare('INSERT INTO users (username, password_hash, role, active) VALUES (?, ?, ?, 1)');
            $ins->execute([$editor, password_hash($editorPass, PASSWORD_DEFAULT), 'editor']);
        }
    }

    $siteCount = (int) $pdo->query('SELECT COUNT(*) FROM site_settings')->fetchColumn();
    if ($siteCount === 0) {
        $ins = $pdo->prepare('INSERT INTO site_settings (locale, content) VALUES (?, ?)');
        $ins->execute(['es', json_encode(site_seed(), JSON_UNESCAPED_UNICODE)]);
    }

    $pages = pages_seed();
    $check = $pdo->prepare('SELECT slug FROM pages WHERE slug = ? AND locale = ?');
    $ins = $pdo->prepare('INSERT INTO pages (slug, locale, title, content, path, show_in_menu, menu_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $order = 10;
    $known = cms_known_page_paths();
    foreach ($pages as $slug => $page) {
        if ($slug === 'sitio') {
            continue;
        }
        $check->execute([$slug, 'es']);
        if ($check->fetch()) {
            continue;
        }
        $content = migrate_cms_document($page['content'], $slug);
        $path = cms_page_path_for($slug, $known[$slug] ?? null);
        $show = !empty($page['show_in_menu']) ? 1 : 0;
        $ins->execute([$slug, 'es', $page['title'], json_encode($content, JSON_UNESCAPED_UNICODE), $path, $show, $order]);
        $order += 10;
    }
    if (function_exists('seed_english_locale')) {
        seed_english_locale();
    }
}
