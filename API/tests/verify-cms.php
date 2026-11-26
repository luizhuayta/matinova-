<?php
declare(strict_types=1);

require __DIR__ . '/../helpers.php';
require __DIR__ . '/../sanitize.php';
require __DIR__ . '/../cms-schema.php';
require_once __DIR__ . '/../blocks.php';
require __DIR__ . '/../cms-doc.php';
require __DIR__ . '/../Domain/CmsImagePaths.php';
require __DIR__ . '/../Domain/CmsPlaceholderContact.php';
require __DIR__ . '/../Domain/CmsV15CopyFix.php';
require __DIR__ . '/../redirects.php';
require __DIR__ . '/../media.php';

$failed = 0;
function expect(bool $ok, string $label): void
{
    global $failed;
    echo ($ok ? 'OK  ' : 'FAIL') . " $label\n";
    if (!$ok) {
        $failed++;
    }
}

$clean = sanitize_html('<p>Hola <script>alert(1)</script><strong>mundo</strong></p><img src=x onerror=alert(1)>');
expect(!str_contains($clean, 'script'), 'quita script');
expect(!str_contains($clean, 'onerror'), 'quita onerror');
expect(str_contains($clean, 'strong') || str_contains($clean, 'mundo'), 'conserva texto');

$headings = sanitize_html('<h1>Portada</h1><h3>Sub</h3>');
expect(str_contains($headings, '<p>') && str_contains($headings, 'Portada') && !str_contains($headings, '<h1'), 'h1 pasa a p');
expect(str_contains($headings, '<h2>') && str_contains($headings, 'Sub') && !str_contains($headings, '<h3'), 'h3 pasa a h2');

$tree = sanitize_cms_tree(['body' => '<p>x<script>y</script></p>', 'title' => 'Hola']);
expect(!str_contains((string) $tree['body'], 'script'), 'limpia body en JSON');
expect($tree['title'] === 'Hola', 'no toca título plano');

$migrated = migrate_cms_document(['title' => 'Inicio'], 'inicio');
expect(($migrated['schemaVersion'] ?? 0) >= 5, 'migración schemaVersion');
expect(isset($migrated['blocks'][0]['type']), 'migración blocks en inicio');
expect(($migrated['blocks'][0]['type'] ?? '') === 'hero', 'primer bloque de inicio es hero');
expect(isset($migrated['decorativeImagePaths']) && is_array($migrated['decorativeImagePaths']), 'migración decorativeImagePaths');

$emptyStats = cms_make_block('hero', ['stats' => []]);
expect(($emptyStats['props']['stats'] ?? null) === [], 'stats vacío se respeta');

$bad = validate_cms_payload(['showSplash' => 'si']);
expect($bad !== null && ($bad['field'] ?? '') === 'showSplash', 'bool inválido');

expect(validate_link_value('/contacto') === null, 'ruta interna ok');
expect(validate_link_value('javascript:alert(1)') !== null, 'javascript rechazado');
expect(validate_cms_tree(['cards' => [['link' => 'Ver consultoría']]], 'blocks.0.props') === null, 'link etiqueta con espacios pasa');
expect(validate_cms_tree(['cards' => [['link' => 'javascript:alert(1)']]], 'blocks.0.props') !== null, 'link javascript se rechaza');
expect(validate_cms_tree(['cards' => [['link' => '/contacto']]], 'blocks.0.props') === null, 'link ruta interna pasa');

$magic = normalize_inicio_sections(['sections' => [['type' => 'magic'], ['type' => 'hero']]]);
$types = array_column($magic['sections'], 'type');
expect(!in_array('magic', $types, true) && in_array('hero', $types, true), 'rechaza sección magic');

$legacy = [
    'sections' => [
        ['type' => 'hero', 'hidden' => false],
        ['type' => 'about', 'hidden' => true],
    ],
    'slides' => [['title' => 'Uno', 'image' => '']],
    'contactCards' => [['title' => 'Card']],
    'testimonials' => ['items' => [['text' => 'Bien']]],
    'services' => ['cards' => [['title' => 'SaaS', 'img' => '']]],
    'about' => ['image' => '', 'imageAlt' => ''],
    'decorativeImagePaths' => [],
];
$inicioOk = migrate_cms_document($legacy, 'inicio');
expect(validate_cms_guards($inicioOk, 'inicio') === null, 'inicio válido pasa guards');

