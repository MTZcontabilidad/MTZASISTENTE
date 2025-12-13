/**
 * Componente de menú interactivo para el chatbot
 */

import { MenuOption } from "../lib/menus";
import {
  getClientDocuments,
  getDocumentDownloadUrl,
  formatDocumentName,
  getClientGoogleScript,
} from "../lib/documents";
import { openLink, getWhatsAppLink } from "../config/links";
import "./InteractiveMenu.css";

interface InteractiveMenuProps {
  options: MenuOption[];
  userId: string;
  onActionComplete?: (action: string, result?: any) => void;
  guideImage?: string; // URL de imagen de guía
  title?: string; // Título del menú
  description?: string; // Descripción del menú
}

export default function InteractiveMenu({
  options,
  userId,
  onActionComplete,
  guideImage,
  title,
  description,
}: InteractiveMenuProps) {
  const handleOptionClick = async (option: MenuOption) => {
    try {
      switch (option.action) {
        case "get_document": {
          // Obtener documento del tipo solicitado
          const documentType = option.params?.type;
          if (documentType) {
            const documents = await getClientDocuments(userId, {
              type: documentType,
            });

            if (documents.length > 0) {
              const doc = documents[0]; // Más reciente
              const downloadUrl = getDocumentDownloadUrl(doc);

              if (downloadUrl) {
                window.open(downloadUrl, "_blank", "noopener,noreferrer");
                onActionComplete?.("get_document", { document: doc });
              } else {
                alert(
                  `Documento ${formatDocumentName(
                    doc
                  )} no tiene URL de descarga disponible.`
                );
              }
            } else {
              alert(`No se encontraron documentos de tipo ${documentType}.`);
            }
          }
          break;
        }

        case "list_documents": {
          // Mostrar lista de documentos (se puede expandir a un modal)
          const documents = await getClientDocuments(userId);
          if (documents.length > 0) {
            const message = documents
              .slice(0, 10) // Primeros 10
              .map((doc) => `• ${formatDocumentName(doc)}`)
              .join("\n");
            alert(
              `Documentos disponibles:\n\n${message}${
                documents.length > 10
                  ? `\n\n... y ${documents.length - 10} más`
                  : ""
              }`
            );
          } else {
            alert("No tienes documentos disponibles.");
          }
          onActionComplete?.("list_documents", { count: documents.length });
          break;
        }

        case "open_url": {
          const urlType = option.params?.url_type;

          if (urlType === "dashboard") {
            // Obtener URL del dashboard del cliente
            const googleScript = await getClientGoogleScript(userId);
            if (googleScript?.dashboard_url) {
              openLink(googleScript.dashboard_url);
              onActionComplete?.("open_url", {
                url: googleScript.dashboard_url,
              });
            } else {
              alert(
                "No tienes un dashboard configurado. Contacta al administrador."
              );
            }
          } else if (urlType === "whatsapp") {
            // Abrir WhatsApp
            const whatsappUrl = getWhatsAppLink("Hola, necesito información");
            openLink(whatsappUrl);
            onActionComplete?.("open_url", { url: whatsappUrl });
          } else if (option.params?.url) {
            // URL directa
            openLink(option.params.url);
            onActionComplete?.("open_url", { url: option.params.url });
          } else if (option.params?.url_type === "tramite") {
            // Trámite gubernamental
            const url = option.params.url;
            const descripcion = option.params.descripcion || "";
            if (url) {
              // Mostrar confirmación antes de abrir
              const confirmar = window.confirm(
                `Vas a ser redirigido a: ${option.label}\n\n${descripcion}\n\n¿Deseas continuar?`
              );
              if (confirmar) {
                openLink(url);
                onActionComplete?.("open_url", {
                  url,
                  tramite_id: option.params.tramite_id,
                  tipo: "tramite",
                });
              }
            }
          }
          break;
        }

        case "show_info": {
          // Mostrar información sobre servicios
          const service = option.params?.service;
          if (service === "contabilidad") {
            const message =
              `📊 Servicios de Contabilidad:\n\n` +
              `• Asesoría contable y tributaria\n` +
              `• Declaraciones de impuestos\n` +
              `• Facturación electrónica\n` +
              `• Consultoría financiera\n` +
              `• Gestión de documentos\n\n` +
              `Para más información, contáctanos al +56990062213 (WhatsApp) o visita nuestra oficina en Juan Martinez 616, Iquique.`;
            alert(message);
          } else if (service) {
            alert(`Información sobre ${service} disponible próximamente.`);
          }
          onActionComplete?.("show_info", { service });
          break;
        }

        case "show_menu": {
          // Mostrar otro menú - esto se manejará desde el componente padre
          const menuKey = option.params?.menu;
          onActionComplete?.("show_menu", { menu: menuKey });
          break;
        }

        case "show_tutorial": {
          // Mostrar tutorial
          const tutorialId = option.params?.id;
          onActionComplete?.("show_tutorial", { id: tutorialId });
          break;
        }

        case "navigate": {
          // Navegación interna (puede expandirse)
          const route = option.params?.route;
          if (route) {
            // Aquí se puede implementar navegación interna si es necesario
            console.log("Navegar a:", route);
          }
          onActionComplete?.("navigate", { route });
          break;
        }

        case "link": {
            // Map link to open_url
            if (option.params?.url) {
                openLink(option.params.url);
                onActionComplete?.("open_url", { url: option.params.url });
            }
            break;
        }

        case "contact_support": {
             // Delegate to parent to show Human Support modal
             onActionComplete?.("contact_support", {});
             break;
        }

        default:
          console.warn("Acción no reconocida:", option.action);
      }
    } catch (error) {
      console.error("Error al ejecutar acción del menú:", error);
      alert("Ocurrió un error al procesar tu solicitud.");
    }
  };

  return (
    <div className="interactive-menu">
      {title && <h4 className="menu-title">{title}</h4>}
      {description && <p className="menu-description">{description}</p>}
      {guideImage && (
        <div className="menu-guide-image">
          <img
            src={guideImage}
            alt="Guía visual"
            className="guide-image"
            onError={(e) => {
              // Si la imagen no carga, ocultar el contenedor
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="menu-options">
        {options.map((option) => (
          <button
            key={option.id}
            className="menu-option-button"
            onClick={() => handleOptionClick(option)}
            type="button"
          >
            <span className="menu-option-icon">{option.icon || "•"}</span>
            <span className="menu-option-label">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
