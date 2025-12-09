/**
 * Componente para descargar documentos de clientes
 * Panel completo de gestión de documentos
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getClientDocuments,
  getDocumentDownloadUrl,
  formatDocumentName,
  getDocumentIcon,
  trackDocumentAccess,
  type ClientDocument,
  type DocumentFilters,
} from "../lib/documents";
import "./DocumentDownloader.css";

interface DocumentDownloaderProps {
  userId: string;
  onDocumentSelect?: (document: ClientDocument) => void;
}

export default function DocumentDownloader({
  userId,
  onDocumentSelect,
}: DocumentDownloaderProps) {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<string>("all");

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const filters: DocumentFilters = filterType ? { type: filterType } : {};
      const docs = await getClientDocuments(userId, filters);
      setDocuments(docs);
    } catch (error) {
      console.error("Error al cargar documentos:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, filterType]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDownload = useCallback(
    async (document: ClientDocument) => {
      const downloadUrl = getDocumentDownloadUrl(document);
      if (downloadUrl) {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
        await trackDocumentAccess(document.id);
        onDocumentSelect?.(document);
      } else {
        alert("Este documento no tiene URL de descarga disponible.");
      }
    },
    [onDocumentSelect]
  );

  const handleFilterChange = useCallback((type: string) => {
    setSelectedType(type);
    setFilterType(type === "all" ? undefined : type);
  }, []);

  const documentTypes = useMemo(
    () => ["iva", "erut", "factura", "boleta", "declaracion", "otro"],
    []
  );

  const groupedDocuments = useMemo(() => {
    return documents.reduce((acc, doc) => {
      if (!acc[doc.document_type]) {
        acc[doc.document_type] = [];
      }
      acc[doc.document_type].push(doc);
      return acc;
    }, {} as Record<string, ClientDocument[]>);
  }, [documents]);

  if (loading) {
    return (
      <div className="document-downloader">
        <div className="loading-documents">
          <div className="spinner"></div>
          <p>Cargando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-downloader">
      <div className="documents-header">
        <h3>📄 Mis Documentos</h3>
        <p className="documents-count">
          {documents.length} documento(s) disponible(s)
        </p>
      </div>

      <div className="documents-filters">
        <button
          className={`filter-button ${selectedType === "all" ? "active" : ""}`}
          onClick={() => handleFilterChange("all")}
          type="button"
        >
          Todos
        </button>
        {documentTypes.map((type) => (
          <button
            key={type}
            className={`filter-button ${selectedType === type ? "active" : ""}`}
            onClick={() => handleFilterChange(type)}
            type="button"
          >
            {getDocumentIcon(type)}{" "}
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="documents-list">
        {documents.length === 0 ? (
          <div className="no-documents">
            <p>No tienes documentos disponibles</p>
            <p className="no-documents-subtitle">
              Los documentos aparecerán aquí cuando estén disponibles
            </p>
          </div>
        ) : (
          Object.entries(groupedDocuments).map(([type, docs]) => (
            <div key={type} className="document-group">
              <h4 className="document-group-title">
                {getDocumentIcon(type)}{" "}
                {type.charAt(0).toUpperCase() + type.slice(1)} ({docs.length})
              </h4>
              <div className="document-items">
                {docs.map((doc) => (
                  <div key={doc.id} className="document-item">
                    <div className="document-info">
                      <span className="document-name">
                        {formatDocumentName(doc)}
                      </span>
                      {doc.period && (
                        <span className="document-period">{doc.period}</span>
                      )}
                      {doc.file_size && (
                        <span className="document-size">
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                    <button
                      className="download-button"
                      onClick={() => handleDownload(doc)}
                      type="button"
                    >
                      📥 Descargar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