$hiddenAll = $inicioOk;
foreach ($hiddenAll['blocks'] as $i => $block) {
    $hiddenAll['blocks'][$i]['hidden'] = true;
}
$hiddenErr = validate_cms_guards($hiddenAll, 'inicio');
expect(($hiddenErr['field'] ?? '') === 'blocks', 'no se pueden ocultar todas las secciones');

$noSlides = $inicioOk;
$noSlides['blocks'][0]['props']['slides'] = [];
$slidesErr = validate_cms_guards($noSlides, 'inicio');
expect(str_starts_with((string) ($slidesErr['field'] ?? ''), 'blocks.0.props.slides'), 'mínimo un banner');

$needsAlt = $inicioOk;
foreach ($needsAlt['blocks'] as $i => $block) {
    if (($block['type'] ?? '') === 'about') {
        $needsAlt['blocks'][$i]['props']['image'] = '/api/uploads/foto.jpg';
        $needsAlt['blocks'][$i]['props']['imageAlt'] = '';
        $aboutPath = "blocks.$i.props.image";
        break;
    }
}
$altErr = validate_cms_guards($needsAlt, 'inicio');
expect(($altErr['field'] ?? '') === ($aboutPath ?? '') . 'Alt', 'alt obligatorio si hay imagen');

$decorative = $needsAlt;
$decorative['decorativeImagePaths'] = [$aboutPath ?? 'blocks.1.props.image'];
expect(validate_cms_guards($decorative, 'inicio') === null, 'imagen decorativa no exige alt');

$badType = $inicioOk;
$badType['blocks'][] = ['id' => 'x', 'type' => 'magic', 'hidden' => false, 'props' => []];
$badTypeErr = validate_cms_guards($badType, 'inicio');
expect(str_contains((string) ($badTypeErr['field'] ?? ''), 'type'), 'bloque inválido rechazado');

$blank = cms_blank_page_document('Clientes', 'clients');
expect(($blank['blocks'][0]['type'] ?? '') === 'listingHero', 'plantilla clientes banner');
expect(($blank['blocks'][1]['type'] ?? '') === 'clients', 'plantilla clientes');
expect(($blank['blocks'][2]['type'] ?? '') === 'cta', 'plantilla clientes cta');
expect(($blank['blocks'][1]['props']['layout'] ?? '') === 'paneles', 'plantilla clientes usa paneles');
expect(validate_cms_guards($blank, 'clientes') === null, 'clientes paneles pasa guards');
$customCat = $blank;
if (!isset($customCat['blocks'][1]['props']['items'][0]) || !is_array($customCat['blocks'][1]['props']['items'][0])) {
    $customCat['blocks'][1]['props']['items'][0] = ['name' => 'X', 'alt' => 'X'];
}
$customCat['blocks'][1]['props']['layout'] = 'mosaico';
$customCat['blocks'][1]['props']['items'][0]['category'] = 'otro';
expect(validate_cms_guards($customCat, 'clientes') === null, 'layout y category sin enum no rechazan');

$svc = migrate_cms_document([
    'title' => 'Software',
    'heroImage' => '/software-banner.png',
    'heroAlt' => 'Banner',
    'image' => '/software.png',
    'imageAlt' => 'Software',
    'label' => 'SERVICIO',
    'text' => 'Desarrollo a medida.',
    'cta' => 'Contáctanos',
    'reasonsSubtitle' => 'RAZONES',
    'reasonsTitle' => 'Debes elegirnos',
    'reasons' => [['img' => '/erp.jpg', 'alt' => 'ERP', 'title' => 'ERP', 'text' => 'Gestión comercial.']],
], 'servicios-software');
expect(($svc['blocks'][0]['type'] ?? '') === 'serviceHero', 'migración servicio a serviceHero');
expect(($svc['blocks'][1]['type'] ?? '') === 'reasons', 'migración servicio a reasons');
expect(validate_cms_guards($svc, 'servicios-software') === null, 'página de servicio migrada pasa guards');
expect(cms_valid_slug('nueva-pagina') === true, 'slug válido');
expect(cms_valid_slug('Sitio') === false, 'slug con mayúsculas inválido');
expect(in_array('admin', cms_reserved_slugs(), true), 'admin reservado');
expect(cms_page_path_for('inicio') === '/', 'path de inicio');
expect(cms_page_path_for('servicios-saas') === '/servicios/saas', 'path de servicio');
expect(cms_page_path_for('casos-exito') === '/casos-exito', 'path de página nueva');

