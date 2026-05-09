import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  PerspectiveCamera, Stars, Sparkles, 
  PresentationControls, MeshDistortMaterial,
  Torus, Float, Cylinder, Box, Html, TorusKnot
} from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import mascotAerith from '../assets/mascot_aerith.png';

/**
 * GrowCore3D v13 - The Master Core Edition.
 * Hochdetaillierter Reaktor-Block mit Helix-Kern, Metall-Kappen und interner Aura.
 * Synchronisiert mit Lampen-Level und Thermo-Logik.
 */

function MasterReactorBlock({ color, speedMultiplier = 1 }: { color: string, speedMultiplier?: number }) {
  const helixRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (helixRef.current) {
      helixRef.current.rotation.y = t * 0.3 * speedMultiplier;
      helixRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
    }
    if (glowRef.current) {
      (glowRef.current.material as any).opacity = 0.1 + Math.sin(t * 2) * 0.05;
    }
  });

  return (
    <group>
      {/* Obere Metall-Kappe */}
      <mesh position={[0, 4.2, 0]}>
         <cylinderGeometry args={[1.5, 1.3, 0.8, 32]} />
         <meshStandardMaterial color="#080808" metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, 4.6, 0]}>
         <cylinderGeometry args={[0.8, 0.8, 0.4, 32]} />
         <meshStandardMaterial color="#050505" metalness={1} />
      </mesh>

      {/* Untere Metall-Basis */}
      <mesh position={[0, -3.2, 0]}>
         <cylinderGeometry args={[1.3, 1.8, 1.2, 32]} />
         <meshStandardMaterial color="#080808" metalness={1} roughness={0.2} />
      </mesh>

      {/* Haupt-Energiekammer (Glas) */}
      <mesh position={[0, 0.5, 0]}>
         <cylinderGeometry args={[1.2, 1.2, 7, 32, 1, true]} />
         <meshStandardMaterial color={color} transparent opacity={0.1} side={THREE.DoubleSide} metalness={1} roughness={0} />
      </mesh>

      {/* Die Mako-Helix (Kern-Energie) */}
      <group ref={helixRef} position={[0, 0.5, 0]}>
         <TorusKnot args={[0.8, 0.05, 256, 32, 2, 3]}>
            <MeshDistortMaterial 
              color={color} 
              speed={2 * speedMultiplier} 
              distort={0.4} 
              emissive={color} 
              emissiveIntensity={15 * speedMultiplier} 
              transparent 
              opacity={0.8} 
            />
         </TorusKnot>
      </group>

      {/* Internes Kern-Licht (Leuchtet von innen heraus) */}
      <pointLight position={[0, 0.5, 0]} intensity={10 * speedMultiplier} color={color} distance={5} />

      {/* Interne aufsteigende Partikel */}
      <group position={[0, 0.5, 0]}>
         <Sparkles count={100} scale={[1, 7, 1]} size={3} speed={2 * speedMultiplier} color={color} />
      </group>

      {/* Interne Aura */}
      <mesh ref={glowRef} position={[0, 0.5, 0]}>
         <cylinderGeometry args={[1.1, 1.1, 6.8, 32]} />
         <meshBasicMaterial color={color} transparent opacity={0.1} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function ContainmentGimbal({ color, speedMultiplier = 1 }: { color: string, speedMultiplier?: number }) {
  const ring1 = useRef<THREE.Group>(null);
  const ring2 = useRef<THREE.Group>(null);
  const ring3 = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ring1.current) ring1.current.rotation.z = t * 0.1 * speedMultiplier;
    if (ring2.current) ring2.current.rotation.x = t * 0.08 * speedMultiplier;
    if (ring3.current) ring3.current.rotation.y = t * 0.05 * speedMultiplier;
  });

  return (
    <group>
      <group ref={ring1}><Torus args={[6, 0.03, 16, 100]}><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.3} /></Torus></group>
      <group ref={ring2} rotation={[Math.PI/2, 0, 0]}><Torus args={[5, 0.02, 16, 100]}><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.2} /></Torus></group>
      <group ref={ring3} rotation={[0, Math.PI/2, 0]}><Torus args={[4, 0.01, 16, 100]}><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.1} /></Torus></group>
    </group>
  );
}

