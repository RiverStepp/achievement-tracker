# First Time Setup

## Step 0: Install Required Tools

* Visual Studio 2019

  * Ensure you have "ASP.NET and web development", ".NET desktop development", and "Node.js" selected
* Git
* Node.js
* Microsoft SQL Server
* Microsoft SQL Server Management Studio 2019
* Azure CLI (restart all terminal and PowerShell instances after installing)

## Step 1: Clone the Repository

## Step 2: Configure visual studio

* Go to "Configure Startup Projects"
* Select "Single Startup Project"
* From the dropdown, select "AchievementTracker.Api" as the startup project

## Step 3: Restore API packages

* Go to the console and type "dotnet restore"

## Step 4: Setup the database

* Open Microsoft SQL Server Management Studio 2019
* Install the .bacpac file provided (TODO: ADD LINK TO BACPAC HERE)
* Right click on "Databases", select "Import Data Tier Application", and click "Next"
* Select "Import from local disk" and click "Browse..."
* Select the .bacpac file you just installed and then click "Next". Continue with the rest of the import process. You should be able to continue with default settings

## Step 5: Setup Azure Keyvault

* Open a **PowerShell** instance and type "az login"

  * Note: This command does not always work. Sometimes you will need the following:

  ```
  & "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" login  
  ```
* Sign in with your school account. That way, you get free credits
* Type "Enter" to indicate no changes are needed (when prompted)
* **IGNORE FOR SENIOR DESIGN** Create a new key vault named "achievementtracker-dev"
* Add the following secrets:

  * Steam API Key:

    * Name: Authentication--Steam--ApiKey
    * Secret Value: Your Steam API Key
  * Database Connection String:

    * Name: ConnectionStrings--DefaultConnection
    * Secret Value: Your Database Connection String
  * JWT Signing Key:

    * Name: Jwt--SigningKey
    * Secret Value: Whatever JWT signing key you wish to use

## Step 6: Rerun EF migrations

* Open a PowerShell instance and navigate to the backend folder
* Install dotnet-ef with the following command (note: version 8.0.4 required):

  ```
  dotnet tool install --global dotnet-ef --version 8.0.4
  ```
* cd to the "AchievementTracker.Data" directory
* Execute the following command:

  ```
  dotnet ef database update
  ```

## Step 7: Setup HTTPS (One-time)

Run this command to trust the .NET development certificate:
```powershell
dotnet dev-certs https --trust
```

## Step 8: Run the API from Visual Studio. The API will run on https://localhost:7111.

## Step 9: Restore dependencies & run the frontend

* Open a new PowerShell instance
* cd into frontend folder
* Type "npm i" to restore dependencies
* Type "npm run dev" to start the dev server
* The frontend will now be running on https://localhost:5173.

## Production Deployment

For Azure deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).
