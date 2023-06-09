import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';
import userReducer from '../features/user/userSlice';
import notificationReducer from '../features/notification/notificationSlice';
import complaintWindowReducer from '../features/complaintWindow/complaintWindowSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user:userReducer,
    notification: notificationReducer,
    complaintWindow: complaintWindowReducer
  },
});

// export const configureStoreAsync = () =>{
//   return new Promise((resolve, reject) => {
//     fetch('/state')
//     .then(r=>r.json())
//     .then(preloadedState=>{
//       const options = {
//         reducer 
//       }
//     })
// }

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
