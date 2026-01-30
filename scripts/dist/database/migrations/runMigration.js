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
exports.runMigration = runMigration;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const connection_1 = require("../connection");
/**
 * Run a SQL migration script using mssql driver
 * Note: PRINT statements are not captured by mssql driver
 * For better visibility, the script uses SELECT statements for important messages
 * Usage: npm run migrate [script-file]
 *        or: npx ts-node scripts/src/database/runMigration.ts [script-file]
 */
async function runMigration(scriptPath) {
    console.log(`Reading migration script: ${scriptPath}`);
    // Read the SQL file
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');
    if (!sqlScript) {
        throw new Error(`SQL script file is empty: ${scriptPath}`);
    }
    console.log('Connecting to database...');
    const pool = await (0, connection_1.getConnection)();
    try {
        console.log('Executing migration script...\n');
        console.log('='.repeat(80));
        console.log('NOTE: PRINT statements are not captured by mssql driver.');
        console.log('Use sqlcmd or check SSMS Messages tab to see PRINT output.\n');
        console.log('='.repeat(80) + '\n');
        // Execute script batch-by-batch (split on GO).
        // This is REQUIRED for statements like "CREATE OR ALTER PROCEDURE" which must start a batch.
        // NOTE: This does mean variables declared in one batch are not visible to later batches (that is normal for GO).
        console.log('Executing migration script batch-by-batch (GO-separated)...\n');
        const batches = sqlScript
            .split(/^\s*GO\s*$/gim)
            .map((batch) => batch.trim())
            .filter((batch) => batch.length > 0);
        console.log(`Found ${batches.length} batch(es) to execute\n`);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            if (!batch.trim())
                continue;
            console.log(`\n--- Executing Batch ${i + 1}/${batches.length} ---`);
            try {
                const request = pool.request();
                const result = await request.query(batch);
                if (result.recordset && result.recordset.length > 0) {
                    result.recordset.forEach((row) => {
                        const status = row['Migration Status'] ||
                            row['MigrationStatus'] ||
                            row['Migration Note'] ||
                            row['Migration Error'] ||
                            row['Error Message'] ||
                            row['Migration Warning'];
                        if (status) {
                            console.log(String(status));
                        }
                    });
                }
                console.log('✓ Batch executed successfully');
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`\n✗ Error in batch ${i + 1}:`);
                console.error(errorMessage);
                // Preserve previous behavior: many scripts have their own TRY/CATCH; continue unless obviously fatal.
                if (errorMessage.includes('PRIMARY KEY') ||
                    errorMessage.includes('already exists') ||
                    errorMessage.includes('Cannot define PRIMARY KEY constraint on nullable column') ||
                    errorMessage.includes('There is already an object named')) {
                    console.warn('  (This may be expected - script has error handling, continuing...)');
                }
                else {
                    console.warn('  (Continuing; if this was fatal you may need to fix the script.)');
                }
            }
        }
        // Old batch-by-batch approach (commented out - causes issues with transactions and variable scope)
        /*
        // Split the script by GO statements (SQL Server batch separator)
        const batches = sqlScript
            .split(/^\s*GO\s*$/gim)
            .map(batch => batch.trim())
            .filter(batch => batch.length > 0);
        
        console.log(`Found ${batches.length} batch(es) to execute\n`);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            
            // Skip empty batches
            if (!batch.trim()) {
                continue;
            }
            
            // Skip transaction management in individual batches (handled by script)
            if (batch.trim().toUpperCase().startsWith('BEGIN TRANSACTION') ||
                batch.trim().toUpperCase().startsWith('COMMIT TRANSACTION') ||
                batch.trim().toUpperCase().startsWith('ROLLBACK TRANSACTION')) {
                continue;
            }
            
            console.log(`\n--- Executing Batch ${i + 1}/${batches.length} ---`);
            
            try {
                // Create a new request for each batch
                const request = pool.request();
                
                // Execute the batch
                const result = await request.query(batch);
                
                // If there are results, show them
                if (result.recordset && result.recordset.length > 0) {
                    console.log('\nResults:');
                    console.table(result.recordset);
                }
                
                console.log('✓ Batch executed successfully');
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`\n✗ Error in batch ${i + 1}:`);
                console.error(errorMessage);
                
                // Check if this is a non-fatal error
                if (errorMessage.includes('PRIMARY KEY') ||
                    errorMessage.includes('already exists') ||
                    errorMessage.includes('Cannot define PRIMARY KEY constraint on nullable column') ||
                    errorMessage.includes('There is already an object named')) {
                    console.warn('  (This may be expected - script has error handling, continuing...)');
                } else {
                    console.warn('  (Script has error handling - continuing...)');
                }
            }
        }
        */
        console.log('\n' + '='.repeat(80));
        console.log('\nMigration script execution completed!');
    }
    catch (error) {
        console.error('\nFatal error executing migration:');
        console.error(error);
        throw error;
    }
    finally {
        await (0, connection_1.closeConnection)();
    }
}
// Main execution
async function main() {
    const args = process.argv.slice(2);
    // Check for step parameter (--step N or -s N)
    let stepToRun = null;
    let scriptPath = null;
    for (let i = 0; i < args.length; i++) {
        if ((args[i] === '--step' || args[i] === '-s') && i + 1 < args.length) {
            stepToRun = parseInt(args[i + 1], 10);
            if (isNaN(stepToRun)) {
                console.error(`Invalid step number: ${args[i + 1]}`);
                process.exit(1);
            }
            i++; // Skip the next argument as it's the step number
        }
        else if (!scriptPath && !args[i].startsWith('-')) {
            scriptPath = args[i];
        }
    }
    if (!scriptPath) {
        // Default to migrate-to-new-schema.sql
        const defaultScript = path.join(__dirname, 'migrate-to-new-schema.sql');
        if (fs.existsSync(defaultScript)) {
            scriptPath = defaultScript;
        }
        else {
            console.error('No script file provided and default script not found.');
            console.error('Usage: npx ts-node scripts/src/database/runMigration.ts [script-file] [--step N]');
            console.error('  --step N  Run only step N (1-11). Omit to run all steps.');
            process.exit(1);
        }
    }
    // From here on, scriptPath is known to be a string (help TS understand after earlier null-check).
    const scriptPathStr = scriptPath;
    // Resolve the script path - try relative to current directory, then relative to script directory
    let resolvedPath;
    if (path.isAbsolute(scriptPathStr)) {
        resolvedPath = scriptPathStr;
    }
    else {
        // First try relative to current working directory
        resolvedPath = path.join(process.cwd(), scriptPathStr);
        if (!fs.existsSync(resolvedPath)) {
            // Then try relative to the script's directory
            resolvedPath = path.join(__dirname, scriptPathStr);
        }
        if (!fs.existsSync(resolvedPath)) {
            // Try just the filename in the script directory
            resolvedPath = path.join(__dirname, path.basename(scriptPathStr));
        }
    }
    if (!fs.existsSync(resolvedPath)) {
        console.error(`Script file not found: ${scriptPathStr}`);
        console.error(`Tried paths:`);
        console.error(`  - ${path.isAbsolute(scriptPathStr) ? scriptPathStr : path.join(process.cwd(), scriptPathStr)}`);
        console.error(`  - ${path.join(__dirname, scriptPathStr)}`);
        console.error(`  - ${path.join(__dirname, path.basename(scriptPathStr))}`);
        process.exit(1);
    }
    scriptPath = resolvedPath;
    const resolvedScriptPath = scriptPath;
    if (stepToRun !== null) {
        console.log(`Running Step ${stepToRun} only...`);
        // Modify the SQL script to set @StepToRun variable
        const sqlContent = fs.readFileSync(resolvedScriptPath, 'utf8');
        const modifiedContent = sqlContent.replace(/DECLARE @StepToRun INT = NULL;/, `DECLARE @StepToRun INT = ${stepToRun};`);
        const tempPath = path.join(path.dirname(resolvedScriptPath), `temp-${Date.now()}.sql`);
        fs.writeFileSync(tempPath, modifiedContent);
        try {
            await runMigration(tempPath);
        }
        finally {
            // Clean up temp file
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
    }
    else {
        await runMigration(resolvedScriptPath);
    }
}
// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
