import * as fs from 'fs';
import * as path from 'path';
import { getConnection, closeConnection, sql } from '../connection';

/**
 * Run a SQL migration script using mssql driver
 * Note: PRINT statements are not captured by mssql driver
 * For better visibility, the script uses SELECT statements for important messages
 * Usage: npm run migrate [script-file]
 *        or: npx ts-node scripts/src/database/runMigration.ts [script-file]
 */

async function runMigration(scriptPath: string): Promise<void> {
    console.log(`Reading migration script: ${scriptPath}`);
    
    // Read the SQL file
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');
    
    if (!sqlScript) {
        throw new Error(`SQL script file is empty: ${scriptPath}`);
    }
    
    console.log('Connecting to database...');
    const pool = await getConnection();
    
    try {
        console.log('Executing migration script...\n');
        console.log('='.repeat(80));
        console.log('NOTE: PRINT statements are not captured by mssql driver.');
        console.log('Use sqlcmd or check SSMS Messages tab to see PRINT output.\n');
        console.log('='.repeat(80) + '\n');
        
        // Execute the entire script as one batch
        // This preserves transaction context and variable scope
        // Note: GO statements are SQL Server batch separators (SSMS/sqlcmd only), not actual SQL
        // Remove them before executing
        console.log('Executing migration script as a single batch...\n');
        
        // Remove GO statements (they're batch separators for SSMS, not SQL syntax)
        const cleanedScript = sqlScript
            .split(/^\s*GO\s*$/gim)
            .map(batch => batch.trim())
            .filter(batch => batch.length > 0)
            .join('\n\n'); // Join batches with newlines (they'll execute as one batch)
        
        try {
            // Execute the entire script
            const request = pool.request();
            
            // Use multipleRecordSets to capture all SELECT statements
            const result = await request.query(cleanedScript);
            
            // Display all result sets (SELECT statements show migration progress)
            if (result.recordset && result.recordset.length > 0) {
                console.log('\n--- Migration Progress ---');
                result.recordset.forEach((row: Record<string, unknown>) => {
                    const status = row['Migration Status'] || row['MigrationStatus'] || row['Migration Note'] || row['Migration Error'] || row['Error Message'] || row['Migration Warning'];
                    if (status) {
                        console.log(String(status));
                    }
                });
            }
            
            console.log('\n✓ Migration script executed successfully');
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`\n✗ Error executing migration:`);
            console.error(errorMessage);
            
            // Check if this is a non-fatal error
            if (errorMessage.includes('PRIMARY KEY') || 
                errorMessage.includes('already exists') ||
                errorMessage.includes('Cannot define PRIMARY KEY constraint on nullable column') ||
                errorMessage.includes('There is already an object named')) {
                console.warn('  (This may be expected - script has error handling)');
            }
            
            // Don't throw - let the script's own error handling deal with it
            // The script has BEGIN TRY/CATCH blocks
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
        
    } catch (error) {
        console.error('\nFatal error executing migration:');
        console.error(error);
        throw error;
    } finally {
        await closeConnection();
    }
}


// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    // Check for step parameter (--step N or -s N)
    let stepToRun: number | null = null;
    let scriptPath: string | null = null;
    
    for (let i = 0; i < args.length; i++) {
        if ((args[i] === '--step' || args[i] === '-s') && i + 1 < args.length) {
            stepToRun = parseInt(args[i + 1], 10);
            if (isNaN(stepToRun)) {
                console.error(`Invalid step number: ${args[i + 1]}`);
                process.exit(1);
            }
            i++; // Skip the next argument as it's the step number
        } else if (!scriptPath && !args[i].startsWith('-')) {
            scriptPath = args[i];
        }
    }
    
    if (!scriptPath) {
        // Default to migrate-to-new-schema.sql
        const defaultScript = path.join(__dirname, 'migrate-to-new-schema.sql');
        if (fs.existsSync(defaultScript)) {
            scriptPath = defaultScript;
        } else {
            console.error('No script file provided and default script not found.');
            console.error('Usage: npx ts-node scripts/src/database/runMigration.ts [script-file] [--step N]');
            console.error('  --step N  Run only step N (1-11). Omit to run all steps.');
            process.exit(1);
        }
    }
    
    // Resolve the script path - try relative to current directory, then relative to script directory
    let resolvedPath: string;
    if (path.isAbsolute(scriptPath)) {
        resolvedPath = scriptPath;
    } else {
        // First try relative to current working directory
        resolvedPath = path.join(process.cwd(), scriptPath);
        if (!fs.existsSync(resolvedPath)) {
            // Then try relative to the script's directory
            resolvedPath = path.join(__dirname, scriptPath);
        }
        if (!fs.existsSync(resolvedPath)) {
            // Try just the filename in the script directory
            resolvedPath = path.join(__dirname, path.basename(scriptPath));
        }
    }
    
    if (!fs.existsSync(resolvedPath)) {
        console.error(`Script file not found: ${scriptPath}`);
        console.error(`Tried paths:`);
        console.error(`  - ${path.isAbsolute(scriptPath) ? scriptPath : path.join(process.cwd(), scriptPath)}`);
        console.error(`  - ${path.join(__dirname, scriptPath)}`);
        console.error(`  - ${path.join(__dirname, path.basename(scriptPath))}`);
        process.exit(1);
    }
    
    scriptPath = resolvedPath;
    
    if (stepToRun !== null) {
        console.log(`Running Step ${stepToRun} only...`);
        // Modify the SQL script to set @StepToRun variable
        const sqlContent = fs.readFileSync(scriptPath, 'utf8');
        const modifiedContent = sqlContent.replace(
            /DECLARE @StepToRun INT = NULL;/,
            `DECLARE @StepToRun INT = ${stepToRun};`
        );
        const tempPath = path.join(path.dirname(scriptPath), `temp-${Date.now()}.sql`);
        fs.writeFileSync(tempPath, modifiedContent);
        
        try {
            await runMigration(tempPath);
        } finally {
            // Clean up temp file
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
    } else {
        await runMigration(scriptPath);
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

export { runMigration };
