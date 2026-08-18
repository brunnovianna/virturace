import { Route, Routes } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import RequireAuth from './components/RequireAuth';
import Login from './pages/Login';
import EventList from './pages/EventList';
import EventCreate from './pages/EventCreate';
import EventDetail from './pages/EventDetail';
import MyMedals from './pages/MyMedals';

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <EventList />
            </RequireAuth>
          }
        />
        <Route
          path="/criar"
          element={
            <RequireAuth>
              <EventCreate />
            </RequireAuth>
          }
        />
        <Route
          path="/corrida/:id"
          element={
            <RequireAuth>
              <EventDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/medalhas"
          element={
            <RequireAuth>
              <MyMedals />
            </RequireAuth>
          }
        />
      </Routes>
      <BottomNav />
    </div>
  );
}
