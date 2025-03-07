'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useRouter } from 'next/navigation';
import { Profile } from './supabase';

type AuthContextType = {
  user: any | null;
  profile: Profile | null;
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  loading: boolean;
  isCompanyAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signOut: async () => ({}),
  loading: true,
  isCompanyAdmin: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const router = useRouter();

  const fetchUserProfile = async (userId: string) => {
    try {
      // Try to fetch existing profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profileData) {
        // If profile doesn't exist, create one
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                email: userData.user.email,
                full_name: userData.user.user_metadata?.full_name || 'Anonymous User',
                anonymous_name: `Anonymous${Math.floor(Math.random() * 10000)}`,
              },
            ])
            .select()
            .single();

          return newProfile;
        }
      }

      return profileData;
    } catch (error) {
      console.error('Error fetching/creating profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        const profileData = await fetchUserProfile(session.user.id);
        setProfile(profileData);

        // Check if user is a company admin
        const { data: companyData } = await supabase
          .from('companies')
          .select('id')
          .eq('admin_id', session.user.id);

        setIsCompanyAdmin(companyData && companyData.length > 0);
      }

      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);

        if (session?.user) {
          const profileData = await fetchUserProfile(session.user.id);
          setProfile(profileData);

          // Check if user is a company admin
          const { data: companyData } = await supabase
            .from('companies')
            .select('id')
            .eq('admin_id', session.user.id);

          setIsCompanyAdmin(companyData && companyData.length > 0);
        } else {
          setProfile(null);
          setIsCompanyAdmin(false);
        }

        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        signUp,
        signIn,
        signOut,
        loading,
        isCompanyAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);