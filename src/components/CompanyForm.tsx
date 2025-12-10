import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import './CompanyForm.css';

interface Company {
  id?: string;
  rut: string;
  razon_social: string;
  nombre_fantasia: string;
  giro: string;
  direccion: string;
  contacto_nombre: string;
  contacto_email: string;
  contacto_fono: string;
}

interface CompanyFormProps {
  user: User;
  companyToEdit?: Company | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CompanyForm({ user, companyToEdit, onSuccess, onCancel }: CompanyFormProps) {
  const [formData, setFormData] = useState<Company>({
    rut: '',
    razon_social: '',
    nombre_fantasia: '',
    giro: '',
    direccion: '',
    contacto_nombre: '',
    contacto_email: '',
    contacto_fono: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyToEdit) {
      setFormData({
        id: companyToEdit.id,
        rut: companyToEdit.rut || '',
        razon_social: companyToEdit.razon_social || '',
        nombre_fantasia: companyToEdit.nombre_fantasia || '',
        giro: companyToEdit.giro || '',
        direccion: companyToEdit.direccion || '',
        contacto_nombre: companyToEdit.contacto_nombre || '',
        contacto_email: companyToEdit.contacto_email || '',
        contacto_fono: companyToEdit.contacto_fono || ''
      });
    }
  }, [companyToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.rut || !formData.razon_social) {
        throw new Error('RUT y Razón Social son obligatorios');
      }

      const dataToSave = {
        ...formData,
        user_id: user.id
      };

      let result;
      if (companyToEdit?.id) {
        // Update
        const { id, ...updates } = dataToSave; 
        result = await supabase
          .from('companies')
          .update(updates)
          .eq('id', companyToEdit.id);
      } else {
        // Insert
        result = await supabase
          .from('companies')
          .insert([dataToSave]);
      }

      if (result.error) throw result.error;

      onSuccess();
    } catch (err: any) {
      console.error('Error saving company:', err);
      setError(err.message || 'Error al guardar la empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="company-form-overlay">
      <div className="company-form-modal glass-panel">
        <div className="modal-header">
          <h3>{companyToEdit ? 'Editar Empresa' : 'Nueva Empresa'}</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="company-form">
          {error && <div className="error-banner">{error}</div>}
          
          <div className="form-grid">
            <div className="form-group">
              <label>RUT *</label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                placeholder="Ej: 76.123.456-K"
                required
              />
            </div>

            <div className="form-group">
              <label>Razón Social *</label>
              <input
                type="text"
                name="razon_social"
                value={formData.razon_social}
                onChange={handleChange}
                placeholder="Ej: Servicios Integrales SpA"
                required
              />
            </div>

            <div className="form-group">
              <label>Nombre de Fantasía</label>
              <input
                type="text"
                name="nombre_fantasia"
                value={formData.nombre_fantasia}
                onChange={handleChange}
                placeholder="Ej: Mi Tienda"
              />
            </div>

            <div className="form-group">
              <label>Giro</label>
              <input
                type="text"
                name="giro"
                value={formData.giro}
                onChange={handleChange}
                placeholder="Ej: Venta de artículos..."
              />
            </div>

            <div className="form-group full-width">
              <label>Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Calle, Número, Comuna"
              />
            </div>

            <div className="form-section-title full-width">Contacto Principal</div>

            <div className="form-group">
              <label>Nombre Contacto</label>
              <input
                type="text"
                name="contacto_nombre"
                value={formData.contacto_nombre}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email Contacto</label>
              <input
                type="email"
                name="contacto_email"
                value={formData.contacto_email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Teléfono Contacto</label>
              <input
                type="tel"
                name="contacto_fono"
                value={formData.contacto_fono}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onCancel} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="save-button" disabled={loading}>
              {loading ? <span className="spinner-small"></span> : 'Guardar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
