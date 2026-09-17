<?php
declare(strict_types=1);

if (!function_exists('revisarPalabras')) {
    function revisarPalabras(array $keywords, string $textoUsuario): bool
    {
        if ($textoUsuario === '') {
            return false;
        }
        foreach ($keywords as $key) {
            $key_clean = strtolower((string) $key);
            $buscar = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'];
            $reemplazar = ['a', 'e', 'i', 'o', 'u', 'n', 'u'];
            $key_clean = str_replace($buscar, $reemplazar, $key_clean);
            $key_clean = preg_replace('/[^a-z0-9\s]/', '', $key_clean) ?? '';
            if ($key_clean !== '' && strpos($textoUsuario, trim($key_clean)) !== false) {
                return true;
            }
        }
        return false;
    }
}

function chatbot_link(string $label, string $path): array
{
    return ['label' => $label, 'path' => $path];
}

function chatbot_known_pages(): array
{
    return [
        '/servicios' => 'Servicios',
        '/servicios/software' => 'Software y web',
        '/servicios/saas' => 'SaaS',
        '/servicios/consultoria' => 'Consultoría TI',
        '/servicios/soluciones-ti' => 'Soluciones TI',
        '/servicios/hardware' => 'Hardware',
        '/acerca-de' => 'Acerca de',
        '/contacto' => 'Contacto',
        '/libro-reclamaciones' => 'Libro de reclamaciones',
        '/clientes' => 'Clientes',
        '/privacidad' => 'Privacidad',
        '/terminos' => 'Términos',
    ];
}

function chatbot_normalize_links(array $links): array
{
    $out = [];
    $seen = [];
    foreach ($links as $link) {
        if (!is_array($link)) {
            continue;
        }
        $path = trim((string) ($link['path'] ?? ''));
        $label = trim((string) ($link['label'] ?? ''));
        if ($path === '' || !str_starts_with($path, '/') || isset($seen[$path])) {
            continue;
        }
        if ($label === '') {
            $label = chatbot_known_pages()[$path] ?? $path;
        }
        $seen[$path] = true;
        $out[] = chatbot_link($label, $path);
    }
    return $out;
}

function chatbot_links_from_text(string $text): array
{
    $links = [];
    foreach (chatbot_known_pages() as $path => $label) {
        $pattern = '#' . preg_quote($path, '#') . '(?![A-Za-z0-9/\-])#i';
        if (preg_match($pattern, $text)) {
            $links[] = chatbot_link($label, $path);
        }
    }
    return chatbot_normalize_links($links);
}

function chatbot_pack(string $reply, array $links = []): array
{
    return [
        'reply' => $reply,
        'links' => chatbot_normalize_links($links),
    ];
}

