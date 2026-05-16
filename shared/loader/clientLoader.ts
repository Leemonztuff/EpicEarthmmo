import {
  BalanceSchema, BalanceConfig,
  EnemyDataSchema, EnemyData,
  SkillTreeSchema, SkillTree,
  ItemDatabaseSchema, ItemDatabase,
  JobDatabaseSchema, JobDatabase,
  MapSchema, MapConfig,
} from '../schemas';

import balanceJson from '../data/balance.json';
import enemiesJson from '../data/enemies.json';
import skillsJson from '../data/skills.json';
import itemsJson from '../data/items.json';
import jobsJson from '../data/jobs.json';
import pronteraMapJson from '../data/maps/prontera.json';

function validate<T>(data: unknown, schema: any, name: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e: any) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Validation failed for ${name}:\n${errors}`);
  }
  return result.data as T;
}

const balance = validate<BalanceConfig>(balanceJson, BalanceSchema, 'balance.json');
const enemies = validate<EnemyData>(enemiesJson, EnemyDataSchema, 'enemies.json');
const skills = validate<SkillTree>(skillsJson, SkillTreeSchema, 'skills.json');
const items = validate<ItemDatabase>(itemsJson, ItemDatabaseSchema, 'items.json');
const jobs = validate<JobDatabase>(jobsJson, JobDatabaseSchema, 'jobs.json');
const pronteraMap = validate<MapConfig>(pronteraMapJson, MapSchema, 'prontera.json');

const maps: MapConfig[] = [pronteraMap];

export const gameData = {
  balance,
  enemies,
  skills,
  items,
  jobs,
  maps,
};

export type { BalanceConfig, EnemyData, SkillTree, ItemDatabase, JobDatabase, MapConfig };
export type LoadedGameData = typeof gameData;
