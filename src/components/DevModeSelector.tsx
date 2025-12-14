import { useState } from 'react'
import { UserRole, UserType } from '../types'
import './DevModeSelector.css'

interface DevModeSelectorProps {
  onSelectRole: (role: UserRole, userType?: UserType) => void
  onStartNormalAuth?: () => void
}

function DevModeSelector({ onSelectRole, onStartNormalAuth }: DevModeSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('invitado')
  const [selectedUserType, setSelectedUserType] = useState<UserType>('invitado')

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Administrador', description: 'Acceso completo al panel de administración' },
    { value: 'cliente', label: 'Cliente', description: 'Usuario cliente con acceso al chat' },
    { value: 'invitado', label: 'Invitado', description: 'Usuario invitado - verá pantalla de bienvenida' },
  ]

  const userTypes: { value: UserType; label: string }[] = [
    { value: 'invitado', label: 'Invitado' },
    { value: 'cliente_nuevo', label: 'Cliente Nuevo' },
    { value: 'cliente_existente', label: 'Cliente Existente' },
  ]

  const handleStart = () => {
    onSelectRole(selectedRole, selectedUserType)
  }

  return (
    <div className="dev-mode-selector">
      <div className="dev-mode-card">
        <div className="dev-mode-header">
          <h2>🔧 Modo de Desarrollo</h2>
          <p className="dev-mode-subtitle">
            Selecciona un rol para probar la aplicación sin autenticación
          </p>
        </div>

        <div className="dev-mode-content">
          <div className="dev-mode-section">
            <label className="dev-mode-label">Rol del Usuario:</label>
            <div className="dev-mode-options">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`dev-mode-option ${selectedRole === role.value ? 'active' : ''}`}
                >
                  <div className="dev-mode-option-header">
                    <span className="dev-mode-option-label">{role.label}</span>
                  </div>
                  <span className="dev-mode-option-description">{role.description}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedRole !== 'admin' && (
            <div className="dev-mode-section">
              <label className="dev-mode-label">Tipo de Usuario:</label>
              <div className="dev-mode-options-small">
                {userTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedUserType(type.value)}
                    className={`dev-mode-option-small ${selectedUserType === type.value ? 'active' : ''}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedUserType === 'cliente_nuevo' && selectedRole === 'cliente' ? (
            <div className="dev-mode-auth-options">
              <button onClick={handleStart} className="dev-mode-start-button dev-mode-button-secondary">
                Continuar en modo desarrollo
              </button>
              <button onClick={onStartNormalAuth} className="dev-mode-start-button dev-mode-button-primary">
                🔐 Iniciar sesión normal (con teléfono)
              </button>
            </div>
          ) : (
            <button onClick={handleStart} className="dev-mode-start-button">
              Iniciar como {roles.find(r => r.value === selectedRole)?.label}
            </button>
          )}
        </div>

        <div className="dev-mode-footer">
          <p>⚠️ Este modo solo está disponible en desarrollo</p>
        </div>
      </div>
    </div>
  )
}

export default DevModeSelector

