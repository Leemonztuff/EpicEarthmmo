import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import { parse } from 'url';

// Import initial data
import { INITIAL_ENEMIES } from './data/gameData';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' }
  });

  // --- MMORPG Authoritative State ---
  const players: Record<string, any> = {};
  
  // Clone INITIAL_ENEMIES to maintain server state
  const enemies = JSON.parse(JSON.stringify(INITIAL_ENEMIES));

  // Ticks for respawn and regen (1 tick per second)
  setInterval(() => {
    // Basic respawn logic
    for (const [id, enemy] of Object.entries(enemies)) {
      if ((enemy as any).isDead) {
        if (!((enemy as any).deathTime)) {
          (enemy as any).deathTime = Date.now();
        } else if (Date.now() - (enemy as any).deathTime > 5000) {
          // Respawn after 5 seconds
          (enemy as any).hp = (enemy as any).maxHp;
          (enemy as any).isDead = false;
          delete (enemy as any).deathTime;
          io.emit('enemyRespawned', enemy);
        }
      }
    }
  }, 1000);

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Initial sync
    socket.on('join', (data) => {
      players[socket.id] = { 
        id: socket.id, 
        x: 0, y: 0.5, z: 0, 
        name: data.name || 'Player',
        stats: data.stats || { str: 5 } // Basic stats needed for damage calculation if server takes over fully
      };
      
      socket.emit('init', { id: socket.id, players, enemies });
      socket.broadcast.emit('playerJoined', players[socket.id]);
    });

    socket.on('move', (pos) => {
      if (players[socket.id]) {
        // Distance check (rudimentary anti-speedhack)
        const p = players[socket.id];
        const dx = p.x - pos.x;
        const dz = p.z - pos.z;
        const distSq = dx*dx + dz*dz;
        
        // If distance is too large in one tick, we could reject it
        // if (distSq > 100) return;

        p.x = pos.x;
        p.y = pos.y;
        p.z = pos.z;
        socket.broadcast.emit('playerMoved', { id: socket.id, ...pos });
      }
    });

    // Authoritative Attack handler
    socket.on('attack', ({ targetId, skillId, playerStats, sp }) => {
      const p = players[socket.id];
      const enemy = enemies[targetId];

      if (!p || !enemy || enemy.isDead) return;

      // Distance check
      const dx = p.x - enemy.position.x;
      const dz = p.z - enemy.position.z;
      const distSq = dx*dx + dz*dz;
      
      // Range check (e.g., melee range ~ 5 units squared)
      if (distSq > 10) {
        // Too far to attack
        return;
      }

      // Calculate Damage
      let damage = (playerStats?.str || 5) * 2 + Math.floor(Math.random() * 5);
      let usedSkill = false;
      let newSp = sp;

      if (skillId === 'bash' && sp >= 5) {
        damage = Math.floor(damage * 2.5);
        newSp -= 5;
        usedSkill = true;
      }

      damage = Math.floor(damage);
      enemy.hp = Math.max(0, enemy.hp - damage);
      
      if (enemy.hp === 0) {
        enemy.isDead = true;
        enemy.deathTime = Date.now();
        
        // Calculate Loot and Exp
        const expBase = enemy.level * 10;
        const expJob = enemy.level * 5;
        
        let loot = [];
        if (Math.random() > 0.5) {
          loot.push({ id: 'jellopy', name: 'Jellopy', type: 'misc', amount: 1, description: 'A gelatinous substance dropped by Porings.' });
        }

        // Notify client about kill/loot
        socket.emit('enemyKilled', { 
          targetId, 
          expBase, 
          expJob, 
          loot,
          newSp,
          damage,
          usedSkill
        });

      } else {
        // Just damage
        socket.emit('attackResult', {
          targetId,
          damage,
          usedSkill,
          newSp
        });
      }

      // Broadcast to everyone that the enemy was damaged (for visual damage numbers)
      io.emit('enemyDamaged', { 
        targetId, 
        damage, 
        usedSkill, 
        attackerId: socket.id,
        hp: enemy.hp,
        isDead: enemy.isDead
      });
    });

    socket.on('chat', (msg) => {
      if (!players[socket.id]) return;
      io.emit('chatMessage', {
        id: Date.now().toString() + Math.random().toString(),
        sender: players[socket.id].name,
        text: msg,
        timestamp: Date.now()
      });
    });

    socket.on('saveProgress', async (playerData) => {
      // If we had supabase initiated in server, we would save here.
      // E.g.: await supabase.from('characters').upsert(...)
      socket.emit('progressSaved', { success: true });
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      delete players[socket.id];
      io.emit('playerLeft', socket.id);
    });
  });

  server.all(/.*/, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  httpServer.listen(port, () => {
    console.log(`> MMO Server listening on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
