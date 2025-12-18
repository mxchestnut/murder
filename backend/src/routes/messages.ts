import { Router } from 'express';
import * as sdk from 'matrix-js-sdk';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Matrix client instances per user
const matrixClients = new Map<number, any>();

// Initialize Matrix client for user
function getMatrixClient(userId: number) {
  if (!matrixClients.has(userId)) {
    const client = sdk.createClient({
      baseUrl: process.env.MATRIX_HOMESERVER_URL || 'https://matrix.org',
      accessToken: process.env.MATRIX_ACCESS_TOKEN,
      userId: `@user${userId}:cyarika.com`
    });
    matrixClients.set(userId, client);
  }
  return matrixClients.get(userId);
}

// All routes require authentication
router.use(isAuthenticated);

// Send message
router.post('/send', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { roomId, message } = req.body;

    const client = getMatrixClient(userId);
    
    const response = await client.sendEvent(roomId, 'm.room.message', {
      msgtype: 'm.text',
      body: message
    });

    res.json({ eventId: response.event_id });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get messages from room
router.get('/room/:roomId', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { roomId } = req.params;

    const client = getMatrixClient(userId);
    
    const messages = await client.roomMessages(roomId, null, 50);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create or get direct message room
router.post('/dm', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { targetUserId } = req.body;

    const client = getMatrixClient(userId);
    
    const room = await client.createRoom({
      preset: 'trusted_private_chat',
      invite: [`@user${targetUserId}:cyarika.com`]
    });

    res.json({ roomId: room.room_id });
  } catch (error) {
    console.error('Error creating DM room:', error);
    res.status(500).json({ error: 'Failed to create DM room' });
  }
});

export default router;