function chatbot_classic_result(string $message): array
{
    $input_norm = strtolower($message);
    $buscar = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'];
    $reemplazar = ['a', 'e', 'i', 'o', 'u', 'n', 'u'];
    $input_norm = str_replace($buscar, $reemplazar, $input_norm);
    $input_norm = preg_replace('/[^a-z0-9\s]/', '', $input_norm) ?? '';
    $input_norm = trim($input_norm);

    $menu = "-------------------------------------------\n" .
        "📌 *MENU PRINCIPAL DE ASESORIA*\n" .
        "-------------------------------------------\n" .
        "🏢 *Empresa:* ¿Quiénes somos? | Historia | Equipo | Ubicación\n" .
        "🤝 *Clientes:* Empresas, instituciones y alianzas\n" .
        "💻 *ERP:* Módulos, beneficios y costo\n" .
        "🎓 *DSpace:* Implementación, características y SUNEDU\n" .
        "🚀 *Desarrollo:* Apps, SaaS, stack Angular/NestJS\n" .
        "🛡️ *Consultoría:* Redes, Cloud, Ciberseguridad\n" .
        "📚 *Academy:* Cursos, metodología y testimonios\n" .
        "📲 *Contacto:* WhatsApp, Email, Soporte técnico\n" .
        "-------------------------------------------\n" .
        "✍️ *Escribe tu interés y te daré los detalles.*";

    $ayudaAdicional = "\n\n💡 _¿Hay algo más en lo que pueda asesorarte? (Escribe *menu* para ver las opciones)_";
    $menuLinks = [
        chatbot_link('Servicios', '/servicios'),
        chatbot_link('Clientes', '/clientes'),
        chatbot_link('Contacto', '/contacto'),
        chatbot_link('Acerca de', '/acerca-de'),
    ];

    if ($input_norm === '' || $input_norm === 'menu' || $input_norm === 'volver' || revisarPalabras(['hola', 'buen', 'que tal', 'empezar', 'inicio', 'saludos', 'hey'], $input_norm)) {
        return chatbot_pack(
            "¡Hey! Qué gusto verte por aquí. Soy el bot de Matt Innova, tu aliado tech. ¿Listo para descubrir cómo llevar tu empresa al siguiente nivel?\n\n" . $menu,
            $menuLinks
        );
    }

    if (revisarPalabras(['clientes', 'cliente', 'casos de exito', 'alianzas', 'portafolio', 'empresas que confian'], $input_norm)) {
        $reply = "🤝 *NUESTROS CLIENTES*\n\nTrabajamos con empresas, instituciones educativas y alianzas en todo el Perú. En /clientes verás tres paneles:\n" .
            "🏢 *Empresas y E-commerce:* salud, retail, software, gastronomía y más.\n" .
            "🎓 *Instituciones educativas:* CEBA, EESPP, IESPP, IESTP y academias.\n" .
            "🤝 *Alianzas:* corporativas, tecnológicas y gubernamentales.\n\n" .
            "Abre un rubro para ver cada caso. Si quieres un proyecto similar, escribe *contacto*.";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Ver clientes', '/clientes'),
            chatbot_link('Contacto', '/contacto'),
        ]);
    }

    if (revisarPalabras(['quienes', 'nosotros', 'empresa', 'historia', 'anos', 'experiencia', 'fundacion', 'hitos', 'valores', 'mision', 'vision', 'filosofia', 'compromiso'], $input_norm)) {
        $reply = "*30 AÑOS DE LIDERAZGO TECNOLÓGICO*\n\nMatt Innova Solution nació en una época donde los mainframes dominaban. Hemos evolucionado desde el ensamblaje de PCs y cableado estructurado hasta convertirnos en arquitectos de la nube y desarrolladores de inteligencia artificial. Con más de 4,000 clientes y 50 macroproyectos, no solo hemos visto la historia, la hemos escrito.\n\n" .
             "*HITOS CRONOLÓGICOS*\n" .
             "🔹 *1994-2000 (Fundación):* Iniciamos como proveedores de hardware y redes para pymes en Cañete.\n" .
             "🔹 *2001-2010 (Expansión):* Desarrollamos el primer sistema de facturación electrónica adaptado a la legislación peruana.\n" .
             "🔹 *2011-2020 (Innovación):* Lanzamiento de nuestro ERP en la nube. Implementación de repositorios DSpace cumpliendo estándares de SUNEDU y CONCYTEC.\n" .
             "🔹 *2021-Presente (Disrupción):* Fundación de MIS Academy. Migración completa de nuestra infraestructura a microservicios con NestJS y Angular.\n\n" .
             "*NUESTROS VALORES*\n" .
             "✨ *Innovación constante:* Invertimos fuertemente en I+D.\n" .
             "✨ *Compromiso real:* Somos partners de largo plazo con soporte post-implementación de primer nivel.";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Acerca de nosotros', '/acerca-de'),
            chatbot_link('Servicios', '/servicios'),
            chatbot_link('Contacto', '/contacto'),
        ]);
    }

    if (revisarPalabras(['pedro', 'taya', 'ceo', 'fundador', 'dueno'], $input_norm)) {
        $reply = "👨‍💼 *Ing. Pedro Alex Taya Yactayo - CEO y Fundador*\n\nCon más de 30 años de experiencia, el Ing. Taya es un visionario que entendió antes que nadie el potencial de la tecnología para transformar empresas. Es ingeniero de profesión y estratega por vocación. Su enfoque: \"tecnología con propósito, no por moda\".\n\n_\"No vendemos software, vendemos productividad y tranquilidad.\"_";
        return chatbot_pack($reply . $ayudaAdicional, [chatbot_link('Acerca de', '/acerca-de')]);
    }

    if (revisarPalabras(['giovanni', 'risco', 'desarrollador', 'arquitecto', 'programador'], $input_norm)) {
        $reply = "👨‍💻 *Giovanni Risco - Lead Web Developer y Arquitecto de Software*\n\nGiovanni es el cerebro detrás de la robustez técnica de nuestras soluciones. Experto en arquitecturas de microservicios con NestJS y frontends de alto rendimiento con Angular. Es el responsable de que nuestros sistemas sean escalables, seguros y ultrarrápidos.\n\n_\"Un sistema no está completo hasta que es a prueba de fallos y de usuarios.\"_";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Acerca de', '/acerca-de'),
            chatbot_link('Software a medida', '/servicios/software'),
        ]);
    }

    if (revisarPalabras(['equipo', 'talento', 'personal'], $input_norm)) {
        $reply = "👥 *EL TALENTO DETRÁS DE MIS*\n\nNo somos solo dos líderes. Contamos con un equipo multidisciplinario de ingenieros de software, administradores de redes, consultores funcionales y diseñadores UX/UI. Cada proyecto es un esfuerzo colectivo donde la experiencia senior se combina con el talento joven.";
        return chatbot_pack($reply . $ayudaAdicional, [chatbot_link('Acerca de', '/acerca-de')]);
    }

    if (revisarPalabras(['donde', 'ubicacion', 'direccion', 'canete', 'sede', 'oficina', 'horario', 'horarios'], $input_norm)) {
        $reply = "📍 *CASA MATRIZ*\n\nUrb. Libertad Mz. I Lt. 5, Calle Las Moras, San Vicente de Cañete, Lima, Perú.\n\n🌐 *PRESENCIA SIN FRONTERAS*\n\nAunque nuestro corazón está en Cañete, operamos 100% remoto con clientes en toda Latinoamérica. Atención de lunes a viernes; para una demo o visita escribe *contacto* o usa WhatsApp (+51) 992 422 219.";
        return chatbot_pack($reply . $ayudaAdicional, [chatbot_link('Ir a contacto', '/contacto')]);
    }

    if (revisarPalabras(['plazo', 'plazos', 'tardan', 'demora', 'cuanto tiempo', 'tiempo de desarrollo', 'semanas', 'sprints', 'entrega'], $input_norm)) {
        $reply = "⏱️ *TIEMPOS DE ENTREGA*\n\nTrabajamos con *SCRUM*: avances cada 2 semanas.\n\n" .
            "🔹 *Sitio o landing:* 2 a 4 semanas, según contenidos y aprobaciones.\n" .
            "🔹 *App o sistema a medida:* 6 a 12 semanas en sprints con demos.\n" .
            "🔹 *ERP / DSpace:* el plan se arma en una reunión de alcance.\n\n" .
            "El calendario exacto sale de esa reunión. Escríbenos en /contacto.";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Solicitar cotización', '/contacto'),
            chatbot_link('Software a medida', '/servicios/software'),
        ]);
    }

    if (revisarPalabras(['contratar', 'comprar', 'adquirir', 'quiero contratar', 'contraten', 'cotizar proyecto', 'contratar servicios'], $input_norm)) {
        $reply = "🧾 *¿CÓMO CONTRATAR?*\n\n1. Cuéntanos el alcance en /contacto o por WhatsApp (+51) 992 422 219.\n" .
            "2. Te armamos una propuesta (módulos, plazos y rango de inversión).\n" .
            "3. Al aprobar, arrancamos con un sprint de descubrimiento.\n\n" .
            "No cerramos un precio único: depende de módulos, usuarios e integraciones.";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Ir a contacto', '/contacto'),
            chatbot_link('Ver servicios', '/servicios'),
            chatbot_link('Ver clientes', '/clientes'),
        ]);
    }

    if (revisarPalabras(['erp', 'sistema', 'gestion', 'administracion', 'ventas', 'inventario', 'financiero', 'contable', 'precio', 'costo', 'beneficios', 'cotizacion', 'presupuesto', 'cuanto'], $input_norm)) {
        $reply = "🚀 *ERP MIS: EL CEREBRO DE SU EMPRESA*\n\nNuestro sistema ERP es una suite modular que integra todas las áreas de su negocio en una sola plataforma. Acceso 100% web y app móvil.\n\n" .
             "*MÓDULOS DISPONIBLES:*\n" .
             "📦 *Ventas:* Facturación electrónica ilimitada SUNAT y cotizaciones.\n" .
             "📊 *Inventario:* Control multi-almacén en tiempo real, códigos de barra.\n" .
             "💰 *Financiero:* Cuentas por cobrar y pagar, flujo de caja proyectado.\n" .
             "👥 *RRHH:* Control de asistencia, planilla electrónica.\n" .
             "📈 *Business Intelligence:* Tableros de control personalizados con KPIs.\n\n" .
             "💵 *INVERSIÓN:*\n" .
             "Planes adaptables desde 1 hasta 1,000 usuarios. El costo varía según los módulos elegidos. Agenda una demo y te armamos una cotización a medida.";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Solicitar cotización', '/contacto'),
            chatbot_link('Software y ERP', '/servicios/software'),
            chatbot_link('SaaS', '/servicios/saas'),
        ]);
    }

    if (revisarPalabras(['dspace', 'concytec', 'sunedu', 'tesis', 'repositorio', 'biblioteca', 'renati', 'alicia'], $input_norm)) {
        $reply = "🎓 *REPOSITORIO DIGITAL ACADÉMICO DSPACE*\n\nUna biblioteca digital avanzada que almacena, preserva y difunde la producción científica de universidades e institutos, cumpliendo estrictamente con SUNEDU y CONCYTEC.\n\n" .
             "*CARACTERÍSTICAS:*\n" .
             "🔍 *Búsqueda avanzada:* Motor Apache SOLR que indexa texto completo de PDFs.\n" .
             "🌐 *Interoperabilidad:* Protocolo OAI-PMH para visibilidad en ALICIA y La Referencia.\n" .
             "🛠️ *Metodología MIS:* Análisis de colección, personalización de theme institucional, migración masiva de metadata y capacitación completa.";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Soluciones TI', '/servicios/soluciones-ti'),
            chatbot_link('Pedir implementación', '/contacto'),
        ]);
    }

    if (revisarPalabras(['web', 'pagina', 'crear', 'app', 'movil', 'desarrollo', 'angular', 'nest', 'saas', 'stack', 'codigo', 'tienda', 'ecommerce'], $input_norm)) {
        $reply = "💻 *FÁBRICA DE SOFTWARE A LA MEDIDA*\n\nSi tu proceso de negocio es único, nosotros lo automatizamos construyendo la herramienta desde cero.\n\n" .
             "*NUESTRO STACK:*\n" .
             "🅰️ *Frontend:* Interfaces rápidas, reactivas y PWA con Angular.\n" .
             "🟢 *Backend:* APIs robustas y microservicios con NestJS.\n" .
             "📱 *Móvil:* Apps híbridas de alto rendimiento con Ionic + Angular.\n" .
             "⚙️ *Modelo SaaS:* Pagas una suscripción mensual y nosotros nos encargamos del hosting, soporte y actualizaciones.";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Desarrollo web', '/servicios/software'),
            chatbot_link('SaaS', '/servicios/saas'),
            chatbot_link('Pedir presupuesto', '/contacto'),
        ]);
    }

    if (revisarPalabras(['consultoria', 'redes', 'conectividad', 'seguridad', 'cloud', 'ciberseguridad', 'firewall', 'fortinet', 'backup'], $input_norm)) {
        $reply = "🛡️ *CONSULTORÍA TI EMPRESARIAL*\n\nSomos el departamento de tecnología externo que tu empresa necesita:\n" .
             "⚙️ *Redes:* Diseño de cableado estructurado, VPNs y firewalls Fortinet.\n" .
             "☁️ *Migración cloud:* Llevamos tus servidores a AWS, Google Cloud o Azure.\n" .
             "🔒 *Ciberseguridad:* Auditorías de vulnerabilidades y ethical hacking.\n" .
             "💾 *Respaldo:* Backup automático y planes de Disaster Recovery.";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Consultoría TI', '/servicios/consultoria'),
            chatbot_link('Soluciones TI', '/servicios/soluciones-ti'),
            chatbot_link('Hablar con un asesor', '/contacto'),
        ]);
    }

    if (revisarPalabras(['hosting', 'servidor', 'vps', 'planes'], $input_norm)) {
        $reply = "🌐 *HOSTING DE ALTO RENDIMIENTO MANAGED*\n\n" .
             "🚀 *Plan Start:* 2GB RAM, 50GB SSD, 1TB transferencia.\n" .
             "💼 *Plan Business:* 8GB RAM, 200GB NVMe, ancho de banda ilimitado.\n" .
             "👑 *Plan Enterprise:* Servidores dedicados a medida con uptime garantizado.\n\n" .
             "Los precios se cierran según tráfico y slas. Te cotizamos en /contacto.";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Soluciones TI', '/servicios/soluciones-ti'),
            chatbot_link('Cotizar hosting', '/contacto'),
        ]);
    }

    if (revisarPalabras(['academy', 'aprender', 'estudiar', 'curso', 'clases', 'capacitacion', 'testimonios'], $input_norm)) {
        $reply = "📚 *MIS ACADEMY - PROJECT-BASED LEARNING*\n\nNo enseñamos a copiar código. Aprendes construyendo un portafolio de proyectos reales con mentoría en vivo de profesionales de MIS.\n\n" .
             "*PROGRAMAS MASTERY:*\n" .
             "1️⃣ *Frontend Mastery con Angular:* HTML5/CSS3, TypeScript, RxJS, Signals y dashboards avanzados.\n" .
             "2️⃣ *Backend Pro con NestJS:* Node.js, módulos, controladores, TypeORM, Prisma y microservicios (NATS/gRPC).\n" .
             "3️⃣ *Networking y Ethical Hacking:* Modelo OSI, subnetting, laboratorios en Kali Linux, Nmap y Wireshark.\n\n" .
             "💬 _\"Gracias a MIS Academy pasé de ser soporte técnico a desarrollador Angular Senior en 8 meses.\"_ - Carlos M., exalumno.";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Contacto / matrícula', '/contacto'),
        ]);
    }

    if (revisarPalabras(['reclam', 'libro', 'indecopi', 'queja'], $input_norm)) {
        $reply = "📒 *LIBRO DE RECLAMACIONES*\n\nPuedes registrar tu reclamo virtual en /libro-reclamaciones. También te atendemos por WhatsApp al (+51) 992 422 219 o en libroreclamaciones@mattinnovasolution.com.";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Libro de reclamaciones', '/libro-reclamaciones'),
            chatbot_link('Contacto', '/contacto'),
        ]);
    }

    if (revisarPalabras(['contacto', 'whatsapp', 'email', 'correo', 'soporte', 'telefono'], $input_norm)) {
        $reply = "📲 *CONTACTO OFICIAL MATT INNOVA*\n\n📬 *Email:* contacto@mattinnovasolution.com\n📱 *WhatsApp:* (+51) 992 422 219\n👥 *Redes:* @mattinnovasolution\n\n📢 El soporte técnico responde en menos de 15 minutos para incidencias críticas de servidores. Escríbenos desde /contacto.";
        return chatbot_pack($reply . $ayudaAdicional, [chatbot_link('Ir a contacto', '/contacto')]);
    }

    if (revisarPalabras(['garantia', 'facturacion', 'sunat', 'privacidad', 'scrum', 'agil', 'metodologia', 'terminos', 'legal'], $input_norm)) {
        $reply = "📋 *PREGUNTAS FRECUENTES*\n\n" .
             "🛡️ *Garantía:* Todos nuestros desarrollos incluyen 3 meses de garantía sobre errores de programación.\n" .
             "🔄 *Metodología:* Gestionamos los proyectos con SCRUM, entregando avances tangibles cada 2 semanas (sprints).\n" .
             "🔒 *Confidencialidad:* Firmamos acuerdos de confidencialidad (NDA) para proteger tus datos.\n\n" .
             "Textos legales: /privacidad y /terminos.";
        return chatbot_pack($reply . $ayudaAdicional, [
            chatbot_link('Privacidad', '/privacidad'),
            chatbot_link('Términos', '/terminos'),
            chatbot_link('Contacto', '/contacto'),
        ]);
    }

    if (revisarPalabras(['gracias', 'muchas gracias', 'te lo agradezco'], $input_norm)
        && !revisarPalabras(['adios', 'chao', 'hasta luego', 'bye', 'nos vemos'], $input_norm)) {
        $reply = "🙏 *De nada.*\n\nSi quieres, seguimos: escribe *menu* o dime sobre *clientes*, *servicios* o *contacto*.";
        return chatbot_pack($reply . $ayudaAdicional, $menuLinks);
    }

    if (revisarPalabras(['adios', 'chao', 'hasta luego', 'bye', 'nos vemos'], $input_norm)) {
        $reply = "👋 *¡Hasta pronto!*\n\nGracias por escribirnos. Si más adelante quieres una demo o cotización, entra a /contacto o ábreme de nuevo. ¡Éxitos!";
        return chatbot_pack($reply, [
            chatbot_link('Contacto', '/contacto'),
            chatbot_link('Clientes', '/clientes'),
        ]);
    }

    $safe = trim($message);
    if (strlen($safe) > 120) {
        $safe = substr($safe, 0, 117) . '…';
    }
    return chatbot_pack(
        "🤔 *Consulta interesante...*\n\nNo tengo una respuesta exacta para \"" . $safe . "\". Podemos hablar de nuestro *ERP*, *DSpace* para universidades, *desarrollo* a medida o *MIS Academy*.\n\n💡 Escribe *menu* para ver la lista completa de opciones.",
        $menuLinks
    );
}

function chatbot_classic_reply(string $message): string
{
    return chatbot_classic_result($message)['reply'];
}

function handle_bot(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        json_out(['message' => 'Método no permitido'], 405);
    }
    $input = json_input();
    $message = trim((string) ($input['message'] ?? $input['mensaje'] ?? ''));
    $result = chatbot_classic_result($message);
    json_out([
        'status' => 'success',
        'reply' => $result['reply'],
        'links' => $result['links'],
        'source' => 'classic',
    ]);
}

if (!defined('CHATBOT_AS_LIBRARY')) {
    require_once __DIR__ . '/helpers.php';
    handle_bot();
}
