import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Main from './pages/Main';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { fetchUser, selectUser, selectUserStatus } from './features/user/userSlice';
import SignIn from './pages/SignIn';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import EmailConfirm from './pages/EmailConfirm';
import AdminPanel from './pages/AdminPanel';
import AdminComplaints from './pages/AdminComplaints';
import AdminComplaintsId from './pages/AdminComplaintsId';

function App() {

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const userStatus = useAppSelector(selectUserStatus);

  useEffect(()=>{
      dispatch(fetchUser());
  },[])

  useEffect(()=>{
    if(window.location.pathname.includes("admin") && user.info?.role!==1 && userStatus!=="loading"){
      window.location.assign('/');
    }
  },[user,userStatus]);

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="" element={<Main />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="chat" element={<Chat />} />
        <Route path="profile" element={<Profile />} />
        <Route path="email-confirm" element={<EmailConfirm />} />
      </Route>
      <Route path="/admin/" element={<MainLayout />}>
        <Route path="" element={<AdminPanel />} />
        <Route path="complaints/:id" element={<AdminComplaintsId />} />
        <Route path="complaints" element={<AdminComplaints />} />
      </Route>
    </Routes>
  );
}

export default App;
