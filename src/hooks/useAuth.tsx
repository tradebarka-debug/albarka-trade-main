import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isTransportPDG: boolean;
  organizationRoleCode: string | null;
  organizationRoleName: string | null;
  permissionCodes: string[];
  isInternalOrganization: boolean;
  canAccessAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

type AuthDetails = {
  isAdmin: boolean;
  isTransportPDG: boolean;
  organizationRoleCode: string | null;
  organizationRoleName: string | null;
  permissionCodes: string[];
  isInternalOrganization: boolean;
};

const businessRoles = new Set(['admin', 'restaurant', 'alimentaire', 'livreur']);
const managementRoleCodes = new Set([
  'general_management',
  'directeur_general',
  'directeur_generale',
  'pdg',
  'president',
  'ceo',
  'direction_general',
]);

const rolePermissionDefaults: Record<string, string[]> = {
  general_management: ['access_admin', 'create_users', 'manage_team_accounts', 'view_team_overview', 'review_partners', 'manage_commercial_content', 'manage_operations', 'view_sales_reports'],
  directeur_general: ['access_admin', 'create_users', 'manage_team_accounts', 'view_team_overview', 'review_partners', 'manage_commercial_content', 'manage_operations', 'view_sales_reports'],
  directeur_generale: ['access_admin', 'create_users', 'manage_team_accounts', 'view_team_overview', 'review_partners', 'manage_commercial_content', 'manage_operations', 'view_sales_reports'],
  directeur_marketing: ['access_admin', 'manage_commercial_content', 'view_sales_reports'],
  direction_marketing: ['access_admin', 'manage_commercial_content', 'view_sales_reports'],
  directeur_commercial: ['access_admin', 'manage_team_accounts', 'review_partners', 'view_sales_reports'],
  direction_commerciale: ['access_admin', 'manage_team_accounts', 'review_partners', 'view_sales_reports'],
  responsable_commercial: ['access_admin', 'manage_team_accounts', 'review_partners', 'view_sales_reports'],
  commercial_manager: ['access_admin', 'manage_team_accounts', 'review_partners', 'view_sales_reports'],
  agent_commercial: ['access_admin', 'create_partners'],
  agent_commerciale: ['access_admin', 'create_partners'],
  commercial_agent: ['access_admin', 'create_partners'],
  sales_agent: ['access_admin', 'create_partners'],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTransportPDG, setIsTransportPDG] = useState(false);
  const [organizationRoleCode, setOrganizationRoleCode] = useState<string | null>(null);
  const [organizationRoleName, setOrganizationRoleName] = useState<string | null>(null);
  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [isInternalOrganization, setIsInternalOrganization] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthDetails = () => {
    setIsAdmin(false);
    setIsTransportPDG(false);
    setOrganizationRoleCode(null);
    setOrganizationRoleName(null);
    setPermissionCodes([]);
    setIsInternalOrganization(false);
  };

  const loadAuthDetails = async (userId: string): Promise<AuthDetails> => {
    const [{ data: roles, error: rolesError }, { data: profile, error: profileError }, authContextResult] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId),
      (supabase as any)
        .from('profiles')
        .select('role, nom, email, organization_id, organization_role_id')
        .eq('id', userId)
        .maybeSingle(),
      supabase.functions.invoke('manage-users', {
        body: { action: 'auth_context' },
      }),
    ]);

    if (rolesError) console.error('Error checking user roles:', rolesError);
    if (profileError) console.error('Error checking user profile:', profileError);

    const profileRole = profile?.role ?? null;
    const contextData = authContextResult?.data as any;
    const contextError = authContextResult?.error;

    if (contextError) {
      console.error('Error loading auth context from manage-users:', contextError);
    }

    const organizationRoleCode = contextData?.organization_role_code ?? null;
    const organizationRoleName = contextData?.organization_role_name ?? null;
    const effectiveRoleCode = organizationRoleCode ?? profileRole;
    const normalizedRoleCode = String(effectiveRoleCode ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ -]+/g, '_');
    // Le code de poste (ceo/pdg/...) est réutilisé par chaque organisation
    // partenaire : seul le serveur (manage-users) sait si l'utilisateur
    // appartient réellement à l'organisation Albarka Trade et peut donc
    // confirmer un vrai rôle de direction interne.
    const isManagement = Boolean(contextData?.is_management_role);
    const hasManagedRoles = Boolean(contextData?.has_managed_roles);
    const { data: assignedPermissions, error: assignedPermissionsError } = await (supabase as any)
      .from('role_permissions')
      .select('permissions(code)')
      .eq('organization_role_id', profile?.organization_role_id ?? -1);

    if (assignedPermissionsError) {
      console.error('Error checking organization permissions:', assignedPermissionsError);
    }

    const permissions = new Set<string>(
      (contextData?.permission_codes ?? []).filter(Boolean)
    );

    (assignedPermissions ?? [])
      .map((item: any) => item.permissions?.code)
      .filter(Boolean)
      .forEach((permission: string) => permissions.add(permission));

    if (businessRoles.has(profileRole ?? '') || isManagement || hasManagedRoles) {
      permissions.add('access_admin');
    }

    if (isManagement || hasManagedRoles) {
      permissions.add('create_users');
      permissions.add('manage_team_accounts');
    }

    // Ces codes de poste (ex: "agent_commercial") correspondent a
    // l'organigramme interne Albarka Trade : ne les appliquer que si le
    // serveur confirme que le compte appartient bien a Albarka Trade
    // (et non a une organisation partenaire qui reutiliserait le meme code).
    if (contextData?.is_internal_organization) {
      (rolePermissionDefaults[normalizedRoleCode] ?? []).forEach((permission) => {
        permissions.add(permission);
      });
    }

    return {
      isAdmin:
        roles?.some((item) => item.role === 'admin') ||
        profileRole === 'admin' ||
        Boolean(contextData?.is_system_admin) ||
        isManagement ||
        false,
      isTransportPDG:
        roles?.some((item) => item.role === 'transport_pdg') ||
        isManagement,
      organizationRoleCode: organizationRoleCode ?? (profileRole === 'admin' ? 'admin' : null),
      organizationRoleName: organizationRoleName ?? (profileRole === 'admin' ? 'Admin' : null),
      permissionCodes: [...permissions],
      isInternalOrganization: Boolean(contextData?.is_internal_organization) || profileRole === 'admin',
    };
  };

  const applyAuthDetails = (details: AuthDetails) => {
    setIsAdmin(details.isAdmin);
    setIsTransportPDG(details.isTransportPDG);
    setOrganizationRoleCode(details.organizationRoleCode);
    setOrganizationRoleName(details.organizationRoleName);
    setPermissionCodes(details.permissionCodes);
    setIsInternalOrganization(details.isInternalOrganization);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        clearAuthDetails();
        setIsLoading(false);
        return;
      }

      setTimeout(() => {
        void loadAuthDetails(nextSession.user.id)
          .then(applyAuthDetails)
          .catch((error) => console.error('Error loading auth details:', error))
          .finally(() => setIsLoading(false));
      }, 0);
    });

    void supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (!currentSession?.user) {
          clearAuthDetails();
          return;
        }
        return loadAuthDetails(currentSession.user.id).then(applyAuthDetails);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        clearAuthDetails();
      })
      .finally(() => setIsLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    clearAuthDetails();
  };

  const hasPermission = (permission: string) => isAdmin || permissionCodes.includes(permission);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isTransportPDG,
        organizationRoleCode,
        organizationRoleName,
        permissionCodes,
        isInternalOrganization,
        // Un poste organisationnel ne donne acces a l'admin interne que s'il
        // appartient a l'organisation Albarka Trade elle-meme : un PDG/employe
        // d'une organisation partenaire (fournisseur/restaurant/usine) est
        // exclu meme s'il a un organizationRoleCode ou des permissions.
        canAccessAdmin: isAdmin || isTransportPDG || (isInternalOrganization && Boolean(organizationRoleCode)) || permissionCodes.includes('access_admin'),
        hasPermission,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
