
export interface MenuOption {
  id: string;
  label: string;
  action: 'navigate' | 'link' | 'show_menu' | 'show_tutorial' | 'get_document' | 'contact_support';
  params?: any;
  icon?: string;
  description?: string;
}

export interface ChatMenu {
  id: string;
  text: string;
  options: MenuOption[];
}

export const TUTORIAL_CONTENT: Record<string, string> = {
  'f29_step_by_step': `
**🎓 Cómo declarar el Formulario 29 (IVA) en el SII**

1.  Ingresa a [www.sii.cl](https://www.sii.cl).
2.  Ve a **"Servicios online"** > **"Impuestos mensuales"**.
3.  Selecciona **"Declaración mensual (F29)"** > **"Declarar IVA"**.
4.  Ingresa con tu RUT y Clave Tributaria.
5.  Selecciona el mes a declarar.
6.  El sistema te ofrecerá una **Propuesta de Declaración**. Revísala bien.
7.  Si estás de acuerdo, presiona **"Enviar Declaración"**.
8.  ¡Listo! Guarda el certificado de declaración.

*Nota: Si no tienes movimiento, declara "Sin Movimiento" para evitar multas.*
`,
  'inicio_actividades_step': `
**🚀 Guía Rápida: Inicio de Actividades**

1.  Reúne tu Clave Única o Clave Tributaria.
2.  Ingresa a [www.sii.cl](https://www.sii.cl).
3.  Ve a **"Servicios online"** > **"RUT e Inicio de actividades"**.
4.  Selecciona **"Inicio de actividades"**.
5.  Completa el formulario con los datos de tu empresa y domicilio.
6.  Adjunta los documentos que te soliciten (si aplica).
7.  Confirma y finaliza el trámite.

*Consejo: En MTZ podemos hacer esto por ti para asegurar el régimen tributario correcto.*
`,
  'emitir_boleta': `
**📄 Cómo emitir una Boleta de Honorarios**

1.  Entra a [www.sii.cl](https://www.sii.cl).
2.  Ve a **"Servicios online"** > **"Boletas de honorarios electrónicas"**.
3.  Elige **"Emisor"** y luego **"Emitir boleta"**.
4.  Selecciona la retención (generalmente el receptor retiene el % correspondiente).
5.  Completa los datos del cliente y el detalle del servicio.
6.  Confirma y emite.
`
};

