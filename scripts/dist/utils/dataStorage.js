"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStorage = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DataStorage {
    constructor(outputDir = './data') {
        this.outputDir = outputDir;
        this.ensureDirectoryExists();
    }
    ensureDirectoryExists() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }
    saveUserData(steamId, gameStats) {
        const filename = `user_${steamId}_${Date.now()}.json`;
        const filepath = path.join(this.outputDir, filename);
        const data = {
            steamId,
            timestamp: new Date().toISOString(),
            gameStats,
            summary: {
                totalGames: gameStats.length,
                totalAchievements: gameStats.reduce((sum, game) => sum + game.achievements.length, 0),
                completedGames: gameStats.filter(game => game.achievements.length > 0 &&
                    game.achievements.every(ach => ach.achieved === 1)).length
            }
        };
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`User data saved to ${filepath}`);
    }
    saveBatchData(usersData) {
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
    loadResumeData(resumeFile) {
        try {
            const data = fs.readFileSync(resumeFile, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error(`Error loading resume data from ${resumeFile}:`, error);
            return null;
        }
    }
    saveResumeData(data, resumeFile) {
        try {
            fs.writeFileSync(resumeFile, JSON.stringify(data, null, 2));
            console.log(`Resume data saved to ${resumeFile}`);
        }
        catch (error) {
            console.error(`Error saving resume data:`, error);
        }
    }
    getDataFiles() {
        try {
            return fs.readdirSync(this.outputDir)
                .filter(file => file.endsWith('.json'))
                .map(file => path.join(this.outputDir, file));
        }
        catch (error) {
            console.error(`Error reading data directory:`, error);
            return [];
        }
    }
    mergeDataFiles(outputFile) {
        const dataFiles = this.getDataFiles();
        const mergedData = [];
        for (const file of dataFiles) {
            try {
                const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                if (data.users) {
                    mergedData.push(...data.users);
                }
                else if (data.steamId) {
                    mergedData.push(data);
                }
            }
            catch (error) {
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
    cleanupOldFiles(daysToKeep = 7) {
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
        }
        catch (error) {
            console.error(`Error during cleanup:`, error);
        }
    }
}
exports.DataStorage = DataStorage;
