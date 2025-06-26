export const signInWithPassword = jest.fn().mockResolvedValue({ error: { message: 'Invalid login' } });
export const getUser = jest.fn();
export const maybeSingle = jest.fn().mockResolvedValue({ data: null });

export const supabaseClient = {
  auth: {
    signInWithPassword,
    getUser,
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({ maybeSingle }))
    }))
  }))
};
