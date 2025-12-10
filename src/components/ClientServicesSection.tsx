import './ClientSections.css';

interface ClientServicesSectionProps {
  onBack: () => void;
}

export function ClientServicesSection({ onBack }: ClientServicesSectionProps) {
  const quickLinks = [
    {
      id: 'sii',
      title: 'Servicio de Impuestos Internos',
      subtitle: 'SII',
      description: 'Emisión de boletas, facturas y trámites tributarios.',
      url: 'https://homer.sii.cl/',
      icon: '🏢',
      color: '#F44336' // Official red-ish tone or similar
    },
    {
      id: 'tgr',
      title: 'Tesorería General de la República',
      subtitle: 'TGR',
      description: 'Pago de contribuciones y certificados de deuda.',
      url: 'https://www.tgr.cl/',
      icon: '💰',
      color: '#2196F3' // Blue
    },
    {
      id: 'previred',
      title: 'Previred',
      subtitle: 'Cotizaciones',
      description: 'Pago de imposiciones y cotizaciones previsionales.',
      url: 'https://www.previred.com/',
      icon: '📉',
      color: '#FF9800' // Orange
    }
  ];

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="client-section services-section">
      <div className="section-header">
        <button onClick={onBack} className="back-button">← Volver</button>
        <h2>Accesos Rápidos</h2>
      </div>

      <div className="services-content">
        <div className="quick-access-intro">
          <p>Links directos a las plataformas más utilizadas para tus trámites.</p>
        </div>

        <div className="quick-access-grid">
          {quickLinks.map((link) => (
            <div 
              key={link.id} 
              className="quick-access-card" 
              onClick={() => handleOpenLink(link.url)}
              role="button"
              tabIndex={0}
            >
              <div className="card-icon" style={{ borderColor: link.color }}>
                {link.icon}
              </div>
              <div className="card-info">
                <h3>{link.subtitle}</h3>
                <h4>{link.title}</h4>
                <p>{link.description}</p>
              </div>
              <div className="card-arrow">
                ↗
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .quick-access-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-top: 20px;
        }

        .quick-access-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .quick-access-card:hover {
          transform: translateY(-5px);
          border-color: var(--neon-blue);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .quick-access-card:hover .card-arrow {
          opacity: 1;
          transform: translate(0, 0);
        }

        .card-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
          border: 2px solid transparent; /* Set inline */
        }

        .card-info h3 {
          font-size: 1.5rem;
          margin: 0 0 4px 0;
          color: var(--text-primary);
        }

        .card-info h4 {
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: normal;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-info p {
          font-size: 0.95rem;
          color: var(--text-tertiary);
          margin: 0;
          line-height: 1.4;
        }

        .card-arrow {
          position: absolute;
          top: 15px;
          right: 15px;
          font-size: 1.2rem;
          color: var(--neon-blue);
          opacity: 0.5;
          transform: translate(-2px, 2px);
          transition: all 0.3s ease;
        }

        .quick-access-intro {
          text-align: center;
          margin-bottom: 30px;
          color: var(--text-secondary);
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
}
