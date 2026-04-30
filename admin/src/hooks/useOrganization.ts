import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface Organization {
  org_id: string;
  name: string;
  slug: string;
  owner_id: string;
  role?: string;
  members: any[];
}

export const useOrganization = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(localStorage.getItem('active_org_id'));
  const [loading, setLoading] = useState(true);

  const fetchOrgs = async () => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/orgs`, { withCredentials: true });
      const fetchedOrgs = resp.data;
      setOrganizations(fetchedOrgs);
      
      const currentActive = localStorage.getItem('active_org_id');
      if (!currentActive || currentActive === 'system') {
        const userOrgs = fetchedOrgs.filter((o: any) => o.role === 'owner' || o.role !== 'owner'); // Just get any org they belong to
        if (userOrgs.length > 0) {
          // If they have an org and there's no active org OR it's system (and they might not even be staff),
          // default to their first org.
          localStorage.setItem('active_org_id', userOrgs[0].org_id);
          setActiveOrgId(userOrgs[0].org_id);
        } else if (!currentActive) {
          localStorage.setItem('active_org_id', 'system');
          setActiveOrgId('system');
        }
      }
    } catch (err) {
      console.error("Failed to fetch organizations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const switchOrg = (orgId: string | null) => {
    if (orgId) {
      localStorage.setItem('active_org_id', orgId);
      setActiveOrgId(orgId);
    } else {
      localStorage.setItem('active_org_id', 'system');
      setActiveOrgId('system');
    }
  };

  const isSystem = activeOrgId === 'system';
  const isOrg = !!activeOrgId && activeOrgId !== 'system';

  // determine if current user is OWNER of the active context
  const activeOrgData = organizations.find(o => o.org_id === activeOrgId);
  
  // A user is "owner" if:
  // 1. They are owner of the active org
  // 2. OR they are in the 'system' context (assuming only staff have access to this context via Sidebar)
  const isOwner = isOrg ? (activeOrgData?.role === 'owner') : isSystem;

  return {
    organizations,
    activeOrgId,
    activeOrg: activeOrgData,
    isSystem,
    isOrg,
    isOwner,
    switchOrg,
    loading,
    refreshOrgs: fetchOrgs
  };
};
