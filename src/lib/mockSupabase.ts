export const mockSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: {}, error: new Error('Mock: Authentication disabled') }),
    signUp: async () => ({ data: {}, error: new Error('Mock: Authentication disabled') }),
    signOut: async () => ({ error: null }),
    updateUser: async () => ({ data: {}, error: null })
  },
  from: (table: string) => {
    const chain = {
      select: () => chain,
      insert: () => chain,
      upsert: () => chain,
      delete: () => chain,
      update: () => chain,
      eq: () => chain,
      neq: () => chain,
      gt: () => chain,
      gte: () => chain,
      lt: () => chain,
      lte: () => chain,
      match: () => chain,
      ilike: () => chain,
      order: () => chain,
      single: async () => ({ data: null, error: null }),
      or: () => chain,
      limit: () => chain,
      then: (resolve: any) => resolve({ data: [], error: null })
    };
    return chain as any;
  },
  storage: {
    from: () => ({
      upload: async () => ({ data: {}, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
};
// In-memory mock for Supabase to allow the app to run without credentials
