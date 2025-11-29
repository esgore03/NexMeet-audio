import Peer from "peerjs";

const peerServerUrl = import.meta.env.VITE_PEER_SERVER_URL || "localhost:3001";

let peer = null;
let localStream = null;
let activeCalls = new Map(); // { userId: call }

/**
 * Inicializa audio para una meet
 */
export const initMeetAudio = async (meetId, userId) => {
  try {
    // 1. Obtener audio del micrófono
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    // 2. Conectar a Peer.js server
    peer = new Peer(`${meetId}-${userId}`, {
      host: peerServerUrl.split(":")[0],
      port: parseInt(peerServerUrl.split(":")[1]) || 3001,
      path: "/",
    });

    // 3. Configurar listeners básicos
    peer.on("connection", handleIncomingCall);

    return peer;
  } catch (error) {
    console.error("Error iniciando audio:", error);
    throw error;
  }
};

/**
 * Conecta al audio de otro usuario en la meet
 */
export const connectToUserAudio = (targetPeerId, targetUserId) => {
  if (!peer || !localStream) return;

  const call = peer.call(targetPeerId, localStream);

  call.on("stream", (remoteStream) => {
    // Reproducir audio del usuario remoto
    playRemoteAudio(targetUserId, remoteStream);
    activeCalls.set(targetUserId, call);
  });

  call.on("close", () => {
    stopRemoteAudio(targetUserId);
    activeCalls.delete(targetUserId);
  });
};

/**
 * Maneja llamadas entrantes de otros usuarios
 */
function handleIncomingCall(call) {
  if (!localStream) return;

  // Aceptar la llamada
  call.answer(localStream);

  call.on("stream", (remoteStream) => {
    const remoteUserId = call.peer.split("-")[1]; // meetId-userId
    playRemoteAudio(remoteUserId, remoteStream);
    activeCalls.set(remoteUserId, call);
  });

  call.on("close", () => {
    const remoteUserId = call.peer.split("-")[1];
    stopRemoteAudio(remoteUserId);
    activeCalls.delete(remoteUserId);
  });
}

/**
 * Reproduce audio remoto
 */
function playRemoteAudio(userId, stream) {
  // Crear elemento de audio y reproducir
  const audio = new Audio();
  audio.srcObject = stream;
  audio.autoplay = true;
  audio.volume = 1.0;

  // Guardar referencia
  audio._userId = userId;
  document.body.appendChild(audio);
}

/**
 * Detiene audio remoto
 */
function stopRemoteAudio(userId) {
  // Encontrar y detener el audio del usuario
  const audios = document.querySelectorAll("audio");
  audios.forEach((audio) => {
    if (audio._userId === userId) {
      audio.pause();
      audio.remove();
    }
  });
}

/**
 * Silencia/activa micrófono
 */
export const toggleMicrophone = (mute) => {
  if (!localStream) return;

  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !mute;
  });
};

/**
 * Cierra todas las conexiones de audio
 */
export const leaveMeetAudio = () => {
  // Cerrar todas las llamadas
  activeCalls.forEach((call) => call.close());
  activeCalls.clear();

  // Detener stream local
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }

  // Cerrar peer
  if (peer) {
    peer.destroy();
  }
};
