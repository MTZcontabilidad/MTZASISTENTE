import { useState, useEffect } from 'react';
import { getServices, calculateMonthlyFee } from '../lib/services';
import type { ServiceItem } from '../types';
import './ClientSections.css'; // Reusing existing styles or create new ones

interface ClientServicesSectionProps {
  onBack: () => void;
}

export function ClientServicesSection({ onBack }: ClientServicesSectionProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatorInput, setCalculatorInput] = useState<string>('');
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = () => {
    const netSales = parseInt(calculatorInput.replace(/\./g, ''), 10);
    if (!isNaN(netSales)) {
      const fee = calculateMonthlyFee(netSales);
      setCalculatedFee(fee);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and format with dots
    const val = e.target.value.replace(/\D/g, '');
    const formatted = val.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setCalculatorInput(formatted);
  };

  return (
    <div className="client-section services-section">
      <div className="section-header">
        <button onClick={onBack} className="back-button">← Volver</button>
        <h2>Servicios y Honorarios</h2>
      </div>

      <div className="services-content">
        {/* Calculator Section */}
        <div className="calculator-card">
          <h3>🧮 Calculadora de Honorarios Mensuales</h3>
          <p>Ingresa tu promedio de ventas netas mensuales para calcular tu tarifa.</p>
          
          <div className="calculator-input-group">
            <label>Ventas Netas Mensuales:</label>
            <div className="input-wrapper">
              <span className="currency-symbol">$</span>
              <input 
                type="text" 
                value={calculatorInput}
                onChange={handleInputChange}
                placeholder="Ej: 2.000.000"
              />
            </div>
            <button onClick={handleCalculate} className="calculate-button">Calcular</button>
          </div>

          {calculatedFee !== null && (
            <div className="calculation-result">
              <span>Tu honorario mensual estimado es:</span>
              <div className="fee-amount">{formatCurrency(calculatedFee)}</div>
              <p className="fee-note">* Valor referencial con IVA incluido.</p>
            </div>
          )}
        </div>

        {/* Services List */}
        <h3>Nuestros Servicios</h3>
        {loading ? (
          <div className="loading-spinner">Cargando servicios...</div>
        ) : (
          <div className="services-grid">
            {services.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-icon">
                  {service.service_code === 'contabilidad_mensual' ? '📊' : 
                   service.service_code.includes('inicio') ? '🚀' :
                   service.service_code.includes('tributaria') ? '⚖️' : '📄'}
                </div>
                <h4>{service.service_name}</h4>
                <p className="service-description">{service.description}</p>
                <div className="service-price">
                  {service.metadata?.ranges ? (
                    <span className="price-tag">Desde {formatCurrency(service.metadata.ranges[0].price)}</span>
                  ) : (
                    <span className="price-tag">{formatCurrency(service.base_price)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .services-section {
          padding: 20px;
          color: white;
        }
        .calculator-card {
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid #00ff88;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 0 15px rgba(0, 255, 136, 0.2);
        }
        .calculator-card h3 {
          color: #00ff88;
          margin-top: 0;
        }
        .calculator-input-group {
          display: flex;
          gap: 15px;
          align-items: flex-end;
          margin: 20px 0;
          flex-wrap: wrap;
        }
        .input-wrapper {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        .currency-symbol {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #888;
        }
        .input-wrapper input {
          width: 100%;
          padding: 10px 10px 10px 25px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #444;
          border-radius: 6px;
          color: white;
          font-size: 1.1em;
        }
        .calculate-button {
          background: #00ff88;
          color: black;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          font-size: 1em;
          transition: all 0.2s;
        }
        .calculate-button:hover {
          background: #00cc6a;
          transform: scale(1.05);
        }
        .calculation-result {
          background: rgba(0, 0, 0, 0.3);
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          animation: fadeIn 0.5s ease;
        }
        .fee-amount {
          font-size: 2em;
          font-weight: bold;
          color: #00ff88;
          text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
          margin: 10px 0;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .service-card {
          background: rgba(20, 20, 30, 0.8);
          border: 1px solid #333;
          border-radius: 12px;
          padding: 20px;
          transition: transform 0.2s, border-color 0.2s;
        }
        .service-card:hover {
          transform: translateY(-5px);
          border-color: #00ff88;
        }
        .service-icon {
          font-size: 2em;
          margin-bottom: 15px;
        }
        .service-card h4 {
          margin: 0 0 10px 0;
          color: #e0e0e0;
        }
        .service-description {
          color: #aaa;
          font-size: 0.9em;
          margin-bottom: 15px;
          line-height: 1.4;
        }
        .service-price {
          font-weight: bold;
          color: #00ff88;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
