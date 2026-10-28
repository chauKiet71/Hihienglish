import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { LessonAccessProvider } from './contexts/LessonAccessContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { HistoryProvider } from './contexts/HistoryContext';
import { LevelProvider } from './contexts/LevelContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import ScrollToTop from './components/ScrollToTop';
import AppDataPrefetch from './components/AppDataPrefetch';
import HomePage from './pages/HomePage';
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const GoogleCallbackPage = lazy(() => import('./pages/GoogleCallbackPage'));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminLessonsPage = lazy(() => import('./pages/admin/AdminLessonsPage'));
const AdminPodcastsPage = lazy(() => import('./pages/admin/AdminPodcastsPage'));
const AdminPackagesPage = lazy(() => import('./pages/admin/AdminPackagesPage'));
const AdminTransactionsPage = lazy(
  () => import('./pages/admin/AdminTransactionsPage'),
);
const AdminStatsPage = lazy(() => import('./pages/admin/AdminStatsPage'));
const UpgradePage = lazy(() => import('./pages/UpgradePage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const LevelPage = lazy(() => import('./pages/LevelPage'));
const VocabularyPage = lazy(() => import('./pages/VocabularyPage'));
const VideoTranslatePage = lazy(() => import('./pages/VideoTranslatePage'));
const MyVideosPage = lazy(() => import('./pages/MyVideosPage'));

const ListeningLessonPage = lazy(
  () => import('./features/listening/ListeningLessonPage'),
);
const ChannelPage = lazy(() => import('./features/youtube/ChannelPage'));
const VideoLessonPage = lazy(
  () => import('./features/youtube/VideoLessonPage'),
);
const PodcastPage = lazy(() => import('./features/podcast/PodcastPage'));

function LessonPageRoute() {
  const { id } = useParams<{ id: string }>();
  return <LessonPage key={id} />;
}

export default function App() {
  return (
    <AuthProvider>
      <LessonAccessProvider>
        <ThemeProvider>
          <FavoritesProvider>
            <HistoryProvider>
              <LevelProvider>
                <BrowserRouter>
                  <ScrollToTop />
                  <AppDataPrefetch />
                  <Suspense
                    fallback={
                      <p
                        role="status"
                        className="p-6 text-center text-sm text-gray-500"
                      >
                        Đang mở trang…
                      </p>
                    }
                  >
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route
                        path="/kenh/volka-english"
                        element={
                          <Suspense
                            fallback={<p role="status">Đang mở kênh…</p>}
                          >
                            <ChannelPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path="/kenh/volka-english/video/:videoId"
                        element={
                          <Suspense
                            fallback={<p role="status">Đang mở bài học…</p>}
                          >
                            <VideoLessonPage />
                          </Suspense>
                        }
                      />
                      <Route path="/kham-pha" element={<ExplorePage />} />
                      <Route
                        path="/bai-hoc/:id"
                        element={<LessonPageRoute />}
                      />
                      <Route
                        path="/bai-hoc/:id/luyen-tap"
                        element={
                          <Suspense
                            fallback={<p role="status">Đang mở luyện tập…</p>}
                          >
                            <ListeningLessonPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path="/ca-nhan"
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/lich-su" element={<HistoryPage />} />
                      <Route
                        path="/dang-nhap"
                        element={
                          <GuestRoute>
                            <LoginPage />
                          </GuestRoute>
                        }
                      />
                      <Route
                        path="/dang-ky"
                        element={
                          <GuestRoute>
                            <RegisterPage />
                          </GuestRoute>
                        }
                      />
                      <Route
                        path="/xac-thuc-google"
                        element={
                          <GuestRoute>
                            <GoogleCallbackPage />
                          </GuestRoute>
                        }
                      />
                      <Route
                        path="/quen-mat-khau"
                        element={
                          <GuestRoute>
                            <ForgotPasswordPage />
                          </GuestRoute>
                        }
                      />
                      <Route
                        path="/quen-mat-khau/xac-nhan"
                        element={
                          <GuestRoute>
                            <VerifyOtpPage />
                          </GuestRoute>
                        }
                      />
                      <Route
                        path="/quen-mat-khau/dat-lai"
                        element={
                          <GuestRoute>
                            <ResetPasswordPage />
                          </GuestRoute>
                        }
                      />
                      <Route
                        path="/admin/content/podcasts"
                        element={
                          <ProtectedRoute adminOnly>
                            <AdminPodcastsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/trinh-do" element={<LevelPage />} />
                      <Route path="/tu-vung" element={<VocabularyPage />} />
                      <Route
                        path="/podcast"
                        element={
                          <Suspense
                            fallback={<p role="status">Đang mở Podcast…</p>}
                          >
                            <PodcastPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path="/postcast"
                        element={<Navigate to="/podcast" replace />}
                      />
                      <Route
                        path="/luyen-noi/*"
                        element={<Navigate to="/podcast" replace />}
                      />
                      <Route
                        path="/dich-video"
                        element={<VideoTranslatePage />}
                      />
                      <Route
                        path="/video-cua-toi"
                        element={
                          <ProtectedRoute>
                            <MyVideosPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/nang-cap" element={<UpgradePage />} />
                      <Route
                        path="/nang-cap/thanh-toan"
                        element={<PaymentPage />}
                      />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute adminOnly>
                            <AdminOverviewPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/users"
                        element={
                          <ProtectedRoute adminOnly>
                            <AdminUsersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/content"
                        element={
                          <ProtectedRoute adminOnly>
                            <AdminLessonsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/packages"
                        element={
                          <ProtectedRoute adminOnly>
                            <AdminPackagesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/transactions"
                        element={
                          <ProtectedRoute adminOnly>
                            <AdminTransactionsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/stats"
                        element={
                          <ProtectedRoute adminOnly>
                            <AdminStatsPage />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </LevelProvider>
            </HistoryProvider>
          </FavoritesProvider>
        </ThemeProvider>
      </LessonAccessProvider>
    </AuthProvider>
  );
}