$missing = cms_version_guard(4, null);
expect(($missing['status'] ?? 0) === 400 && ($missing['body']['field'] ?? '') === 'version', 'versión ausente es 400');
$stale = cms_version_guard(4, 3);
expect(($stale['status'] ?? 0) === 409 && ($stale['body']['version'] ?? 0) === 4, 'versión vieja es 409');
expect(cms_version_guard(4, 4) === null, 'versión igual es ok');
expect(cms_version_guard(4, '4') === null, 'versión numérica en string es ok');

expect(cms_doc_not_found_message('sitio') === 'Sitio no encontrado', '404 sitio');
expect(cms_doc_not_found_message('inicio') === 'Página no encontrada', '404 página');
expect(cms_doc_save_conflict_message('sitio') === 'Alguien guardó el sitio antes. Recarga para no pisar cambios.', '409 save sitio');
expect(cms_doc_save_conflict_message('inicio') === 'Alguien guardó esta página antes. Recarga para no pisar cambios.', '409 save página');
expect(cms_doc_publish_conflict_message() === 'Alguien publicó o guardó antes. Recarga para no pisar cambios.', '409 publish');

define('CHATBOT_AS_LIBRARY', true);
require __DIR__ . '/../chatbot.php';
require __DIR__ . '/../chatbot-ai.php';
$cfg = ai_default_config();
expect($cfg['enabled'] === false, 'IA deshabilitada por defecto');
$public = ai_public_config(['enabled' => true, 'provider' => 'openrouter', 'model' => 'x', 'baseUrl' => 'https://openrouter.ai/api/v1', 'apiKey' => 'sk-secret-value']);
expect(empty($public['apiKey']) && ($public['keyConfigured'] ?? false) === true, 'la API key no se expone');
expect(ai_is_ready($cfg) === false, '/bot-ai sin key no está listo');
$classic = chatbot_classic_reply('hola');
expect(str_contains($classic, 'MENU PRINCIPAL') || str_contains($classic, 'Matt Innova'), 'bot clásico responde saludo');
$hello = chatbot_classic_result('hola');
expect(is_array($hello['links'] ?? null) && $hello['links'] !== [], 'saludo incluye links');
$reclamo = chatbot_classic_result('quiero un reclamo');
expect(str_contains(strtolower((string) $reclamo['reply']), 'reclam'), 'bot clásico deriva a reclamos');
$reclamoPaths = array_column($reclamo['links'] ?? [], 'path');
expect(cms_normalize_locale('en') === 'en', 'locale en');
expect(cms_normalize_locale('fr') === 'es', 'locale fallback es');
expect(cms_public_path('/contacto', 'en') === '/en/contacto', 'path público en');
expect(cms_public_path('/', 'en') === '/en', 'home en');
expect(cms_hmac_signature('{}', 'secret') === 'sha256=' . hash_hmac('sha256', '{}', 'secret'), 'firma hmac');
expect((cms_schema_for_slug('contacto')['kind'] ?? '') === 'contact', 'schema explícito contacto');
expect((cms_schema_for_slug('acerca-de')['kind'] ?? '') === 'about', 'schema explícito acerca-de');
expect((cms_default_layout()['width'] ?? '') === 'full', 'layout por defecto');
expect(array_key_exists('backgroundImage', cms_default_layout()), 'layout trae backgroundImage');
expect((cms_default_layout()['backgroundImage'] ?? '') === CMS_DEFAULT_BG_IMAGE, 'layout trae fondo por defecto');
$v6doc = migrate_cms_document(['schemaVersion' => 5, 'blocks' => [
    ['id' => 'a', 'type' => 'cta', 'hidden' => false, 'layout' => ['width' => 'full', 'padding' => '', 'background' => '', 'backgroundImage' => ''], 'props' => []],
    ['id' => 'b', 'type' => 'cta', 'hidden' => false, 'layout' => ['width' => 'full', 'padding' => '', 'background' => '', 'backgroundImage' => '/api/uploads/x.webp'], 'props' => []],
]], 'inicio');
expect(($v6doc['blocks'][0]['layout']['backgroundImage'] ?? '') === CMS_DEFAULT_BG_IMAGE, 'v6 rellena fondo vacío');
expect(($v6doc['blocks'][1]['layout']['backgroundImage'] ?? '') === '/api/uploads/x.webp', 'v6 respeta fondo propio');
$bgBlock = cms_make_block('cta', [], false, null, ['backgroundImage' => '/api/uploads/bg.webp']);
expect(($bgBlock['layout']['backgroundImage'] ?? '') === '/api/uploads/bg.webp', 'make_block conserva imagen de fondo');
expect(cms_normalize_redirect_path('/vieja/') === '/vieja', 'normaliza redirect');
$erp = chatbot_classic_result('precio del erp');
expect(in_array('/contacto', array_column($erp['links'] ?? [], 'path'), true), 'precios derivan a contacto');
$clientes = chatbot_classic_result('quiero ver sus clientes');
expect(in_array('/clientes', array_column($clientes['links'] ?? [], 'path'), true), 'clientes derivan a /clientes');
$bye = chatbot_classic_result('adios');
expect(str_contains(strtolower((string) $bye['reply']), 'hasta'), 'despedida del bot clásico');
$thanks = chatbot_classic_result('gracias');
expect(str_contains(strtolower((string) $thanks['reply']), 'de nada'), 'gracias es cortesía');
expect(!str_contains(strtolower((string) $thanks['reply']), 'hasta pronto'), 'gracias no cierra la conversación');
$iaKept = migrate_cms_document(['chatbotMode' => 'ia', 'schemaVersion' => 5], 'sitio');
expect(($iaKept['chatbotMode'] ?? '') === 'ia', 'publicar sitio conserva modo ia');
$modeFilled = migrate_cms_document(['schemaVersion' => 5], 'sitio');
expect(in_array($modeFilled['chatbotMode'] ?? '', ['ia', 'clasico'], true), 'sitio siempre tiene chatbotMode');
$splash = migrate_cms_document(['schemaVersion' => 5], 'sitio');
expect(isset($splash['splashImages'][0]['image']) && str_contains((string) $splash['splashImages'][0]['image'], 'mis-academy'), 'splash rellena marcas');
$splashEmpty = migrate_cms_document(['schemaVersion' => 5, 'splashImages' => []], 'sitio');
expect($splashEmpty['splashImages'] === [], 'splash vacía se respeta');
$enLabel = cms_apply_splash_defaults(['schemaVersion' => 5], 'en');
expect(($enLabel['splashLabel'] ?? '') === 'LOADING…', 'splash en inglés');
$plazo = chatbot_classic_result('cuanto tardan un desarrollo');
expect(str_contains(strtolower((string) $plazo['reply']), 'semana') || str_contains(strtolower((string) $plazo['reply']), 'sprint'), 'plazos de desarrollo');
$hire = chatbot_classic_result('quiero contratar sus servicios');
expect(in_array('/contacto', array_column($hire['links'] ?? [], 'path'), true), 'contratar deriva a contacto');
$aiCtx = chatbot_ai_context();
expect(str_contains($aiCtx, '/clientes'), 'contexto IA incluye /clientes');
require_once __DIR__ . '/../clients-catalog.php';
expect(count(cms_clients_catalog_items()) >= 50, 'catalogo de clientes cargado');
expect(cms_public_href('#') === '', 'quita href hash');
expect(cms_public_href('https://electrihouse.xyz/') === '', 'quita .xyz demo');
expect(cms_public_href('https://makitoolsporu.com/') === '', 'quita typo makitoolsporu');
expect(cms_public_href('http://tecnocom.edu.pe/') === 'http://tecnocom.edu.pe/', 'conserva URL educativa');
$contactoBlocks = cms_blocks_from_contacto(['title' => 'Contacto']);
$contactoTypes = array_map(static fn ($block) => $block['type'] ?? '', $contactoBlocks);
expect(in_array('faq', $contactoTypes, true) && in_array('map', $contactoTypes, true), 'contacto incluye faq y mapa');
$acercaDoc = migrate_cms_document([
    'heroTitle' => 'Equipo en Cañete, operación en todo el Perú.',
    'heroText' => '30 años instalando sistemas.',
    'heroCta' => 'Hablar con un experto',
], 'acerca-de');
expect(($acercaDoc['blocks'][0]['type'] ?? '') === 'pageHero', 'acerca-de empieza en pageHero');
expect(($acercaDoc['blocks'][0]['props']['title'] ?? '') === 'Equipo en Cañete, operación en todo el Perú.', 'acerca-de conserva el lema');
$serviciosDoc = migrate_cms_document([
    'heroTitle' => 'Cinco líneas, cada una hasta la puesta en marcha.',
    'heroText' => 'Software, hardware y consultoría.',
    'cards' => [],
], 'servicios');
expect(($serviciosDoc['blocks'][0]['type'] ?? '') === 'listingHero', 'servicios empieza en listingHero');
expect(str_contains((string) ($serviciosDoc['blocks'][0]['props']['title'] ?? ''), 'puesta en marcha'), 'servicios conserva el lema');
$contactoDoc = migrate_cms_document([
    'title' => 'Escríbenos con el problema, no con un briefing vacío.',
    'text' => 'Casa matriz en San Vicente de Cañete.',
    'cards' => [],
], 'contacto');
expect(($contactoDoc['blocks'][0]['type'] ?? '') === 'pageHero', 'contacto empieza en pageHero');
expect(str_contains((string) ($contactoDoc['blocks'][0]['props']['title'] ?? ''), 'briefing vacío'), 'contacto conserva el lema');
$packed = chatbot_pack("Hola \u{1F680}");
expect(!preg_match('/[\x{1F300}-\x{1FAFF}]/u', $packed['reply']), 'chatbot quita emoji');
expect(cms_clients_content_is_placeholder(['blocks' => []]) === true, 'pagina clientes vacia es placeholder');
expect(cms_clients_content_is_placeholder(['blocks' => [['type' => 'clients', 'props' => ['items' => [['name' => 'A'], ['name' => 'B']]]]]]) === false, 'clientes con 2 items no es placeholder');
$fromText = chatbot_links_from_text('Mira /contacto y /servicios/software');
expect(count($fromText) === 2, 'extrae rutas del texto de IA');

