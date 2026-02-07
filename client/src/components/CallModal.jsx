import { useEffect, useRef, useState, useContext } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, User, PhoneCall } from "lucide-react";
import AuthContext from "../context/AuthContext";

const CallModal = ({ callData, incomingCall, onEndCall, socket: sharedSocket }) => {
    const { user: currentUser } = useContext(AuthContext);
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [isAnswering, setIsAnswering] = useState(false);

    const localVideo = useRef();
    const remoteVideo = useRef();
    const peerConnection = useRef();

    const iceServers = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    };

    useEffect(() => {
        const initCall = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: callData.type === 'video',
                    audio: true
                });
                setStream(mediaStream);
                if (localVideo.current) localVideo.current.srcObject = mediaStream;

                if (!incomingCall) {
                    await startCall(mediaStream);
                } else {
                    setIsAnswering(true);
                    setIsConnecting(false);
                }
            } catch (err) {
                console.error("Failed to get media", err);
                onEndCall();
            }
        };

        initCall();

        const handleCallAnswered = async ({ answer }) => {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            setIsConnecting(false);
        };

        const handleIceCandidate = async ({ candidate }) => {
            if (peerConnection.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        };

        const handleCallEnded = () => {
            endCall();
        };

        sharedSocket.on("call_answered", handleCallAnswered);
        sharedSocket.on("ice_candidate", handleIceCandidate);
        sharedSocket.on("call_ended", handleCallEnded);

        return () => {
            sharedSocket.off("call_answered", handleCallAnswered);
            sharedSocket.off("ice_candidate", handleIceCandidate);
            sharedSocket.off("call_ended", handleCallEnded);
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (peerConnection.current) peerConnection.current.close();
        };
    }, []);

    const setupPeerConnection = (mediaStream) => {
        peerConnection.current = new RTCPeerConnection(iceServers);

        mediaStream.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, mediaStream);
        });

        peerConnection.current.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
        };

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                sharedSocket.emit("ice_candidate", {
                    to: incomingCall ? callData.fromId : callData.toId,
                    candidate: event.candidate
                });
            }
        };
    };

    const startCall = async (mediaStream) => {
        setupPeerConnection(mediaStream);
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);

        sharedSocket.emit("call_user", {
            to: callData.toId,
            fromId: currentUser._id,
            fromName: currentUser.name,
            offer,
            type: callData.type
        });
    };

    const answerCallAction = async () => {
        setIsAnswering(false);
        setIsConnecting(false);
        setupPeerConnection(stream);

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(callData.offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        sharedSocket.emit("answer_call", {
            to: callData.fromId,
            answer
        });
    };

    const endCall = () => {
        sharedSocket.emit("end_call", { to: incomingCall ? callData.fromId : callData.toId });
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (peerConnection.current) peerConnection.current.close();
        onEndCall();
    };

    const toggleMute = () => {
        stream.getAudioTracks()[0].enabled = isMuted;
        setIsMuted(!isMuted);
    };

    const toggleVideo = () => {
        if (stream.getVideoTracks()[0]) {
            stream.getVideoTracks()[0].enabled = isVideoOff;
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
            <div className="relative glass-card w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden border border-white/10 flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-4 bg-white/5 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary-glow/20">
                            <PhoneCall className="w-5 h-5 text-primary-glow" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                {callData.type === 'video' ? 'Video Call' : 'Voice Call'}
                            </p>
                            <h3 className="text-lg font-bold text-white">
                                {incomingCall ? callData.fromName : callData.toName}
                            </h3>
                        </div>
                    </div>
                    {isConnecting && !isAnswering && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                            <span className="text-xs text-yellow-500 font-black uppercase tracking-widest">Calling...</span>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 relative bg-black/40 flex items-center justify-center p-4">

                    {/* Remote Video (Full Screen) */}
                    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-gray-900 shadow-inner">
                        {callData.type === 'video' ? (
                            <video
                                playsInline
                                ref={remoteVideo}
                                autoPlay
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                                <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center border-4 border-white/10 shadow-2xl animate-pulse">
                                    <User className="w-16 h-16 text-gray-500" />
                                </div>
                                <p className="mt-8 text-2xl font-black text-white glow-text tracking-widest uppercase">
                                    {incomingCall ? callData.fromName : callData.toName}
                                </p>
                            </div>
                        )}

                        {/* Remote User Placeholder when connecting */}
                        {isConnecting && !isAnswering && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                <div className="w-24 h-24 rounded-full bg-primary-glow/10 flex items-center justify-center border border-primary-glow/20 animate-bounce">
                                    <User className="w-10 h-10 text-primary-glow" />
                                </div>
                                <p className="mt-4 text-sm font-bold text-gray-400">Waiting for response...</p>
                            </div>
                        )}
                    </div>

                    {/* Local Video (Floating) */}
                    {callData.type === 'video' && (
                        <div className="absolute top-8 right-8 w-48 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 hover:scale-105 transition-transform duration-300">
                            <video
                                playsInline
                                muted
                                ref={localVideo}
                                autoPlay
                                className="w-full h-full object-cover"
                            />
                            {isVideoOff && (
                                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                                    <VideoOff className="w-6 h-6 text-gray-600" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-8 flex items-center justify-center gap-6 bg-linear-to-t from-black/80 to-transparent">
                    {isAnswering ? (
                        <>
                            <button
                                onClick={answerCallAction}
                                className="w-16 h-16 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:scale-110 active:scale-95"
                            >
                                <PhoneCall className="w-8 h-8" />
                            </button>
                            <button
                                onClick={endCall}
                                className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all hover:scale-110 active:scale-95"
                            >
                                <PhoneOff className="w-8 h-8" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={toggleMute}
                                className={`w-14 h-14 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>

                            <button
                                onClick={endCall}
                                className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all hover:scale-110 active:scale-95 mx-4"
                            >
                                <PhoneOff className="w-8 h-8" />
                            </button>

                            {callData.type === 'video' && (
                                <button
                                    onClick={toggleVideo}
                                    className={`w-14 h-14 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallModal;
