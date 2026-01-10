import { configureStore } from '@reduxjs/toolkit';
import hackathonReducer from '../features/hackathon/hackathonSlice';

export const store = configureStore({
    reducer: {
        hackathon: hackathonReducer,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