$rewritten = '/software.png';
cms_rewrite_public_image_tree($rewritten);
expect($rewritten === '/software.webp', 'reescribe software.png a webp');
$tree = ['cards' => [['img' => 'hardware2026.png'], ['img' => 'consultoria.png']]];
cms_rewrite_public_image_tree($tree);
expect($tree['cards'][0]['img'] === 'hardware2026.webp', 'reescribe hardware en árbol');
expect($tree['cards'][1]['img'] === 'consultoria.webp', 'reescribe consultoria en árbol');
$again = 'software.webp';
cms_rewrite_public_image_tree($again);
expect($again === 'software.webp', 'reescribir webp es idempotente');

expect(cms_media_basename('/api/uploads/27dd730a948402a6.webp') === '27dd730a948402a6.webp', 'basename de subida principal');
expect(cms_media_basename('/api/uploads/27dd730a948402a6-480.webp') === '27dd730a948402a6.webp', 'basename quita variante 480');
expect(cms_media_basename('/api/uploads/27dd730a948402a6-960.jpg') === '27dd730a948402a6.jpg', 'basename quita variante 960 jpg');

$contactoReal = ['address' => 'Urb. Libertad, San Vicente de Cañete', 'email' => 'contacto@mattinnovasolution.com', 'phone' => '+51 992 422 219'];
$cards = [
    (object) ['title' => 'Custom address', 'text' => 'Av. República de Panamá 3591, Of. 802 — San Isidro, Lima'],
    (object) ['title' => 'Email', 'text' => 'contacto@mattinnova.pe'],
    (object) ['title' => 'WhatsApp', 'text' => '(+51) 987 654 321'],
    (object) ['title' => 'Otro local', 'text' => 'Oficina temporal en San Isidro'],
];
$doc = (object) ['blocks' => [(object) ['type' => 'contactCards', 'props' => (object) ['items' => $cards]]]];
expect(cms_replace_page_contact_placeholders($doc, 'inicio', $contactoReal), 'repara los tres datos de contacto de relleno');
expect(array_column($cards, 'text') === [...array_values($contactoReal), 'Oficina temporal en San Isidro'], 'conserva otros contactos aunque mencionen San Isidro');
expect($cards[0]->title === 'Custom address' && !cms_replace_page_contact_placeholders($doc, 'inicio', $contactoReal), 'conserva títulos y la reparación es idempotente');

