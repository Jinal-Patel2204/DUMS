import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile, Store } from '@/types/database';

interface AuthState {
  user: UserProfile | null;
  currentStore: Store | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  currentStore: null,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserProfile | null>) {
      state.user = action.payload;
      state.isLoading = false;
    },
    setCurrentStore(state, action: PayloadAction<Store | null>) {
      state.currentStore = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    logout(state) {
      state.user = null;
      state.currentStore = null;
    },
  },
});

export const { setUser, setCurrentStore, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
