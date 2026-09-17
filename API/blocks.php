<?php
declare(strict_types=1);

function cms_new_block_id(): string
{
    return bin2hex(random_bytes(8));
}

function cms_field(string $path, string $type, string $label, array $extra = []): array
{
    return array_merge(['path' => $path, 'type' => $type, 'label' => $label], $extra);
}

function cms_seo_fields(): array
{
    return [
        cms_field('title', 'text', 'Título SEO', ['maxLength' => 70]),
        cms_field('description', 'area', 'Descripción SEO', ['maxLength' => 160]),
        cms_field('image', 'image', 'Imagen para compartir'),
    ];
}

function cms_block_catalog(): array
{
    static $catalog = null;
    if ($catalog !== null) {
        return $catalog;
    }

    $slideItem = [
        cms_field('badge', 'text', 'Etiqueta'),
        cms_field('title', 'area', 'Título', ['maxLength' => 180]),
        cms_field('image', 'image', 'Imagen'),
    ];
    $cardItem = [
        cms_field('title', 'text', 'Título'),
        cms_field('text', 'area', 'Texto'),
        cms_field('icon', 'text', 'Icono'),
    ];
    $serviceCard = [
        cms_field('img', 'image', 'Imagen'),
        cms_field('alt', 'text', 'Texto de la imagen'),
        cms_field('title', 'text', 'Título'),
        cms_field('text', 'area', 'Texto'),
    ];
    $linkCard = [
        cms_field('path', 'link', 'Enlace'),
        cms_field('img', 'image', 'Imagen'),
        cms_field('title', 'text', 'Título'),
        cms_field('text', 'area', 'Texto'),
        cms_field('link', 'text', 'Texto del enlace'),
    ];
    $innovativeItem = [
        cms_field('title', 'text', 'Título'),
        cms_field('desc', 'area', 'Descripción'),
        cms_field('img', 'image', 'Imagen'),
    ];
    $testimonialItem = [
        cms_field('text', 'area', 'Opinión'),
        cms_field('client', 'text', 'Cliente'),
        cms_field('logo', 'image', 'Logo'),
        cms_field('role', 'text', 'Cargo o rol'),
        cms_field('company', 'text', 'Empresa'),
        cms_field('rating', 'number', 'Estrellas (1-5)'),
    ];
    $statItem = [
        cms_field('icon', 'text', 'Icono'),
        cms_field('number', 'text', 'Número'),
        cms_field('label', 'text', 'Etiqueta'),
    ];
    $teamItem = [
        cms_field('name', 'text', 'Nombre'),
        cms_field('role', 'text', 'Cargo'),
        cms_field('image', 'image', 'Foto'),
        cms_field('linkedin', 'link', 'LinkedIn'),
        cms_field('github', 'link', 'GitHub'),
    ];
    $videoItem = [
        cms_field('embed', 'embed', 'Enlace de YouTube'),
        cms_field('user', 'text', 'Usuario'),
        cms_field('title', 'text', 'Título'),
    ];
    $reasonItem = [
        cms_field('img', 'image', 'Imagen'),
        cms_field('title', 'text', 'Título'),
        cms_field('text', 'area', 'Texto'),
    ];
    $clientItem = [
        cms_field('logo', 'image', 'Logo'),
        cms_field('name', 'text', 'Nombre'),
        cms_field('url', 'link', 'Enlace'),
        cms_field('alt', 'text', 'Texto de la imagen'),
        cms_field('text', 'area', 'Caso de éxito'),
        cms_field('icon', 'text', 'Icono (si no hay logo)'),
        cms_field('category', 'select', 'Panel', ['options' => [
            ['value' => 'empresas', 'label' => 'Empresas y E-commerce'],
            ['value' => 'educativas', 'label' => 'Instituciones Educativas'],
            ['value' => 'alianzas', 'label' => 'Alianzas Institucionales'],
        ]]),
        cms_field('subcategory', 'text', 'Subcategoría / rubro'),
    ];
    $stageItem = [
        cms_field('step', 'text', 'Paso'),
        cms_field('title', 'text', 'Título'),
        cms_field('text', 'area', 'Texto'),
        cms_field('image', 'image', 'Imagen'),
    ];
    $faqItem = [
        cms_field('question', 'text', 'Pregunta'),
        cms_field('answer', 'area', 'Respuesta'),
    ];
    $galleryItem = [
        cms_field('image', 'image', 'Imagen'),
        cms_field('alt', 'text', 'Texto de la imagen'),
        cms_field('caption', 'text', 'Pie de foto'),
    ];

    $catalog = [
        'hero' => [
            'type' => 'hero',
            'label' => 'Banner carrusel',
            'icon' => 'bi-images',
            'category' => 'Portada',
            'description' => 'Fotos grandes que rotan con título y botón.',
            'schema' => [
                cms_field('slides', 'list', 'Banners', ['item' => $slideItem, 'min' => 1]),
                cms_field('cta', 'text', 'Botón'),
                cms_field('ctaLink', 'link', 'Enlace del botón'),
            ],
            'defaults' => [
                'slides' => [['badge' => 'NUEVO', 'title' => 'Título del banner', 'image' => 'carousel.jpg']],
                'cta' => 'Aprender más',
                'ctaLink' => '/contacto',
            ],
        ],
        'about' => [
            'type' => 'about',
            'label' => 'Quiénes somos',
            'icon' => 'bi-people',
            'category' => 'Contenido',
            'description' => 'Imagen, texto y botón. Puedes añadir puntos destacados.',
            'schema' => [
                cms_field('tag', 'text', 'Etiqueta'),
                cms_field('title', 'text', 'Título'),
                cms_field('text', 'area', 'Texto'),
                cms_field('image', 'image', 'Imagen'),
                cms_field('imageAlt', 'text', 'Texto de la imagen'),
                cms_field('cta', 'text', 'Botón'),
                cms_field('ctaLink', 'link', 'Enlace del botón'),
                cms_field('features', 'list', 'Puntos destacados', ['item' => [cms_field('text', 'text', 'Texto')]]),
            ],
            'defaults' => [
                'tag' => 'QUIÉNES SOMOS',
                'title' => 'Título de la sección',
                'text' => 'Describe aquí tu empresa.',
                'image' => 'about-image.jpg',
                'imageAlt' => '',
                'cta' => 'Leer más',
                'ctaLink' => '/acerca-de',
                'features' => [],
            ],
        ],
        'contactCards' => [
            'type' => 'contactCards',
            'label' => 'Tarjetas de contacto',
            'icon' => 'bi-geo-alt',
            'category' => 'Contacto',
            'description' => 'Dirección, correo o teléfono en tarjetas.',
            'schema' => [
                cms_field('items', 'list', 'Tarjetas', ['item' => $cardItem, 'min' => 1]),
            ],
            'defaults' => [
                'items' => [['title' => 'Contacto', 'text' => 'Escribe aquí el dato', 'icon' => 'bi-geo-alt-fill']],
            ],
        ],
        'services' => [
            'type' => 'services',
            'label' => 'Servicios (cuadrícula)',
            'icon' => 'bi-grid',
            'category' => 'Servicios',
            'description' => 'Tarjetas con foto, título y texto.',
            'schema' => [
                cms_field('tag', 'text', 'Etiqueta'),
                cms_field('title', 'text', 'Título'),
                cms_field('cards', 'list', 'Tarjetas', ['item' => $serviceCard, 'min' => 1]),
            ],
            'defaults' => [
                'tag' => 'QUÉ HACEMOS',
                'title' => 'Ofrecemos servicios',
                'cards' => [['img' => 'imac.jpg', 'alt' => '', 'title' => 'Servicio', 'text' => 'Descripción del servicio.']],
            ],
        ],
        'innovative' => [
            'type' => 'innovative',
            'label' => 'Carrusel de servicios',
            'icon' => 'bi-collection',
            'category' => 'Servicios',
            'description' => 'Texto a un lado y tarjetas que se deslizan.',
            'schema' => [
                cms_field('tag', 'text', 'Etiqueta'),
                cms_field('title', 'text', 'Título'),
                cms_field('text', 'area', 'Texto'),
                cms_field('cta', 'text', 'Botón'),
                cms_field('ctaLink', 'link', 'Enlace del botón'),
                cms_field('items', 'list', 'Elementos', ['item' => $innovativeItem]),
            ],
            'defaults' => [
                'tag' => 'SERVICIOS INNOVADORES',
                'title' => 'Conozca nuestros servicios',
                'text' => '',
                'cta' => 'Descubrir más',
                'ctaLink' => '/servicios',
                'items' => [['title' => 'Servicio', 'desc' => 'Descripción corta.', 'img' => 'sol_ti.jpg']],
            ],
        ],
        'testimonials' => [
            'type' => 'testimonials',
            'label' => 'Opiniones',
            'icon' => 'bi-chat-quote',
            'category' => 'Clientes',
            'description' => 'Comentarios de clientes con logo.',
            'schema' => [
                cms_field('tag', 'text', 'Etiqueta'),
                cms_field('title', 'text', 'Título'),
                cms_field('text', 'area', 'Texto'),
                cms_field('cta', 'text', 'Botón'),
                cms_field('ctaLink', 'link', 'Enlace del botón'),
                cms_field('items', 'list', 'Comentarios', ['item' => $testimonialItem, 'min' => 1]),
            ],
            'defaults' => [
                'tag' => 'CLIENTES SATISFECHOS',
                'title' => 'Opiniones y casos de éxito',
                'text' => '',
                'cta' => 'Aprender más',
                'ctaLink' => '/contacto',
                'items' => [['text' => 'Excelente servicio.', 'client' => 'Cliente', 'logo' => 'logo.svg', 'role' => 'Cliente Satisfecho', 'company' => 'Matt Innova Solution', 'rating' => 5]],
            ],
        ],
        'pageHero' => [
            'type' => 'pageHero',
            'label' => 'Portada de página',
            'icon' => 'bi-window',
            'category' => 'Portada',
            'description' => 'Título, texto y botón sobre un fondo.',
            'schema' => [
                cms_field('badge', 'text', 'Etiqueta'),
                cms_field('title', 'text', 'Título'),
                cms_field('text', 'area', 'Texto'),
                cms_field('cta', 'text', 'Botón'),
                cms_field('ctaLink', 'link', 'Enlace del botón'),
                cms_field('image', 'image', 'Imagen de fondo'),
            ],
            'defaults' => [
                'badge' => 'SECCIÓN',
                'title' => 'Título de la página',
                'text' => '',
                'cta' => 'Contáctanos',
                'ctaLink' => '/contacto',
                'image' => '',
            ],
        ],
        'stats' => [
            'type' => 'stats',
            'label' => 'Cifras',
            'icon' => 'bi-graph-up',
            'category' => 'Contenido',
            'description' => 'Números destacados: años, clientes, proyectos.',
            'schema' => [
                cms_field('items', 'list', 'Cifras', ['item' => $statItem]),
            ],
            'defaults' => [
                'items' => [['icon' => '🎯', 'number' => '+10', 'label' => 'Años']],
            ],
        ],
        'team' => [
            'type' => 'team',
            'label' => 'Equipo',
            'icon' => 'bi-person-badge',
            'category' => 'Contenido',
            'description' => 'Fotos y cargos de las personas del equipo.',
            'schema' => [
                cms_field('tag', 'text', 'Etiqueta'),
                cms_field('title', 'text', 'Título'),
                cms_field('text', 'area', 'Texto'),
                cms_field('items', 'list', 'Personas', ['item' => $teamItem]),
            ],
            'defaults' => [
                'tag' => 'NUESTRO EQUIPO',
                'title' => 'Conoce al equipo',
                'text' => '',
                'items' => [['name' => 'Nombre', 'role' => 'Cargo', 'image' => 'taya.jpg', 'linkedin' => '#', 'github' => '#']],
            ],
        ],
        'videos' => [
            'type' => 'videos',
            'label' => 'Videos',
            'icon' => 'bi-youtube',
            'category' => 'Contenido',
            'description' => 'Videos de YouTube embebidos.',
            'schema' => [
                cms_field('tag', 'text', 'Etiqueta'),
                cms_field('title', 'text', 'Título'),
                cms_field('text', 'area', 'Texto'),
                cms_field('items', 'list', 'Videos', ['item' => $videoItem]),
            ],
            'defaults' => [
                'tag' => 'NOVEDADES',
                'title' => 'Videos',
                'text' => '',
                'items' => [['embed' => 'https://www.youtube.com/embed/RtNdTuCxWoI', 'user' => '@mattinnovasolution', 'title' => 'Video']],
            ],
        ],
        'listingHero' => [
            'type' => 'listingHero',
            'label' => 'Banner de listado',
            'icon' => 'bi-image',
            'category' => 'Portada',
            'description' => 'Imagen ancha con título encima.',
            'schema' => [
                cms_field('image', 'image', 'Imagen'),
                cms_field('title', 'text', 'Título'),
                cms_field('text', 'area', 'Texto'),
            ],
            'defaults' => [
                'image' => '/carousel.jpg',
                'title' => 'Nuestros servicios',
                'text' => '',
            ],
        ],
        'serviceCards' => [
            'type' => 'serviceCards',
            'label' => 'Listado con enlaces',
            'icon' => 'bi-card-list',
            'category' => 'Servicios',
            'description' => 'Tarjetas que llevan a otra página.',
            'schema' => [
                cms_field('subtitle', 'text', 'Etiqueta'),
                cms_field('title', 'text', 'Título'),
                cms_field('cards', 'list', 'Tarjetas', ['item' => $linkCard]),
            ],
            'defaults' => [
                'subtitle' => 'CONOCE NUESTROS',
                'title' => 'Servicios',
                'cards' => [['path' => '/contacto', 'img' => '/software.png', 'title' => 'Servicio', 'text' => 'Descripción.', 'link' => 'Ver más →']],
            ],
        ],
        'cta' => [
            'type' => 'cta',
            'label' => 'Llamado a la acción',
            'icon' => 'bi-megaphone',
            'category' => 'Contenido',
            'description' => 'Título, texto y botón para contactar.',
            'schema' => [
                cms_field('title', 'text', 'Título'),
                cms_field('text', 'area', 'Texto'),
                cms_field('button', 'text', 'Botón'),
                cms_field('link', 'link', 'Enlace'),
            ],
            'defaults' => [
                'title' => '¿Listo para transformar tu negocio?',
                'text' => 'Contáctanos y descubre cómo podemos ayudarte.',
                'button' => 'Contáctanos',
                'link' => '/contacto',
            ],
        ],
        'serviceHero' => [
            'type' => 'serviceHero',
            'label' => 'Detalle de servicio',
            'icon' => 'bi-layers',
            'category' => 'Servicios',
            'description' => 'Banner, foto y texto introductorio.',
            'schema' => [
                cms_field('heroImage', 'image', 'Imagen del banner'),
                cms_field('heroAlt', 'text', 'Texto del banner'),
                cms_field('image', 'image', 'Imagen'),
                cms_field('imageAlt', 'text', 'Texto de la imagen'),
                cms_field('label', 'text', 'Etiqueta'),
                cms_field('title', 'text', 'Título'),
                cms_field('text', 'area', 'Texto'),
                cms_field('cta', 'text', 'Botón'),
                cms_field('ctaLink', 'link', 'Enlace del botón'),
            ],
            'defaults' => [
                'heroImage' => '/carousel.jpg',
                'heroAlt' => '',
                'image' => '/software.png',
                'imageAlt' => '',
                'label' => 'SERVICIO',
                'title' => 'Nombre del servicio',
                'text' => 'Describe el servicio.',
                'cta' => 'Contáctanos',
                'ctaLink' => '/contacto',
            ],
        ],
        'reasons' => [
            'type' => 'reasons',
            'label' => 'Motivos / beneficios',
            'icon' => 'bi-check2-square',
            'category' => 'Servicios',
            'description' => 'Por qué elegirte, con foto y texto.',
            'schema' => [
                cms_field('subtitle', 'text', 'Etiqueta'),
                cms_field('title', 'text', 'Título'),
                cms_field('items', 'list', 'Motivos', ['item' => $reasonItem]),
            ],
            'defaults' => [
                'subtitle' => 'RAZONES POR LAS CUALES',
                'title' => 'Debes elegirnos',
                'items' => [['img' => '/integridad.jpg', 'title' => 'Motivo', 'text' => 'Explica el beneficio.']],
            ],
        ],
        'richText' => [
            'type' => 'richText',
            'label' => 'Texto largo',
            'icon' => 'bi-textarea-t',
            'category' => 'Contenido',
            'description' => 'Título y contenido con negritas, listas y enlaces.',
            'schema' => [
                cms_field('title', 'text', 'Título'),
                cms_field('lastUpdated', 'text', 'Última actualización'),
                cms_field('body', 'rich', 'Texto'),
            ],
            'defaults' => [
                'title' => 'Título',
                'lastUpdated' => '',
                'body' => '<p>Escribe el contenido aquí.</p>',
            ],
        ],
        'contactForm' => [
            'type' => 'contactForm',
            'label' => 'Formulario de contacto',
            'icon' => 'bi-envelope',
            'category' => 'Contacto',
            'description' => 'Formulario que envía mensajes al correo que indiques.',
            'schema' => [
                cms_field('submitLabel', 'text', 'Texto del botón enviar'),
                cms_field('destinationEmail', 'text', 'Correo donde llegan los mensajes'),
                cms_field('fields', 'group', 'Campos visibles', ['children' => [
                    cms_field('name', 'bool', 'Nombre'),
                    cms_field('email', 'bool', 'Correo'),
                    cms_field('phone', 'bool', 'Teléfono'),
                    cms_field('subject', 'bool', 'Asunto'),
                    cms_field('message', 'bool', 'Mensaje'),
                ]]),
                cms_field('placeholders', 'group', 'Textos de ayuda', ['children' => [
                    cms_field('name', 'text', 'Nombre'),
                    cms_field('email', 'text', 'Correo'),
                    cms_field('phone', 'text', 'Teléfono'),
                    cms_field('subject', 'text', 'Asunto'),
                    cms_field('message', 'text', 'Mensaje'),
                ]]),
            ],
            'defaults' => [
                'submitLabel' => 'Enviar mensaje',
                'destinationEmail' => 'contacto@mattinnovasolution.com',
                'fields' => ['name' => true, 'email' => true, 'phone' => true, 'subject' => true, 'message' => true],
                'placeholders' => [
                    'name' => 'Su nombre',
                    'email' => 'Su correo electrónico',
                    'phone' => 'Teléfono (9 dígitos)',
                    'subject' => 'Asunto',
                    'message' => 'Mensaje',
                ],
            ],
        ],
        'claimsBook' => [
            'type' => 'claimsBook',
            'label' => 'Libro de reclamaciones',
            'icon' => 'bi-journal-text',
            'category' => 'Legal',
            'description' => 'Textos del libro virtual. Los campos del reclamo los pide la ley.',
            'schema' => [
                cms_field('title', 'text', 'Título'),
                cms_field('company', 'text', 'Empresa'),
                cms_field('subtitle', 'area', 'Subtítulo'),
                cms_field('logo', 'image', 'Logo'),
                cms_field('ruc', 'text', 'RUC'),
                cms_field('destinationEmail', 'text', 'Correo de destino'),
                cms_field('disclaimer1', 'area', 'Aviso legal 1'),
                cms_field('disclaimer2', 'area', 'Aviso legal 2'),
                cms_field('submitLabel', 'text', 'Texto del botón enviar'),
            ],
            'defaults' => [
                'title' => 'Libro de Reclamaciones Virtual',
                'company' => 'Matt Innova Solution',
                'subtitle' => '',
                'logo' => 'logo.svg',
                'ruc' => '',
                'destinationEmail' => 'libroreclamaciones@mattinnovasolution.com',
                'disclaimer1' => '',
                'disclaimer2' => '',
                'submitLabel' => 'Enviar reclamación virtual',
            ],
        ],
        'clients' => [
            'type' => 'clients',
            'label' => 'Clientes',
            'icon' => 'bi-building',
            'category' => 'Clientes',
            'description' => 'Logos, nombres y casos. Elige paneles, cuadrícula, carrusel o casos.',
            'schema' => [
                cms_field('title', 'text', 'Título'),
                cms_field('text', 'area', 'Texto'),
                cms_field('layout', 'select', 'Diseño', ['options' => [
                    ['value' => 'paneles', 'label' => 'Paneles / acordeón'],
                    ['value' => 'logos-grid', 'label' => 'Cuadrícula de logos'],
                    ['value' => 'carrusel', 'label' => 'Carrusel'],
                    ['value' => 'casos', 'label' => 'Casos de éxito'],
                ]]),
                cms_field('items', 'list', 'Clientes', ['item' => $clientItem]),
            ],
            'defaults' => [
                'title' => 'Nuestros clientes',
                'text' => '',
                'layout' => 'paneles',
                'items' => [['logo' => '', 'name' => 'Cliente', 'url' => '', 'alt' => 'Cliente', 'text' => '', 'icon' => '', 'category' => 'empresas', 'subcategory' => '']],
            ],
        ],
        'clientStages' => [
            'type' => 'clientStages',
            'label' => 'Fases de clientes',
            'icon' => 'bi-diagram-3',
            'category' => 'Clientes',
            'description' => 'Pasos o etapas del trabajo con clientes.',
            'schema' => [
                cms_field('title', 'text', 'Título'),
                cms_field('text', 'area', 'Texto'),
                cms_field('stages', 'list', 'Fases', ['item' => $stageItem]),
            ],
            'defaults' => [
                'title' => 'Cómo trabajamos con clientes',
                'text' => '',
                'stages' => [['step' => '01', 'title' => 'Diagnóstico', 'text' => 'Entendemos tu necesidad.', 'image' => '']],
            ],
        ],
        'faq' => [
            'type' => 'faq',
            'label' => 'Preguntas frecuentes',
            'icon' => 'bi-question-circle',
            'category' => 'Contenido',
            'description' => 'Pregunta y respuesta en lista.',
            'schema' => [
                cms_field('title', 'text', 'Título'),
                cms_field('items', 'list', 'Preguntas', ['item' => $faqItem]),
            ],
            'defaults' => [
                'title' => 'Preguntas frecuentes',
                'items' => [['question' => '¿Cómo empezamos?', 'answer' => 'Escríbenos y agendamos una reunión.']],
            ],
        ],
        'gallery' => [
            'type' => 'gallery',
            'label' => 'Galería',
            'icon' => 'bi-images',
            'category' => 'Contenido',
            'description' => 'Varias fotos en cuadrícula.',
            'schema' => [
                cms_field('title', 'text', 'Título'),
                cms_field('items', 'list', 'Fotos', ['item' => $galleryItem]),
            ],
            'defaults' => [
                'title' => 'Galería',
                'items' => [['image' => 'carousel.jpg', 'alt' => '', 'caption' => '']],
            ],
        ],
        'map' => [
            'type' => 'map',
            'label' => 'Mapa',
            'icon' => 'bi-map',
            'category' => 'Contacto',
            'description' => 'Mapa embebido (Google Maps u otro iframe https).',
            'schema' => [
                cms_field('title', 'text', 'Título'),
                cms_field('embed', 'embed', 'Enlace del mapa'),
                cms_field('text', 'area', 'Texto'),
            ],
            'defaults' => [
                'title' => 'Dónde estamos',
                'embed' => '',
                'text' => '',
            ],
        ],
    ];

    return $catalog;
}