$spanishContacts = [(object) ['title' => 'Correo', 'text' => $contactoReal['email']]];
$emptyEnglish = cms_fill_english_contact_items([], $spanishContacts);
expect($emptyEnglish === [['title' => 'Email', 'text' => $contactoReal['email']]], 'localiza un contacto EN vacío a partir de ES');
$editedEnglish = [['title' => 'Contact sales', 'icon' => 'bi-envelope', 'text' => 'ventas@example.com']];
expect(cms_fill_english_contact_items($editedEnglish, $spanishContacts) === $editedEnglish, 'conserva los datos EN ya editados');

$v15Document = static fn (array $blocks): stdClass => json_decode(json_encode(['blocks' => $blocks]));
$serviceGrid = array_map(static fn (int $i): array => ['path' => '/servicio-' . $i], range(0, 4));
$listing = $v15Document([['type' => 'serviceCards', 'props' => ['cards' => $serviceGrid]]]);
expect(cms_v15_repair_copy($listing, 'servicios', 'en') && $listing->blocks[0]->props->cards[2]->path === '/servicios/soluciones-ti', 'v15 repone el servicio TI en el índice 2');
$listing->blocks[0]->props->cards[2]->title = 'Edited IT services';
$sameListing = json_encode($listing);
expect(!cms_v15_repair_copy($listing, 'servicios', 'en') && json_encode($listing) === $sameListing, 'v15 conserva una tarjeta TI ya existente');
$largeListing = $v15Document([['type' => 'serviceCards', 'props' => ['cards' => [...$serviceGrid, ['path' => '/nuevo']]]]]);
expect(!cms_v15_repair_copy($largeListing, 'servicios', 'en'), 'v15 conserva una rejilla personalizada de seis tarjetas');

