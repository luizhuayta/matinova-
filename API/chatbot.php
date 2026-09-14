<?php
$input = json_decode(file_get_contents('php://input'), true);
$message = isset($input['mensaje']) ? trim($input['mensaje']) : (isset($input['message']) ? trim($input['message']) : '');

$input_norm = strtolower($message);
$buscar = array('á','é','í','ó','ú','ñ','ü');
$reemplazar = array('a','e','i','o','u','n','u');
$input_norm = str_replace($buscar, $reemplazar, $input_norm);
$input_norm = preg_replace('/[^a-z0-9\s]/', '', $input_norm);
$input_norm = trim($input_norm);

function revisarPalabras($keywords, $textoUsuario) {
    if (empty($textoUsuario)) return false;
    foreach ($keywords as $key) {
        $key_clean = strtolower($key);
        $buscar = array('á','é','í','ó','ú','ñ','ü');
        $reemplazar = array('a','e','i','o','u','n','u');
        $key_clean = str_replace($buscar, $reemplazar, $key_clean);
        $key_clean = preg_replace('/[^a-z0-9\s]/', '', $key_clean);
        if (strpos($textoUsuario, trim($key_clean)) !== false) {
            return true;
        }
    }
    return false;
}

$menu = "-------------------------------------------\n" .
        "📌 *MENU PRINCIPAL DE ASESORIA*\n" .
        "-------------------------------------------\n" .
        "🏢 *Empresa:* ¿Quienes somos? | Historia | Equipo | Ubicacion\n" .
        "💻 *ERP:* Modulos, beneficios y costo\n" .
        "🎓 *DSpace:* Implementacion, caracteristicas y SUNEDU\n" .
        "🚀 *Desarrollo:* Apps, SaaS, Stack Angular/NestJS\n" .
        "🛡️ *Consultoria:* Redes, Cloud, Ciberseguridad\n" .
        "📚 *Academy:* Cursos, metodologia y testimonios\n" .
        "📲 *Contacto:* WhatsApp, Email, Soporte Tecnico\n" .
        "-------------------------------------------\n" .
        "✍️ *Escribe tu interes y te dare todos los detalles.*";

$ayudaAdicional = "\n\n💡 _¿Hay algo mas en lo que pueda asesorarte? (Escribe *menu* para ver las opciones)_";

if (empty($input_norm) || $input_norm === 'menu' || $input_norm === 'volver' || revisarPalabras(['hola', 'buen', 'que tal', 'empezar', 'inicio', 'saludos', 'hey'], $input_norm)) {
    $reply = "¡Hey! Que gusto verte por aqui. Soy el bot de Matt Innova, tu aliado tech. ¿Listo para descubrir como llevar tu empresa al siguiente nivel?\n\n" . $menu;
    echo json_encode(["status" => "success", "reply" => $reply], JSON_UNESCAPED_UNICODE);
    exit();
} 

