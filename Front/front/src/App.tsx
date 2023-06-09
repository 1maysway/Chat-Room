import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Main from './pages/Main';
import { useAppDispatch } from './app/hooks';
import { fetchUser } from './features/user/userSlice';
import SignIn from './pages/SignIn';
import Chat from './pages/Chat';

function App() {

  const dispatch = useAppDispatch();

  useEffect(()=>{
      dispatch(fetchUser());
  },[])

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="" element={<Main />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="chat" element={<Chat />} />
      </Route>
    </Routes>
  );
}

export default App;
