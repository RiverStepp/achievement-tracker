import * as fs from 'fs';
import * as path from 'path';
import { SteamGameStats } from '../types';

export class DataStorage {
  private outputDir: string;

  constructor(outputDir: string = './data') {
    this.outputDir = outputDir;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  saveUserData(steamId: string, gameStats: SteamGameStats[]): void {
    const filename = `user_${steamId}_${Date.now()}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    const data = {
      steamId,
      timestamp: new Date().toISOString(),
      gameStats,
      summary: {
        totalGames: gameStats.length,
        totalAchievements: gameStats.reduce((sum, game) => sum + game.achievements.length, 0),
        completedGames: gameStats.filter(game => 
          game.achievements.length > 0 && 
          game.achievements.every(ach => ach.achieved === 1)
        ).length
      }
    };

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`User data saved to ${filepath}`);
  }

  saveBatchData(usersData: any[]): void {
    const filename = `batch_${Date.now()}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    const data = {
      timestamp: new Date().toISOString(),
      totalUsers: usersData.length,
      users: usersData
    };

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`Batch data saved to ${filepath}`);
  }

  loadResumeData(resumeFile: string): any {
    try {
      const data = fs.readFileSync(resumeFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading resume data from ${resumeFile}:`, error);
      return null;
    }
  }

  saveResumeData(data: any, resumeFile: string): void {
    try {
      fs.writeFileSync(resumeFile, JSON.stringify(data, null, 2));
      console.log(`Resume data saved to ${resumeFile}`);
    } catch (error) {
      console.error(`Error saving resume data:`, error);
    }
  }

  getDataFiles(): string[] {
    try {
      return fs.readdirSync(this.outputDir)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(this.outputDir, file));
    } catch (error) {
      console.error(`Error reading data directory:`, error);
      return [];
    }
  }

  mergeDataFiles(outputFile: string): void {
    const dataFiles = this.getDataFiles();
    const mergedData: any[] = [];

    for (const file of dataFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (data.users) {
          mergedData.push(...data.users);
        } else if (data.steamId) {
          mergedData.push(data);
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }

    const finalData = {
      timestamp: new Date().toISOString(),
      totalUsers: mergedData.length,
      users: mergedData
    };

    fs.writeFileSync(outputFile, JSON.stringify(finalData, null, 2));
    console.log(`Merged data saved to ${outputFile}`);
  }

  cleanupOldFiles(daysToKeep: number = 7): void {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    try {
      const files = fs.readdirSync(this.outputDir);
      let deletedCount = 0;

      for (const file of files) {
        const filepath = path.join(this.outputDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old files`);
      }
    } catch (error) {
      console.error(`Error during cleanup:`, error);
    }
  }
}