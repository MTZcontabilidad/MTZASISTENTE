import { useState } from 'react';
import './F29Guide.css';

interface F29GuideProps {
  onStepComplete?: (step: number) => void;
  onComplete?: () => void;
}

const F29_STEPS = [
  {
    id: 1,
    title: 'Ingreso al Portal del SII',
    description: 'Primero necesitas entrar al sitio oficial del Servicio de Impuestos Internos.',
    instructions: [
      'Ve a www.sii.cl',
      'Haz clic en el botón naranja "Ingresar a Mi SII" o en "Servicios online"',
    ],
    link: 'https://zeusr.sii.cl/AUT2000/InicioAutenticacion/IngresoRutClave.html?https://www4.sii.cl/propuestaf29ui/index.html#/default',
    linkText: 'Ir directo al portal del SII',
  },
  {
    id: 2,
    title: 'Autenticación',
    description: 'Ahora necesitas ingresar con tus datos.',
    instructions: [
      'Ingresa tu RUT (de la empresa o personal)',
      'Ingresa tu Clave Tributaria (o ClaveÚnica si es persona natural)',
      'Haz clic en "Ingresar"',
    ],
  },
  {
    id: 3,
    title: 'Navegar al F29',
    description: 'Una vez dentro, busca la opción para declarar el F29.',
    instructions: [
      'En el menú superior, selecciona "Servicios online"',
      'Busca "Impuestos mensuales"',
      'Haz clic en "Declaración mensual (F29)"',
      'Selecciona "Declarar IVA (F29)"',
    ],
  },
  {
    id: 4,
    title: 'Seleccionar el Período',
    description: 'El sistema te pedirá identificar qué mes vas a declarar.',
    instructions: [
      'Selecciona el Mes correspondiente',
      'Selecciona el Año correspondiente',
      'Haz clic en "Aceptar"',
      '💡 Recuerda: El IVA se declara al mes siguiente (ejemplo: si seleccionas "Agosto", estás declarando las ventas y compras de Agosto, y el trámite se hace en Septiembre)',
    ],
  },
  {
    id: 5,
    title: 'Revisar la Propuesta',
    description: 'El SII cruza la información y genera una propuesta automática.',
    instructions: [
      'Revisa la pantalla resumen con tus ventas y compras',
      'Verifica que la información coincida con tus registros',
      'Si todo está correcto, presiona "Continuar" o "Ingresar a declarar"',
    ],
  },
  {
    id: 6,
    title: 'Revisar el Formulario',
    description: 'Revisa los montos importantes antes de enviar.',
    instructions: [
      'Verifica el Débito Fiscal (Ventas) - debe coincidir con tus boletas y facturas emitidas',
      'Verifica el Crédito Fiscal (Compras) - asegúrate de que estén todas tus facturas de proveedores',
      'Revisa el PPM (Pagos Provisionales Mensuales) - verifica que la tasa sea correcta',
      'Si todo está bien, ve al final de la página',
    ],
  },
  {
    id: 7,
    title: 'Enviar la Declaración',
    description: 'Último paso: enviar tu declaración.',
    instructions: [
      'Si debes dinero al fisco:',
      '  • Haz clic en "Enviar Declaración"',
      '  • Selecciona el medio de pago (WebPay, tarjeta bancaria, o cupón presencial)',
      '  • Realiza la transacción',
      '',
      'Si no debes nada o tienes saldo a favor:',
      '  • Simplemente haz clic en "Enviar Declaración"',
    ],
  },
  {
    id: 8,
    title: 'Guardar el Certificado',
    description: '¡Importante! Guarda tu certificado como respaldo.',
    instructions: [
      'Una vez enviado, el sistema te mostrará el Certificado de Declaración',
      'Descarga el PDF y guárdalo en un lugar seguro',
      'Este certificado es tu respaldo de que cumpliste con tu obligación tributaria',
    ],
  },
];

function F29Guide({ onStepComplete, onComplete }: F29GuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showLinkOption, setShowLinkOption] = useState(true);

  const handleNext = () => {
    if (currentStep < F29_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepComplete?.(nextStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUseLink = () => {
    const step = F29_STEPS[currentStep];
    if (step.link) {
      window.open(step.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStepComplete = () => {
    handleNext();
  };

  const currentStepData = F29_STEPS[currentStep];

  return (
    <div className="f29-guide">
      <div className="f29-guide-header">
        <h3>📋 Guía para Declarar el F29 (IVA)</h3>
        <div className="f29-progress">
          <span className="f29-progress-text">
            Paso {currentStep + 1} de {F29_STEPS.length}
          </span>
          <div className="f29-progress-bar">
            <div
              className="f29-progress-fill"
              style={{ width: `${((currentStep + 1) / F29_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="f29-step-content">
        <h4 className="f29-step-title">{currentStepData.title}</h4>
        <p className="f29-step-description">{currentStepData.description}</p>

        <div className="f29-instructions">
          <ul>
            {currentStepData.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ul>
        </div>

        {currentStepData.link && showLinkOption && (
          <div className="f29-link-option">
            <p className="f29-link-question">
              ¿Prefieres ir directo al portal o seguir con el paso a paso?
            </p>
            <button
              onClick={handleUseLink}
              className="f29-link-button"
              type="button"
            >
              🔗 {currentStepData.linkText}
            </button>
            <button
              onClick={() => setShowLinkOption(false)}
              className="f29-continue-button"
              type="button"
            >
              Continuar con el paso a paso
            </button>
          </div>
        )}
      </div>

      <div className="f29-guide-actions">
        {currentStep > 0 && (
          <button
            onClick={handlePrevious}
            className="f29-nav-button f29-prev-button"
            type="button"
          >
            ← Anterior
          </button>
        )}
        <button
          onClick={handleStepComplete}
          className="f29-nav-button f29-next-button"
          type="button"
        >
          {currentStep < F29_STEPS.length - 1 ? 'Siguiente →' : 'Finalizar'}
        </button>
      </div>

      <div className="f29-tips">
        <p className="f29-tips-title">💡 Tips importantes:</p>
        <ul>
          <li>
            <strong>Plazos:</strong> Si declaras con pago, el plazo suele vencer el día 20 de cada mes (si usas facturación electrónica y pagas en línea), de lo contrario es hasta el día 12.
          </li>
          <li>
            <strong>Sin movimiento:</strong> Si tu empresa no vendió ni compró nada, igual debes declarar el F29 seleccionando "Declarar Sin Movimiento" para evitar multas.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default F29Guide;

