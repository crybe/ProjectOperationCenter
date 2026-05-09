import { lazy, Suspense, useEffect, Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import UpdateBanner from './components/UpdateBanner';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    // If it's a chunk loading error, try to reload the page once
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center">
          <div className="text-red-500 font-black uppercase tracking-[0.5em] mb-4 text-xl">System_Failure</div>
          <div className="text-red-900/60 font-mono text-[10px] mb-8 uppercase">Tactical link lost or module corruption detected</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 border border-red-500/30 text-red-500 text-[10px] uppercase tracking-[0.3em] hover:bg-red-500/10 transition-all"
          >
            Re-Initialize_System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ShinraDashboard = lazy(() => import('./pages/ShinraDashboard'));
const Growbox = lazy(() => import('./pages/Growbox'));
const Board = lazy(() => import('./pages/Board'));
const VPanel = lazy(() => import('./pages/VPanel'));
const Services = lazy(() => import('./pages/Services'));
const Cmd = lazy(() => import('./pages/Cmd'));
const BotMonitor = lazy(() => import('./pages/BotMonitor'));
const NetWatch = lazy(() => import('./pages/NetWatch'));
const MobileApp = lazy(() => import('./mobile/MobileApp'));
const OsintHub = lazy(() => import('./pages/OsintHub'));
const CipherStream = lazy(() => import('./pages/CipherStream'));
const DarkPool = lazy(() => import('./pages/DarkPool'));
const Codex = lazy(() => import('./pages/Codex'));
const Sentinel = lazy(() => import('./pages/Sentinel'));
const StorageMatrix = lazy(() => import('./pages/StorageMatrix'));
const ShinraAdmin = lazy(() => import('./pages/ShinraAdmin'));
const CVEReport = lazy(() => import('./pages/CVEReport'));
const Notes = lazy(() => import('./pages/Notes'));
const PigeonLog = lazy(() => import('./pages/PigeonLog'));
const SystemMap = lazy(() => import('./pages/SystemMap'));
const FixerHub = lazy(() => import('./pages/FixerHub'));


function ExternalLoginRedirect() {
  useEffect(() => {
    window.location.replace('/login');
  }, []);
  return null;
}

function RouteFallback() {
  return (
    <div className="min-h-[45vh] flex items-center justify-center text-[10px] font-black uppercase tracking-[0.35em] text-emerald-500/70">
      Loading Tactical Module
    </div>
  );
}

function App() {
  return (
    <>
      <UpdateBanner />
      <ErrorBoundary>
        <BrowserRouter basename="/ui">
          <Routes>
            <Route path="/login" element={<ExternalLoginRedirect />} />
            <Route path="/mobile" element={<Suspense fallback={<RouteFallback />}><MobileApp /></Suspense>} />
            <Route element={<Layout />}>
              <Route path="/" element={<Suspense fallback={<RouteFallback />}><ShinraDashboard /></Suspense>} />
              <Route path="/board" element={<Suspense fallback={<RouteFallback />}><Board /></Suspense>} />
              <Route path="/vpanel" element={<Suspense fallback={<RouteFallback />}><VPanel /></Suspense>} />
              <Route path="/services" element={<Suspense fallback={<RouteFallback />}><Services /></Suspense>} />
              <Route path="/growbox" element={<Suspense fallback={<RouteFallback />}><Growbox /></Suspense>} />
              <Route path="/n8n" element={<Suspense fallback={<RouteFallback />}><BotMonitor /></Suspense>} />
              <Route path="/cmd" element={<Suspense fallback={<RouteFallback />}><Cmd /></Suspense>} />
              <Route path="/netwatch" element={<Suspense fallback={<RouteFallback />}><NetWatch /></Suspense>} />
              <Route path="/osint" element={<Suspense fallback={<RouteFallback />}><OsintHub /></Suspense>} />
              <Route path="/cipher" element={<Suspense fallback={<RouteFallback />}><CipherStream /></Suspense>} />
              <Route path="/darkpool" element={<Suspense fallback={<RouteFallback />}><DarkPool /></Suspense>} />
              <Route path="/codex" element={<Suspense fallback={<RouteFallback />}><Codex /></Suspense>} />
              <Route path="/sentinel" element={<Suspense fallback={<RouteFallback />}><Sentinel /></Suspense>} />
              <Route path="/storage" element={<Suspense fallback={<RouteFallback />}><StorageMatrix /></Suspense>} />
              <Route path="/admin" element={<Suspense fallback={<RouteFallback />}><ShinraAdmin /></Suspense>} />
              <Route path="/cve" element={<Suspense fallback={<RouteFallback />}><CVEReport /></Suspense>} />
              <Route path="/notes" element={<Suspense fallback={<RouteFallback />}><Notes /></Suspense>} />
              <Route path="/pigeon" element={<Suspense fallback={<RouteFallback />}><PigeonLog /></Suspense>} />
              <Route path="/blueprint" element={<Suspense fallback={<RouteFallback />}><SystemMap /></Suspense>} />
              <Route path="/fixer" element={<Suspense fallback={<RouteFallback />}><FixerHub /></Suspense>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </>
  );
}

export default App;
