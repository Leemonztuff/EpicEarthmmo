import fs from 'fs';
import path from 'path';
import { ZodSchema, ZodError } from 'zod';
import {
  BalanceSchema, BalanceConfig,
  EnemyDataSchema, EnemyData,
  SkillTreeSchema, SkillTree,
  ItemDatabaseSchema, ItemDatabase,
  JobDatabaseSchema, JobDatabase,
  MapSchema, MapConfig,
} from '../schemas';

interface LoadedGameData {
  balance: BalanceConfig;
  enemies: EnemyData;
  skills: SkillTree;
  items: ItemDatabase;
  jobs: JobDatabase;
  maps: MapConfig[];
}

function loadAndValidate<T>(filePath: string, schema: ZodSchema<T>): T {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  const result = schema.safeParse(parsed);

  if (!result.success) {
    const errors = result.error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Validation failed for ${filePath}:\n${errors}`);
  }

  return result.data;
}

export function loadGameData(dataDir?: string): LoadedGameData {
  const baseDir = dataDir || path.join(__dirname, '..', 'data');

  console.log(`[GameData] Loading from ${baseDir}`);

  const balance = loadAndValidate(path.join(baseDir, 'balance.json'), BalanceSchema);
  const enemies = loadAndValidate(path.join(baseDir, 'enemies.json'), EnemyDataSchema);
  const skills = loadAndValidate(path.join(baseDir, 'skills.json'), SkillTreeSchema);
  const items = loadAndValidate(path.join(baseDir, 'items.json'), ItemDatabaseSchema);
  const jobs = loadAndValidate(path.join(baseDir, 'jobs.json'), JobDatabaseSchema);

  const mapsDir = path.join(baseDir, 'maps');
  const maps: MapConfig[] = [];
  if (fs.existsSync(mapsDir)) {
    for (const file of fs.readdirSync(mapsDir).filter(f => f.endsWith('.json'))) {
      const mapData = loadAndValidate(path.join(mapsDir, file), MapSchema);
      maps.push(mapData);
      console.log(`[GameData] Loaded map: ${mapData.name} (${mapData.id})`);
    }
  }

  console.log(`[GameData] Loaded ${enemies.templates.length} enemy templates, ${skills.length} skills, ${items.length} items, ${jobs.length} jobs, ${maps.length} maps`);

  return { balance, enemies, skills, items, jobs, maps };
}

export type { LoadedGameData };
