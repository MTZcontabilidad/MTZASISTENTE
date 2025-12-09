/**
 * Componente de acciones rápidas - Botones de acceso rápido para trámites comunes
 */

import { useState } from "react";
import { openLink, getWhatsAppLink } from "../config/links";
import { buscarTramites, generarMenuTramites } from "../config/tramites";
import "./QuickActions.css";

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  description?: string;
}

interface QuickActionsProps {
  onActionClick?: (actionId: string) => void;
  onSendMessage?: (message: string) => void;
}

export default function QuickActions({
  onActionClick,
  onSendMessage,
}: QuickActionsProps) {
  const [expanded, setExpanded] = useState(false);

  const handleCarpetaTributaria = () => {
    // Primero enviar mensaje al chat para que el asistente dé contexto
    if (onSendMessage) {
      onSendMessage("necesito obtener mi carpeta tributaria");
    }
    onActionClick?.("carpeta-tributaria");
    // El link se abrirá desde el menú interactivo que genera el chatbot
  };

  const handleTramitesSII = () => {
    if (onSendMessage) {
      onSendMessage("necesito ayuda con trámites del SII");
    }
    onActionClick?.("tramites-sii");
  };

  const handleWhatsApp = () => {
    const whatsappUrl = getWhatsAppLink(
      "Hola, necesito información sobre servicios contables"
    );
    openLink(whatsappUrl);
    onActionClick?.("whatsapp");
  };

  const handleDocumentos = () => {
    if (onSendMessage) {
      onSendMessage("quiero ver mis documentos");
    }
    onActionClick?.("documentos");
  };

  const handleCategorias = () => {
    if (onSendMessage) {
      onSendMessage("Quiero ver todas las categorías de trámites");
    }
    onActionClick?.("categorias");
  };

  const quickActions: QuickAction[] = [
    {
      id: "carpeta-tributaria",
      label: "Carpeta Tributaria",
      icon: "📁",
      action: handleCarpetaTributaria,
      description: "Acceso directo al SII",
    },
    {
      id: "tramites-sii",
      label: "Trámites SII",
      icon: "🏛️",
      action: handleTramitesSII,
      description: "Ver todos los trámites",
    },
    {
      id: "whatsapp",
      label: "Contactar",
      icon: "💬",
      action: handleWhatsApp,
      description: "Hablar por WhatsApp",
    },
    {
      id: "documentos",
      label: "Mis Documentos",
      icon: "📄",
      action: handleDocumentos,
      description: "Ver documentos",
    },
    {
      id: "categorias",
      label: "Ver Categorías",
      icon: "📋",
      action: handleCategorias,
      description: "Ver todos los trámites por categoría",
    },
    {
      id: "reuniones",
      label: "Agendar Reunión",
      icon: "📅",
      action: () => {
        if (onSendMessage) {
          onSendMessage("quiero agendar una reunión");
        }
        onActionClick?.("reuniones");
      },
      description: "Solicitar una reunión",
    },
  ];

  // Acciones expandidas (se muestran cuando se expande)
  const expandedActions: QuickAction[] = [
    {
      id: "declaracion-iva",
      label: "Declaración IVA",
      icon: "💰",
      action: () => {
        if (onSendMessage) {
          onSendMessage("necesito ayuda con declaración de IVA");
        }
        onActionClick?.("declaracion-iva");
      },
    },
    {
      id: "facturacion",
      label: "Facturación",
      icon: "🧾",
      action: () => {
        if (onSendMessage) {
          onSendMessage("necesito ayuda con facturación electrónica");
        }
        onActionClick?.("facturacion");
      },
    },
    {
      id: "previred",
      label: "PreviRed",
      icon: "💼",
      action: () => {
        if (onSendMessage) {
          onSendMessage("necesito ayuda con PreviRed");
        }
        onActionClick?.("previred");
      },
    },
    {
      id: "servicios",
      label: "Nuestros Servicios",
      icon: "📊",
      action: () => {
        if (onSendMessage) {
          onSendMessage("qué servicios ofrecen");
        }
        onActionClick?.("servicios");
      },
    },
  ];

  return (
    <div className="quick-actions-container">
      <div className="quick-actions-header">
        <h3 className="quick-actions-title">Accesos Rápidos</h3>
        <button
          className="quick-actions-toggle"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Contraer" : "Expandir"}
          title={expanded ? "Ver menos opciones" : "Ver más opciones"}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>
      <div className="quick-actions-grid">
        {quickActions.map((action) => (
          <button
            key={action.id}
            className="quick-action-button"
            onClick={action.action}
            type="button"
            title={action.description || action.label}
          >
            <span className="quick-action-icon">{action.icon}</span>
            <span className="quick-action-label">{action.label}</span>
          </button>
        ))}
        {expanded &&
          expandedActions.map((action) => (
            <button
              key={action.id}
              className="quick-action-button"
              onClick={action.action}
              type="button"
            >
              <span className="quick-action-icon">{action.icon}</span>
              <span className="quick-action-label">{action.label}</span>
            </button>
          ))}
      </div>
    </div>
  );
}