if (revisarPalabras(['quienes', 'nosotros', 'empresa', 'historia', 'anos', 'experiencia', 'fundacion', 'hitos', 'valores', 'mision', 'vision', 'filosofia', 'compromiso', 'clientes'], $input_norm)) {
    $reply = "*30 ANOS DE LIDERAZGO TECNOLOGICO*\n\nMatt Innova Solution nacio en una epoca donde los mainframes dominaban. Hemos evolucionado desde el ensamblaje de PCs y cableado estructurado hasta convertirnos en arquitectos de la nube y desarrolladores de inteligencia artificial. Con mas de 4,000 clientes y 50 macroproyectos, no solo hemos visto la historia, la hemos escrito.\n\n" .
             "*HITOS CRONOLOGICOS*\n" .
             "🔹 *1994-2000 (Fundacion):* Iniciamos como proveedores de hardware y redes para pymes en Canete.\n" .
             "🔹 *2001-2010 (Expansion):* Desarrollamos el primer sistema de facturacion electronica adaptado a la legislacion peruana.\n" .
             "🔹 *2011-2020 (Innovacion):* Lanzamiento de nuestro ERP en la nube. Implementacion de repositorios DSpace cumpliendo estandares de SUNEDU y CONCYTEC.\n" .
             "🔹 *2021-Presente (Disrupcion):* Fundacion de MIS Academy. Migracion completa de nuestra infraestructura a microservicios con NestJS y Angular.\n\n" .
             "*NUESTROS VALORES*\n" .
             "✨ *Innovacion Constante:* Invertimos fuertemente en I+D.\n" .
             "✨ *Compromiso Real:* Somos partners de largo plazo con soporte post-implementacion de primer nivel.";
} 
elseif (revisarPalabras(['pedro', 'taya', 'ceo', 'fundador', 'dueno'], $input_norm)) {
    $reply = "👨‍💼 *Ing. Pedro Alex Taya Yactayo - CEO y Fundador*\n\nCon mas de 30 anos de experiencia, el Ing. Taya es un visionario que entendio antes que nadie el potencial de la tecnologia para transformar empresas. Es Ingeniero de profesion y estratega por vocacion. Su enfoque: \"tecnologia con proposito, no por moda\".\n\n_\"No vendemos software, vendemos productividad y tranquilidad.\"_";
} 
elseif (revisarPalabras(['giovanni', 'risco', 'desarrollador', 'arquitecto', 'programador'], $input_norm)) {
    $reply = "👨‍💻 *Giovanni Risco - Lead Web Developer y Arquitecto de Software*\n\nGiovanni es el cerebro detras de la robustez tecnica de nuestras soluciones. Experto en arquitecturas de microservicios con NestJS y frontends de alto rendimiento con Angular. Es el responsable de que nuestros sistemas sean escalables, seguros y ultrarrapidos.\n\n_\"Un sistema no esta completo hasta que es a prueba de fallos y de usuarios.\"_";
} 
elseif (revisarPalabras(['equipo', 'talento', 'personal'], $input_norm)) {
    $reply = "👥 *EL TALENTO DETRAS DE MIS*\n\nNo somos solo dos lideres. Contamos con un equipo multidisciplinario de ingenieros de software, administradores de redes, consultores funcionales y disenadores UX/UI. Cada proyecto es un esfuerzo colectivo donde la experiencia senior se combina con el talento joven.";
} 
elseif (revisarPalabras(['donde', 'ubicacion', 'direccion', 'cañete', 'sede', 'oficina'], $input_norm)) {
    $reply = "📍 *CASA MATRIZ*\n\nUrb. Libertad Mz. I Lt. 5, Calle Las Moras, San Vicente de Canete, Lima, Peru.\n\n🌐 *PRESENCIA SIN FRONTERAS*\n\nAunque nuestro corazon esta en Canete, operamos 100% remoto con clientes en toda Latinoamerica. Usamos herramientas de colaboracion de ultima generacion, lo que nos permite implementar soluciones sin perder eficiencia.";
} 
elseif (revisarPalabras(['erp', 'sistema', 'gestion', 'administracion', 'ventas', 'inventario', 'financiero', 'contable', 'precio', 'costo', 'beneficios'], $input_norm)) {
    $reply = "🚀 *ERP MIS: EL CEREBRO DE SU EMPRESA*\n\nNuestro sistema ERP es una suite modular que integra todas las areas de su negocio en una sola plataforma. Acceso 100% web y App Movil.\n\n" .
             "*MODULOS DISPONIBLES:*\n" .
             "📦 *Modulo de Ventas:* Facturacion electronica ilimitada SUNAT y cotizaciones.\n" .
             "📊 *Modulo de Inventario:* Control multi-almacen en tiempo real, codigos de barra.\n" .
             "💰 *Modulo Financiero:* Cuentas por cobrar y pagar, flujo de caja proyectado.\n" .
             "👥 *Modulo de RRHH:* Control de asistencia, planilla electronica.\n" .
             "📈 *Business Intelligence:* Tableros de control personalizados con KPIs.\n\n" .
             "💵 *INVERSION INTELIGENTE:*\n" .
             "Tenemos planes adaptables desde 1 hasta 1,000 usuarios. El costo varia segun los modulos elegidos. Escribe *contacto* para agendar una demo a tu medida.";
} 
elseif (revisarPalabras(['dspace', 'concytec', 'sunedu', 'tesis', 'repositorio', 'biblioteca', 'renati', 'alicia'], $input_norm)) {
    $reply = "🎓 *REPOSITORIO DIGITAL ACADEMICO DSPACE*\n\nUna biblioteca digital avanzada que almacena, preserva y difunde la produccion cientifica de universidades e institutos, cumpliendo estrictamente con SUNEDU y CONCYTEC.\n\n" .
             "*CARACTERISTICAS PRINCIPALES:*\n" .
             "🔍 *Busqueda Avanzada:* Motor Apache SOLR que indexa texto completo de PDFs.\n" .
             "🌐 *Interoperabilidad:* Cumplimiento del protocolo OAI-PMH para visibilidad en redes globales como ALICIA y La Referencia.\n" .
             "🛠️ *Metodologia MIS:* Analisis de coleccion, personalizacion de theme institucional, migracion masiva de metadata y capacitacion completa.";
} 
elseif (revisarPalabras(['web', 'pagina', 'crear', 'app', 'movil', 'desarrollo', 'angular', 'nest', 'saas', 'stack', 'codigo'], $input_norm)) {
    $reply = "💻 *FABRICA DE SOFTWARE A LA MEDIDA*\n\nSi tu proceso de negocio es unico, nosotros lo automatizamos construyendo la herramienta desde cero.\n\n" .
             "*NUESTRO STACK TECNOLOGICO:*\n" .
             "🅰️ *Frontend:* Interfaces de usuario rapidas, reactivas y hermosas con Angular (PWA).\n" .
             "🟢 *Backend:* APIs robustas, microservicios y arquitectura escalable con NestJS.\n" .
             "📱 *Movil:* Apps hibridas de alto rendimiento con Ionic + Angular.\n" .
             "⚙️ *Modelo SaaS:* Software como Servicio. Pagas una suscripcion mensual y nosotros nos encargamos del hosting, soporte y actualizaciones.";
} 
elseif (revisarPalabras(['consultoria', 'redes', 'conectividad', 'seguridad', 'cloud', 'ciberseguridad', 'firewall', 'fortinet', 'backup'], $input_norm)) {
    $reply = "🛡️ *CONSULTORIA TI EMPRESARIAL*\n\nSomos el departamento de tecnologia externo que tu empresa necesita:\n" .
             "⚙️ *Redes:* Diseno de cableado estructurado, VPNs y firewalls Fortinet.\n" .
             "☁️ *Migracion Cloud:* Llevamos tus servidores a AWS, Google Cloud o Azure.\n" .
             "🔒 *Ciberseguridad:* Auditorias de vulnerabilidades (pentesting) y Ethical Hacking.\n" .
             "💾 *Respaldo:* Sistemas de backup automatico y planes de Disaster Recovery.";
} 
elseif (revisarPalabras(['hosting', 'servidor', 'vps', 'planes'], $input_norm)) {
    $reply = "🌐 *HOSTING DE ALTO RENDIMIENTO MANAGED*\n\n" .
             "🚀 *Plan Start:* 2GB RAM, 50GB SSD, 1TB transferencia.\n" .
             "💼 *Plan Business:* 8GB RAM, 200GB NVMe, ancho de banda ilimitado.\n" .
             "👑 *Plan Enterprise:* Servidores dedicados a medida con uptime garantizado.";
} 
elseif (revisarPalabras(['academy', 'aprender', 'estudiar', 'curso', 'clases', 'capacitacion', 'testimonios'], $input_norm)) {
    $reply = "📚 *MIS ACADEMY - PROJECT-BASED LEARNING*\n\nNo ensenamos a copiar codigo. Aprendes construyendo un portafolio de proyectos reales con mentoria en vivo de profesionales de MIS.\n\n" .
             "*NUESTROS PROGRAMAS MASTERY:*\n" .
             "1️⃣ *Frontend Mastery con Angular:* HTML5/CSS3, TypeScript, RxJS, Signals y dashboards avanzados.\n" .
             "2️⃣ *Backend Pro con NestJS:* Node.js, Modulos, Controladores, TypeORM, Prisma y Microservicios (NATS/gRPC).\n" .
             "3️⃣ *Networking y Ethical Hacking:* Modelo OSI, Subnetting, laboratorios en Kali Linux, Nmap y Wireshark.\n\n" .
             "💬 _\"Gracias a MIS Academy pase de ser soporte tecnico a desarrollador Angular Senior en 8 meses.\"_ - Carlos M., Ex-alumno.";
} 
elseif (revisarPalabras(['contacto', 'whatsapp', 'email', 'correo', 'soporte', 'telefono'], $input_norm)) {
    $reply = "📲 *CONTACTO OFICIAL MATT INNOVA*\n\n📬 *Email de Atencion/Soporte:* contacto@mattinnovasolution.com\n👥 *Redes Sociales:* @mattinnovasolution\n\n📢 Nuestro soporte tecnico responde en menos de 15 minutos para incidencias criticas de servidores.";
} 
elseif (revisarPalabras(['garantia', 'facturacion', 'sunat', 'privacidad', 'scrum', 'agil', 'metodologia'], $input_norm)) {
    $reply = "📋 *PREGUNTAS FRECUENTES (FAQ)*\n\n" .
             "🛡️ *Garantia:* Todos nuestros desarrollos incluyen 3 meses de garantia sobre errores de programacion.\n" .
             "🔄 *Metodologia:* Gestionamos los proyectos con SCRUM, entregando avances tangibles cada 2 semanas (sprints).\n" .
             "🔒 *Confidencialidad:* Firmamos acuerdos de confidencialidad (NDA) para proteger tus datos.";
} 
else {
    $reply = "🤔 *Interesante consulta...*\n\nNo tengo una respuesta exacta para \"" . $message . "\". Podriamos hablar de nuestro *ERP*, *DSpace* para universidades, *Desarrollo* a medida o *MIS Academy*.\n\n💡 Escribe *menu* para ver la lista completa de opciones.";
    echo json_encode(["status" => "success", "reply" => $reply], JSON_UNESCAPED_UNICODE);
    exit();
}

echo json_encode(["status" => "success", "reply" => $reply . $ayudaAdicional], JSON_UNESCAPED_UNICODE);
exit();