import type { MapConfig, Warp, EnemyArea, SafeZone, EnemyTemplate, MapSpawnPoint, MapDecoration, SafeZone as SafeZoneType } from '../shared/schemas';
import type { ServerPlayer } from './types';

export interface RuntimeEnemy {
  id: string;
  spawnId: string;
  name: string;
  hp: number;
  maxHp: number;
  level: number;
  position: { x: number; y: number; z: number };
  isDead: boolean;
  deathTime?: number;
  respawnTime?: number;
  templateId: string;
  areaCenter: { x: number; z: number };
  areaRadius: number;
  respawnSeconds: number;
}

export interface MapInstance {
  config: MapConfig;
  players: Map<string, ServerPlayer>;
  enemies: Map<string, RuntimeEnemy>;
  enemyIdCounter: number;
}

export class MapManager {
  private maps = new Map<string, MapInstance>();
  private enemyTemplates = new Map<string, EnemyTemplate>();

  registerEnemyTemplate(template: EnemyTemplate) {
    this.enemyTemplates.set(template.id, template);
  }

  loadMap(config: MapConfig) {
    if (this.maps.has(config.id)) {
      console.warn(`[MapManager] Map ${config.id} already loaded, skipping`);
      return;
    }

    const instance: MapInstance = {
      config,
      players: new Map(),
      enemies: new Map(),
      enemyIdCounter: 0,
    };

    this.spawnEnemies(instance);
    this.maps.set(config.id, instance);
    console.log(`[MapManager] Loaded map: ${config.name} (${config.id}) [${config.type}]`);
  }

  private spawnEnemies(instance: MapInstance) {
    for (const area of instance.config.enemyAreas) {
      const template = this.enemyTemplates.get(area.enemyId);
      if (!template) {
        console.warn(`[MapManager] Enemy template "${area.enemyId}" not found for map ${instance.config.id}`);
        continue;
      }

      for (let i = 0; i < area.count; i++) {
        const pos = this.randomPositionInCircle(area.center, area.radius);
        const enemyId = `${instance.config.id}_enemy_${instance.enemyIdCounter++}`;

        instance.enemies.set(enemyId, {
          id: enemyId,
          spawnId: enemyId,
          name: template.name,
          hp: template.hp,
          maxHp: template.hp,
          level: template.level,
          position: { x: pos.x, y: 0.5, z: pos.z },
          isDead: false,
          templateId: template.id,
          areaCenter: { ...area.center },
          areaRadius: area.radius,
          respawnSeconds: area.respawnSeconds,
        });
      }
    }
  }

  private randomPositionInCircle(center: { x: number; z: number }, radius: number): { x: number; z: number } {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;
    return {
      x: center.x + Math.cos(angle) * r,
      z: center.z + Math.sin(angle) * r,
    };
  }

  getMap(mapId: string): MapInstance | undefined {
    return this.maps.get(mapId);
  }

  getAllMaps(): Map<string, MapInstance> {
    return this.maps;
  }

  getPlayerMap(socketId: string): { mapId: string; instance: MapInstance } | null {
    for (const [mapId, instance] of this.maps) {
      if (instance.players.has(socketId)) {
        return { mapId, instance };
      }
    }
    return null;
  }

  addPlayerToMap(socketId: string, player: ServerPlayer, mapId: string, spawnId: string = 'main') {
    const instance = this.maps.get(mapId);
    if (!instance) {
      console.error(`[MapManager] Map ${mapId} not found`);
      return false;
    }

    const spawnPoint = instance.config.spawnPoints.find((sp: MapSpawnPoint) => sp.id === spawnId);
    if (spawnPoint) {
      player.x = spawnPoint.position.x;
      player.y = spawnPoint.position.y;
      player.z = spawnPoint.position.z;
    }

    instance.players.set(socketId, player);
    return true;
  }

  removePlayerFromMap(socketId: string): { mapId: string; instance: MapInstance } | null {
    const result = this.getPlayerMap(socketId);
    if (result) {
      result.instance.players.delete(socketId);
    }
    return result;
  }

