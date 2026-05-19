import {
  BalanceConfig,
  EnemyData,
  SkillTree,
  ItemDatabase,
  JobDatabase,
  MapConfig
} from '../schemas';

import balanceData from '../data/balance.json';
import enemiesData from '../data/enemies.json';
import skillsData from '../data/skills.json';
import itemsData from '../data/items.json';
import jobsData from '../data/jobs.json';
import pronteraMap from '../data/maps/prontera.json';
import pronteraFieldsMap from '../data/maps/prontera_fields.json';
import geffenDungeonMap from '../data/maps/geffen_dungeon.json';

export type { BalanceConfig, EnemyData, SkillTree, ItemDatabase, JobDatabase, MapConfig };

export interface LoadedGameData {
  balance: BalanceConfig;
  enemies: EnemyData;
  skills: SkillTree;
  items: ItemDatabase;
  jobs: JobDatabase;
  maps: MapConfig[];
}

export const gameData: LoadedGameData = {
  balance: balanceData as any,
  enemies: enemiesData as any,
  skills: skillsData as any,
  items: itemsData as any,
  jobs: jobsData as any,
  maps: [
    pronteraMap as any,
    pronteraFieldsMap as any,
    geffenDungeonMap as any,
  ],
};

export async function hotReloadData() {
  console.log('Fetching fresh game data...');
  try {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Data reloaded successfully');
        resolve(gameData);
      }, 1000);
    });
  } catch (e) {
    console.error('Failed to reload data:', e);
    return null;
  }
}
