export const SII_LINKS = [
    // 1. FACTURACIÓN ELECTRÓNICA Y VENTAS
    {
        id: 'portal_mipyme',
        keywords: ['facturar gratis', 'mipyme', 'portal mipyme', 'facturación gratuita', 'sistema gratuito'],
        title: 'Portal MIPYME (Gratuito)',
        description: 'Entrada principal para facturar gratis usando el sistema del SII.',
        url: 'https://www1.sii.cl/cgi-bin/portal/portal_mipyme.cgi',
        category: 'Facturación'
    },
    {
        id: 'emitir_factura',
        keywords: ['emitir factura', 'hacer factura', 'factura electronica', 'factura afecta'],
        title: 'Emitir Factura Electrónica',
        description: 'Emisión de factura afecta a IVA.',
        url: 'https://www1.sii.cl/cgi-bin/portal/portal_mipyme.cgi?OPCION=3',
        category: 'Facturación'
    },
    {
        id: 'factura_exportacion',
        keywords: ['factura exportacion', 'factura exenta', 'exportar'],
        title: 'Emitir Factura de Exportación',
        description: 'Para ventas fuera de Chile (Exentas de IVA).',
        url: 'https://www1.sii.cl/cgi-bin/portal/portal_mipyme.cgi?OPCION=13',
        category: 'Facturación'
    },
    {
        id: 'emitir_boleta',
        keywords: ['emitir boleta', 'boleta ventas', 'boleta servicios', 'boleta consumo'],
        title: 'Emitir Boleta Ventas/Servicios',
        description: 'Boleta electrónica de consumo masivo.',
        url: 'https://www.sii.cl/servicios_online/boleta_ventas_servicios.html',
        category: 'Facturación'
    },
    {
        id: 'rcv',
        keywords: ['rcv', 'registro compras ventas', 'aceptar factura', 'rechazar factura', 'revisar iva'],
        title: 'Registro de Compras y Ventas',
        description: 'Obligatorio revisar mensualmente. Aceptar/rechazar facturas.',
        url: 'https://www1.sii.cl/cgi-bin/portal/portal_mipyme.cgi?OPCION=RCV',
        category: 'Facturación'
    },
    {
        id: 'factoring',
        keywords: ['factoring', 'ceder factura', 'cesion factura', 'liquidez'],
        title: 'Cesión de Facturas (Factoring)',
        description: 'Para ceder el crédito de una factura a un tercero.',
        url: 'https://www.sii.cl/servicios_online/1039-1111.html',
        category: 'Facturación'
    },

    // 2. BOLETAS DE HONORARIOS
    {
        id: 'boleta_honorarios',
        keywords: ['boleta honorarios', 'emitir honorarios', 'bhe'],
        title: 'Emitir Boleta de Honorarios',
        description: 'El trabajador ingresa con su clave y emite la boleta.',
        url: 'https://www.sii.cl/servicios_online/boletas_honorarios.html',
        category: 'Honorarios'
    },
    {
        id: 'consultar_boletas',
        keywords: ['consultar boletas', 'mis boletas', 'historial boletas'],
        title: 'Consultar Boletas Emitidas',
        description: 'Ver historial de boletas vigentes o anuladas.',
        url: 'https://www4.sii.cl/boletahonorariosui/honorarios/misboletas/consultas/emitidas',
        category: 'Honorarios'
    },

    // 3. IMPUESTOS MENSUALES (F29)
    {
        id: 'pagar_f29',
        keywords: ['pagar f29', 'declarar f29', 'formulario 29', 'pagar iva', 'declarar iva'],
        title: 'Declarar y Pagar F29',
        description: 'Formulario mensual de IVA. Vence generalmente el día 20.',
        url: 'https://www4.sii.cl/propuestaf29internet/',
        category: 'Impuestos Mensuales'
    },
    {
        id: 'consulta_f29',
        keywords: ['consulta f29', 'estado f29', 'ver pago iva'],
        title: 'Consulta Integral F29',
        description: 'Ver si el pago del mes pasado se procesó correctamente.',
        url: 'https://www4.sii.cl/consf29internet/',
        category: 'Impuestos Mensuales'
    },
    {
        id: 'pago_deudas',
        keywords: ['pagar deudas', 'pagar giros', 'deuda fiscal', 'multas sii'],
        title: 'Pago de Giros y Deudas',
        description: 'Pagar multas, giros pendientes o deudas atrasadas.',
        url: 'https://www4.sii.cl/pagoenlinea/',
        category: 'Impuestos Mensuales'
    },

    // 4. RENTA ANUAL (F22)
    {
        id: 'declarar_renta',
        keywords: ['operacion renta', 'declarar renta', 'f22', 'formulario 22'],
        title: 'Declarar Renta Anual (F22)',
        description: 'Proceso anual de declaración de impuestos (Abril).',
        url: 'https://www.sii.cl/servicios_online/1044-.html',
        category: 'Renta'
    },
    {
        id: 'estado_renta',
        keywords: ['estado renta', 'consulta renta', 'devolucion de impuestos'],
        title: 'Consulta Estado de Declaración',
        description: 'Saber si la devolución fue aprobada o rechazada.',
        url: 'https://www4.sii.cl/consultarentainternet/',
        category: 'Renta'
    },

    // 5. CLAVES Y CERTIFICADOS
    {
        id: 'recuperar_clave',
        keywords: ['recuperar clave', 'olvide clave', 'contraseña sii'],
        title: 'Recuperar Clave Tributaria',
        description: 'Si olvidaste tu contraseña del SII.',
        url: 'https://www4.sii.cl/creaclaveinternet/recuperarClave.html',
        category: 'Trámites'
    },
    {
        id: 'crear_clave',
        keywords: ['crear clave', 'clave inicial', 'primera clave'],
        title: 'Obtener Clave (Primera Vez)',
        description: 'Para usuarios nuevos.',
        url: 'https://www4.sii.cl/creaclaveinternet/crearClave.html',
        category: 'Trámites'
    },
    {
        id: 'carpeta_tributaria',
        keywords: ['carpeta tributaria', 'acreditar renta', 'documento banco'],
        title: 'Carpeta Tributaria',
        description: 'Generar documento para bancos o acreditar renta.',
        url: 'https://www.sii.cl/servicios_online/1047-1702.html',
        category: 'Certificados'
    },
    {
        id: 'erut',
        keywords: ['e-rut', 'rut digital', 'cedula rut', 'plastico rut'],
        title: 'Cédula e-RUT',
        description: 'Descargar el RUT digital de la empresa.',
        url: 'https://www.sii.cl/servicios_online/1031-2751.html',
        category: 'Trámites'
    },
    {
        id: 'situacion_tributaria',
        keywords: ['situacion tributaria', 'mi situacion', 'bloqueos sii', 'observaciones sii'],
        title: 'Mi Situación Tributaria',
        description: 'Cartola 360° para ver bloqueos o problemas.',
        url: 'https://www4.sii.cl/cartulainternet/',
        category: 'Información'
    },

    // 6. TRAMITES ADMINISTRATIVOS
    {
        id: 'inicio_actividades',
        keywords: ['inicio actividades', 'crear empresa', 'formalizar negocio'],
        title: 'Inicio de Actividades',
        description: 'Declaración jurada para comenzar un negocio.',
        url: 'https://www.sii.cl/servicios_online/1031-.html',
        category: 'Trámites'
    },
    {
        id: 'termino_giro',
        keywords: ['termino giro', 'cerrar empresa', 'cerrar negocio'],
        title: 'Término de Giro',
        description: 'Aviso para cerrar definitivamente una empresa.',
        url: 'https://www.sii.cl/servicios_online/1036-1037.html',
        category: 'Trámites'
    }
];

export function findSIILinks(query: string): any[] {
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const q = normalize(query);
    
    return SII_LINKS.filter(link => {
        return link.keywords.some(k => q.includes(normalize(k)));
    }).map(link => ({
        text: link.title,
        label: link.title, // Support both formats
        url: link.url,
        icon: 'link', // Icon for the button
        description: link.description
    }));
}
