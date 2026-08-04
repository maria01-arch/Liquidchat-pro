import React, { useEffect, useRef } from 'react';
import { ActiveCall } from '../types';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Maximize2,
  Lock,
  Sparkles
} from 'lucide-react';
import { formatDuration } from '../utils/audio';

interface CallModalProps {
  activeCall: ActiveCall;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  activeCall,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (activeCall?.isVideo && !activeCall?.isCameraOff) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((s) => {
          stream = s;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn('Camera stream preview fallback:', err);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeCall?.isVideo, activeCall?.isCameraOff]);

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-between p-6 select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Top Encryption Header */}
      <div className="w-full max-w-md flex items-center justify-between text-xs text-slate-300 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center space-x-2 text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="font-bold tracking-wide">E2EE 256-Bit Encrypted</span>
        </div>
        <div className="flex items-center space-x-1 text-slate-400 font-mono text-[11px]">
          <Lock className="w-3 h-3 text-cyan-400" />
          <span>SRTP Peer-to-Peer</span>
        </div>
      </div>

      {/* Main Avatar / Video Stage */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg my-8 relative">
        {activeCall.isVideo && !activeCall.isCameraOff ? (
          <div className="w-full h-80 md:h-96 rounded-3xl overflow-hidden relative border border-slate-800 shadow-2xl bg-slate-900 flex items-center justify-center">
            {/* Local Video Camera Stream */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {/* Overlay contact info */}
            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-slate-950/70 px-3 py-1.5 rounded-full backdrop-blur-md border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-white">{activeCall.contactName}</span>
            </div>
            {/* Duration pill */}
            <div className="absolute bottom-4 left-4 bg-slate-950/80 text-emerald-400 px-3 py-1 rounded-xl text-xs font-mono font-bold border border-slate-800">
              {activeCall.status === 'dialing' ? 'Dialing...' : formatDuration(activeCall.duration)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            {/* Glowing Avatar */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-xl opacity-40 animate-pulse" />
              <img
                src={activeCall.contactAvatar}
                alt={activeCall.contactName}
                className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover relative ring-4 ring-blue-500/50 shadow-2xl"
              />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {activeCall.contactName}
              </h2>
              <p className="text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider">
                {activeCall.status === 'dialing' ? (
                  <span className="animate-pulse flex items-center justify-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Establishing E2EE Channel...</span>
                  </span>
                ) : (
                  <span>Connected • {formatDuration(activeCall.duration)}</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons Dock */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-4 rounded-3xl backdrop-blur-2xl shadow-2xl flex items-center justify-around">
        {/* Mute Mic */}
        <button
          onClick={onToggleMute}
          className={`p-4 rounded-2xl transition-all ${
            activeCall.isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={activeCall.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {activeCall.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Toggle Camera */}
        <button
          onClick={onToggleVideo}
          className={`p-4 rounded-2xl transition-all ${
            activeCall.isCameraOff || !activeCall.isVideo
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
          }`}
          title={activeCall.isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {activeCall.isCameraOff || !activeCall.isVideo ? (
            <VideoOff className="w-6 h-6" />
          ) : (
            <Video className="w-6 h-6" />
          )}
        </button>

        {/* Toggle Speaker */}
        <button
          onClick={onToggleSpeaker}
          className={`p-4 rounded-2xl transition-all ${
            activeCall.isSpeakerOn
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Toggle Speaker Mode"
        >
          {activeCall.isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/30 transition-transform active:scale-95"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