export const CHAT_TREES: Record<string, ChatMenu> = {
  // --- ROL: CLIENTE (Enfoque en Impuestos/Contabilidad) ---
  'cliente_root': {
    id: 'cliente_root',
    text: 'Hola, soy Arise, tu asistente contable de MTZ. Gestiono tus impuestos y documentos. ¿Qué necesitas ver ahora?',
    options: [
      { id: 'taxes', label: '📊 Mis Impuestos', icon: '📊', action: 'show_menu', params: { menu: 'cliente_taxes' }, description: 'F29, Renta, Situación Tributaria' },
      { id: 'docs', label: '📂 Mis Documentos', icon: '📂', action: 'show_menu', params: { menu: 'cliente_docs' }, description: 'Carpetas, Balances, E-RUT' },
      { id: 'help', label: '🎓 Tutoriales y Ayuda', icon: '🎓', action: 'show_menu', params: { menu: 'cliente_tutorials' } },
      { id: 'support', label: '💬 Hablar con Contador', icon: '🙋‍♂️', action: 'contact_support' }
    ]
  },
  'cliente_taxes': {
    id: 'cliente_taxes',
    text: 'Selecciona qué trámite de impuestos necesitas revisar o realizar:',
    options: [
      { id: 'f29_status', label: 'Estado F29 (IVA)', icon: '📅', action: 'show_tutorial', params: { id: 'f29_check' } }, // Placeholder logic
      { id: 'renta', label: 'Operación Renta', icon: '💰', action: 'contact_support' },
      { id: 'back', label: '🔙 Volver al inicio', action: 'show_menu', params: { menu: 'cliente_root' } }
    ]
  },
  'cliente_docs': {
    id: 'cliente_docs',
    text: 'Accediendo a tu base de documentos. ¿Qué necesitas descargar?',
    options: [
      { id: 'get_folder', label: 'Carpeta Tributaria', icon: '📁', action: 'get_document', params: { type: 'carpeta_tributaria' } },
      { id: 'get_f29', label: 'Último F29', icon: '📄', action: 'get_document', params: { type: 'f29' } },
      { id: 'get_balance', label: 'Balance General', icon: '📉', action: 'get_document', params: { type: 'balance' } },
      { id: 'back', label: '🔙 Volver al inicio', action: 'show_menu', params: { menu: 'cliente_root' } }
    ]
  },

  // --- MENÚS COMPARTIDOS (Tutoriales) ---
  invitado_root: {
    id: 'invitado_root',
    text: '¡Hola! 👋 Bienvenido a MTZ. Soy Arise, tu asistente virtual. ¿En qué puedo ayudarte hoy?',
    options: [
      { id: 'opt_servicios', label: '🚀 Quiero Cotizar / Emprender', action: 'show_menu', params: { menu: 'invitado_cotizar' } },
      { id: 'opt_guias', label: '📚 Guías y Tutoriales', action: 'show_menu', params: { menu: 'invitado_tutorials' } },
      { id: 'opt_ubicacion', label: '📍 Ubicación y Contacto', action: 'show_menu', params: { menu: 'general_contact' } },
      { id: 'opt_login', label: '🔐 Iniciar Sesión', action: 'link', params: { url: '/login' } },
    ]
  },

  invitado_cotizar: {
    id: 'invitado_cotizar',
    text: '¡Excelente! Estamos listos para ayudarte a crecer. ¿Qué tipo de servicio te interesa?',
    options: [
      { id: 'opt_creacion_empresa', label: '🏢 Crear mi Empresa', action: 'show_menu', params: { menu: 'invitado_cotizar_creacion_empresa' } },
      { id: 'opt_servicios_contables', label: '📈 Servicios Contables (Empresa ya creada)', action: 'show_menu', params: { menu: 'invitado_servicios_contables' } },
      { id: 'opt_asesoria_tributaria', label: '💡 Asesoría Tributaria Específica', action: 'contact_support' },
      { id: 'back_root', label: '⬅️ Volver al inicio', action: 'show_menu', params: { menu: 'invitado_root' } }
    ]
  },

  invitado_cotizar_creacion_empresa: {
    id: 'invitado_cotizar_creacion_empresa',
    text: '¡Emprender es el camino! Te ayudamos con todo el proceso de creación de tu empresa, desde la elección del tipo societario hasta el inicio de actividades en el SII.',
    options: [
      { id: 'opt_agendar_creacion', label: '📅 Agendar Asesoría Gratis', action: 'link', params: { url: 'https://calendly.com/mtz-consultores/asesoria-inicial' } },
      { id: 'opt_ver_requisitos', label: '📄 Ver Requisitos', action: 'show_tutorial', params: { id: 'tutorial_creacion_empresa' } },
      { id: 'back_cotizar', label: '⬅️ Volver', action: 'show_menu', params: { menu: 'invitado_cotizar' } }
    ]
  },

  invitado_servicios_contables: {
    id: 'invitado_servicios_contables',
    text: 'Perfecto. Para empresas ya constituidas, ofrecemos planes integrales de contabilidad:\n\n✅ Declaración Mensual F29\n✅ Declaración de Renta Anual\n✅ Asesoría Laboral y Remuneraciones\n✅ Representación ante el SII\n\n¿Buscas cambiar de contador o regularizar tu situación?',
    options: [
      { id: 'opt_cotizar_plan', label: '💰 Cotizar Plan Mensual', action: 'link', params: { url: 'https://wa.me/56912345678?text=Hola,%20me%20interesa%20cotizar%20un%20plan%20contable' } },
      { id: 'opt_regularizar', label: '⚠️ Necesito Regularizar (Multas/Bloqueos)', action: 'link', params: { url: 'https://wa.me/56912345678?text=Hola,%20tengo%20problemas%20con%20el%20SII%20y%20necesito%20ayuda' } },
      { id: 'root_back', label: '⬅️ Volver al inicio', action: 'show_menu', params: { menu: 'invitado_cotizar' } }
    ]
  },

  invitado_contact: {
    id: 'invitado_contact',
    text: 'Estamos ubicados en Juan Martinez 616, Iquique. Horario: 9:00 - 18:00.',
    options: [
      { id: 'wsp', label: 'WhatsApp', icon: '💬', action: 'link', params: { url: 'https://wa.me/56912345678' } },
      { id: 'map', label: 'Ver Mapa', icon: '🗺️', action: 'link', params: { url: 'https://maps.google.com' } },
      { id: 'back', label: '🔙 Volver', action: 'show_menu', params: { menu: 'invitado_root' } }
    ]
  },

  // --- MENÚS COMPARTIDOS (Tutoriales) ---
  // --- MENÚS DE TUTORIALES (Separados por rol para navegación correcta) ---
  'cliente_tutorials': {
    id: 'cliente_tutorials',
    text: '¡Excelente iniciativa! Aprender a gestionar tus trámites te da poder. ¿Qué guía quieres ver hoy?',
    options: [
      { id: 'guide_f29', label: '📝 Cómo declarar IVA (F29)', icon: '📝', action: 'show_tutorial', params: { id: 'f29_step_by_step' } },
      { id: 'guide_start', label: '🚀 Inicio de Actividades', icon: '🚀', action: 'show_tutorial', params: { id: 'inicio_actividades_step' } },
      { id: 'guide_boleta', label: '📄 Emitir Boleta Honorarios', icon: '📄', action: 'show_tutorial', params: { id: 'emitir_boleta' } },
      { id: 'back', label: '🔙 Volver al inicio', action: 'show_menu', params: { menu: 'cliente_root' } }
    ]
  },

  'invitado_tutorials': {
    id: 'invitado_tutorials',
    text: '¡Excelente iniciativa! Aprender a gestionar tus trámites te da poder. ¿Qué guía quieres ver hoy?',
    options: [
      { id: 'guide_f29', label: '📝 Cómo declarar IVA (F29)', icon: '📝', action: 'show_tutorial', params: { id: 'f29_step_by_step' } },
      { id: 'guide_start', label: '🚀 Inicio de Actividades', icon: '🚀', action: 'show_tutorial', params: { id: 'inicio_actividades_step' } },
      { id: 'guide_boleta', label: '📄 Emitir Boleta Honorarios', icon: '📄', action: 'show_tutorial', params: { id: 'emitir_boleta' } },
      { id: 'back', label: '🔙 Volver al inicio', action: 'show_menu', params: { menu: 'invitado_root' } }
    ]
  },

  'invitado_guiar': {
    id: 'invitado_guiar',
    text: '¡Entiendo! A veces es mucha información. Vamos paso a paso. ¿Cuál de estas situaciones describe mejor lo que buscas?',
    options: [
      { id: 'unsure_create', label: '🏢 Quiero armar mi empresa', description: 'Tengo una idea y quiero formalizarla', action: 'show_menu', params: { menu: 'invitado_cotizar_creacion_empresa' } },
      { id: 'unsure_accounting', label: '⚖️ Ya tengo empresa (Contabilidad)', description: 'Busco contador o cambiar el actual', action: 'show_menu', params: { menu: 'invitado_servicios_contables' } },
      { id: 'unsure_problems', label: '🆘 Tengo problemas con el SII', description: 'Multas, bloqueos o declaraciones pendientes', action: 'link', params: { url: 'https://wa.me/56912345678?text=Hola,%20tengo%20problemas%20urgentes%20con%20el%20SII' } },
      { id: 'unsure_browse', label: '👀 Solo estoy mirando', description: 'Quiero ver tutoriales o info general', action: 'show_menu', params: { menu: 'invitado_tutorials' } },
      { id: 'back_root', label: '🔙 Volver al inicio', action: 'show_menu', params: { menu: 'invitado_root' } }
    ]
  }
};
