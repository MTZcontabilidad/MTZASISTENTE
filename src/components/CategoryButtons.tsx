/**
 * Componente de botones por categoría - Muestra trámites organizados por categoría
 */

import { useState } from "react";
import {
  getCategoriasDisponibles,
  getTramitesPorCategoria,
  generarMenuTramites,
} from "../config/tramites";
import InteractiveMenu from "./InteractiveMenu";
import "./CategoryButtons.css";

interface CategoryButtonsProps {
  onCategorySelect?: (categoryId: string) => void;
  onTramiteSelect?: (tramiteId: string) => void;
  showAllCategories?: boolean; // Si es true, muestra todas las categorías. Si es false, solo muestra las principales
}

export default function CategoryButtons({
  onCategorySelect,
  onTramiteSelect,
  showAllCategories = false,
}: CategoryButtonsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const categorias = getCategoriasDisponibles();
  const categoriasPrincipales = categorias.slice(0, 3); // SII, PreviRed, Tesorería
  const categoriasMunicipales = categorias.slice(3); // Municipalidades

  const categoriasAMostrar = showAllCategories
    ? categorias
    : categoriasPrincipales;

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      // Si ya está seleccionada, colapsar
      setSelectedCategory(null);
      const newExpanded = new Set(expandedCategories);
      newExpanded.delete(categoryId);
      setExpandedCategories(newExpanded);
    } else {
      // Expandir nueva categoría
      setSelectedCategory(categoryId);
      const newExpanded = new Set(expandedCategories);
      newExpanded.add(categoryId);
      setExpandedCategories(newExpanded);
    }
    onCategorySelect?.(categoryId);
  };

  const getTramitesForCategory = (categoryId: string) => {
    return getTramitesPorCategoria(
      categoryId as
        | "sii"
        | "previred"
        | "tesoreria"
        | "municipalidad-iquique"
        | "municipalidad-alto-hospicio"
        | "otro"
    );
  };

  return (
    <div className="category-buttons-container">
      <h3 className="category-buttons-title">Trámites por Categoría</h3>
      <p className="category-buttons-subtitle">
        Selecciona una categoría para ver los trámites disponibles
      </p>

      <div className="category-buttons-grid">
        {categoriasAMostrar.map((categoria) => {
          const tramites = getTramitesForCategory(categoria.id);
          const isExpanded = expandedCategories.has(categoria.id);

          return (
            <div key={categoria.id} className="category-section">
              <button
                className={`category-button ${isExpanded ? "expanded" : ""}`}
                onClick={() => handleCategoryClick(categoria.id)}
                type="button"
              >
                <span className="category-icon">{categoria.icon}</span>
                <div className="category-info">
                  <span className="category-name">{categoria.nombre}</span>
                  <span className="category-description">
                    {categoria.descripcion}
                  </span>
                  <span className="category-count">
                    {tramites.length} trámite{tramites.length !== 1 ? "s" : ""}{" "}
                    disponible{tramites.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className="category-arrow">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </button>

              {isExpanded && (
                <div className="category-tramites">
                  <InteractiveMenu
                    options={generarMenuTramites(tramites, categoria.id).options}
                    userId="current" // Se actualizará cuando se use en el chat
                    title={`${categoria.nombre} - Trámites Disponibles`}
                    description={`Selecciona el trámite que necesitas realizar`}
                    onActionComplete={(action, result) => {
                      if (result?.tramite_id) {
                        onTramiteSelect?.(result.tramite_id);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!showAllCategories && categoriasMunicipales.length > 0 && (
        <div className="municipalities-section">
          <h4 className="municipalities-title">Municipalidades</h4>
          <div className="municipalities-grid">
            {categoriasMunicipales.map((categoria) => {
              const tramites = getTramitesForCategory(categoria.id);
              const isExpanded = expandedCategories.has(categoria.id);

              return (
                <div key={categoria.id} className="category-section">
                  <button
                    className={`category-button municipality-button ${
                      isExpanded ? "expanded" : ""
                    }`}
                    onClick={() => handleCategoryClick(categoria.id)}
                    type="button"
                  >
                    <span className="category-icon">{categoria.icon}</span>
                    <div className="category-info">
                      <span className="category-name">{categoria.nombre}</span>
                      <span className="category-count">
                        {tramites.length} trámite
                        {tramites.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="category-arrow">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="category-tramites">
                      <InteractiveMenu
                        options={
                          generarMenuTramites(tramites, categoria.id).options
                        }
                        userId="current"
                        title={`${categoria.nombre} - Trámites Disponibles`}
                        description={`Selecciona el trámite que necesitas realizar`}
                        onActionComplete={(action, result) => {
                          if (result?.tramite_id) {
                            onTramiteSelect?.(result.tramite_id);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