function cms_block_type(string $type): ?array
{
    $catalog = cms_block_catalog();
    return $catalog[$type] ?? null;
}

function cms_allowed_block_types(): array
{
    return array_keys(cms_block_catalog());
}

function cms_block_defaults(string $type): array
{
    $def = cms_block_type($type);
    return is_array($def) ? ($def['defaults'] ?? []) : [];
}

function cms_make_block(string $type, ?array $props = null, bool $hidden = false, ?string $id = null, ?array $layout = null): array
{
    $base = cms_block_defaults($type);
    $merged = array_replace_recursive($base, is_array($props) ? $props : []);
    return [
        'id' => $id ?: cms_new_block_id(),
        'type' => $type,
        'hidden' => $hidden,
        'layout' => array_merge(cms_default_layout(), is_array($layout) ? $layout : []),
        'props' => $merged,
    ];
}

function cms_public_block_catalog(): array
{
    $out = [];
    foreach (cms_block_catalog() as $item) {
        $out[] = [
            'type' => $item['type'],
            'label' => $item['label'],
            'icon' => $item['icon'],
            'category' => $item['category'],
            'description' => $item['description'],
            'schema' => $item['schema'],
            'defaults' => $item['defaults'],
        ];
    }
    return $out;
}

function handle_blocks(string $method): void
{
    if ($method !== 'GET') {
        json_out(['message' => 'Método no permitido'], 405);
    }
    json_out(['blocks' => cms_public_block_catalog(), 'templates' => cms_page_templates()]);
}

