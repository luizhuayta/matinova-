<?php
declare(strict_types=1);

function cms_client_catalog_item(string $name, string $url, string $category, string $subcategory, string $icon = ''): array
{
    return [
        'logo' => '',
        'name' => $name,
        'url' => $url,
        'alt' => $name,
        'text' => '',
        'icon' => $icon,
        'category' => $category,
        'subcategory' => $subcategory,
    ];
}

function cms_clients_catalog_items(): array
{
    return [
        cms_client_catalog_item('Ángel Farmacia', 'http://arcangelfarmacia.website/', 'empresas', 'Salud y Farmacia', '💊'),
        cms_client_catalog_item('Ohsana', 'http://ohsana.website/', 'empresas', 'Salud y Farmacia', '🏥'),
        cms_client_catalog_item('Automundo', 'http://automundo.xyz/', 'empresas', 'Automotriz', '🚗'),
        cms_client_catalog_item('Motorlab', 'https://sitemotorlab.xyz/', 'empresas', 'Automotriz', '🛠️'),
        cms_client_catalog_item('Cuantix', 'http://cuantix.xyz/', 'empresas', 'Tecnología y Software', '💻'),
        cms_client_catalog_item('DTemp', 'http://dtemp.xyz/', 'empresas', 'Tecnología y Software', '🌡️'),
        cms_client_catalog_item('MyEC', 'http://myec.website/', 'empresas', 'Tecnología y Software', '⚡'),
        cms_client_catalog_item('NetzunXP', 'http://netzunxp.xyz/', 'empresas', 'Tecnología y Software', '🌐'),
        cms_client_catalog_item('ElectriHouse', 'https://electrihouse.xyz/', 'empresas', 'Tecnología y Software', '💡'),
        cms_client_catalog_item('EclipseByte', 'https://eclipsebyte.xyz/', 'empresas', 'Tecnología y Software', '💻'),
        cms_client_catalog_item('Site ATI', 'https://siteati.xyz/', 'empresas', 'Tecnología y Software', '💻'),
        cms_client_catalog_item('ACAK Systems', 'https://acaksystems.xyz/', 'empresas', 'Tecnología y Software', '🖥️'),
        cms_client_catalog_item('Anjedutech', 'https://anjedutech.xyz/', 'empresas', 'Tecnología y Software', '🔬'),
        cms_client_catalog_item('El Bambi', 'http://elbambi.website/', 'empresas', 'Retail y Moda', '🦌'),
        cms_client_catalog_item('Mashikta', 'http://mashikta.website/', 'empresas', 'Retail y Moda', '👔'),
        cms_client_catalog_item('Mueblería Rivas', 'http://muebleriarivas.website/', 'empresas', 'Retail y Moda', '🪑'),
        cms_client_catalog_item('Ropa Trend', 'http://ropatrend.xyz/', 'empresas', 'Retail y Moda', '👗'),
        cms_client_catalog_item('CRJ Outfit', 'https://crjjoutfit.xyz/', 'empresas', 'Retail y Moda', '👟'),
        cms_client_catalog_item('Zenvella Creativa', 'https://zenvellacreativa.xyz/', 'empresas', 'Retail y Moda', '🎨'),
        cms_client_catalog_item('Elegance Boutique', 'https://eleganceboutique.xyz/', 'empresas', 'Retail y Moda', '👗'),
        cms_client_catalog_item('TechStyle', 'https://sitetechstyle.xyz/', 'empresas', 'Retail y Moda', '🎨'),
        cms_client_catalog_item('Paginacial', 'http://paginicial.website/', 'empresas', 'Agropecuario', '🌾'),
        cms_client_catalog_item('Sumak', 'https://sitesumak.xyz/', 'empresas', 'Agropecuario', '🌾'),
        cms_client_catalog_item('Tereparo', 'https://tereparo.xyz/', 'empresas', 'Servicios y Reparación', '🔧'),
        cms_client_catalog_item('Reparaya', 'https://reparaya.xyz/', 'empresas', 'Servicios y Reparación', '🔨'),
        cms_client_catalog_item('Hanamiyo', 'https://hanamiyo.xyz/', 'empresas', 'Gastronomía', '🍜'),
        cms_client_catalog_item('Site EduFuture', 'http://siteedufuture.xyz/', 'empresas', 'Educación y Consultoría', '🎓'),
        cms_client_catalog_item('Pequeños Equilibrados', 'https://pequenosequilibrados.xyz/', 'empresas', 'Educación y Consultoría', '⚖️'),
        cms_client_catalog_item('Enterprise Elevatik', 'https://enterpriseelevatik.xyz/', 'empresas', 'Servicios Profesionales', '🏢'),
        cms_client_catalog_item('Atlas Arquitectura', 'https://atlasquitectura.xyz/', 'empresas', 'Servicios Profesionales', '🏛️'),
        cms_client_catalog_item('Tu Mundo Interior', 'https://tumundointerior.xyz/', 'empresas', 'Servicios Profesionales', '🏠'),
        cms_client_catalog_item('Verceblend', 'https://verceblend.xyz/', 'empresas', 'Servicios Profesionales', '💼'),
        cms_client_catalog_item('Cine Chincha', 'https://cinechincha.xyz/', 'empresas', 'Entretenimiento', '🎬'),
        cms_client_catalog_item('FastTrack Travel', 'https://fasttracktravel.xyz/', 'empresas', 'Entretenimiento', '✈️'),

        cms_client_catalog_item('CEBA Santo Domingo', 'http://cebasantodomingo.edu.pe/', 'educativas', 'CEBA', '🏫'),
        cms_client_catalog_item('EESPP Virgen del Carmen', 'http://eespvirgendelcarmen.edu.pe/', 'educativas', 'EESPP', '🏫'),
        cms_client_catalog_item('EESPP Teodoro Peñaloza', '#', 'educativas', 'EESPP', '🏫'),
        cms_client_catalog_item('EESPP La Inmaculada', '#', 'educativas', 'EESPP', '🏫'),
        cms_client_catalog_item('IESPP Peruano Canadiense', '#', 'educativas', 'EESPP', '🏫'),
        cms_client_catalog_item('IESPP Virgen del Carmen - Ayacucho', '#', 'educativas', 'EESPP', '🏫'),
        cms_client_catalog_item('IESPP Pedro Monge', 'http://iesppedromonge.edu.pe/', 'educativas', 'IESPP', '🏫'),
        cms_client_catalog_item('IESPP Pedro Monge Córdova', '#', 'educativas', 'IESPP', '🏫'),
        cms_client_catalog_item('IESTP Tecnocom', 'http://tecnocom.edu.pe/', 'educativas', 'IESTP', '🏫'),
        cms_client_catalog_item('IESTP Mario Gutiérrez López', '#', 'educativas', 'IESTP', '🏫'),
        cms_client_catalog_item('IESTP Taylor', '#', 'educativas', 'IESTP', '🏫'),
        cms_client_catalog_item('IESTP World Net', '#', 'educativas', 'IESTP', '🏫'),
        cms_client_catalog_item('IEI 449', '#', 'educativas', 'IEI', '🏫'),
        cms_client_catalog_item('I.E. N°6097 Mateo Pumacahua', '#', 'educativas', 'I.E. Primaria/Secundaria', '🏫'),
        cms_client_catalog_item('Tayamaq', 'http://tayamaq.com/', 'educativas', 'Academias y Formación', '🎓'),
        cms_client_catalog_item('Tayamaq Academy', 'http://tayamaq.edu.pe/', 'educativas', 'Academias y Formación', '🎓'),
        cms_client_catalog_item('Makitoolsperu', 'https://makitoolsporu.com/', 'educativas', 'Academias y Formación', '🎓'),
        cms_client_catalog_item('TAYA MAQ SAC', '#', 'educativas', 'Academias y Formación', '🎓'),
        cms_client_catalog_item('TAYA MAQ ACADEMIA', '#', 'educativas', 'Academias y Formación', '🎓'),
        cms_client_catalog_item('UGEL 13 Yauyos', '#', 'educativas', 'UGEL', '🏛️'),

        cms_client_catalog_item('BAYER', '#', 'alianzas', 'Corporativas', '🏢'),
        cms_client_catalog_item('LASER TIC EIRL', '#', 'alianzas', 'Corporativas', '🔧'),
        cms_client_catalog_item('Gran Hotel Villa del Sur', '#', 'alianzas', 'Corporativas', '🏨'),
        cms_client_catalog_item('Microsoft Users Group Cañete', '#', 'alianzas', 'Tecnológicas', '💻'),
        cms_client_catalog_item('Dirección Regional de Educación de Ayacucho', '#', 'alianzas', 'Gubernamentales', '🏛️'),
        cms_client_catalog_item('Dirección Regional de Cusco', '#', 'alianzas', 'Gubernamentales', '🏛️'),
        cms_client_catalog_item('UPSJB', '#', 'alianzas', 'Educativas', '🎓'),
    ];
}

