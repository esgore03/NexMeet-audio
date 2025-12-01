import { PeerServer } from "peer";
import "dotenv/config";

const port = Number(process.env.PORT) || 3001;

/**
 * Initialize Peer.js Server for audio transmission
 * Peer.js handles all WebRTC signaling automatically
 */
const peerServer = PeerServer({
  port: port,
  path: "/",
});

console.log(`Audio server running on port ${port}`);

/**
 * Peer.js event handlers for connection management
 */

peerServer.on("connection", (client) => {
  console.log(`Peer connected: ${client.getId()}`);
});

peerServer.on("disconnect", (client) => {
  console.log(`Peer disconnected: ${client.getId()}`);
});

peerServer.on("error", (error) => {
  console.error("PeerServer error:", error);
});
