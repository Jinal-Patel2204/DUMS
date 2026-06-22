import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  sidebarMobileOpen: boolean;
}

const initialState: UiState = {
  sidebarOpen: true,
  sidebarMobileOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleMobileSidebar(state) {
      state.sidebarMobileOpen = !state.sidebarMobileOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { toggleSidebar, toggleMobileSidebar, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;