function cms_clients_page_document(): array
{
    return [
        'schemaVersion' => CMS_SCHEMA_VERSION,
        'seo' => [
            'title' => 'Clientes',
            'description' => 'Empresas, instituciones educativas y alianzas de Matt Innova Solution.',
            'image' => '',
        ],
        'decorativeImagePaths' => [],
        'blocks' => [
            cms_make_block('listingHero', [
                'image' => '/carousel.jpg',
                'title' => 'Nuestros clientes',
                'text' => 'Empresas e instituciones que confían en nosotros para transformar su futuro tecnológico',
            ]),
            cms_make_block('clients', [
                'title' => 'Quiénes confían en nosotros',
                'text' => 'Organizados por rubro. Abre un panel para ver logos y sitios.',
                'layout' => 'paneles',
                'items' => cms_clients_catalog_items(),
            ]),
            cms_make_block('cta', [
                'title' => '¿Quieres ser parte de nuestros clientes satisfechos?',
                'text' => 'Cuéntanos tu proyecto y te mostramos casos similares.',
                'button' => 'Contáctanos',
                'link' => '/contacto',
            ]),
        ],
    ];
}

function cms_clients_content_is_placeholder(array $content): bool
{
    $blocks = $content['blocks'] ?? null;
    if (!is_array($blocks) || $blocks === []) {
        return true;
    }
    foreach ($blocks as $block) {
        if (!is_array($block) || ($block['type'] ?? '') !== 'clients') {
            continue;
        }
        $items = $block['props']['items'] ?? [];
        if (!is_array($items) || count($items) <= 1) {
            return true;
        }
        return false;
    }
    return true;
}