$home = $v15Document([['type' => 'services', 'props' => ['cards' => [
    ['alt' => 'Consultoría informática'],
    ['alt' => 'Consultoría informática para PYMES'],
]]]]);
expect(!cms_v15_repair_copy($home, 'inicio', 'es'), 'v15 conserva el texto español en inicio ES');
expect(cms_v15_repair_copy($home, 'inicio', 'en')
    && array_column($home->blocks[0]->props->cards, 'alt') === ['IT consulting', 'Consultoría informática para PYMES'], 'v15 traduce alt por coincidencia exacta en EN');

$faqES = cms_studio_faq_items('es');
$faqEN = cms_studio_faq_items('en');
$contact = $v15Document([['type' => 'faq', 'props' => $faqES]]);
expect(cms_v15_repair_copy($contact, 'contacto', 'en')
    && json_encode($contact->blocks[0]->props) === json_encode($faqEN), 'v15 traduce la lista de preguntas original');
$faqES['items'][0]['answer'] = 'Respuesta editada';
$contact = $v15Document([['type' => 'faq', 'props' => $faqES]]);
expect(cms_v15_repair_copy($contact, 'contacto', 'en')
    && $contact->blocks[0]->props->title === $faqEN['title']
    && json_encode($contact->blocks[0]->props->items) === json_encode($faqES['items']), 'v15 conserva toda la lista cuando se editó una respuesta');

$detail = $v15Document([
    ['type' => 'serviceHero', 'props' => ['heroAlt' => 'Software Banner', 'cta' => 'Hablar con un experto hoy']],
    ['type' => 'reasons', 'props' => ['title' => 'Qué queda instalado', 'items' => [
        ['title' => 'Pagina Ecommerce para tu negocio', 'alt' => 'Pagina Ecommerce para tu negocio.'],
    ]]],
]);
expect(cms_v15_repair_copy($detail, 'servicios-software', 'en')
    && $detail->blocks[0]->props->cta === 'Hablar con un experto hoy'
    && $detail->blocks[1]->props->title === 'What gets installed', 'v15 conserva el CTA personalizado');
expect(cms_v15_repair_copy($detail, 'servicios-software', 'es')
    && $detail->blocks[0]->props->heroAlt === 'Banner de Software'
    && $detail->blocks[1]->props->items[0]->title === 'Página Ecommerce para tu negocio'
    && $detail->blocks[1]->props->items[0]->alt === 'Pagina Ecommerce para tu negocio.', 'v15 corrige solo banner y título coincidentes');

exit($failed > 0 ? 1 : 0);