function cms_page_templates(): array
{
    return [
        ['id' => 'blank', 'label' => 'En blanco', 'description' => 'Una sección de texto para empezar.'],
        ['id' => 'home', 'label' => 'Portada', 'description' => 'Banner, quiénes somos y un llamado.'],
        ['id' => 'service', 'label' => 'Servicio', 'description' => 'Banner, texto e ítems de beneficios.'],
        ['id' => 'legal', 'label' => 'Legal', 'description' => 'Título y texto largo.'],
        ['id' => 'clients', 'label' => 'Clientes', 'description' => 'Paneles por rubro, logos y llamado a contacto.'],
        ['id' => 'contact', 'label' => 'Contacto', 'description' => 'Tarjetas y formulario.'],
    ];
}

function cms_template_blocks(string $template): array
{
    return match ($template) {
        'home' => [
            cms_make_block('hero'),
            cms_make_block('about'),
            cms_make_block('cta'),
        ],
        'service' => [
            cms_make_block('serviceHero'),
            cms_make_block('reasons'),
        ],
        'legal' => [
            cms_make_block('richText'),
        ],
        'clients' => [
            cms_make_block('listingHero', [
                'image' => '/carousel.jpg',
                'title' => 'Nuestros clientes',
                'text' => 'Empresas e instituciones que confían en nosotros para transformar su futuro tecnológico',
            ]),
            cms_make_block('clients', ['layout' => 'paneles']),
            cms_make_block('cta', [
                'title' => '¿Quieres ser parte de nuestros clientes satisfechos?',
                'text' => 'Cuéntanos tu proyecto y te mostramos casos similares.',
                'button' => 'Contáctanos',
                'link' => '/contacto',
            ]),
        ],
        'contact' => [
            cms_make_block('pageHero', [
                'badge' => 'CONTACTO',
                'title' => 'Hablemos',
                'text' => '',
                'cta' => '',
            ]),
            cms_make_block('contactCards'),
            cms_make_block('contactForm'),
        ],
        default => [
            cms_make_block('richText', ['title' => 'Nueva página', 'body' => '<p>Empieza a escribir o añade más secciones.</p>']),
        ],
    };
}

function cms_blank_page_document(string $title, string $template = 'blank'): array
{
    return [
        'schemaVersion' => CMS_SCHEMA_VERSION,
        'seo' => ['title' => $title, 'description' => '', 'image' => ''],
        'decorativeImagePaths' => [],
        'blocks' => cms_template_blocks($template),
    ];
}
