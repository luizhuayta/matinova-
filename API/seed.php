<?php
declare(strict_types=1);

if (!function_exists('cms_clients_page_document')) {
    require_once __DIR__ . '/clients-catalog.php';
}

function site_seed(): array
{
    return [
        'logo' => 'logo.svg',
        'logoAlt' => 'Matt Innova Solution',
        'showSplash' => true,
        'splashSeconds' => 3,
        'founderName' => 'Ing. Pedro Alex Taya Yactayo',
        'founderRole' => 'CEO & Founder',
        'founderImage' => 'taya.jpg',
        'splashTagline' => 'SOLUCIONES TI QUE TRANSFORMAN',
        'showCtaBanner' => true,
        'ctaText' => '¿Necesitas una solución web para tu negocio?',
        'ctaEmail' => 'contacto@mattinnovasolution.com',
        'ctaButton' => 'Contáctanos',
        'showWhatsapp' => true,
        'whatsappNumber' => '51992422219',
        'whatsappMessage' => 'Hola Matt Innova Solution, quisiera recibir más información.',
        'whatsappTooltip' => '¡Escríbenos ahora!',
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
        'clientsLabel' => 'Clientes',
        'animateCarousels' => true,
        'nav' => [
            'inicio' => 'Inicio',
            'acerca' => 'Acerca de',
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
            'desc' => 'Innovamos y transformamos tu negocio con soluciones tecnológicas de vanguardia.',
            'quickTitle' => 'Enlaces Rápidos',
            'popularTitle' => 'Enlaces Populares',
            'contactTitle' => 'Ponerse en Contacto',
            'tagline' => 'Soluciones TI que Transforman',
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
                    ['badge' => 'INNOVACIÓN EN TECNOLOGÍA', 'title' => 'Soluciones TI que Transforman para tu empresa', 'image' => 'carousel.jpg'],
                    ['badge' => 'NUESTRO EQUIPO', 'title' => 'Profesionales altamente capacitados en tecnología y consultoría', 'image' => 'carousel.jpg'],
                    ['badge' => 'CLIENTES SATISFECHOS', 'title' => 'Opiniones positivas y casos de éxito en implementación de TI', 'image' => 'carousel.jpg'],
                ],
                'heroCta' => 'Aprender Más',
                'heroCtaLink' => '/servicios/soluciones-ti',
                'about' => [
                    'tag' => 'QUIENES SOMOS',
                    'title' => 'Soluciones TI que Transforman',
                    'text' => 'Nuestra empresa tiene como objetivo principal impulsar el crecimiento de las empresas mediante soluciones tecnológicas innovadoras y de alta calidad, ya que contamos con un equipo de profesionales altamente capacitados y una amplia gama de servicios adaptados a las necesidades de nuestros clientes.',
                    'image' => 'about-image.jpg',
                    'imageAlt' => 'Especialista TI trabajando',
                    'cta' => 'Leer más',
                ],
                'contactCards' => [
                    ['title' => 'Domicilio Legal', 'text' => 'Urb. Libertad Mz.I Lt.5 Calle Las Moras S/N San Vicente - Cañete - Lima - Perú'],
                    ['title' => 'Envíanos un Correo electrónico', 'text' => 'contacto@mattinnovasolution.com'],
                    ['title' => 'WhatsApp', 'text' => '(+51) 992 422 219'],
                ],
                'services' => [
                    'tag' => 'QUÉ HACEMOS',
                    'title' => 'Ofrecemos Servicios',
                    'cards' => [
                        ['img' => 'imac.jpg', 'alt' => 'Consultoría TI', 'title' => 'Consultoría De Informática Y De Gestión De Instalaciones Informáticas', 'text' => 'Ofrecemos servicios de hosting y dominio, diseño y creación de páginas web, desarrollo de sistemas informáticos, implementación de redes, y mucho más.'],
                        ['img' => 'imas.jpg', 'alt' => 'Tecnología', 'title' => 'Actividades De Tecnología De La Información Y De Servicios Informáticos', 'text' => 'Nos especializamos en la automatización de procesos, integración y mantenimiento de sistemas informáticos, soporte técnico, y arquitectura de soluciones TI.'],
                        ['img' => 'imat.jpg', 'alt' => 'Consultoría Gestión', 'title' => 'Actividades De Consultoría De Gestión', 'text' => 'Brindamos nuevos productos y servicios de TI, implementación de ecosistemas de trabajo digital colaborativo, y desarrollo de nuevos sistemas informáticos.'],
                        ['img' => 'integridad.jpg', 'alt' => 'Capacitaciones', 'title' => 'Capacitaciones y Cursos con Certificación', 'text' => 'Ofrecemos cursos especializados en tecnología, impartidos por expertos, con certificaciones que avalan tus conocimientos y mejoran tu perfil profesional.'],
                        ['img' => 'ecommerce.jpeg', 'alt' => 'Ecommerce', 'title' => 'Pagina Ecommerce para tu negocio', 'text' => 'Creamos tu tienda en línea con diseño responsivo, hosting y dominio incluidos. Automatiza tus ventas, integra pasarelas de pago y gestiona tu catálogo de productos de manera fácil y rápida.'],
                        ['img' => 'software.png', 'alt' => 'Web', 'title' => 'Creacion de Paginas Web', 'text' => 'Ofrecemos planes para crear tu página web, con dominio incluido y funciones como subdominios y correos corporativos ilimitados, adaptados a tus necesidades.'],
                    ],
                ],
                'innovative' => [
                    'tag' => 'SERVICIOS INNOVADORES',
                    'title' => 'Conozca Nuestro Servicios',
                    'text' => 'En Matt Innova Solution, brindamos soluciones tecnológicas integrales: desde el diseño web y la implementación de sistemas, hasta la automatización y la seguridad de la información.',
                    'cta' => 'Descubrir más',
                    'items' => [
                        ['title' => 'Soluciones TI', 'desc' => 'Transformamos tu trabajo con soluciones de TI.', 'img' => 'sol_ti.jpg'],
                        ['title' => 'SAAS', 'desc' => 'Gestiona todo, así puedes centrarte en tu negocio.', 'img' => 'saas.jpg'],
                        ['title' => 'Hardware', 'desc' => 'Ofrecemos hardware avanzado para un rendimiento óptimo.', 'img' => 'hard.avif'],
                        ['title' => 'Software', 'desc' => 'Creamos Software a medida para tu negocio', 'img' => 'software.png'],
                        ['title' => 'Consultoria', 'desc' => 'Consultores en TI para transformar tu negocio', 'img' => 'consultoria.jpg'],
                    ],
                ],
                'testimonials' => [
                    'tag' => 'CLIENTES SATISFECHOS',
                    'title' => 'Opiniones positivas y casos de éxito en implementación de TI',
                    'text' => 'En MIS ha sido fundamental en la mejora de nuestras soluciones TI. Su atención personalizada y soporte excepcional nos han ayudado a alcanzar nuestros objetivos tecnológicos con gran éxito.',
                    'cta' => 'Aprender Más',
                    'items' => [
                        ['text' => 'Un equipo profesional como la empresa MIS que entiende nuestras necesidades y resuelve problemas rápidamente.', 'client' => 'IEI Nº 449 San Luis – Cañete', 'logo' => 'sanluis.jpg', 'role' => 'Cliente Satisfecho', 'company' => 'Matt Innova Solution', 'rating' => 5],
                        ['text' => 'Matt Innova Solution mejoró nuestra infraestructura TI y ofrece un soporte excepcional. ¡Recomendados!', 'client' => 'IESTP TECNOCOM', 'logo' => 'tecnocom.jpg', 'role' => 'Cliente Satisfecho', 'company' => 'Matt Innova Solution', 'rating' => 5],
                        ['text' => 'La implementación del ERP y otras soluciones de Matt Innova Solution optimizó nuestros procesos y aumentó la eficiencia.', 'client' => 'IESTP WORLDNET', 'logo' => 'worldnet.jpg', 'role' => 'Cliente Satisfecho', 'company' => 'Matt Innova Solution', 'rating' => 5],
                    ],
                ],
            ],
        ],
        'acerca-de' => [
            'title' => 'Acerca de',
            'content' => [
                'heroBadge' => 'ACERCA DE NOSOTROS',
                'heroTitle' => 'Innovación y Tecnología al Servicio de tu Negocio',
                'heroText' => 'Más de 30 años transformando empresas con soluciones digitales de vanguardia',
                'heroCta' => 'Contáctanos',
                'stats' => [
                    ['icon' => '🎯', 'number' => '+30', 'label' => 'Años de Experiencia'],
                    ['icon' => '👥', 'number' => '10', 'label' => 'Expertos Calificados'],
                    ['icon' => '🏆', 'number' => '+4000', 'label' => 'Clientes Felices'],
                    ['icon' => '💼', 'number' => '50', 'label' => 'Proyectos Completados'],
                ],
                'aboutTag' => 'QUIENES SOMOS',
                'aboutTitle' => 'Soluciones TI que Transforman Negocios',
                'aboutText' => 'Nuestra empresa tiene como objetivo principal impulsar el crecimiento de las empresas mediante soluciones tecnológicas innovadoras y de alta calidad. Contamos con un equipo de profesionales altamente capacitados y una amplia gama de servicios adaptados a las necesidades de nuestros clientes.',
                'aboutImage' => 'about-image.jpg',
                'aboutCta' => 'Saber Más',
                'features' => [
                    'Experiencia comprobada en proyectos complejos',
                    'Enfoque personalizado en cada cliente',
                    'Innovación constante y compromiso con la calidad',
                ],
                'teamTag' => 'NUESTRO EQUIPO',
                'teamTitle' => 'Conoce a los Expertos de MIS',
                'teamText' => 'Profesionales apasionados por la tecnología y la innovación',
                'team' => [
                    ['name' => 'Giovanni Risco Collazos', 'role' => 'Web Developer', 'image' => 'giovani.jpg', 'linkedin' => '#', 'github' => '#'],
                    ['name' => 'Pedro Alex Taya Yactayo', 'role' => 'CEO, Founder', 'image' => 'taya.jpg', 'linkedin' => '#', 'github' => '#'],
                ],
                'contactCards' => [
                    ['title' => 'Domicilio Legal', 'text' => "Urb. Libertad Mz.I Lt.5 Calle Las Moras S/N\nSan Vicente - Cañete - Lima - Perú"],
                    ['title' => 'Correo Electrónico', 'text' => 'contacto@mattinnovasolution.com'],
                    ['title' => 'WhatsApp', 'text' => '(+51) 992 422 219'],
                ],
                'videosTag' => 'NOVEDADES',
                'videosTitle' => 'Lo Último en YouTube',
                'videosText' => 'Descubre nuestro contenido técnico y novedades',
                'videos' => [
                    ['embed' => 'https://www.youtube.com/embed/RtNdTuCxWoI', 'user' => '@mattinnovasolution', 'title' => 'Relacionamiento con Partner Microsoft Local y Tenant Microsoft 365'],
                    ['embed' => 'https://www.youtube.com/embed/RtNdTuCxWoI', 'user' => '@mattinnovasolution', 'title' => 'Relacionamiento con Partner Microsoft Local y Tenant Microsoft 365'],
                ],
            ],
        ],
        'servicios' => [
            'title' => 'Servicios',
            'content' => [
                'heroImage' => '/carousel.jpg',
                'heroTitle' => 'Nuestros Servicios',
                'heroText' => 'Soluciones tecnológicas integrales para tu empresa',
                'subtitle' => 'CONOCE NUESTROS',
                'title' => 'Servicios',
                'cards' => [
                    ['path' => '/servicios/software', 'img' => '/software.png', 'title' => 'Software', 'text' => 'Desarrollo e implementación de soluciones de software a medida.', 'link' => 'Ver más →'],
                    ['path' => '/servicios/hardware', 'img' => '/imac.jpg', 'title' => 'Hardware', 'text' => 'Suministro e instalación de equipos.', 'link' => 'Ver más →'],
                    ['path' => '/servicios/consultoria', 'img' => '/about-image.jpg', 'title' => 'Consultoría', 'text' => 'Asesoramiento experto para tu negocio.', 'link' => 'Ver más →'],
                    ['path' => '/servicios/saas', 'img' => '/saas.jpg', 'title' => 'SaaS', 'text' => 'Soluciones en la nube seguras.', 'link' => 'Ver más →'],
                    ['path' => '/servicios/soluciones-ti', 'img' => '/imagen.jpg', 'title' => 'Soluciones TI', 'text' => 'Infraestructura tecnológica completa.', 'link' => 'Ver más →'],
                ],
                'ctaTitle' => '¿Listo para transformar tu negocio?',
                'ctaText' => 'Contáctanos y descubre cómo podemos ayudarte.',
                'ctaButton' => 'Contáctanos',
            ],
        ],
        'servicios-software' => [
            'title' => 'Software',
            'content' => service_page_seed(
                '/software-banner.png',
                'Software Banner',
                '/software.png',
                'Persona programando',
                'SERVICIO',
                'Software',
                'El software es el corazón de cualquier operación digital. En Matt Innova Solution, desarrollamos e implementamos soluciones de software a medida, optimizadas para mejorar la eficiencia y productividad de tu empresa. Ya sea un sistema de gestión empresarial, aplicaciones personalizadas o plataformas de e-commerce, tenemos la experiencia para llevar tu visión a la realidad.',
                [
                    ['img' => '/microsoft3651.png', 'title' => 'Microsoft 365', 'text' => 'Nuestros profesionales son expertos en Microsoft 365 y cuentan con experiencia en proyectos de implementación de ecosistemas colaborativos digitales.'],
                    ['img' => '/dspace.jpg', 'title' => 'Repositorio de Investigación', 'text' => 'Ofrecemos instalación de DSpace en VPS, cumpliendo normativas RENATI y CONCYTEC, con personalización, búsquedas avanzadas SOLR, y estadísticas AWStat.'],
                    ['img' => '/erp.jpg', 'title' => 'Software ERP', 'text' => 'Ofrecemos software de ERP de gestión comercial, multiempresa, multiusuario y multisucursales. Todo lo que necesitas para comenzar a vender y crecer de inmediato.'],
                    ['img' => 'ecommerce.jpeg', 'title' => 'Pagina Ecommerce para tu negocio', 'text' => 'Diseñamos y desarrollamos tu tienda virtual a medida. Incluye hosting, dominio, pasarelas de pago seguras y un panel autoadministrable para que gestiones tus productos y vendas en línea sin complicaciones.'],
                    ['img' => '/windows.png', 'title' => 'Windows Server 2022', 'text' => 'Protegemos contra amenazas con un servidor de núcleo seguro y gestionamos cargas críticas con 48 TB de memoria y 2048 núcleos. Administra con Windows Admin Center y Azure Arc.'],
                    ['img' => '/windows-server-azure-arc.png', 'title' => 'Windows Server y Azure Arc', 'text' => 'Extendemos tu centro de datos a Azure para mejorar la eficiencia. Administramos servidores y modernizamos aplicaciones con Azure Kubernetes Service en Azure Stack HCI.'],
                ]
            ),
        ],
        'servicios-saas' => [
            'title' => 'SaaS',
            'content' => service_page_seed(
                '/saas2026.png',
                'Saas Banner',
                '/saas.jpg',
                'SAAS',
                'SERVICIO',
                'SAAS (Software as a Service)',
                'La evolución tecnológica requiere soluciones flexibles y escalables. Con nuestro servicio de SAAS, proporcionamos software basado en la nube que se adapta a las necesidades específicas de tu empresa. Ya no tendrás que preocuparte por instalaciones complejas o mantenimiento continuo; nosotros nos encargamos de todo para que puedas centrarte en lo que realmente importa: hacer crecer tu negocio.',
                [
                    ['img' => '/microsoft3651.png', 'title' => 'Microsoft 365', 'text' => 'Nuestros profesionales son expertos en Microsoft 365 y cuentan con experiencia en proyectos de implementación de ecosistemas colaborativos digitales.'],
                    ['img' => '/dspace.jpg', 'title' => 'Repositorio de Investigación', 'text' => 'Ofrecemos instalación de DSpace en VPS, cumpliendo normativas RENATI y CONCYTEC, con personalización, búsquedas avanzadas SOLR, y estadísticas AWStat.'],
                    ['img' => '/creacion.jpg', 'title' => 'Creación de página web', 'text' => 'Ofrecemos planes para crear tu página web, con dominio incluido y funciones como subdominios y correos corporativos ilimitados, adaptados a tus necesidades.'],
                    ['img' => '/infreaestructura.jpg', 'title' => 'Infraestructura tecnológica', 'text' => 'Se apoya en plataformas líderes como Bitbucket y GitHub para la gestión de código, DigitalOcean para soluciones en la nube, y Cloudflare para optimizar la seguridad.'],
                    ['img' => '/erp.jpg', 'title' => 'Software ERP', 'text' => 'Ofrecemos software de ERP de gestión comercial, multiempresa, multiusuario y multi sucursales. Todo lo que necesitas para comenzar a vender y crecer de inmediato.'],
                    ['img' => '/modulos.jpg', 'title' => 'Módulos Generales', 'text' => 'Brindamos módulos completos para Ventas, Compras, Caja, Productos, Almacén y Reportes. Administra eficientemente cada área y personaliza según tus necesidades.'],
                ]
            ),
        ],
        'servicios-hardware' => [
            'title' => 'Hardware',
            'content' => service_page_seed(
                '/hardware2026.png',
                'Hardware Banner',
                '/hard.avif',
                'Hardware',
                'SERVICIO',
                'Hardware',
                'Sabemos que el hardware adecuado es crucial para el rendimiento de tu empresa. Ofrecemos un amplio catálogo de equipos de cómputo de última generación, adaptados a las necesidades de cada cliente. Desde servidores robustos hasta estaciones de trabajo personalizadas, nos aseguramos de que cuentes con la infraestructura necesaria para operar de manera eficiente y segura.',
                [
                    ['img' => '/ServidoresHPE.png', 'title' => 'Servidores HPE ProLiant', 'text' => 'Contamos con computación diseñada para tu mundo híbrido, ya que se puede acelerar los resultados de inteligencia artificial que proporcionan información e innovación.'],
                    ['img' => '/INFRAESTRUCTURAIT.jpg', 'title' => 'Servidores Infraestructura de IT Lenovo', 'text' => 'Ofrecemos servidores Lenovo ThinkSystem, líderes en fiabilidad y tiempo de actividad. Pon tu confianza en nuestra infraestructura de TI para un servicio confiable y eficiente.'],
                ]
            ),
        ],
        'servicios-consultoria' => [
            'title' => 'Consultoría',
            'content' => service_page_seed(
                '/consultoria.png',
                'consultoria Banner',
                '/consultoria.jpg',
                'Consultoría TI',
                'SERVICIO',
                'Consultoría',
                'Nuestro equipo de consultores expertos en TI trabaja contigo para identificar oportunidades de mejora y desarrollar estrategias que impulsen tu negocio. Desde la gestión de proyectos hasta la implementación de tecnologías avanzadas, nuestra consultoría está diseñada para ofrecer soluciones integrales que transformen tu empresa.',
                [
                    ['img' => '/expertos.jpg', 'title' => 'Expertos en TI', 'text' => 'Con más de 30 años en el sector, ofrecemos una visión profunda y estratégica para tu negocio.'],
                    ['img' => '/personalizado.jpg', 'title' => 'Enfoque Personalizado', 'text' => 'Adaptamos nuestras soluciones a las necesidades específicas de cada cliente, asegurando resultados óptimos.'],
                    ['img' => '/resultados.jpg', 'title' => 'Resultados Comprobados', 'text' => 'Hemos ayudado a numerosas empresas a mejorar su eficiencia y competitividad mediante estrategias tecnológicas bien ejecutadas.'],
                ]
            ),
        ],
        'servicios-soluciones-ti' => [
            'title' => 'Soluciones TI',
            'content' => service_page_seed(
                '/soluciones.png',
                'soluciones Banner',
                '/sol_ti.jpg',
                'Soluciones TI',
                'SERVICIO',
                'Soluciones TI',
                'Las soluciones de TI son el pilar que sostiene a las empresas modernas. Ofrecemos un servicio integral que abarca desde la implementación de redes hasta la integración de plataformas colaborativas como Microsoft 365 y Google Workspace. Nuestro enfoque está en ofrecer soluciones que no solo funcionen, sino que transformen la manera en que trabajas.',
                [
                    ['img' => '/integridad.jpg', 'title' => 'Integralidad', 'text' => 'Abordamos todas las necesidades de TI de tu empresa, desde la infraestructura hasta las herramientas colaborativas.'],
                    ['img' => '/adaptabilidad.jpg', 'title' => 'Adaptabilidad', 'text' => 'Nuestras soluciones están diseñadas para crecer con tu negocio, asegurando que siempre tengas el soporte que necesitas.'],
                    ['img' => '/transformacion_digital.jpg', 'title' => 'Transformación Digital', 'text' => 'Te ayudamos a adoptar las últimas tecnologías para que puedas mantenerte competitivo en un entorno empresarial en constante cambio.'],
                ]
            ),
        ],
        'contacto' => [
            'title' => 'Contacto',
            'content' => [
                'badge' => 'PONERSE EN CONTACTO',
                'title' => 'Contáctenos para cualquier consulta',
                'cards' => [
                    ['title' => 'Domicilio Legal', 'text' => 'Urb. Libertad Mz. Lt.5 Calle Las Moras S/N San Vicente de Cañete'],
                    ['title' => 'Envíanos un Correo electrónico', 'text' => 'contacto@mattinnovasolution.com'],
                    ['title' => 'WhatsApp', 'text' => '(+51) 992 422 219'],
                ],
                'submitLabel' => 'Enviar Mensaje',
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
                'title' => 'Libro de Reclamaciones Virtual',
                'company' => 'Matt Innova Solution',
                'subtitle' => 'Conforme a lo establecido en el Código de Protección y Defensa del Consumidor (Ley N° 29571) y su Reglamento.',
                'logo' => 'logo.svg',
                'ruc' => '',
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

function service_page_seed(string $hero, string $heroAlt, string $image, string $imageAlt, string $label, string $title, string $text, array $reasons): array
{
    foreach ($reasons as $i => $reason) {
        if (!is_array($reason)) {
            continue;
        }
        if (!isset($reason['alt']) || trim((string) $reason['alt']) === '') {
            $reasons[$i]['alt'] = (string) ($reason['title'] ?? 'Motivo');
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
        'cta' => 'Contáctanos',
        'reasonsSubtitle' => 'RAZONES POR LAS CUALES',
        'reasonsTitle' => 'Debes Elegirnos',
        'reasons' => $reasons,
    ];
}

function seed_database(): void
{
    db_init();
    if (function_exists('db_migrate')) {
        db_migrate();
    }
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
}