  findWarp(mapId: string, warpId: string): Warp | null {
    const instance = this.maps.get(mapId);
    if (!instance) return null;
    return instance.config.warps.find(w => w.id === warpId) ?? null;
  }

  findWarpByProximity(mapId: string, playerX: number, playerZ: number, range: number = 2.0): Warp | null {
    const instance = this.maps.get(mapId);
    if (!instance) return null;

    for (const warp of instance.config.warps) {
      const dx = warp.position.x - playerX;
      const dz = warp.position.z - playerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= range) {
        return warp;
      }
    }
    return null;
  }

  isInSafeZone(mapId: string, x: number, z: number): boolean {
    const instance = this.maps.get(mapId);
    if (!instance) return false;

    for (const zone of instance.config.safeZones) {
      const dx = zone.center.x - x;
      const dz = zone.center.z - z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= zone.radius) {
        return true;
      }
    }
    return false;
  }

  getMapInitData(mapId: string) {
    const instance = this.maps.get(mapId);
    if (!instance) return null;

    const { config } = instance;

    return {
      mapId: config.id,
      mapName: config.name,
      mapType: config.type,
      dimensions: config.dimensions,
      spawnPoints: config.spawnPoints.map((sp: MapSpawnPoint) => ({
        id: sp.id,
        position: sp.position,
        label: sp.label,
      })),
      warps: config.warps.map((w: Warp) => ({
        id: w.id,
        name: w.name,
        position: w.position,
        targetMapName: this.maps.get(w.targetMapId)?.config.name ?? w.targetMapId,
        visual: w.visual,
      })),
      safeZones: config.safeZones.map((sz: SafeZoneType) => ({
        id: sz.id,
        center: sz.center,
        radius: sz.radius,
        name: sz.name,
      })),
      decorations: config.decorations.map((d: MapDecoration) => ({
        position: d.position,
        type: d.type,
        scale: d.scale,
      })),
      grassTuftCount: config.grassTuftCount,
      grassTexture: config.grassTexture,
      floorColor: config.floorColor,
    };
  }

  getMapEnemies(mapId: string) {
    const instance = this.maps.get(mapId);
    if (!instance) return {};

    const result: Record<string, any> = {};
    for (const [id, e] of instance.enemies) {
      result[id] = {
        id: e.id,
        name: e.name,
        hp: e.hp,
        maxHp: e.maxHp,
        level: e.level,
        position: e.position,
        isDead: e.isDead,
      };
    }
    return result;
  }

  getMapPlayers(mapId: string) {
    const instance = this.maps.get(mapId);
    if (!instance) return {};

    const result: Record<string, any> = {};
    for (const [id, p] of instance.players) {
      result[id] = {
        id: p.id,
        x: p.x,
        y: p.y,
        z: p.z,
        name: p.name,
      };
    }
    return result;
  }

  tickEnemies(mapId: string, now: number, onEnemyRespawn: (enemy: RuntimeEnemy) => void) {
    const instance = this.maps.get(mapId);
    if (!instance) return;

    for (const enemy of instance.enemies.values()) {
      if (enemy.isDead && enemy.deathTime) {
        const respawnMs = enemy.respawnSeconds * 1000;
        if (now - enemy.deathTime > respawnMs) {
          const template = this.enemyTemplates.get(enemy.templateId);
          if (template) {
            enemy.hp = template.hp;
            enemy.maxHp = template.hp;
          }
          enemy.isDead = false;
          enemy.respawnTime = now;
          delete enemy.deathTime;

          const newPos = this.randomPositionInCircle(enemy.areaCenter, enemy.areaRadius);
          enemy.position.x = newPos.x;
          enemy.position.z = newPos.z;

          onEnemyRespawn(enemy);
        }
      }
    }
  }

  getEnemy(mapId: string, enemyId: string): RuntimeEnemy | undefined {
    const instance = this.maps.get(mapId);
    if (!instance) return undefined;
    return instance.enemies.get(enemyId);
  }

  getEnemyDrops(templateId: string) {
    const template = this.enemyTemplates.get(templateId);
    return template?.drops ?? [];
  }
}
