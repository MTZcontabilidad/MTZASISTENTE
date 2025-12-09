import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getOrCreateClientInfo, updateClientInfo } from "../lib/clientInfo";
import {
  getCompanyInfo,
  updateCompanyInfo,
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  type CompanyInfo,
  type FAQResponse,
} from "../lib/companyConfig";
import {
  getAllClientDocuments,
  getDocumentsByUserId,
  createClientDocument,
  updateClientDocument,
  deleteClientDocument,
  setClientGoogleScript,
  type DocumentInput,
} from "../lib/adminDocuments";
import {
  getAllMeetings,
  getPendingMeetings,
  updateMeetingStatus,
} from "../lib/meetings";
import type { Meeting, MeetingStatus } from "../types";
import { getDocumentIcon } from "../lib/documents";
import { UserProfile, ClientInfo, UserType, UserRole } from "../types";
import WheelchairWorkshopPanel from "./WheelchairWorkshopPanel";
import TransportPanel from "./TransportPanel";
import "./AdminPanel.css";

interface UserWithClientInfo extends UserProfile {
  client_info?: ClientInfo | null;
}

type AdminTab = "users" | "faqs" | "company" | "documents" | "meetings" | "requests" | "wheelchair" | "transport";

function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  // Estados para usuarios
  const [users, setUsers] = useState<UserWithClientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterUserType, setFilterUserType] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserWithClientInfo | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);

  // Estados para FAQs
  const [faqs, setFaqs] = useState<FAQResponse[]>([]);
  const [loadingFAQs, setLoadingFAQs] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQResponse | null>(null);

  // Estados para datos de empresa
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  // Estados para documentos
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedUserForDocument, setSelectedUserForDocument] =
    useState<string>("");

  // Estados para reuniones
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [meetingFilter, setMeetingFilter] = useState<string>("all");

  // Funciones fetch memoizadas para evitar recreaciones innecesarias
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener todos los perfiles de usuario
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      // Obtener información de clientes para cada usuario
      const usersWithClientInfo = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Usar maybeSingle() en lugar de single() para evitar errores 406 cuando no existe el registro
          const { data: clientInfo, error: clientError } = await supabase
            .from("client_info")
            .select("*")
            .eq("user_id", profile.id)
            .maybeSingle();

          // Si hay error y no es "no encontrado", loguearlo pero continuar
          if (clientError && clientError.code !== "PGRST116") {
            console.warn(
              `Error al obtener client_info para ${profile.email}:`,
              clientError
            );
          }

          return {
            ...profile,
            client_info: clientInfo || null,
          };
        })
      );

      setUsers(usersWithClientInfo);
    } catch (err: any) {
      console.error("Error al cargar usuarios:", err);
      setError(
        `Error al cargar usuarios: ${err.message || "Error desconocido"}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Funciones para FAQs
  const fetchFAQs = useCallback(async () => {
    try {
      setLoadingFAQs(true);
      const allFAQs = await getAllFAQs();
      setFaqs(allFAQs);
    } catch (err: any) {
      console.error("Error al cargar FAQs:", err);
      setError(`Error al cargar FAQs: ${err.message || "Error desconocido"}`);
    } finally {
      setLoadingFAQs(false);
    }
  }, []);

  // Funciones para datos de empresa
  const fetchCompanyInfo = useCallback(async () => {
    try {
      setLoadingCompany(true);
      const info = await getCompanyInfo();
      setCompanyInfo(info);
    } catch (err: any) {
      console.error("Error al cargar datos de empresa:", err);
      setError(`Error al cargar datos: ${err.message || "Error desconocido"}`);
    } finally {
      setLoadingCompany(false);
    }
  }, []);

  // Funciones para documentos
  const fetchAllDocuments = useCallback(async () => {
    try {
      setLoadingDocuments(true);
      const docs = await getAllClientDocuments();
      setAllDocuments(docs);
    } catch (err: any) {
      console.error("Error al cargar documentos:", err);
      setError(
        `Error al cargar documentos: ${err.message || "Error desconocido"}`
      );
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  // Funciones para reuniones
  const fetchMeetings = useCallback(async () => {
    try {
      setLoadingMeetings(true);
      const allMeetings = await getAllMeetings();
      setMeetings(allMeetings);
    } catch (err: any) {
      console.error("Error al cargar reuniones:", err);
      setError(
        `Error al cargar reuniones: ${err.message || "Error desconocido"}`
      );
    } finally {
      setLoadingMeetings(false);
    }
  }, []);

  // useEffect que depende de las funciones memoizadas
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "faqs") {
      fetchFAQs();
    } else if (activeTab === "company") {
      fetchCompanyInfo();
    } else if (activeTab === "documents") {
      fetchAllDocuments();
    } else if (activeTab === "meetings") {
      fetchMeetings();
    } else if (activeTab === "requests") {
      // Las requests se cargan automáticamente desde users y meetings
      fetchUsers();
      fetchMeetings();
    } else if (activeTab === "wheelchair" || activeTab === "transport") {
      // Los paneles de Taller y Transporte cargan sus propios datos
    }
  }, [activeTab, fetchUsers, fetchFAQs, fetchCompanyInfo, fetchAllDocuments, fetchMeetings]);

  const handleEditUser = (user: UserWithClientInfo) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleToggleUserStatus = async (user: UserWithClientInfo) => {
    try {
      const newStatus = user.is_active !== false ? false : true;
      const { error } = await supabase
        .from("user_profiles")
        .update({ is_active: newStatus })
        .eq("id", user.id);

      if (error) throw error;

      // Actualizar estado local
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: newStatus } : u
        )
      );
    } catch (err: any) {
      alert(`Error: ${err.message || "Error desconocido"}`);
    }
  };

  const handleSaveUser = async (updates: {
    full_name?: string;
    user_type?: UserType;
    role?: UserRole;
    company_name?: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) => {
    if (!selectedUser) return;

    try {
      // Actualizar perfil de usuario
      const profileUpdates: any = {};
      if (updates.full_name !== undefined)
        profileUpdates.full_name = updates.full_name;
      if (updates.user_type !== undefined)
        profileUpdates.user_type = updates.user_type;
      if (updates.role !== undefined) profileUpdates.role = updates.role;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update(profileUpdates)
          .eq("id", selectedUser.id);

        if (profileError) throw profileError;
      }

      // Actualizar información de cliente
      if (
        updates.company_name !== undefined ||
        updates.phone !== undefined ||
        updates.address !== undefined ||
        updates.notes !== undefined
      ) {
        const clientUpdates: any = {};
        if (updates.company_name !== undefined)
          clientUpdates.company_name = updates.company_name;
        if (updates.phone !== undefined) clientUpdates.phone = updates.phone;
        if (updates.address !== undefined)
          clientUpdates.address = updates.address;
        if (updates.notes !== undefined) clientUpdates.notes = updates.notes;

        await updateClientInfo(selectedUser.id, clientUpdates);
      }

      // Recargar usuarios
      await fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error("Error al guardar cambios:", err);
      alert(`Error al guardar: ${err.message || "Error desconocido"}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtrar usuarios
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false) ||
      (user.client_info?.company_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ??
        false);

    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesUserType =
      filterUserType === "all" || user.user_type === filterUserType;

    return matchesSearch && matchesRole && matchesUserType;
  });

  const handleCreateFAQ = () => {
    setSelectedFAQ(null);
    setShowFAQModal(true);
  };

  const handleEditFAQ = (faq: FAQResponse) => {
    setSelectedFAQ(faq);
    setShowFAQModal(true);
  };

  const handleDeleteFAQ = async (id: string) => {
    if (
      !confirm("¿Estás seguro de que deseas eliminar esta respuesta frecuente?")
    )
      return;

    try {
      const success = await deleteFAQ(id);
      if (success) {
        await fetchFAQs();
      } else {
        alert("Error al eliminar la FAQ");
      }
    } catch (err: any) {
      alert(`Error: ${err.message || "Error desconocido"}`);
    }
  };

  const handleSaveCompanyInfo = async (updates: Partial<CompanyInfo>) => {
    try {
      setSavingCompany(true);
      const success = await updateCompanyInfo(updates);
      if (success) {
        await fetchCompanyInfo();
        alert("Datos guardados correctamente");
      } else {
        alert("Error al guardar los datos");
      }
    } catch (err: any) {
      alert(`Error: ${err.message || "Error desconocido"}`);
    } finally {
      setSavingCompany(false);
    }
  };

  const handleCreateDocument = () => {
    setSelectedDocument(null);
    setShowDocumentModal(true);
  };

  const handleEditDocument = (doc: any) => {
    setSelectedDocument(doc);
    setShowDocumentModal(true);
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este documento?"))
      return;

    try {
      const success = await deleteClientDocument(id);
      if (success) {
        await fetchAllDocuments();
        alert("Documento eliminado correctamente");
      } else {
        alert("Error al eliminar el documento");
      }
    } catch (err: any) {
      alert(`Error: ${err.message || "Error desconocido"}`);
    }
  };

  const handleSaveDocument = async (documentData: DocumentInput) => {
    try {
      if (selectedDocument) {
        await updateClientDocument(selectedDocument.id, documentData);
      } else {
        await createClientDocument(documentData);
      }
      await fetchAllDocuments();
      setShowDocumentModal(false);
      setSelectedDocument(null);
      alert("Documento guardado correctamente");
    } catch (err: any) {
      alert(`Error: ${err.message || "Error desconocido"}`);
    }
  };

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    active: users.filter((u) => u.last_login).length,
    clients: users.filter(
      (u) =>
        u.user_type === "cliente_existente" || u.user_type === "cliente_nuevo"
    ).length,
  };

  const getRefreshAction = () => {
    if (activeTab === "users") return fetchUsers;
    if (activeTab === "faqs") return fetchFAQs;
    if (activeTab === "company") return fetchCompanyInfo;
    if (activeTab === "documents") return fetchAllDocuments;
    if (activeTab === "meetings") return fetchMeetings;
    return () => {};
  };

  const getRefreshLoading = () => {
    if (activeTab === "users") return loading;
    if (activeTab === "faqs") return loadingFAQs;
    if (activeTab === "company") return loadingCompany;
    if (activeTab === "documents") return loadingDocuments;
    if (activeTab === "meetings") return loadingMeetings;
    return false;
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div>
          <h2>Panel de Administración</h2>
          <p className="admin-subtitle">
            Gestiona usuarios, respuestas frecuentes y datos de la empresa
          </p>
        </div>
        <button
          onClick={getRefreshAction()}
          className="refresh-button"
          disabled={getRefreshLoading()}
        >
          {getRefreshLoading() ? "Actualizando..." : "🔄 Actualizar"}
        </button>
      </div>

      {/* Pestañas */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Usuarios
        </button>
        <button
          className={`admin-tab ${activeTab === "faqs" ? "active" : ""}`}
          onClick={() => setActiveTab("faqs")}
        >
          💬 Respuestas Frecuentes
        </button>
        <button
          className={`admin-tab ${activeTab === "company" ? "active" : ""}`}
          onClick={() => setActiveTab("company")}
        >
          🏢 Datos de la Empresa
        </button>
        <button
          className={`admin-tab ${activeTab === "documents" ? "active" : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          📄 Documentos
        </button>
        <button
          className={`admin-tab ${activeTab === "meetings" ? "active" : ""}`}
          onClick={() => setActiveTab("meetings")}
        >
          📅 Reuniones
        </button>
        <button
          className={`admin-tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          🔔 Requerimientos
        </button>
        <button
          className={`admin-tab ${activeTab === "wheelchair" ? "active" : ""}`}
          onClick={() => setActiveTab("wheelchair")}
        >
          🪑 Taller de Sillas
        </button>
        <button
          className={`admin-tab ${activeTab === "transport" ? "active" : ""}`}
          onClick={() => setActiveTab("transport")}
        >
          🚐 Transporte Inclusivo
        </button>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {/* Contenido según pestaña activa */}
      {activeTab === "users" && (
        <>
          {/* Estadísticas */}
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total usuarios</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.admins}</div>
              <div className="stat-label">Administradores</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Usuarios activos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.clients}</div>
              <div className="stat-label">Clientes</div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="admin-filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Buscar por email, nombre o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todos los roles</option>
                <option value="admin">Administradores</option>
                <option value="user">Usuarios</option>
              </select>
              <select
                value={filterUserType}
                onChange={(e) => setFilterUserType(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todos los tipos</option>
                <option value="invitado">Invitados</option>
                <option value="cliente_nuevo">Clientes nuevos</option>
                <option value="cliente_existente">Clientes existentes</option>
              </select>
            </div>
          </div>

          {/* Tabla de usuarios */}
          {loading && users.length === 0 ? (
            <div className="loading-state">
              <div className="spinner-large"></div>
              <p>Cargando usuarios...</p>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Tipo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Empresa</th>
                    <th>Registro</th>
                    <th>Último acceso</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-info">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name || user.email}
                              className="user-avatar"
                            />
                          ) : (
                            <div className="user-avatar-placeholder">
                              {user.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>
                            {user.full_name || user.email.split("@")[0]}
                          </span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.client_info?.phone || "-"}</td>
                      <td>
                        <span className={`user-type-badge ${user.user_type}`}>
                          {user.user_type === "invitado"
                            ? "Invitado"
                            : user.user_type === "cliente_nuevo"
                            ? "Cliente nuevo"
                            : "Cliente existente"}
                        </span>
                      </td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === "admin" ? "Admin" : user.role === "invitado" ? "Invitado" : "Usuario"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.is_active !== false ? 'active' : 'inactive'}`}>
                          {user.is_active !== false ? "✅ Activo" : "❌ Inactivo"}
                        </span>
                      </td>
                      <td>{user.client_info?.company_name || "-"}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>{formatDate(user.last_login)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="edit-button"
                            title="Editar usuario"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`toggle-button ${user.is_active !== false ? 'deactivate' : 'activate'}`}
                            title={user.is_active !== false ? "Desactivar usuario" : "Activar usuario"}
                          >
                            {user.is_active !== false ? "🚫 Desactivar" : "✅ Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && !loading && (
                <div className="empty-state">
                  <p>No se encontraron usuarios con los filtros aplicados</p>
                </div>
              )}
            </div>
          )}

          {/* Modal de edición de usuario */}
          {showEditModal && selectedUser && (
            <EditUserModal
              user={selectedUser}
              onClose={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}
              onSave={handleSaveUser}
            />
          )}
        </>
      )}

      {activeTab === "faqs" && (
        <FAQsSection
          faqs={faqs}
          loading={loadingFAQs}
          onCreate={handleCreateFAQ}
          onEdit={handleEditFAQ}
          onDelete={handleDeleteFAQ}
          onRefresh={fetchFAQs}
        />
      )}

      {activeTab === "documents" && (
        <div className="documents-section">
          <div className="section-header">
            <h3>📄 Gestión de Documentos</h3>
            <button onClick={handleCreateDocument} className="create-button">
              ➕ Nuevo Documento
            </button>
          </div>

          {loadingDocuments ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando documentos...</p>
            </div>
          ) : (
            <div className="documents-admin-list">
              {allDocuments.length === 0 ? (
                <div className="empty-state">
                  <p>No hay documentos registrados</p>
                  <p className="empty-subtitle">
                    Crea un documento para comenzar
                  </p>
                </div>
              ) : (
                <div className="documents-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Tipo</th>
                        <th>Nombre</th>
                        <th>Período</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allDocuments.map((doc) => {
                        const user = users.find((u) => u.id === doc.user_id);
                        return (
                          <tr key={doc.id}>
                            <td>{user?.email || doc.user_id}</td>
                            <td>
                              {getDocumentIcon(doc.document_type)}{" "}
                              {doc.document_type}
                            </td>
                            <td>{doc.document_name}</td>
                            <td>
                              {doc.period || `${doc.month}/${doc.year}` || "-"}
                            </td>
                            <td>
                              <button
                                onClick={() => handleEditDocument(doc)}
                                className="edit-button"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="delete-button"
                              >
                                🗑️ Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "company" && (
        <CompanyInfoSection
          companyInfo={companyInfo}
          loading={loadingCompany}
          saving={savingCompany}
          onSave={handleSaveCompanyInfo}
        />
      )}

      {activeTab === "meetings" && (
        <MeetingsSection
          meetings={meetings}
          loading={loadingMeetings}
          filter={meetingFilter}
          onFilterChange={setMeetingFilter}
          onStatusChange={async (meetingId, status, notes) => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              await updateMeetingStatus(
                meetingId,
                status as MeetingStatus,
                notes,
                user?.id
              );
              await fetchMeetings();
            } catch (err: any) {
              alert(`Error: ${err.message || "Error desconocido"}`);
            }
          }}
        />
      )}

      {activeTab === "requests" && (
        <RequestsSection
          users={users}
          meetings={meetings}
          onUserClick={handleEditUser}
        />
      )}

      {activeTab === "wheelchair" && <WheelchairWorkshopPanel />}

      {activeTab === "transport" && <TransportPanel />}

      {/* Modal de FAQ */}
      {showFAQModal && (
        <FAQModal
          faq={selectedFAQ}
          onClose={() => {
            setShowFAQModal(false);
            setSelectedFAQ(null);
          }}
          onSave={async (faqData) => {
            try {
              if (selectedFAQ) {
                await updateFAQ(selectedFAQ.id, faqData);
              } else {
                await createFAQ(faqData);
              }
              await fetchFAQs();
              setShowFAQModal(false);
              setSelectedFAQ(null);
            } catch (err: any) {
              alert(`Error: ${err.message || "Error desconocido"}`);
            }
          }}
        />
      )}

      {showDocumentModal && (
        <DocumentModal
          document={selectedDocument}
          users={users}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedDocument(null);
          }}
          onSave={handleSaveDocument}
        />
      )}
    </div>
  );
}

// Componente Modal para editar usuario
interface EditUserModalProps {
  user: UserWithClientInfo;
  onClose: () => void;
  onSave: (updates: any) => Promise<void>;
}

function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [userType, setUserType] = useState<UserType>(
    user.user_type || "invitado"
  );
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState<boolean>(user.is_active !== false);
  const [companyName, setCompanyName] = useState(
    user.client_info?.company_name || ""
  );
  const [phone, setPhone] = useState(user.client_info?.phone || "");
  const [address, setAddress] = useState(user.client_info?.address || "");
  const [notes, setNotes] = useState(user.client_info?.notes || "");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "client">("profile");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        full_name: fullName,
        user_type: userType,
        role,
        is_active: isActive,
        company_name: companyName,
        phone,
        address,
        notes,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar Usuario: {user.email}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            Perfil
          </button>
          <button
            className={activeTab === "client" ? "active" : ""}
            onClick={() => setActiveTab("client")}
          >
            Información de Cliente
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === "profile" && (
            <div className="modal-form">
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nombre del usuario"
                />
              </div>

              <div className="form-group">
                <label>Tipo de usuario</label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as UserType)}
                >
                  <option value="invitado">Invitado</option>
                  <option value="cliente_nuevo">Cliente nuevo</option>
                  <option value="cliente_existente">Cliente existente</option>
                </select>
              </div>

              <div className="form-group">
                <label>Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                  <option value="invitado">Invitado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Estado</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <label htmlFor="isActive" className="toggle-label">
                    {isActive ? "✅ Activo" : "❌ Inactivo"}
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "client" && (
            <div className="modal-form">
              <div className="form-group">
                <label>Nombre de empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nombre de la empresa"
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Teléfono de contacto"
                />
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dirección"
                />
              </div>

              <div className="form-group">
                <label>Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales sobre el cliente"
                  rows={4}
                />
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="save-button">
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente para sección de FAQs
interface FAQsSectionProps {
  faqs: FAQResponse[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (faq: FAQResponse) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

function FAQsSection({
  faqs,
  loading,
  onCreate,
  onEdit,
  onDelete,
  onRefresh,
}: FAQsSectionProps) {
  return (
    <div className="faqs-section">
      <div className="section-header">
        <h3>Respuestas Frecuentes</h3>
        <button onClick={onCreate} className="create-button">
          ➕ Nueva Respuesta
        </button>
      </div>

      {loading && faqs.length === 0 ? (
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Cargando respuestas frecuentes...</p>
        </div>
      ) : (
        <div className="faqs-list">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className={`faq-card ${!faq.is_active ? "inactive" : ""}`}
            >
              <div className="faq-header">
                <div>
                  <h4>{faq.question}</h4>
                  <div className="faq-meta">
                    <span className="faq-category">{faq.category}</span>
                    <span className="faq-priority">
                      Prioridad: {faq.priority}
                    </span>
                    {faq.usage_count > 0 && (
                      <span className="faq-usage">
                        Usada {faq.usage_count} veces
                      </span>
                    )}
                    {!faq.is_active && (
                      <span className="faq-inactive-badge">Inactiva</span>
                    )}
                  </div>
                </div>
                <div className="faq-actions">
                  <button
                    onClick={() => onEdit(faq)}
                    className="edit-button-small"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDelete(faq.id)}
                    className="delete-button-small"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
              {faq.triggers.length > 0 && (
                <div className="faq-triggers">
                  <strong>Palabras clave:</strong>
                  {faq.triggers.map((trigger, idx) => (
                    <span key={idx} className="trigger-tag">
                      {trigger}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {faqs.length === 0 && !loading && (
            <div className="empty-state">
              <p>No hay respuestas frecuentes. Crea una nueva para comenzar.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para sección de datos de empresa
interface CompanyInfoSectionProps {
  companyInfo: CompanyInfo | null;
  loading: boolean;
  saving: boolean;
  onSave: (updates: Partial<CompanyInfo>) => Promise<void>;
}

function CompanyInfoSection({
  companyInfo,
  loading,
  saving,
  onSave,
}: CompanyInfoSectionProps) {
  const [formData, setFormData] = useState({
    company_name: "",
    phone: "",
    email: "",
    address: "",
    website: "",
    business_hours: "",
    description: "",
  });

  useEffect(() => {
    if (companyInfo) {
      setFormData({
        company_name: companyInfo.company_name || "",
        phone: companyInfo.phone || "",
        email: companyInfo.email || "",
        address: companyInfo.address || "",
        website: companyInfo.website || "",
        business_hours: companyInfo.business_hours || "",
        description: companyInfo.description || "",
      });
    }
  }, [companyInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner-large"></div>
        <p>Cargando datos de la empresa...</p>
      </div>
    );
  }

  return (
    <div className="company-info-section">
      <div className="section-header">
        <h3>Datos Básicos de la Empresa</h3>
        <p className="section-description">
          Esta información se usará en las respuestas del chatbot
        </p>
      </div>

      <form onSubmit={handleSubmit} className="company-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Nombre de la Empresa *</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) =>
                setFormData({ ...formData, company_name: e.target.value })
              }
              placeholder="MTZ Contabilidad"
              required
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+52 123 456 7890"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="contacto@mtzcontabilidad.com"
            />
          </div>

          <div className="form-group">
            <label>Sitio Web</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              placeholder="https://www.mtzcontabilidad.com"
            />
          </div>

          <div className="form-group full-width">
            <label>Dirección</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Calle, número, colonia, ciudad, estado"
            />
          </div>

          <div className="form-group full-width">
            <label>Horarios de Atención</label>
            <input
              type="text"
              value={formData.business_hours}
              onChange={(e) =>
                setFormData({ ...formData, business_hours: e.target.value })
              }
              placeholder="Lunes a Viernes: 9:00 AM - 6:00 PM"
            />
          </div>

          <div className="form-group full-width">
            <label>Descripción de la Empresa</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Breve descripción de los servicios que ofrece la empresa..."
              rows={4}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving} className="save-button">
            {saving ? "Guardando..." : "💾 Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Modal para crear/editar FAQ
interface FAQModalProps {
  faq: FAQResponse | null;
  onClose: () => void;
  onSave: (
    faqData: Omit<
      FAQResponse,
      "id" | "created_at" | "updated_at" | "usage_count"
    >
  ) => Promise<void>;
}

function FAQModal({ faq, onClose, onSave }: FAQModalProps) {
  const [question, setQuestion] = useState(faq?.question || "");
  const [answer, setAnswer] = useState(faq?.answer || "");
  const [triggers, setTriggers] = useState<string>(
    faq?.triggers.join(", ") || ""
  );
  const [category, setCategory] = useState(faq?.category || "general");
  const [priority, setPriority] = useState(faq?.priority || 5);
  const [isActive, setIsActive] = useState(faq?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const triggersArray = triggers
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onSave({
        question,
        answer,
        triggers: triggersArray,
        category,
        priority,
        is_active: isActive,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {faq ? "Editar Respuesta Frecuente" : "Nueva Respuesta Frecuente"}
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-form">
            <div className="form-group">
              <label>Pregunta *</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="¿Qué servicios ofrecen?"
                required
              />
            </div>

            <div className="form-group">
              <label>Respuesta *</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Ofrecemos servicios de contabilidad y asesoría..."
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label>Palabras Clave (separadas por comas)</label>
              <input
                type="text"
                value={triggers}
                onChange={(e) => setTriggers(e.target.value)}
                placeholder="servicio, servicios, qué ofrecen"
              />
              <small>
                Estas palabras activarán esta respuesta cuando el usuario las
                mencione
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="servicios">Servicios</option>
                  <option value="contacto">Contacto</option>
                  <option value="precios">Precios</option>
                  <option value="proceso">Proceso</option>
                </select>
              </div>

              <div className="form-group">
                <label>Prioridad (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 5)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Respuesta activa</span>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="save-button">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para crear/editar documento
interface DocumentModalProps {
  document: any | null;
  users: UserWithClientInfo[];
  onClose: () => void;
  onSave: (documentData: DocumentInput) => Promise<void>;
}

function DocumentModal({
  document,
  users,
  onClose,
  onSave,
}: DocumentModalProps) {
  const [userId, setUserId] = useState(document?.user_id || "");
  const [documentType, setDocumentType] = useState(
    document?.document_type || "iva"
  );
  const [documentName, setDocumentName] = useState(
    document?.document_name || ""
  );
  const [period, setPeriod] = useState(document?.period || "");
  const [year, setYear] = useState(document?.year || new Date().getFullYear());
  const [month, setMonth] = useState(
    document?.month || new Date().getMonth() + 1
  );
  const [fileUrl, setFileUrl] = useState(document?.file_url || "");
  const [downloadUrl, setDownloadUrl] = useState(document?.download_url || "");
  const [googleScriptUrl, setGoogleScriptUrl] = useState(
    document?.google_script_url || ""
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Debes seleccionar un cliente");
      return;
    }

    setSaving(true);
    try {
      const documentData: DocumentInput = {
        user_id: userId,
        document_type: documentType as any,
        document_name: documentName,
        period: period || undefined,
        year: year || undefined,
        month: month || undefined,
        file_url: fileUrl || undefined,
        download_url: downloadUrl || undefined,
        google_script_url: googleScriptUrl || undefined,
      };

      await onSave(documentData);
    } catch (err: any) {
      alert(`Error: ${err.message || "Error desconocido"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{document ? "Editar Documento" : "Nuevo Documento"}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-form">
            <div className="form-group">
              <label>Cliente *</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                disabled={!!document}
              >
                <option value="">Selecciona un cliente</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email} {user.full_name ? `(${user.full_name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tipo de Documento *</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  required
                >
                  <option value="iva">IVA</option>
                  <option value="erut">E-RUT</option>
                  <option value="factura">Factura</option>
                  <option value="boleta">Boleta</option>
                  <option value="declaracion">Declaración</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nombre del Documento *</label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Ej: IVA Enero 2024"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Período (YYYY-MM)</label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="2024-01"
                  pattern="\d{4}-\d{2}"
                />
                <small>O usa año y mes por separado</small>
              </div>

              <div className="form-group">
                <label>Año</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) =>
                    setYear(
                      parseInt(e.target.value) || new Date().getFullYear()
                    )
                  }
                  min="2000"
                  max="2100"
                />
              </div>

              <div className="form-group">
                <label>Mes</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                >
                  <option value="">-</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label>URL del Archivo</label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="form-group full-width">
              <label>URL de Descarga Directa</label>
              <input
                type="url"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="form-group full-width">
              <label>URL de Google Script</label>
              <input
                type="url"
                value={googleScriptUrl}
                onChange={(e) => setGoogleScriptUrl(e.target.value)}
                placeholder="https://script.google.com/..."
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="save-button">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente para sección de reuniones
interface MeetingsSectionProps {
  meetings: Meeting[];
  loading: boolean;
  filter: string;
  onFilterChange: (filter: string) => void;
  onStatusChange: (meetingId: string, status: string, notes?: string) => Promise<void>;
}

function MeetingsSection({
  meetings,
  loading,
  filter,
  onFilterChange,
  onStatusChange,
}: MeetingsSectionProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const filteredMeetings = meetings.filter((meeting) => {
    if (filter === "all") return true;
    return meeting.status === filter;
  });

  const handleAction = async () => {
    if (!selectedMeeting) return;

    setProcessing(true);
    try {
      await onStatusChange(
        selectedMeeting.id,
        actionType === "approve" ? "approved" : "rejected",
        adminNotes || undefined
      );
      setShowActionModal(false);
      setSelectedMeeting(null);
      setAdminNotes("");
    } catch (err) {
      console.error("Error al procesar acción:", err);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { text: string; class: string }> = {
      pending: { text: "⏳ Pendiente", class: "status-pending" },
      approved: { text: "✅ Aprobada", class: "status-approved" },
      rejected: { text: "❌ Rechazada", class: "status-rejected" },
      cancelled: { text: "🚫 Cancelada", class: "status-cancelled" },
      completed: { text: "✓ Completada", class: "status-completed" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>{config.text}</span>
    );
  };

  const pendingCount = meetings.filter((m) => m.status === "pending").length;

  return (
    <div className="meetings-section">
      <div className="section-header">
        <div>
          <h3>📅 Gestión de Reuniones</h3>
          {pendingCount > 0 && (
            <span className="pending-badge">
              {pendingCount} {pendingCount === 1 ? "reunión pendiente" : "reuniones pendientes"}
            </span>
          )}
        </div>
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">Todas las reuniones</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="rejected">Rechazadas</option>
          <option value="cancelled">Canceladas</option>
          <option value="completed">Completadas</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Cargando reuniones...</p>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="empty-state">
          <p>No hay reuniones con el filtro seleccionado</p>
        </div>
      ) : (
        <div className="meetings-admin-list">
          {filteredMeetings.map((meeting) => (
            <div key={meeting.id} className="meeting-admin-card">
              <div className="meeting-admin-header">
                <div>
                  <h4>{meeting.title}</h4>
                  <div className="meeting-admin-meta">
                    <span>
                      <strong>Usuario:</strong> {meeting.user_email || meeting.user_id}
                      {meeting.user_full_name && ` (${meeting.user_full_name})`}
                    </span>
                    {meeting.company_name && (
                      <span>
                        <strong>Empresa:</strong> {meeting.company_name}
                        {meeting.client_phone && ` - Tel: ${meeting.client_phone}`}
                      </span>
                    )}
                    <span>
                      <strong>Solicitada:</strong> {formatDate(meeting.created_at)}
                    </span>
                  </div>
                </div>
                {getStatusBadge(meeting.status)}
              </div>

              {meeting.description && (
                <p className="meeting-description">{meeting.description}</p>
              )}

              <div className="meeting-admin-details">
                <div className="meeting-detail">
                  <strong>📅 Fecha y hora:</strong>
                  <span>{formatDate(meeting.meeting_date)}</span>
                </div>
                <div className="meeting-detail">
                  <strong>⏱️ Duración:</strong>
                  <span>{meeting.duration_minutes} minutos</span>
                </div>
                {meeting.admin_notes && (
                  <div className="meeting-detail">
                    <strong>💬 Notas:</strong>
                    <span>{meeting.admin_notes}</span>
                  </div>
                )}
                {meeting.approved_at && (
                  <div className="meeting-detail">
                    <strong>✅ Aprobada:</strong>
                    <span>{formatDate(meeting.approved_at)}</span>
                  </div>
                )}
              </div>

              {meeting.status === "pending" && (
                <div className="meeting-admin-actions">
                  <button
                    onClick={() => {
                      setSelectedMeeting(meeting);
                      setActionType("approve");
                      setShowActionModal(true);
                    }}
                    className="btn-approve"
                  >
                    ✅ Aprobar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMeeting(meeting);
                      setActionType("reject");
                      setShowActionModal(true);
                    }}
                    className="btn-reject"
                  >
                    ❌ Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal para aprobar/rechazar */}
      {showActionModal && selectedMeeting && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {actionType === "approve" ? "Aprobar Reunión" : "Rechazar Reunión"}
              </h3>
              <button className="modal-close" onClick={() => setShowActionModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-form">
              <div className="form-group">
                <label>
                  {actionType === "approve"
                    ? "Notas (opcional)"
                    : "Motivo del rechazo (opcional)"}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "Agrega notas adicionales sobre esta reunión..."
                      : "Explica el motivo del rechazo..."
                  }
                  rows={4}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedMeeting(null);
                    setAdminNotes("");
                  }}
                  className="cancel-button"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAction}
                  disabled={processing}
                  className={actionType === "approve" ? "save-button" : "delete-button"}
                >
                  {processing
                    ? "Procesando..."
                    : actionType === "approve"
                    ? "Aprobar"
                    : "Rechazar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sección de Requerimientos
interface RequestsSectionProps {
  users: UserWithClientInfo[];
  meetings: any[];
  onUserClick: (user: UserWithClientInfo) => void;
}

function RequestsSection({ users, meetings, onUserClick }: RequestsSectionProps) {
  // Reuniones pendientes
  const pendingMeetings = meetings.filter(m => m.status === 'pending');
  
  // Usuarios inactivos
  const inactiveUsers = users.filter(u => u.is_active === false);
  
  // Usuarios sin información completa o con notas/solicitudes
  const incompleteUsers = users.filter(u => {
    const hasIncompleteData = !u.client_info?.company_name && 
                             !u.client_info?.phone && 
                             u.user_type !== 'invitado';
    const hasNotes = u.client_info?.notes && u.client_info.notes.trim() !== '';
    return hasIncompleteData || hasNotes;
  });

  return (
    <div className="requests-section">
      <div className="requests-grid">
        {/* Reuniones pendientes */}
        <div className="request-card">
          <div className="request-header">
            <h3>📅 Reuniones Pendientes</h3>
            <span className="request-count">{pendingMeetings.length}</span>
          </div>
          {pendingMeetings.length === 0 ? (
            <p className="no-requests">No hay reuniones pendientes</p>
          ) : (
            <div className="request-list">
              {pendingMeetings.slice(0, 5).map((meeting) => {
                const user = users.find(u => u.id === meeting.user_id);
                return (
                  <div key={meeting.id} className="request-item">
                    <div className="request-info">
                      <strong>{meeting.title}</strong>
                      <p>{user?.email || 'Usuario desconocido'}</p>
                      <small>{new Date(meeting.meeting_date).toLocaleDateString('es-CL')}</small>
                    </div>
                    <button
                      onClick={() => user && onUserClick(user)}
                      className="view-button"
                      disabled={!user}
                    >
                      Ver
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Usuarios inactivos */}
        <div className="request-card">
          <div className="request-header">
            <h3>❌ Usuarios Inactivos</h3>
            <span className="request-count">{inactiveUsers.length}</span>
          </div>
          {inactiveUsers.length === 0 ? (
            <p className="no-requests">Todos los usuarios están activos</p>
          ) : (
            <div className="request-list">
              {inactiveUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="request-item">
                  <div className="request-info">
                    <strong>{user.full_name || user.email}</strong>
                    <p>{user.email}</p>
                    <small>Último acceso: {user.last_login ? new Date(user.last_login).toLocaleDateString('es-CL') : 'Nunca'}</small>
                  </div>
                  <button
                    onClick={() => onUserClick(user)}
                    className="view-button"
                  >
                    Ver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usuarios con información incompleta */}
        <div className="request-card">
          <div className="request-header">
            <h3>⚠️ Información Incompleta</h3>
            <span className="request-count">{incompleteUsers.length}</span>
          </div>
          {incompleteUsers.length === 0 ? (
            <p className="no-requests">Todos los usuarios tienen información completa</p>
          ) : (
            <div className="request-list">
              {incompleteUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="request-item">
                  <div className="request-info">
                    <strong>{user.full_name || user.email}</strong>
                    <p>{user.email}</p>
                    <small>Falta: {!user.client_info?.company_name && 'Empresa'} {!user.client_info?.phone && 'Teléfono'}</small>
                  </div>
                  <button
                    onClick={() => onUserClick(user)}
                    className="view-button"
                  >
                    Completar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
