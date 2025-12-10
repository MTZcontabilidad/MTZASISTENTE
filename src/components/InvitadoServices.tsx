import './InvitadoServices.css';

interface InvitadoServiceSectionProps {
  serviceId: string;
  title: string;
  icon: string;
  description: string;
  onBack: () => void;
}

export function InvitadoServiceSection({ 
  serviceId, 
  title, 
  icon, 
  description, 
  onBack 
}: InvitadoServiceSectionProps) {
  return (
    <div className="invitado-service-section">
      <div className="service-header">
        <button onClick={onBack} className="back-button" aria-label="Volver al chat">
          ← Volver
        </button>
        <h2>
          <span className="service-icon">{icon}</span>
          {title}
        </h2>
      </div>
      <div className="service-content">
        <div className="service-description">
          <p>{description}</p>
        </div>
        <div className="service-info">
          <p>Esta sección está en desarrollo. Próximamente podrás acceder a información detallada y servicios relacionados con {title}.</p>
        </div>
      </div>
    </div>
  );
}

// Componentes específicos para cada servicio
export function MTZConsultoresSection({ onBack }: { onBack: () => void }) {
  return (
    <InvitadoServiceSection
      serviceId="mtz-consultores"
      title="MTZ Consultores Tributarios"
      icon="📊"
      description="Servicios de consultoría tributaria y contable. Asesoría profesional para empresas y personas."
      onBack={onBack}
    />
  );
}

export function FundacionTeQuieroFelizSection({ onBack }: { onBack: () => void }) {
  return (
    <InvitadoServiceSection
      serviceId="fundacion"
      title="Fundación Te Quiero Feliz"
      icon="🚐"
      description="Transporte inclusivo y servicios de movilidad para personas con discapacidad."
      onBack={onBack}
    />
  );
}

export function TallerMMCSection({ onBack }: { onBack: () => void }) {
  return (
    <InvitadoServiceSection
      serviceId="taller-mmc"
      title="Taller de Sillas de Ruedas MMC"
      icon="🪑"
      description="Reparación, mantenimiento y personalización de sillas de ruedas. Servicios especializados en movilidad."
      onBack={onBack}
    />
  );
}

export function AbuelitaAlejandraSection({ onBack }: { onBack: () => void }) {
  return (
    <InvitadoServiceSection
      serviceId="abuelita-alejandra"
      title="Fábrica de Ropa y Diseño Abuelita Alejandra"
      icon="👗"
      description="Diseño y confección de ropa personalizada. Servicios de moda y textil con enfoque inclusivo."
      onBack={onBack}
    />
  );
}