function PowerCables({ color }: { color: string }) {
  return (
    <group>
       {[...Array(12)].map((_, i) => {
         const angle = (i / 12) * Math.PI * 2;
         const x = Math.cos(angle) * 7.5;
         const z = Math.sin(angle) * 7.5;
         return (
           <group key={i} position={[x, 0, z]}>
              <mesh position={[0, 5, 0]}>
                 <cylinderGeometry args={[0.03, 0.03, 15]} />
                 <meshStandardMaterial color="#050505" metalness={1} roughness={0.5} />
              </mesh>
              <mesh position={[0, 5, 0]}>
                 <cylinderGeometry args={[0.005, 0.005, 15]} />
                 <meshBasicMaterial color={color} transparent opacity={0.1} />
              </mesh>
           </group>
         );
       })}
    </group>
  );
}

function CrystalCluster({ color, speedMultiplier = 1 }: { color: string, speedMultiplier?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05 * speedMultiplier;
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
       <mesh>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.3} />
       </mesh>
    </group>
  );
}

export function GrowCore3D({ metrics }: { metrics: any }) {
  const temp = metrics?.temperature || 24;
  const humidity = metrics?.humidity || 55;
  const lampLevel = metrics?.lampLevel ?? 0;

  const status = useMemo(() => {
    let baseColor = lampLevel === 0 ? '#ef4444' : '#10b981';
    let label = lampLevel === 0 ? 'NIGHT_PHASE_ACTIVE' : 'DAY_PHASE_ACTIVE';
    const intensity = lampLevel === 0 ? 3 : (lampLevel / 10) * 5 + 2;

    if (temp > 35) return { color: '#ef4444', label: 'REACTOR_CRITICAL', speed: 4, intensity: 10 };
    if (temp > 30) return { color: '#f59e0b', label: 'MAKO_OVERFLOW', speed: 2, intensity: 5 };
    
    return { color: baseColor, label: label, speed: lampLevel === 0 ? 0.2 : 0.4 + (lampLevel / 10), intensity: intensity };
  }, [temp, lampLevel]);

  // --- Tactical Phase Timing Logic ---
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const phaseInfo = useMemo(() => {
    const lightOnH = metrics?.light_on_h ?? 5;
    const lightHours = metrics?.light_hours ?? 12;
    
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentTotalM = currentH * 60 + currentM;

    const onStartM = lightOnH * 60;
    const onDurationM = lightHours * 60;
    const onEndM = (onStartM + onDurationM) % 1440;

    let isDay = false;
    if (onStartM < onEndM) {
      isDay = currentTotalM >= onStartM && currentTotalM < onEndM;
    } else {
      isDay = currentTotalM >= onStartM || currentTotalM < onEndM;
    }

    let minutesToSwitch = 0;
    let phaseProgress = 0;

    if (isDay) {
      minutesToSwitch = (onEndM - currentTotalM + 1440) % 1440;
      phaseProgress = 1 - (minutesToSwitch / onDurationM);
    } else {
      const offDurationM = 1440 - onDurationM;
      minutesToSwitch = (onStartM - currentTotalM + 1440) % 1440;
      phaseProgress = 1 - (minutesToSwitch / offDurationM);
    }

    const h = Math.floor(minutesToSwitch / 60);
    const m = minutesToSwitch % 60;
    
    return {
      countdown: `${h}h ${m}m`,
      progress: phaseProgress,
      segments: Math.floor(phaseProgress * 30)
    };
  }, [now, metrics]);

  return (
    <div className="w-full aspect-video min-h-[500px] lg:h-[800px] bg-[#000000] rounded-[3rem] lg:rounded-[7rem] border-2 lg:border-4 border-emerald-950 relative overflow-hidden group shadow-[0_0_200px_rgba(0,0,0,1)]">
      {/* Shinra Master HUD v14.1 */}
      <div className="absolute inset-0 pointer-events-none z-20 p-6 md:p-10 lg:p-12 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-8">
             <div className="flex items-center gap-10">
                <div className="w-6 h-6 bg-emerald-500 shadow-[0_0_40px_#10b981] animate-pulse" style={{ backgroundColor: status.color, boxShadow: `0 0 40px ${status.color}` }} />
                <h1 className="text-3xl font-black tracking-[1.8em] uppercase italic" style={{ color: status.color, filter: `drop-shadow(0 0 15px ${status.color})` }}>
                  {status.label}
                </h1>
             </div>
              <div className="ml-6 md:ml-16 border-l-2 lg:border-l-4 border-emerald-900/20 pl-6 md:pl-12 space-y-2 md:space-y-4">
                <span className="text-[10px] md:text-[14px] text-emerald-900 font-black uppercase tracking-[0.8em] block opacity-40">System: RE-GROW-01</span>
                <span className="text-[10px] md:text-[14px] text-emerald-900 font-black uppercase tracking-[0.8em] block opacity-40">Load: {status.speed.toFixed(1)} MW</span>
                <span className="text-[10px] md:text-[14px] font-black uppercase tracking-[0.8em] block animate-pulse" style={{ color: status.color }}>OVERSIGHT_ACTIVE</span>
              </div>
          </div>
          
          <div className="text-right flex flex-col items-end">
              <span className="text-[12px] md:text-[16px] text-emerald-900 font-black uppercase tracking-[1.2em] block mb-4 md:mb-6">Shinra_Corp_Intranet</span>
              <div className="px-6 md:px-10 py-3 md:py-5 bg-black/40 border-2 rounded-2xl md:rounded-3xl shadow-3xl mb-4 md:mb-8" style={{ borderColor: `${status.color}30` }}>
                <span className="text-sm md:text-lg font-black tracking-[0.6em]" style={{ color: status.color }}>CORE_FACILITY_7</span>
              </div>

             {/* Right Sidebar Mascot */}
              <div className="relative group/mascot mt-4 md:mt-12 hidden md:flex">
                <div className="absolute -inset-4 bg-emerald-500/10 blur-2xl rounded-full animate-pulse opacity-0 group-hover/mascot:opacity-100 transition-opacity" />
                <div className="relative w-32 lg:w-48 h-48 lg:h-64 glass-panel border-emerald-500/20 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-6 flex flex-col items-center justify-between overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                   <div className="w-full flex justify-between items-center opacity-30 mb-2 lg:mb-4">
                      <div className="flex gap-1"><div className="w-1 h-1 bg-emerald-500" /><div className="w-1 h-1 bg-emerald-500" /></div>
                      <span className="text-[7px] lg:text-[8px] font-black tracking-widest uppercase">Advisor_V2</span>
                   </div>
                   <div className="flex-1 w-full relative">
                      <img src={mascotAerith} alt="Tactical Advisor" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover/mascot:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                   </div>
                   <div className="w-full space-y-1 lg:space-y-2 mt-2 lg:mt-4">
                      <div className="h-0.5 w-full bg-emerald-950 rounded-full overflow-hidden"><div className="w-3/4 h-full bg-emerald-500 animate-pulse" /></div>
                      <div className="flex justify-between items-center">
                         <span className="text-[7px] lg:text-[9px] font-black text-emerald-500/50 uppercase tracking-tighter">Analysis: Active</span>
                         <span className="text-[7px] lg:text-[9px] font-black text-emerald-500 animate-pulse uppercase">Sync: 100%</span>
                      </div>
                   </div>
                </div>
                <div className="absolute top-1/2 -right-8 lg:-right-12 -translate-y-1/2 rotate-90 whitespace-nowrap">
                   <span className="text-[8px] lg:text-[10px] font-black text-emerald-900/40 uppercase tracking-[1em]">TACTICAL_ASSISTANT</span>
                </div>
              </div>
           </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex gap-6">
            {/* Compact Mako Resonance Mini-Card */}
            <div className="bg-black/30 backdrop-blur-md p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-emerald-900/20 shadow-2xl w-32 md:w-48 lg:w-64 relative overflow-hidden group/mako">
               <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" style={{ backgroundColor: status.color }} />
               <span className="text-[7px] lg:text-[9px] text-emerald-900 font-black uppercase tracking-widest mb-1 opacity-60">Mako_Resonance</span>
               <div className="flex items-baseline gap-1 lg:gap-2">
                  <span className="text-2xl md:text-3xl lg:text-5xl font-black italic tabular-nums tracking-tighter" style={{ color: status.color }}>{temp}</span>
                  <span className="text-xs lg:text-lg font-black opacity-20 text-emerald-500">°C</span>
               </div>
            </div>

            {/* Compact Atmospheric Grid Mini-Card */}
            <div className="bg-black/30 backdrop-blur-md p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-cyan-900/20 shadow-2xl w-32 md:w-48 lg:w-64 relative overflow-hidden group/atmos">
               <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
               <span className="text-[7px] lg:text-[9px] text-cyan-900 font-black uppercase tracking-widest mb-1 opacity-60">Atmospheric_Grid</span>
               <div className="flex items-baseline gap-1 lg:gap-2">
                  <span className="text-2xl md:text-3xl lg:text-5xl font-black text-cyan-500 italic tabular-nums tracking-tighter">{humidity}</span>
                  <span className="text-xs lg:text-lg font-black opacity-20 text-cyan-500">%</span>
               </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl p-4 md:p-6 lg:p-8 rounded-xl md:rounded-2xl lg:rounded-[2rem] border border-emerald-900/10 shadow-3xl relative overflow-hidden group/phase w-full max-w-[640px] mb-2 md:mb-4">
             {/* Tactical Scanline Overlay */}
             <div className="absolute inset-0 scanner-line opacity-[0.03] pointer-events-none" />
             
             <div className="flex justify-between items-center mb-4 lg:mb-8">
                <div className="flex flex-col">
                   <span className="text-[7px] lg:text-[10px] text-emerald-900 font-black uppercase tracking-[0.4em] mb-1 opacity-60">Phase_Status</span>
                   <span className="text-xs md:text-base lg:text-xl font-black italic tracking-wider" style={{ color: status.color }}>
                      {lampLevel === 0 ? 'RECHARGING_DARKNESS' : 'ENERGY_MAXIMIZED'}
                   </span>
                </div>
                <div className="text-right">
                   <span className="text-[7px] lg:text-[10px] text-emerald-900 font-black uppercase tracking-[0.4em] mb-1 opacity-60">Cycle_Progress</span>
                   <span className="text-xs md:text-base lg:text-xl font-black tabular-nums" style={{ color: status.color }}>
                      {Math.round(phaseInfo.progress * 100)}%
                   </span>
                </div>
             </div>

             <div className="flex gap-[2px] md:gap-2 lg:gap-2.5 mb-4 lg:mb-10 h-10 md:h-12 lg:h-16">
                {[...Array(30)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-[1px] md:rounded-[4px] transition-all duration-700 relative overflow-hidden`} 
                    style={{ 
                      backgroundColor: i < phaseInfo.segments ? `${status.color}25` : '#050a08',
                      border: `1px solid ${i < phaseInfo.segments ? status.color : '#111'}`,
                      boxShadow: i < phaseInfo.segments ? `0 0 15px ${status.color}30` : 'none',
                    }} 
                  >
                     {i < phaseInfo.segments && (
                       <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent animate-[pulse_2s_ease-in-out_infinite]" />
                     )}
                     {/* Segment details */}
                     <div className="absolute inset-0 flex flex-col justify-between p-[1px] md:p-[3px] opacity-10">
                        <div className="h-[1px] w-full bg-white/40" />
                        <div className="h-[1px] w-full bg-white/40" />
                        <div className="h-[1px] w-full bg-white/40" />
                     </div>
                  </div>
                ))}
             </div>

             <div className="flex justify-between items-end">
                <div className="space-y-1 hidden sm:block">
                   <span className="text-[6px] lg:text-[8px] text-emerald-900 font-black uppercase tracking-widest opacity-40">Operational_Protocol</span>
                   <div className="flex items-center gap-2 lg:gap-3">
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500 animate-ping" style={{ backgroundColor: status.color }} />
                      <span className="text-[8px] lg:text-[12px] font-mono uppercase tracking-tighter text-emerald-100/60">Live_Telemetry_Synced</span>
                   </div>
                </div>
                <div className="flex flex-col items-end ml-auto">
                   <span className="text-[7px] lg:text-[10px] text-emerald-900 font-black uppercase tracking-[0.4em] mb-1 lg:mb-2 opacity-40">Next_Transition_Event</span>
                   <div className="flex items-center gap-3 lg:gap-5 px-4 lg:px-8 py-2 lg:py-4 bg-black/60 rounded-lg lg:rounded-2xl border border-white/5 shadow-inner">
                      <span className="text-[7px] lg:text-[10px] font-black text-rose-500/50 uppercase tracking-[0.3em]">T-MINUS</span>
                      <span className="text-xl md:text-2xl lg:text-4xl font-black italic tracking-[0.15em] tabular-nums text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                         {phaseInfo.countdown}
                      </span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-10">
        <Canvas gl={{ antialias: true, logarithmicDepthBuffer: true }}>
          <PerspectiveCamera makeDefault position={[0, 8, 25]} fov={35} />
          
          <PresentationControls global snap={true} rotation={[0, 0, 0]} polar={[-Math.PI / 10, Math.PI / 10]} azimuth={[-Math.PI / 4, Math.PI / 4]}>
            <group scale={1.4} position={[0, 1.5, 0]}>
              <MasterReactorBlock color={status.color} speedMultiplier={status.speed} />
              <CrystalCluster color={status.color} speedMultiplier={status.speed} />
              <ContainmentGimbal color={status.color} speedMultiplier={status.speed} />
              <PowerCables color={status.color} />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#020202" metalness={1} roughness={0.2} />
              </mesh>
              <Sparkles count={800} scale={[20, 20, 20]} size={5} speed={status.speed * 0.5} color={status.color} />
            </group>
          </PresentationControls>
          <EffectComposer>
            <Bloom intensity={status.intensity} luminanceThreshold={0.1} luminanceSmoothing={0.9} mipmapBlur />
            <Noise opacity={0.08} />
            <Vignette darkness={1.2} />
          </EffectComposer>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={status.intensity} color={status.color} />
          <pointLight position={[-10, 5, 5]} intensity={status.intensity * 0.5} color="#06b6d4" />
          <pointLight position={[0, -2, 5]} intensity={status.intensity} color={status.color} />
          <Stars radius={250} depth={50} count={15000} factor={10} saturation={0} fade speed={0.8} />
        </Canvas>
      </div>

      <div className="absolute inset-0 pointer-events-none z-30 shadow-[inset_0_0_500px_rgba(0,0,0,1)]" />
      <div className="absolute inset-0 pointer-events-none z-30 scan-overlay opacity-10" />
      <div className="absolute inset-0 pointer-events-none z-40 border-[60px] border-black/50" />
      <div className="absolute top-1/2 left-10 -rotate-90 text-[12px] text-emerald-900 font-black tracking-[2em] opacity-20">SHINRA_REACTOR_CONTROL_HUB</div>
    </div>
  );
}
