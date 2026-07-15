param(
    [string]$SymbolsJsonPath = "C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV3\graphify\symbol-index-storage\symbols.json",
    [string]$OutputDir = "C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV3\graphify\graphify-storage"
)

Write-Host "Loading symbols.json..." -ForegroundColor Cyan
$symbols = Get-Content $SymbolsJsonPath -Raw | ConvertFrom-Json

$allPaths = $symbols.files.path | ForEach-Object { $_.Replace("\", "/") }
$allPathsLower = @{}
foreach ($p in $allPaths) { $allPathsLower[$p.ToLower()] = $p }

Write-Host "Resolving imports..." -ForegroundColor Cyan
function Resolve-ImportPath {
    param($sourceFile, $importPath)
    $sourceFile = $sourceFile.Replace("\", "/")
    $importPath = $importPath.Replace("\", "/")
    
    if ($importPath.StartsWith("./") -or $importPath.StartsWith("../")) {
        $dir = Split-Path $sourceFile -Parent
        $dir = $dir.Replace("\", "/")
        $resolved = [System.IO.Path]::GetFullPath((Join-Path $dir $importPath))
        $resolved = $resolved.Replace("\", "/")
        # Remove base path to get relative
        $base = "C:/Users/Windows 10/Desktop/Personal/Studies/Research/EduToolV3/"
        if ($resolved.StartsWith($base)) {
            $resolved = $resolved.Substring($base.Length)
        }
        
        $extensions = @(".ts", ".tsx", ".js", ".jsx", "")
        foreach ($ext in $extensions) {
            $candidate = $resolved + $ext
            if ($allPathsLower.ContainsKey($candidate.ToLower())) {
                return $allPathsLower[$candidate.ToLower()]
            }
        }
        foreach ($ext in @(".ts", ".tsx", ".js", ".jsx")) {
            $candidate = $resolved + "/index" + $ext
            if ($allPathsLower.ContainsKey($candidate.ToLower())) {
                return $allPathsLower[$candidate.ToLower()]
            }
        }
    }
    return $null
}

$imports = @()
$fanIn = @{}
$fanOut = @{}
foreach ($imp in $symbols.imports) {
    $sf = $imp.sourceFile.Replace("\", "/")
    $tgt = Resolve-ImportPath -sourceFile $sf -importPath $imp.importPath
    if ($tgt) {
        $imports += @{source=$sf; target=$tgt}
        if (-not $fanOut.ContainsKey($sf)) { $fanOut[$sf] = @() }
        $fanOut[$sf] += $tgt
        if (-not $fanIn.ContainsKey($tgt)) { $fanIn[$tgt] = 0 }
        $fanIn[$tgt]++
    }
}

# Deduplicate fanOut
$fanOutUnique = @{}
foreach ($k in $fanOut.Keys) {
    $fanOutUnique[$k] = ($fanOut[$k] | Select-Object -Unique)
}

Write-Host "Building symbol stats per file..." -ForegroundColor Cyan
$symPerFile = @{}
foreach ($sym in $symbols.symbols) {
    $fp = $sym.filePath.Replace("\", "/")
    if (-not $symPerFile.ContainsKey($fp)) { $symPerFile[$fp] = @() }
    $symPerFile[$fp] += $sym
}

# ============= FILE SUMMARIES =============
# Create a summary mapping based on file path patterns
Write-Host "Creating file summaries..." -ForegroundColor Cyan

function Get-FileSummary {
    param($path)
    $p = $path.ToLower()
    
    # Backend core
    if ($p -eq "backend/src/main.ts") { return @{summary="Application entry point that bootstraps NestJS with global pipes, filters, interceptors, CORS, and security middleware"; responsibilities=@("Bootstrap NestJS app","Register global middleware","Configure CORS"); features=@("core-infrastructure"); tags=@("entry-point","nestjs","bootstrap")} }
    if ($p -eq "backend/src/app.module.ts") { return @{summary="Root NestJS module importing all domain, core, and utility modules"; responsibilities=@("Aggregate all modules","Configure imports"); features=@("core-infrastructure"); tags=@("module","root")} }
    if ($p -eq "backend/src/app.controller.ts") { return @{summary="Root controller with health-check and favicon endpoints"; responsibilities=@("Health check endpoint"); features=@("core-infrastructure"); tags=@("controller","health")} }
    if ($p -eq "backend/src/app.service.ts") { return @{summary="Simple service providing greeting string for root controller"; responsibilities=@("Provide root greeting"); features=@("core-infrastructure"); tags=@("service")} }
    
    if ($p -like "backend/src/configs/*") {
        if ($p -like "*app.config*") { return @{summary="App configuration (name, port, env) from environment variables"; responsibilities=@("Provide app config"); features=@("configuration"); tags=@("config","env")} }
        if ($p -like "*db.config*") { return @{summary="Database URL configuration from environment"; responsibilities=@("Provide DB config"); features=@("configuration","database"); tags=@("config","database")} }
        if ($p -like "*jwt.config*") { return @{summary="JWT secret and expiration configuration"; responsibilities=@("Provide JWT config"); features=@("configuration","authentication"); tags=@("config","jwt")} }
        if ($p -like "*env.validation*") { return @{summary="Joi validation schema for required environment variables"; responsibilities=@("Validate env vars"); features=@("configuration"); tags=@("config","validation","joi")} }
    }
    
    if ($p -like "backend/src/commons/decorators/*") {
        if ($p -like "*roles*") { return @{summary="Roles decorator for role-based access control metadata"; responsibilities=@("Set role metadata"); features=@("authorization"); tags=@("decorator","rbac")} }
        if ($p -like "*current-user*") { return @{summary="Parameter decorator to extract authenticated user from request"; responsibilities=@("Extract user from request"); features=@("authentication"); tags=@("decorator","user")} }
    }
    
    if ($p -like "backend/src/commons/guards/*") {
        if ($p -like "*auth.guard*") { return @{summary="JWT authentication guard using Passport"; responsibilities=@("Validate JWT tokens"); features=@("authentication"); tags=@("guard","jwt","passport")} }
        if ($p -like "*role.guard*") { return @{summary="Role-based authorization guard checking @Roles() metadata"; responsibilities=@("Enforce role access"); features=@("authorization"); tags=@("guard","rbac")} }
    }
    
    if ($p -like "backend/src/commons/filters/*") {
        if ($p -like "*all-exception*") { return @{summary="Global catch-all exception filter returning structured error JSON"; responsibilities=@("Catch all exceptions","Format errors"); features=@("error-handling"); tags=@("filter","exception")} }
        if ($p -like "*http-exception*") { return @{summary="HTTP exception filter returning structured error response"; responsibilities=@("Format HTTP errors"); features=@("error-handling"); tags=@("filter","http")} }
    }
    
    if ($p -like "backend/src/commons/interceptors/*") {
        if ($p -like "*response*") { return @{summary="Interceptor wrapping responses in {success, data} envelope"; responsibilities=@("Wrap responses"); features=@("core-infrastructure"); tags=@("interceptor","response")} }
        if ($p -like "*logging*") { return @{summary="Interceptor logging request method, URL, ID and response time"; responsibilities=@("Log requests"); features=@("monitoring"); tags=@("interceptor","logging")} }
    }
    
    if ($p -like "backend/src/commons/pipes/*") {
        if ($p -like "*parse-int*") { return @{summary="Pipe validating and transforming string to integer"; responsibilities=@("Parse integers"); features=@("validation"); tags=@("pipe","parse")} }
        if ($p -like "*validation*") { return @{summary="Validation pipe using class-validator to validate DTOs"; responsibilities=@("Validate DTOs","Format errors"); features=@("validation"); tags=@("pipe","validation")} }
    }
    
    if ($p -like "backend/src/commons/utils/*") {
        if ($p -like "*password*") { return @{summary="Utility to generate cryptographically random passwords"; responsibilities=@("Generate passwords"); features=@("user-management"); tags=@("util","password")} }
        if ($p -like "*token*") { return @{summary="JWT token signing and verification utilities"; responsibilities=@("Sign and verify JWTs"); features=@("authentication"); tags=@("util","jwt")} }
        if ($p -like "*hash*") { return @{summary="Password hashing and comparison using bcryptjs"; responsibilities=@("Hash passwords","Compare passwords"); features=@("authentication"); tags=@("util","hash","bcrypt")} }
    }
    
    # Core
    if ($p -like "backend/src/core/core.module*") { return @{summary="Global core module aggregating config, database, logger, AI, and mail"; responsibilities=@("Aggregate core infrastructure"); features=@("infrastructure"); tags=@("module","core")} }
    if ($p -like "backend/src/core/database/*") { 
        if ($p -like "*.module*") { return @{summary="Global database module providing Prisma client service"; responsibilities=@("Provide database access"); features=@("database"); tags=@("module","prisma")} }
        return @{summary="Prisma client service extending PrismaClient with auto-connection lifecycle"; responsibilities=@("Manage DB connection"); features=@("database"); tags=@("provider","prisma")}
    }
    if ($p -like "backend/src/core/logger/*") {
        if ($p -like "*.module*") { return @{summary="Winston logging module providing structured JSON logger"; responsibilities=@("Configure logging"); features=@("logging"); tags=@("module","winston")} }
        return @{summary="Configured Winston logger with JSON format, timestamps, and console transport"; responsibilities=@("Create logger instance"); features=@("logging"); tags=@("logger","winston")}
    }
    if ($p -like "backend/src/core/middleware/*") { return @{summary="Middleware assigning UUID request ID to each HTTP request"; responsibilities=@("Assign request IDs","Set X-Request-Id header"); features=@("observability"); tags=@("middleware","request-id","tracing")} }
    if ($p -like "backend/src/core/scheduler/*") {
        if ($p -like "*.module*") { return @{summary="Module registering scheduled background tasks"; responsibilities=@("Register cron jobs"); features=@("scheduler"); tags=@("module","cron")} }
        return @{summary="Cron tasks for auto grade-lock, closing drafts, archiving notifications, and auto-unenrollment"; responsibilities=@("Auto grade-lock","Close drafts","Archive notifications","Auto-unenroll"); features=@("scheduler","grade-management"); tags=@("cron","tasks")}
    }
    if ($p -like "backend/src/core/ai/*") {
        if ($p -like "*.module*") { return @{summary="Global AI module providing content generation services"; responsibilities=@("Provide AI services"); features=@("ai"); tags=@("module","ai")} }
        if ($p -like "*ai-client*") { return @{summary="HTTP client for OpenRouter API chat completions"; responsibilities=@("Call AI API"); features=@("ai"); tags=@("service","openrouter")} }
        if ($p -like "*ai.service*") { return @{summary="Core AI service for concept extraction, building, and question generation with chunking and retry logic"; responsibilities=@("Extract concepts","Build concepts","Generate questions","Chunk blueprints"); features=@("ai","question-generation"); tags=@("service","ai")} }
        if ($p -like "*constants*") { return @{summary="AI token costs, prompt versions, and system prompt templates"; responsibilities=@("Define AI constants"); features=@("ai"); tags=@("constants","configuration")} }
        if ($p -like "*concept-validator*") { return @{summary="Validates ConceptBuild data structure integrity"; responsibilities=@("Validate concept builds"); features=@("ai","validation"); tags=@("util","validation")} }
        if ($p -like "*json-parser*") { return @{summary="Parses AI response text into JSON with markdown stripping and truncation repair"; responsibilities=@("Parse AI JSON responses"); features=@("ai"); tags=@("util","json")} }
        if ($p -like "*prompt-builder*") { return @{summary="Builds AI prompts for question chunk generation with type-specific examples"; responsibilities=@("Build AI prompts"); features=@("ai","question-generation"); tags=@("util","prompts")} }
        if ($p -like "*types*") { return @{summary="TypeScript interfaces for concept extraction, question generation, and progress types"; responsibilities=@("Define AI types"); features=@("ai"); tags=@("types","interfaces")} }
    }
    
    # Backend Domain Modules
    if ($p -like "backend/src/domains/*") {
        if ($p -like "*academic*") { return @{summary="Domain module aggregating academic calendar feature"; responsibilities=@("Wire academic calendar domain"); features=@("academic-calendar"); tags=@("module","domain")} }
        if ($p -like "*assessment*") { return @{summary="Domain module aggregating assessment feature"; responsibilities=@("Wire assessment domain"); features=@("assessment"); tags=@("module","domain")} }
        if ($p -like "*class*") { return @{summary="Domain module aggregating class management feature"; responsibilities=@("Wire class domain"); features=@("class"); tags=@("module","domain")} }
        if ($p -like "*user*") { return @{summary="Domain module aggregating user management feature"; responsibilities=@("Wire user domain"); features=@("user-management"); tags=@("module","domain")} }
        if ($p -like "*platform*") { return @{summary="Domain module aggregating platform administration feature"; responsibilities=@("Wire platform domain"); features=@("platform"); tags=@("module","domain")} }
        if ($p -like "*system*") { return @{summary="Domain module aggregating system settings feature"; responsibilities=@("Wire system domain"); features=@("system"); tags=@("module","domain")} }
    }
    
    # Backend Module - Auth
    if ($p -like "backend/src/modules/auth/*") {
        if ($p -like "*.module*") { return @{summary="Authentication module with JWT, Passport, and mail dependencies"; responsibilities=@("Wire auth DI"); features=@("authentication"); tags=@("module","auth")} }
        if ($p -like "*.controller*") { return @{summary="REST controller for login, register, OTP, refresh, logout, and profile"; responsibilities=@("Auth HTTP endpoints"); features=@("authentication"); tags=@("controller","auth")} }
        if ($p -like "*.service*") { return @{summary="Core auth business logic: credentials validation, JWT generation, OTP flow, token refresh"; responsibilities=@("Authenticate users","Manage tokens","Handle OTP"); features=@("authentication"); tags=@("service","auth")} }
        if ($p -like "*.repository*") { return @{summary="Data access for auth: accounts, OTPs, registration requests via Prisma"; responsibilities=@("Auth DB operations"); features=@("authentication"); tags=@("repository","prisma")} }
        if ($p -like "*/dto/*") { return @{summary="DTOs for login, register, OTP verification requests with validation"; responsibilities=@("Validate auth requests"); features=@("authentication"); tags=@("dto","validation")} }
        if ($p -like "*/entity/*") { return @{summary="Auth entity types: AuthEntity, TokenPayload, AuthTokens"; responsibilities=@("Define auth types"); features=@("authentication"); tags=@("entity","types")} }
        if ($p -like "*/strategies/*") { return @{summary="Passport JWT strategy validating tokens and checking account status"; responsibilities=@("Validate JWT","Check account status"); features=@("authentication"); tags=@("strategy","passport")} }
    }
    
    # Assessments
    if ($p -like "backend/src/modules/assessment/*") {
        if ($p -like "*.module*") { return @{summary="Assessment module wiring core, educator, and student sub-modules"; responsibilities=@("Wire assessment modules"); features=@("assessment"); tags=@("module")} }
        if ($p -like "*/core/*.module*") { return @{summary="Core assessment module providing shared services and repository"; responsibilities=@("Provide core assessment services"); features=@("assessment"); tags=@("module","core")} }
        if ($p -like "*/core/*.service*") { return @{summary="Core assessment service with business rules, hybrid grading, and response building"; responsibilities=@("Enforce business rules","Calculate scores","Build responses"); features=@("assessment"); tags=@("service","core")} }
        if ($p -like "*/core/*.repository*") { return @{summary="Data access for assessments, questions, and submissions via Prisma"; responsibilities=@("Assessment CRUD","Question management","Submission management"); features=@("assessment"); tags=@("repository","prisma")} }
        if ($p -like "*/dto/*") { return @{summary="DTOs for assessment CRUD, grading, publishing, and question management"; responsibilities=@("Validate assessment requests"); features=@("assessment"); tags=@("dto","validation")} }
        if ($p -like "*/entity/*") { return @{summary="Entity types for Question, Assessment, and Submission"; responsibilities=@("Define assessment entities"); features=@("assessment"); tags=@("entity")} }
        if ($p -like "*/educator/*.module*") { return @{summary="Educator assessment module with controllers, services, and helpers"; responsibilities=@("Wire educator assessment"); features=@("assessment","educator"); tags=@("module","educator")} }
        if ($p -like "*/educator/*.controller*") { return @{summary="Educator REST controller for assessment CRUD, AI generation, grading, publishing"; responsibilities=@("Educator assessment endpoints"); features=@("assessment","educator"); tags=@("controller","educator")} }
        if ($p -like "*/educator/*.service*") { return @{summary="Educator assessment service orchestrating creation, AI generation, publishing, and submissions"; responsibilities=@("Create assessments","Manage submissions","Publish scores","Handle AI preview"); features=@("assessment","educator"); tags=@("service","educator")} }
        if ($p -like "*/educator/assessment-generation*") { return @{summary="Helper managing AI question generation with progress tracking and preview support"; responsibilities=@("Manage AI generation","Track progress","Handle previews"); features=@("assessment","ai"); tags=@("helper","generation")} }
        if ($p -like "*/educator/helpers/*") {
            if ($p -like "*creation*") { return @{summary="Helper for assessment creation validation, grading mode resolution, and persistence"; responsibilities=@("Validate creation","Resolve grading mode"); features=@("assessment"); tags=@("helper","creation")} }
            if ($p -like "*submission*") { return @{summary="Helper for educator submission operations: listing, grading, assignment, reopening"; responsibilities=@("Manage submissions","Grade essays","Reopen assessments"); features=@("assessment","submission"); tags=@("helper","submission")} }
        }
        if ($p -like "*/student/*") {
            if ($p -like "*.module*") { return @{summary="Student assessment module providing endpoints for enrolled students"; responsibilities=@("Wire student assessment"); features=@("assessment","student"); tags=@("module","student")} }
            if ($p -like "*.controller*") { return @{summary="Student REST controller for assessment list, detail, and result viewing"; responsibilities=@("Student assessment endpoints"); features=@("assessment","student"); tags=@("controller","student")} }
            if ($p -like "*.service*") { return @{summary="Student assessment service with enrollment and release guards"; responsibilities=@("Enforce enrollment","Control release visibility"); features=@("assessment","student"); tags=@("service","student")} }
        }
    }
    
    # Grades
    if ($p -like "backend/src/modules/grade/*") {
        if ($p -like "*.module*" -and $p -notlike "*/core/*" -and $p -notlike "*/educator/*" -and $p -notlike "*/student/*") { return @{summary="Root grade module aggregating core, educator, and student sub-modules"; responsibilities=@("Wire grade modules"); features=@("grade"); tags=@("module")} }
        if ($p -like "*.controller*" -and $p -notlike "*/educator/*" -and $p -notlike "*/student/*") { return @{summary="Legacy grade controller for viewing, computing, and setting manual scores"; responsibilities=@("Grade HTTP endpoints"); features=@("grade"); tags=@("controller")} }
        if ($p -like "*.service*" -and $p -notlike "*/core/*" -and $p -notlike "*/educator/*" -and $p -notlike "*/student/*") { return @{summary="Legacy grade service for weighted computation, manual scores, and scale resolution"; responsibilities=@("Compute grades","Resolve scales","Manage manual scores"); features=@("grade"); tags=@("service")} }
        if ($p -like "*.repository*" -and $p -notlike "*/core/*" -and $p -notlike "*/educator/*") { return @{summary="Grade data access: CRUD, scheme/scale resolution, term management via Prisma"; responsibilities=@("Grade DB operations","Resolve schemes","Resolve scales"); features=@("grade"); tags=@("repository","prisma")} }
        if ($p -like "*/dto/*") { return @{summary="DTOs for grade operations like manual score setting"; responsibilities=@("Validate grade requests"); features=@("grade"); tags=@("dto")} }
        if ($p -like "*/entity/*") { return @{summary="Entity types for Grade, ManualScore, and response shapes"; responsibilities=@("Define grade entities"); features=@("grade"); tags=@("entity","types")} }
        if ($p -like "*/core/*.service*") { return @{summary="Core grade computation service with pure functions for weighted scoring, hybrid merging, and category breakdown"; responsibilities=@("Compute weighted scores","Merge hybrid scores","Build category breakdown"); features=@("grade","computation"); tags=@("service","core")} }
        if ($p -like "*/educator/*.controller*") { return @{summary="Educator grade controller for viewing, computing, and locking grades"; responsibilities=@("Educator grade endpoints"); features=@("grade","educator"); tags=@("controller","educator")} }
        if ($p -like "*/educator/*.service*") { return @{summary="Educator grade service for visibility, publish/unlock, computation, and manual scores"; responsibilities=@("Manage grade visibility","Compute grades","Lock/unlock"); features=@("grade","educator"); tags=@("service","educator")} }
        if ($p -like "*/student/*.controller*") { return @{summary="Student grade controller for viewing own grades"; responsibilities=@("Student grade endpoints"); features=@("grade","student"); tags=@("controller","student")} }
        if ($p -like "*/student/*.service*") { return @{summary="Student grade service for viewing grades with lock status"; responsibilities=@("Provide student grades"); features=@("grade","student"); tags=@("service","student")} }
    }
    
    # Grade Lock
    if ($p -like "backend/src/modules/grade-lock/*") {
        if ($p -like "*.module*") { return @{summary="Grade lock module composing settings, operations, requests, and auto-lock services"; responsibilities=@("Wire grade lock modules"); features=@("grade-lock"); tags=@("module")} }
        if ($p -like "*.controller*") { return @{summary="REST controller for grade lock settings, assignment, lock/unlock, and unlock requests"; responsibilities=@("Grade lock endpoints"); features=@("grade-lock"); tags=@("controller")} }
        if ($p -like "*.service*" -and $p -notlike "*-*") { return @{summary="Facade service delegating to specialized sub-services for grade lock operations"; responsibilities=@("Coordinate lock services"); features=@("grade-lock"); tags=@("service","facade")} }
        if ($p -like "*.repository*") { return @{summary="Data access for grade lock settings, locks, events, and unlock requests"; responsibilities=@("Lock DB operations"); features=@("grade-lock"); tags=@("repository","prisma")} }
        if ($p -like "*-auto*") { return @{summary="Auto-lock service that locks classes past their deadline"; responsibilities=@("Auto-lock expired classes"); features=@("grade-lock","scheduler"); tags=@("service","auto-lock")} }
        if ($p -like "*-requests*") { return @{summary="Unlock request service handling educator requests and admin grant/deny workflow"; responsibilities=@("Handle unlock requests"); features=@("grade-lock"); tags=@("service","requests")} }
        if ($p -like "*-settings*") { return @{summary="Grade lock settings management service"; responsibilities=@("Manage lock settings"); features=@("grade-lock"); tags=@("service","settings")} }
        if ($p -like "*-operations*") { return @{summary="Grade lock operations service for assigning, locking, unlocking, and overriding"; responsibilities=@("Assign settings","Lock/unlock classes"); features=@("grade-lock"); tags=@("service","operations")} }
        if ($p -like "*.utils*") { return @{summary="Grade lock utility functions for deadline resolution and lock data hydration"; responsibilities=@("Resolve deadlines","Hydrate lock data"); features=@("grade-lock"); tags=@("util")} }
        if ($p -like "*.validator*") { return @{summary="Validator service for grade lock operations: edit permissions and readiness checks"; responsibilities=@("Validate grade edits","Check readiness"); features=@("grade-lock","validation"); tags=@("validator")} }
        if ($p -like "*/dto/*") { return @{summary="DTOs for all grade lock operations"; responsibilities=@("Validate lock requests"); features=@("grade-lock"); tags=@("dto")} }
    }
    
    # Catch-all for backend module files based on their module name
    if ($p -match 'backend/src/modules/([^/]+)/') {
        $moduleName = $matches[1]
        $isController = $p -like "*.controller*"
        $isService = $p -like "*.service*"
        $isModule = $p -like "*.module*"
        $isRepository = $p -like "*.repository*"
        $isDto = $p -like "*/dto/*"
        $isEntity = $p -like "*/entity/*"
        
        $featureName = $moduleName -replace '-', ' '
        $featureTag = $moduleName
        
        if ($featureName -eq "org seeder") { $featureName = "org-seeder"; $featureTag = "org-seeder" }
        if ($featureName -eq "org enrollment setting") { $featureName = "org-enrollment-setting"; $featureTag = "org-enrollment-setting" }
        if ($featureName -eq "grading scheme template") { $featureName = "grading-scheme-template"; $featureTag = "grading-scheme-template" }
        if ($featureName -eq "student enrollment") { $featureName = "student-enrollment"; $featureTag = "student-enrollment" }
        if ($featureName -eq "subject prerequisite") { $featureName = "subject-prerequisite"; $featureTag = "subject-prerequisite" }
        if ($featureName -eq "platform registration") { $featureName = "platform-registration"; $featureTag = "platform-registration" }
        if ($featureName -eq "school year") { $featureName = "school-year"; $featureTag = "school-year" }
        if ($featureName -eq "audit log") { $featureName = "audit-log"; $featureTag = "audit-log" }
        if ($featureName -eq "grading scale") { $featureName = "grading-scale"; $featureTag = "grading-scale" }
        if ($featureName -eq "grading scheme") { $featureName = "grading-scheme"; $featureTag = "grading-scheme" }
        if ($featureName -eq "semester template") { $featureName = "semester-template"; $featureTag = "semester-template" }

        if ($isModule) { return @{summary="${featureName} NestJS module wiring dependencies"; responsibilities=@("Wire ${featureName} module"); features=@($featureTag); tags=@("module",$featureTag)} }
        if ($isController) { return @{summary="REST controller for ${featureName} CRUD operations"; responsibilities=@("${featureName} HTTP endpoints"); features=@($featureTag); tags=@("controller",$featureTag)} }
        if ($isService) { return @{summary="Business logic service for ${featureName} operations"; responsibilities=@("${featureName} business logic"); features=@($featureTag); tags=@("service",$featureTag)} }
        if ($isRepository) { return @{summary="Data access layer for ${featureName} via Prisma"; responsibilities=@("${featureName} DB operations"); features=@($featureTag); tags=@("repository","prisma")} }
        if ($isDto) { return @{summary="DTOs for ${featureName} request validation"; responsibilities=@("Validate ${featureName} requests"); features=@($featureTag); tags=@("dto","validation")} }
        if ($isEntity) { return @{summary="Entity types defining ${featureName} data shapes"; responsibilities=@("Define ${featureName} entities"); features=@($featureTag); tags=@("entity","types")} }
    }
    
    # Health
    if ($p -like "backend/src/modules/health/*") {
        if ($p -like "*.controller*") { return @{summary="Health check controller returning status, message, and timestamp"; responsibilities=@("Health check endpoint"); features=@("health"); tags=@("controller","health")} }
        return @{summary="Health check module"; responsibilities=@("Register health check"); features=@("health"); tags=@("module","health")}
    }
    
    # Upload
    if ($p -like "backend/src/modules/upload/*") {
        if ($p -like "*.controller*") { return @{summary="File upload controller accepting multipart file uploads"; responsibilities=@("Handle file uploads"); features=@("upload"); tags=@("controller","upload")} }
        if ($p -like "*.service*") { return @{summary="File upload service saving files to uploads directory"; responsibilities=@("Save files"); features=@("upload"); tags=@("service","upload")} }
        return @{summary="File upload module"; responsibilities=@("Wire upload module"); features=@("upload"); tags=@("module","upload")}
    }
    
    # Seeds
    if ($p -like "backend/src/seeds/*") {
        if ($p -like "*start*") { return @{summary="Database seeding entry point"; responsibilities=@("Seed database"); features=@("seeding"); tags=@("seed","database")} }
        if ($p -like "*drop*") { return @{summary="Database drop utility for development"; responsibilities=@("Drop database"); features=@("seeding"); tags=@("seed","utility")} }
    }

    # Tests
    if ($p -like "backend/test/*") { return @{summary="E2E test specification"; responsibilities=@("E2E testing"); features=@("testing"); tags=@("test","e2e")} }
    if ($p -like "**/__TEST__/*") { return @{summary="Unit tests for corresponding service/controller"; responsibilities=@("Unit testing"); features=@("testing"); tags=@("test","unit")} }
    if ($p -like "**/__tests__/*") { return @{summary="Unit tests for corresponding component"; responsibilities=@("Unit testing"); features=@("testing"); tags=@("test","unit")} }
    
    # Frontend
    # API layer
    if ($p -like "frontend/src/api/client*") { return @{summary="Axios HTTP client instance with interceptors for auth and error handling"; responsibilities=@("Configure HTTP client","Handle auth tokens"); features=@("frontend","api"); tags=@("api","client","axios")} }
    if ($p -like "frontend/src/api/auth*") { return @{summary="Authentication API calls (login, register, OTP, refresh, logout)"; responsibilities=@("Auth API calls"); features=@("frontend","authentication"); tags=@("api","auth")} }
    if ($p -like "frontend/src/api/admin/*") { return @{summary="Admin portal API calls for ${moduleName} management"; responsibilities=@("Admin API calls"); features=@("frontend","admin"); tags=@("api","admin")} }
    if ($p -like "frontend/src/api/educator/*") { return @{summary="Educator portal API calls for ${moduleName} operations"; responsibilities=@("Educator API calls"); features=@("frontend","educator"); tags=@("api","educator")} }
    if ($p -like "frontend/src/api/student/*") { return @{summary="Student portal API calls for ${moduleName} operations"; responsibilities=@("Student API calls"); features=@("frontend","student"); tags=@("api","student")} }
    if ($p -like "frontend/src/api/platform/*") { return @{summary="Platform admin API calls"; responsibilities=@("Platform API calls"); features=@("frontend","platform"); tags=@("api","platform")} }
    if ($p -like "frontend/src/api/transcript*") { return @{summary="Transcript download API calls"; responsibilities=@("Transcript API calls"); features=@("frontend","transcript"); tags=@("api","transcript")} }
    
    # Store / Context
    if ($p -like "frontend/src/store/*") {
        if ($p -like "*auth*") { return @{summary="Zustand auth store managing tokens, user state, and login/logout actions"; responsibilities=@("Manage auth state"); features=@("frontend","authentication"); tags=@("store","auth","zustand")} }
        if ($p -like "*meeting*") { return @{summary="Zustand store for meeting room state (participants, media, chat)"; responsibilities=@("Manage meeting state"); features=@("frontend","meeting"); tags=@("store","meeting","zustand")} }
        if ($p -like "*notification*") { return @{summary="Zustand store for notification state"; responsibilities=@("Manage notification state"); features=@("frontend","notification"); tags=@("store","notification","zustand")} }
    }
    
    if ($p -like "frontend/src/context/*") {
        if ($p -like "*Auth*") { return @{summary="React context providing authentication state and methods app-wide"; responsibilities=@("Provide auth context"); features=@("frontend","authentication"); tags=@("context","auth")} }
        if ($p -like "*Sidebar*") { return @{summary="React context managing sidebar collapse/expand state"; responsibilities=@("Manage sidebar state"); features=@("frontend","layout"); tags=@("context","sidebar")} }
    }
    
    # Hooks
    if ($p -like "frontend/src/hooks/admin/*") { return @{summary="React hook for admin data fetching with TanStack Query"; responsibilities=@("Fetch admin data","Manage cache"); features=@("frontend","admin"); tags=@("hook","react-query")} }
    if ($p -like "frontend/src/hooks/educator/*") { return @{summary="React hook for educator data fetching with TanStack Query"; responsibilities=@("Fetch educator data"); features=@("frontend","educator"); tags=@("hook","react-query")} }
    if ($p -like "frontend/src/hooks/student/*") { return @{summary="React hook for student data fetching with TanStack Query"; responsibilities=@("Fetch student data"); features=@("frontend","student"); tags=@("hook","react-query")} }
    if ($p -like "frontend/src/hooks/meeting/*") {
        if ($p -like "*MeetingContext*") { return @{summary="React context for real-time meeting state (Agora, participants, chat)"; responsibilities=@("Provide meeting context"); features=@("frontend","meeting"); tags=@("hook","meeting")} }
        if ($p -like "*useAgora*") { return @{summary="Custom hook for Agora RTC video/audio stream management"; responsibilities=@("Manage media streams"); features=@("frontend","meeting"); tags=@("hook","agora","webrtc")} }
        return @{summary="React hook for meeting real-time features"; responsibilities=@("Handle meeting features"); features=@("frontend","meeting"); tags=@("hook","meeting")}
    }
    if ($p -like "frontend/src/hooks/useAuth*") { return @{summary="Auth hook providing login, register, logout, and user state"; responsibilities=@("Provide auth actions"); features=@("frontend","authentication"); tags=@("hook","auth")} }
    if ($p -like "frontend/src/hooks/useRole*") { return @{summary="Hook for determining user role and permissions"; responsibilities=@("Determine user role"); features=@("frontend","authentication"); tags=@("hook","role")} }
    if ($p -like "frontend/src/hooks/useMediaQuery*") { return @{summary="Hook for responsive design breakpoint matching"; responsibilities=@("Match media queries"); features=@("frontend"); tags=@("hook","responsive")} }
    
    # App pages
    if ($p -like "frontend/src/app/layout*") { return @{summary="Root layout with providers, fonts, and global styles"; responsibilities=@("Render root layout"); features=@("frontend"); tags=@("layout","app")} }
    if ($p -like "frontend/src/app/page*") { return @{summary="Landing/home page component"; responsibilities=@("Render home page"); features=@("frontend"); tags=@("page","landing")} }
    if ($p -like "frontend/src/app/login/*") { return @{summary="Login page with form and authentication"; responsibilities=@("Render login page"); features=@("frontend","authentication"); tags=@("page","login")} }
    if ($p -like "frontend/src/app/register/*") { return @{summary="Registration page for new organizations"; responsibilities=@("Render registration page"); features=@("frontend","registration"); tags=@("page","register")} }
    if ($p -like "frontend/src/app/providers*") { return @{summary="App-wide providers: QueryClient, Auth, Theme, Sidebar"; responsibilities=@("Wrap app with providers"); features=@("frontend"); tags=@("providers","react")} }
    
    if ($p -like "frontend/src/app/admin/*") {
        if ($p -like "*/layout*") { return @{summary="Admin portal layout with sidebar navigation"; responsibilities=@("Render admin layout"); features=@("frontend","admin"); tags=@("layout","admin")} }
        return @{summary="Admin portal page for ${moduleName} management"; responsibilities=@("Render admin page"); features=@("frontend","admin"); tags=@("page","admin")}
    }
    if ($p -like "frontend/src/app/educator/*") {
        if ($p -like "*/layout*") { return @{summary="Educator portal layout with sidebar navigation"; responsibilities=@("Render educator layout"); features=@("frontend","educator"); tags=@("layout","educator")} }
        return @{summary="Educator portal page for ${moduleName}"; responsibilities=@("Render educator page"); features=@("frontend","educator"); tags=@("page","educator")}
    }
    if ($p -like "frontend/src/app/student/*") {
        if ($p -like "*/layout*") { return @{summary="Student portal layout with sidebar navigation"; responsibilities=@("Render student layout"); features=@("frontend","student"); tags=@("layout","student")} }
        return @{summary="Student portal page for ${moduleName}"; responsibilities=@("Render student page"); features=@("frontend","student"); tags=@("page","student")}
    }
    if ($p -like "frontend/src/app/platform/*") {
        if ($p -like "*/layout*") { return @{summary="Platform admin layout"; responsibilities=@("Render platform layout"); features=@("frontend","platform"); tags=@("layout","platform")} }
        return @{summary="Platform admin page for ${moduleName}"; responsibilities=@("Render platform page"); features=@("frontend","platform"); tags=@("page","platform")}
    }
    if ($p -like "frontend/src/app/docs/*") { return @{summary="Documentation/help page"; responsibilities=@("Render documentation"); features=@("frontend","docs"); tags=@("page","docs")} }
    
    # Components
    if ($p -like "frontend/src/components/shared/*") { return @{summary="Shared UI component: ${moduleName}"; responsibilities=@("Provide reusable UI"); features=@("frontend","ui"); tags=@("component","shared","ui")} }
    if ($p -like "frontend/src/components/ui/*") { return @{summary="Base UI primitive component (shadcn/ui)"; responsibilities=@("Provide base UI"); features=@("frontend","ui"); tags=@("component","ui","shadcn")} }
    if ($p -like "frontend/src/components/layout/*") { return @{summary="Layout component: ${moduleName}"; responsibilities=@("Render layout shell"); features=@("frontend","layout"); tags=@("component","layout")} }
    if ($p -like "frontend/src/components/admin/*") { return @{summary="Admin UI component for ${moduleName}"; responsibilities=@("Render admin component"); features=@("frontend","admin"); tags=@("component","admin")} }
    if ($p -like "frontend/src/components/educator/*") { return @{summary="Educator UI component for ${moduleName}"; responsibilities=@("Render educator component"); features=@("frontend","educator"); tags=@("component","educator")} }
    if ($p -like "frontend/src/components/student/*") { return @{summary="Student UI component for ${moduleName}"; responsibilities=@("Render student component"); features=@("frontend","student"); tags=@("component","student")} }
    if ($p -like "frontend/src/components/meeting/*") { return @{summary="Meeting UI component for real-time collaboration features"; responsibilities=@("Render meeting component"); features=@("frontend","meeting"); tags=@("component","meeting")} }
    if ($p -like "frontend/src/components/landing/*") { return @{summary="Landing page UI section component"; responsibilities=@("Render landing section"); features=@("frontend","landing"); tags=@("component","landing")} }
    if ($p -like "frontend/src/components/platform/*") { return @{summary="Platform admin UI component"; responsibilities=@("Render platform component"); features=@("frontend","platform"); tags=@("component","platform")} }
    
    # Lib/Utils
    if ($p -like "frontend/src/lib/*") {
        if ($p -like "*utils*") { return @{summary="General utility functions (cn, formatting)"; responsibilities=@("Provide utilities"); features=@("frontend"); tags=@("util")} }
        if ($p -like "*email*") { return @{summary="Email composition utility for building full email URLs"; responsibilities=@("Build email URLs"); features=@("frontend"); tags=@("util","email")} }
        if ($p -like "*error*") { return @{summary="Error handling utilities for API error formatting"; responsibilities=@("Handle API errors"); features=@("frontend"); tags=@("util","errors")} }
        if ($p -like "*palette*") { return @{summary="Color palette utility constants"; responsibilities=@("Provide colors"); features=@("frontend"); tags=@("util","colors")} }
        if ($p -like "*presentation*") { return @{summary="Presentation template definitions and utilities"; responsibilities=@("Provide presentation templates"); features=@("frontend","presentation"); tags=@("util","presentations")} }
        if ($p -like "*query-client*") { return @{summary="TanStack Query client configuration"; responsibilities=@("Configure query client"); features=@("frontend"); tags=@("config","react-query")} }
    }
    
    if ($p -like "frontend/src/utils/*") {
        if ($p -like "*classes*") { return @{summary="Utility for merging CSS class names"; responsibilities=@("Merge class names"); features=@("frontend"); tags=@("util","css")} }
        if ($p -like "*csv*") { return @{summary="CSV file parsing utility"; responsibilities=@("Parse CSV files"); features=@("frontend"); tags=@("util","csv")} }
        if ($p -like "*date*") { return @{summary="Date formatting and manipulation utilities"; responsibilities=@("Format dates"); features=@("frontend"); tags=@("util","date")} }
        return @{summary="General utility functions"; responsibilities=@("Provide utilities"); features=@("frontend"); tags=@("util")}
    }
    
    if ($p -like "frontend/src/types/*") { return @{summary="TypeScript type definitions for ${moduleName}"; responsibilities=@("Define types"); features=@("frontend"); tags=@("types","typescript")} }
    if ($p -like "frontend/src/config/*") { return @{summary="Frontend API configuration constants"; responsibilities=@("Configure API"); features=@("frontend"); tags=@("config")} }
    if ($p -like "frontend/src/styles/*") { return @{summary="Global CSS stylesheet"; responsibilities=@("Define styles"); features=@("frontend"); tags=@("styles","css")} }
    
    # Default
    return @{summary="Source file in the ${moduleName} module"; responsibilities=@(); features=@(); tags=@()}
}

# ============= BUILD NODES =============
Write-Host "Building nodes..." -ForegroundColor Cyan
$global:totalNodes = $symbols.files.Count
$nodes = @()

foreach ($file in $symbols.files) {
    $fp = $file.path.Replace("\", "/")
    $syms = if ($symPerFile.ContainsKey($fp)) { $symPerFile[$fp] } else { @() }
    
    $info = Get-FileSummary -path $fp
    $label = Split-Path $fp -Leaf
    $dir = Split-Path $fp -Parent
    
    # Stats
    $exported = ($syms | Where-Object { $_.isExported }).Count
    $functions = ($syms | Where-Object { $_.type -eq "function" }).Count
    $classes = ($syms | Where-Object { $_.type -eq "class" }).Count
    $methods = ($syms | Where-Object { $_.type -eq "method" }).Count
    $variables = ($syms | Where-Object { $_.type -eq "variable" }).Count
    
    # Symbol summaries - include key symbols
    $nodeSymbols = @()
    $processed = @{}
    foreach ($sym in $syms) {
        if ($sym.type -in @("function","class","method")) {
            if ($processed.ContainsKey($sym.name)) { continue }
            $processed[$sym.name] = $true
            # Determine role based on name and pattern
            $role = "member"
            if ($sym.type -eq "class") {
                if ($sym.name -like "*Controller") { $role = "controller" }
                elseif ($sym.name -like "*Service") { $role = "service" }
                elseif ($sym.name -like "*Repository") { $role = "repository" }
                elseif ($sym.name -like "*Module") { $role = "module" }
                elseif ($sym.name -like "*Guard") { $role = "guard" }
                elseif ($sym.name -like "*Filter") { $role = "filter" }
                elseif ($sym.name -like "*Interceptor") { $role = "interceptor" }
                elseif ($sym.name -like "*Pipe") { $role = "pipe" }
                elseif ($sym.name -like "*Entity") { $role = "entity" }
                elseif ($sym.name -like "*Dto" -or $sym.name -like "*DTO") { $role = "dto" }
                elseif ($sym.name -like "*Strategy") { $role = "strategy" }
                elseif ($sym.name -like "*Gateway") { $role = "gateway" }
                elseif ($sym.name -like "*Helper") { $role = "helper" }
                elseif ($sym.name -like "*Validator") { $role = "validator" }
                elseif ($sym.name -like "*Decorator") { $role = "decorator" }
                else { $role = "class" }
            } elseif ($sym.type -eq "function") {
                if ($sym.name -like "*bootstrap" -or $sym.name -like "*main") { $role = "entry point" }
                elseif ($sym.name -like "*create*" -or $sym.name -like "*update*" -or $sym.name -like "*delete*") { $role = "command" }
                elseif ($sym.name -like "*find*" -or $sym.name -like "*get*" -or $sym.name -like "*list*") { $role = "query" }
                elseif ($sym.name -like "*validate*" -or $sym.name -like "*assert*" -or $sym.name -like "*check*") { $role = "validator" }
                elseif ($sym.name -like "*map*" -or $sym.name -like "*build*" -or $sym.name -like "*format*") { $role = "mapper" }
                elseif ($sym.name -like "*generate*") { $role = "utility" }
                elseif ($sym.name -like "*handle*") { $role = "handler" }
                elseif ($sym.name -like "*intercept*") { $role = "interceptor" }
                elseif ($sym.name -like "*transform*") { $role = "pipe" }
                else { $role = "function" }
            } elseif ($sym.type -eq "method") {
                $role = "method"
            }
            
            $nodeSymbols += @{
                name = $sym.name
                type = $sym.type
                line = $sym.line
                signature = $sym.signature
                purpose = "${role}: ${sym.name}"  # Will be overwritten for important files
                role = $role
            }
        }
    }
    
    $fanInFile = if ($fanIn.ContainsKey($fp)) { $fanIn[$fp] } else { 0 }
    $fanOutFile = if ($fanOutUnique.ContainsKey($fp)) { ($fanOutUnique[$fp]).Count } else { 0 }
    $degree = $fanInFile + $fanOutFile
    $centrality = if ($global:totalNodes -gt 1) { [Math]::Round($degree / ($global:totalNodes - 1), 4) } else { 0 }
    
    $node = @{
        id = "file-$fp"
        type = "file"
        label = $label
        filePath = $fp
        language = $file.language
        summary = $info.summary
        responsibilities = $info.responsibilities
        features = $info.features
        tags = $info.tags
        stats = @{
            totalSymbols = $syms.Count
            exportedSymbols = $exported
            functions = $functions
            classes = $classes
            methods = $methods
            variables = $variables
        }
        symbols = $nodeSymbols
        summarySource = "ai"
        centrality = @{
            fanIn = $fanInFile
            fanOut = $fanOutFile
            degree = $degree
            centrality = $centrality
            importCount = $fanOutFile
            importedByCount = $fanInFile
            inDegree = $fanInFile
            outDegree = $fanOutFile
        }
        graphVersion = 2
        updatedAt = (Get-Date -Format "o")
        structureHash = ""
        contentHash = ""
        generationMode = "ai_generated"
    }
    $nodes += $node
}

# ============= BUILD EDGES =============
Write-Host "Building edges..." -ForegroundColor Cyan
$edges = @()

# Import edges
foreach ($imp in $imports) {
    $edges += @{
        source = "file-$($imp.source)"
        target = "file-$($imp.target)"
        type = "IMPORTS"
        weight = 2
        description = "File imports symbols from target"
    }
}

# Semantic edges based on patterns
# ORCHESTRATES: main.ts -> app.module, app.module -> domain modules
$mainNode = "file-backend/src/main.ts"
$appModuleNode = "file-backend/src/app.module.ts"
$edges += @{source=$mainNode; target=$appModuleNode; type="ORCHESTRATES"; weight=3; description="Main process bootstraps the root AppModule"}

# PROVIDES_TO: Module exports -> Controller uses -> Service uses -> Repository uses
# We can derive some from import chains
$moduleServiceMap = @{
    "auth" = @("controller","service","repository")
    "assessment" = @("controller","service","repository")
    "grade" = @("controller","service","repository")
    "class" = @("controller","service","repository")
    "attendance" = @("controller","service","repository")
    "course" = @("controller","service","repository")
    "educator" = @("controller","service","repository")
    "enrollment" = @("controller","service","repository")
    "lesson" = @("controller","service","repository")
    "meeting" = @("controller","service","repository","gateway")
    "notification" = @("controller","service","repository")
    "organization" = @("controller","service","repository")
    "student" = @("controller","service","repository")
    "subject" = @("controller","service","repository")
    "grade-lock" = @("controller","service","repository")
    "grading-scale" = @("controller","service","repository")
    "grading-scheme" = @("controller","service","repository")
}

foreach ($kv in $moduleServiceMap.GetEnumerator()) {
    $mod = $kv.Key
    $svcs = $kv.Value
    # Module -> Controller/Hub relationships
    # This creates DEPENDS_ON edges between layers
}

# CROSS_CUTTING: Utilities used across modules
$coreUtils = @(
    "backend/src/commons/utils/password.util.ts",
    "backend/src/commons/utils/token.util.ts",
    "backend/src/commons/utils/hash.util.ts"
)
$coreDb = @(
    "backend/src/core/database/database.provider.ts",
    "backend/src/core/database/database.module.ts"
)
$coreLogger = @(
    "backend/src/core/logger/logger.ts",
    "backend/src/core/logger/logger.module.ts"
)

# Add COLLABORATES_WITH edges for files in same module directory
$dirGroups = @{}
foreach ($fp in $allPaths) {
    $dir = Split-Path $fp -Parent
    if (-not $dirGroups.ContainsKey($dir)) { $dirGroups[$dir] = @() }
    $dirGroups[$dir] += $fp
}

$addedEdges = @{}
foreach ($dir in $dirGroups.Keys) {
    $files = $dirGroups[$dir]
    $moduleName = ($dir -split '/')[-1]
    # Only add for backend module directories with 2+ files
    if ($dir -like "backend/src/modules/*") {
        $controllers = $files | Where-Object { $_ -like "*.controller*" }
        $services = $files | Where-Object { $_ -like "*.service*" -and $_ -notlike "*-*" }
        $repos = $files | Where-Object { $_ -like "*.repository*" }
        $modules = $files | Where-Object { $_ -like "*.module*" }
        
        foreach ($mod in $modules) {
            foreach ($ctrl in $controllers) {
                $ek = "COLLABORATES_WITH:$($mod):$($ctrl)"
                if (-not $addedEdges.ContainsKey($ek)) {
                    $edges += @{source="file-$mod"; target="file-$ctrl"; type="COLLABORATES_WITH"; weight=1; description="Module registers controller for $moduleName feature"}
                    $addedEdges[$ek] = $true
                }
            }
            foreach ($svc in $services) {
                $ek = "COLLABORATES_WITH:$($mod):$($svc)"
                if (-not $addedEdges.ContainsKey($ek)) {
                    $edges += @{source="file-$mod"; target="file-$svc"; type="COLLABORATES_WITH"; weight=1; description="Module provides service for $moduleName feature"}
                    $addedEdges[$ek] = $true
                }
            }
            foreach ($rp in $repos) {
                $ek = "COLLABORATES_WITH:$($mod):$($rp)"
                if (-not $addedEdges.ContainsKey($ek)) {
                    $edges += @{source="file-$mod"; target="file-$rp"; type="COLLABORATES_WITH"; weight=1; description="Module provides repository for $moduleName feature"}
                    $addedEdges[$ek] = $true
                }
            }
        }
        
        # Controller -> Service -> Repository chain
        foreach ($ctrl in $controllers) {
            foreach ($svc in $services) {
                $ek = "ORCHESTRATES:$($ctrl):$($svc)"
                if (-not $addedEdges.ContainsKey($ek)) {
                    $edges += @{source="file-$ctrl"; target="file-$svc"; type="ORCHESTRATES"; weight=2; description="Controller delegates business logic to service"}
                    $addedEdges[$ek] = $true
                }
            }
        }
        foreach ($svc in $services) {
            foreach ($rp in $repos) {
                $ek = "DEPENDS_ON:$($svc):$($rp)"
                if (-not $addedEdges.ContainsKey($ek)) {
                    $edges += @{source="file-$svc"; target="file-$rp"; type="DEPENDS_ON"; weight=2; description="Service depends on repository for data access"}
                    $addedEdges[$ek] = $true
                }
            }
        }
    }
    
    # Core AI module internal edges
    if ($dir -like "backend/src/core/ai") {
        $aiServiceFile = $files | Where-Object { $_ -like "*ai.service*" }
        $aiClientFile = $files | Where-Object { $_ -like "*ai-client*" }
        $promptBuilder = $files | Where-Object { $_ -like "*prompt-builder*" }
        $jsonParser = $files | Where-Object { $_ -like "*json-parser*" }
        $conceptValidator = $files | Where-Object { $_ -like "*concept-validator*" }
        $constants = $files | Where-Object { $_ -like "*constants*" }
        
        if ($aiServiceFile -and $aiClientFile) {
            $edges += @{source="file-$aiServiceFile"; target="file-$aiClientFile"; type="DEPENDS_ON"; weight=3; description="AI service calls AI client for API requests"}
            $addedEdges["DEPENDS_ON:$($aiServiceFile):$($aiClientFile)"] = $true
        }
        if ($aiServiceFile -and $promptBuilder) {
            $edges += @{source="file-$aiServiceFile"; target="file-$promptBuilder"; type="DEPENDS_ON"; weight=2; description="AI service uses prompt builder for generating prompts"}
            $addedEdges["DEPENDS_ON:$($aiServiceFile):$($promptBuilder)"] = $true
            }
            if ($aiServiceFile -and $jsonParser) {
                $edges += @{source="file-$aiServiceFile"; target="file-$jsonParser"; type="DEPENDS_ON"; weight=2; description="AI service uses JSON parser for response parsing"}
                $addedEdges["DEPENDS_ON:$($aiServiceFile):$($jsonParser)"] = $true
            }
            if ($aiServiceFile -and $conceptValidator) {
                $edges += @{source="file-$aiServiceFile"; target="file-$conceptValidator"; type="DEPENDS_ON"; weight=2; description="AI service uses concept validator"}
                $addedEdges["DEPENDS_ON:$($aiServiceFile):$($conceptValidator)"] = $true
            }
            if ($aiServiceFile -and $constants) {
                $edges += @{source="file-$aiServiceFile"; target="file-$constants"; type="DEPENDS_ON"; weight=1; description="AI service references constants"}
                $addedEdges["DEPENDS_ON:$($aiServiceFile):$($constants)"] = $true
        }
    }
}

# ============= BUILD FEATURES =============
Write-Host "Building features..." -ForegroundColor Cyan

$features = @{
    "core-infrastructure" = @{
        description = "Core application infrastructure: bootstrap, configuration, middleware, interceptors, pipes, and global exception filters"
        color = "#4A90D9"
        files = @("backend/src/main.ts","backend/src/app.module.ts","backend/src/app.controller.ts","backend/src/app.service.ts")
    }
    "configuration" = @{
        description = "Application configuration loaded from environment variables with Joi validation"
        color = "#7B61FF"
        files = @()
    }
    "error-handling" = @{
        description = "Global exception filters for structured error responses"
        color = "#E74C3C"
        files = @()
    }
    "authentication" = @{
        description = "Authentication system: JWT-based auth with Passport, login, register, OTP, token refresh, and guards"
        color = "#2ECC71"
        files = @()
    }
    "authorization" = @{
        description = "Role-based access control with @Roles() decorator and RolesGuard"
        color = "#F39C12"
        files = @()
    }
    "validation" = @{
        description = "Request validation using class-validator pipes and custom validators"
        color = "#9B59B6"
        files = @()
    }
    "database" = @{
        description = "SQLite/PostgreSQL database access via Prisma ORM with global DatabaseService provider"
        color = "#3498DB"
        files = @()
    }
    "ai" = @{
        description = "AI-powered content generation: concept extraction, concept building, and question generation via OpenRouter API"
        color = "#E91E63"
        files = @()
    }
    "logging" = @{
        description = "Structured logging with Winston, request logging interceptor, and request ID tracing"
        color = "#1ABC9C"
        files = @()
    }
    "scheduler" = @{
        description = "Scheduled background tasks: auto grade-lock, draft cleanup, notification archiving, and auto-unenrollment"
        color = "#34495E"
        files = @()
    }
    "academic-calendar" = @{
        description = "Academic calendar management: holidays, breaks, program calendars, and term date assignment"
        color = "#16A085"
        files = @()
    }
    "assessment" = @{
        description = "Assessment system: create, manage, and grade assessments with AI question generation, hybrid grading, and score publishing"
        color = "#8E44AD"
        files = @()
    }
    "attendance" = @{
        description = "Attendance tracking: session generation from class schedules, bulk recording, and student/educator views"
        color = "#27AE60"
        files = @()
    }
    "audit-log" = @{
        description = "Audit logging for admin actions and educator activity events with searchable history"
        color = "#2C3E50"
        files = @()
    }
    "class" = @{
        description = "Class management: CRUD, scheduling, enrollment, educator assignment, and ownership tracking"
        color = "#2980B9"
        files = @()
    }
    "course" = @{
        description = "Course management: CRUD with program and school year associations"
        color = "#D35400"
        files = @()
    }
    "grade" = @{
        description = "Grade computation: weighted scoring, category breakdowns, manual scores, grading scale resolution, and grade publishing"
        color = "#C0392B"
        files = @()
    }
    "grade-lock" = @{
        description = "Grade locking system: settings, auto-lock, unlock requests, override, and deadline management"
        color = "#E67E22"
        files = @()
    }
    "grading-scale" = @{
        description = "Grading scale management: letter grade ranges, program assignment, and percentage-to-grade resolution"
        color = "#F1C40F"
        files = @()
    }
    "grading-scheme" = @{
        description = "Grading scheme management: component weight configuration, template application, and class assignment"
        color = "#1ABC9C"
        files = @()
    }
    "lesson" = @{
        description = "Lesson management: CRUD, AI concept extraction/building, week structure generation, and student lesson viewing"
        color = "#3498DB"
        files = @()
    }
    "meeting" = @{
        description = "Video conferencing: Agora RTC integration, WebSocket gateway for real-time features, meeting CRUD, and join requests"
        color = "#9B59B6"
        files = @()
    }
    "notification" = @{
        description = "Notification system: create, list, mark read, and archive notifications for users"
        color = "#E74C3C"
        files = @()
    }
    "organization" = @{
        description = "Organization management: CRUD, settings, and multi-tenant configuration"
        color = "#2ECC71"
        files = @()
    }
    "platform" = @{
        description = "Platform administration: super admin management, platform-level configuration, and school oversight"
        color = "#34495E"
        files = @()
    }
    "student" = @{
        description = "Student management: CRUD, profile management, enrollment history, and status management"
        color = "#16A085"
        files = @()
    }
    "enrollment" = @{
        description = "Student enrollment: class enrollment, prerequisite checking, capacity management, and eligibility validation"
        color = "#2980B9"
        files = @()
    }
}

# Now categorize all files into features based on their path
foreach ($fp in $allPaths) {
    $p = $fp.ToLower()
    
    if ($p -like "backend/src/configs/*") { $features["configuration"].files += $fp }
    elseif ($p -like "backend/src/commons/decorators/*") { 
        if ($p -like "*roles*") { $features["authorization"].files += $fp }
        else { $features["authentication"].files += $fp }
    }
    elseif ($p -like "backend/src/commons/guards/*") {
        if ($p -like "*auth*") { $features["authentication"].files += $fp }
        else { $features["authorization"].files += $fp }
    }
    elseif ($p -like "backend/src/commons/filters/*") { $features["error-handling"].files += $fp }
    elseif ($p -like "backend/src/commons/interceptors/*") { $features["core-infrastructure"].files += $fp }
    elseif ($p -like "backend/src/commons/pipes/*") { $features["validation"].files += $fp }
    elseif ($p -like "backend/src/commons/utils/*") { $features["core-infrastructure"].files += $fp }
    elseif ($p -like "backend/src/core/database/*") { $features["database"].files += $fp }
    elseif ($p -like "backend/src/core/logger/*") { $features["logging"].files += $fp }
    elseif ($p -like "backend/src/core/middleware/*") { $features["core-infrastructure"].files += $fp }
    elseif ($p -like "backend/src/core/scheduler/*") { $features["scheduler"].files += $fp }
    elseif ($p -like "backend/src/core/ai/*") { $features["ai"].files += $fp }
    elseif ($p -like "backend/src/modules/auth/*") { $features["authentication"].files += $fp }
    elseif ($p -like "backend/src/modules/assessment/*") { $features["assessment"].files += $fp }
    elseif ($p -like "backend/src/modules/attendance/*") { $features["attendance"].files += $fp }
    elseif ($p -like "backend/src/modules/audit-log/*") { $features["audit-log"].files += $fp }
    elseif ($p -like "backend/src/modules/class/*") { $features["class"].files += $fp }
    elseif ($p -like "backend/src/modules/course/*") { $features["course"].files += $fp }
    elseif ($p -like "backend/src/modules/dashboard/*") { $features["core-infrastructure"].files += $fp }
    elseif ($p -like "backend/src/modules/educator/*") { $features["core-infrastructure"].files += $fp }
    elseif ($p -like "backend/src/modules/enrollment/*") { $features["enrollment"].files += $fp }
    elseif ($p -like "backend/src/modules/grade-lock/*") { $features["grade-lock"].files += $fp }
    elseif ($p -like "backend/src/modules/grade/*") { $features["grade"].files += $fp }
    elseif ($p -like "backend/src/modules/grading-scale/*") { $features["grading-scale"].files += $fp }
    elseif ($p -like "backend/src/modules/grading-scheme/*") { $features["grading-scheme"].files += $fp }
    elseif ($p -like "backend/src/modules/grading-scheme-template/*") { $features["grading-scheme"].files += $fp }
    elseif ($p -like "backend/src/modules/lesson/*") { $features["lesson"].files += $fp }
    elseif ($p -like "backend/src/modules/meeting/*") { $features["meeting"].files += $fp }
    elseif ($p -like "backend/src/modules/notification/*") { $features["notification"].files += $fp }
    elseif ($p -like "backend/src/modules/organization/*") { $features["organization"].files += $fp }
    elseif ($p -like "backend/src/modules/platform-registration/*") { $features["platform"].files += $fp }
    elseif ($p -like "backend/src/modules/platform/*") { $features["platform"].files += $fp }
    elseif ($p -like "backend/src/modules/profile/*") { $features["core-infrastructure"].files += $fp }
    elseif ($p -like "backend/src/modules/student/*") { $features["student"].files += $fp }
    elseif ($p -like "backend/src/modules/student-enrollment/*") { $features["enrollment"].files += $fp }
    elseif ($p -like "backend/src/modules/academic-calendar/*") { $features["academic-calendar"].files += $fp }
    elseif ($p -like "backend/src/modules/*") { 
        # Generic catch-all for any module not listed
        $modName = ($fp -split '/')[3]
        if (-not $features.ContainsKey($modName)) {
            $features[$modName] = @{
                description = "${modName} module"
                color = "#95A5A6"
                files = @()
            }
        }
        $features[$modName].files += $fp
    }
    elseif ($p -like "backend/src/core/*") { $features["core-infrastructure"].files += $fp }
    elseif ($p -like "backend/src/domains/*") { $features["core-infrastructure"].files += $fp }
    elseif ($p -like "backend/src/seeds/*") { $features["core-infrastructure"].files += $fp }
    elseif ($p -like "frontend/src/api/*") { 
        if ($features.ContainsKey("frontend-api")) { } else { $features["frontend-api"] = @{description="Frontend API layer: HTTP client and API function modules for all portals"; color="#5DADE2"; files=@()} }
        $features["frontend-api"].files += $fp
    }
    elseif ($p -like "frontend/src/app/*") { 
        if ($features.ContainsKey("frontend-pages")) { } else { $features["frontend-pages"] = @{description="Frontend Next.js App Router pages for admin, educator, student, and platform portals"; color="#48C9B0"; files=@()} }
        $features["frontend-pages"].files += $fp
    }
    elseif ($p -like "frontend/src/components/*") { 
        if ($features.ContainsKey("frontend-components")) { } else { $features["frontend-components"] = @{description="Frontend React components: shared UI, admin, educator, student, meeting, and landing"; color="#F1948A"; files=@()} }
        $features["frontend-components"].files += $fp
    }
    elseif ($p -like "frontend/src/hooks/*") { 
        if ($features.ContainsKey("frontend-hooks")) { } else { $features["frontend-hooks"] = @{description="Frontend React hooks for data fetching, state management, and real-time features"; color="#AED6F1"; files=@()} }
        $features["frontend-hooks"].files += $fp
    }
    elseif ($p -like "frontend/src/context/*") { 
        if ($features.ContainsKey("frontend-context")) { } else { $features["frontend-context"] = @{description="Frontend React context providers for auth, sidebar, and meeting state"; color="#D7BDE2"; files=@()} }
        $features["frontend-context"].files += $fp
    }
    elseif ($p -like "frontend/src/store/*") { 
        if ($features.ContainsKey("frontend-store")) { } else { $features["frontend-store"] = @{description="Frontend Zustand state stores for auth, meeting, and notifications"; color="#FADBD8"; files=@()} }
        $features["frontend-store"].files += $fp
    }
    elseif ($p -like "frontend/src/lib/*" -or $p -like "frontend/src/utils/*") { 
        if ($features.ContainsKey("frontend-utilities")) { } else { $features["frontend-utilities"] = @{description="Frontend utility libraries and helpers"; color="#D5F5E3"; files=@()} }
        $features["frontend-utilities"].files += $fp
    }
    elseif ($p -like "frontend/src/types/*") { 
        if ($features.ContainsKey("frontend-types")) { } else { $features["frontend-types"] = @{description="Frontend TypeScript type definitions"; color="#F5CBA7"; files=@()} }
        $features["frontend-types"].files += $fp
    }
    elseif ($p -like "frontend/src/config/*") { 
        if ($features.ContainsKey("frontend-config")) { } else { $features["frontend-config"] = @{description="Frontend configuration files"; color="#A3E4D7"; files=@()} }
        $features["frontend-config"].files += $fp
    }
    elseif ($p -like "frontend/src/styles/*") { 
        if ($features.ContainsKey("frontend-styles")) { } else { $features["frontend-styles"] = @{description="Frontend CSS stylesheets and theme definitions"; color="#F9E79F"; files=@()} }
        $features["frontend-styles"].files += $fp
    }
    elseif ($p -like "frontend/*") { 
        if ($features.ContainsKey("frontend-config")) { } else { $features["frontend-config"] = @{description="Frontend configuration files"; color="#A3E4D7"; files=@()} }
        $features["frontend-config"].files += $fp
    }
}

# Remove features that ended up with zero files (they have entries from service mapping but no files added)
$emptyFeatures = @()
foreach ($k in $features.Keys) { if ($features[$k].files.Count -eq 0) { $emptyFeatures += $k } }
foreach ($k in $emptyFeatures) { $features.Remove($k) }

# ============= BUILD CONCEPTS =============
Write-Host "Building concepts..." -ForegroundColor Cyan
$concepts = @{
    "IPC-Communication" = @{
        description = "Inter-Process Communication between main and renderer processes via Electron ipcMain/ipcRenderer"
        keywords = @("ipcMain","ipcRenderer","contextBridge","handle","invoke")
        locations = @()
    }
    "JWT-Authentication" = @{
        description = "JWT-based authentication with access/refresh token rotation, Passport strategy, and guards"
        keywords = @("JwtService","JwtStrategy","AuthGuard","access_token","refresh_token","TokenPayload")
        locations = @("backend/src/modules/auth/auth.service.ts","backend/src/modules/auth/auth.controller.ts","backend/src/modules/auth/strategies/jwt.strategy.ts","backend/src/commons/guards/auth.guard.ts","backend/src/commons/utils/token.util.ts","backend/src/configs/jwt.config.ts")
    }
    "AI-Question-Generation" = @{
        description = "AI-powered assessment question generation with concept extraction, chunking, progress tracking, and preview workflows"
        keywords = @("AiService","AiClientService","concept","question","blueprint","generation","preview","OpenRouter")
        locations = @("backend/src/core/ai/ai.service.ts","backend/src/core/ai/ai-client.service.ts","backend/src/core/ai/prompt-builder.util.ts","backend/src/core/ai/json-parser.util.ts","backend/src/core/ai/concept-validator.util.ts","backend/src/core/ai/constants.ts","backend/src/core/ai/types.ts","backend/src/modules/assessment/educator/assessment-generation.helper.ts")
    }
    "Grade-Computation-Engine" = @{
        description = "Weighted grade computation with category breakdowns, hybrid score merging, grading scale resolution, and lock management"
        keywords = @("GradeCoreService","computeWeightedScore","buildCategoryBreakdown","resolveGrade","grade-lock","manual-score")
        locations = @("backend/src/modules/grade/core/grade-core.service.ts","backend/src/modules/grade/grade.service.ts","backend/src/modules/grade/grade.repository.ts","backend/src/modules/grade-lock/grade-lock.service.ts","backend/src/modules/grading-scale/grading-scale.service.ts","backend/src/modules/grading-scheme/grading-scheme.service.ts")
    }
    "Real-Time-Meeting" = @{
        description = "Real-time video conferencing with WebRTC (Agora), WebSocket signaling, chat, reactions, screen sharing, and presentation sync"
        keywords = @("MeetingGateway","Agora","WebSocket","WebRTC","RTC","socket.io","chat","reaction","screen-share","presentation")
        locations = @("backend/src/modules/meeting/meeting.gateway.ts","backend/src/modules/meeting/agora-token.service.ts","backend/src/modules/meeting/meeting.service.ts")
    }
    "Role-Based-Access-Control" = @{
        description = "RBAC system with role guards, decorators, and multi-portal authorization (admin, educator, student, platform)"
        keywords = @("RolesGuard","Roles","ROLES_KEY","AuthGuard","role","admin","educator","student","platform_owner")
        locations = @("backend/src/commons/guards/role.guard.ts","backend/src/commons/decorators/roles.decorator.ts","backend/src/commons/guards/auth.guard.ts")
    }
    "Scheduled-Background-Jobs" = @{
        description = "Cron-based background jobs for auto grade-lock, submission cleanup, notification archiving, and enrollment management"
        keywords = @("SchedulerTasks","cron","@Cron","handleAutoGradeLock","handleCloseExpiredDrafts","handleNotificationArchiving","handleAutoUnenrollOnYearEnd")
        locations = @("backend/src/core/scheduler/scheduler.tasks.ts","backend/src/core/scheduler/scheduler.module.ts")
    }
    "Prisma-Data-Access" = @{
        description = "Database access layer using Prisma ORM with DatabaseService singleton and repository pattern across all modules"
        keywords = @("DatabaseService","PrismaClient","prisma","repository","PrismaPg","DATABASE_URL")
        locations = @("backend/src/core/database/database.provider.ts","backend/src/core/database/database.module.ts")
    }
    "Multi-Tenant-Organization" = @{
        description = "Multi-tenant architecture where each organization has isolated data scoped by org_id throughout all queries"
        keywords = @("orgId","organization","school","tenant","platform")
        locations = @("backend/src/modules/organization/organization.service.ts","backend/src/modules/platform/platform.service.ts","backend/src/modules/platform-registration/platform-registration.service.ts")
    }
    "Assessment-Hybrid-Grading" = @{
        description = "Hybrid assessment grading mode combining auto-graded system questions with manually graded sections"
        keywords = @("hybrid","grading_mode","system","manual","AssessmentCoreService","mergeHybridScores","section_score")
        locations = @("backend/src/modules/assessment/core/assessment-core.service.ts","backend/src/modules/grade/core/grade-core.service.ts","backend/src/modules/assessment/dto/assessment.dto.ts")
    }
}

# ============= WRITE OUTPUT =============
Write-Host "Writing graph.json..." -ForegroundColor Cyan
$now = (Get-Date -Format "o")
$exportedAt = $symbols.exportedAt

$graph = @{
    graphVersion = "2"
    repoName = "EduToolV3"
    repoPath = "C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV3"
    generatedAt = $now
    exportedAt = $exportedAt
    meta = @{
        incremental = @{
            total = $nodes.Count
            reused = 0
            rebuilt = $nodes.Count
            new = $nodes.Count
            changed = 0
            neighborAffected = 0
            generationMode = "ai_generated"
            affectedSetSize = $nodes.Count
            bfsDepth = 0
        }
    }
    stats = @{
        totalFiles = $symbols.files.Count
        totalSymbols = $symbols.symbols.Count
        totalImports = $symbols.imports.Count
        totalNodes = $nodes.Count
        totalEdges = $edges.Count
        totalFeatures = $features.Count
        totalConcepts = $concepts.Count
    }
    nodes = $nodes
    edges = $edges
    features = $features
    concepts = $concepts
}

$json = $graph | ConvertTo-Json -Depth 100
$json | Set-Content -Path (Join-Path $OutputDir "graph.json") -Encoding UTF8
Write-Host "graph.json written successfully!" -ForegroundColor Green
Write-Host "Stats: $($nodes.Count) nodes, $($edges.Count) edges, $($features.Count) features, $($concepts.Count) concepts"

# ============= BUILD GRAPH.MD =============
Write-Host "Building graph.md..." -ForegroundColor Cyan

function Add-MdLine([string]$line) {
    Add-Content -Path (Join-Path $OutputDir "graph.md") -Value $line -Encoding UTF8
}

# Clear file
"" | Set-Content -Path (Join-Path $OutputDir "graph.md") -Encoding UTF8

Add-MdLine "# Graphify Report: EduToolV3"
Add-MdLine ""
Add-MdLine "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-MdLine ""
Add-MdLine "## Overview"
Add-MdLine ""
Add-MdLine "- Total files: $($symbols.files.Count)"
Add-MdLine "- Total symbols: $($symbols.symbols.Count)"
Add-MdLine "- Total imports: $($symbols.imports.Count)"
Add-MdLine "- Graph nodes: $($nodes.Count)"
Add-MdLine "- Graph edges: $($edges.Count)"
Add-MdLine "- Features: $($features.Count)"
Add-MdLine "- Concepts: $($concepts.Count)"
Add-MdLine "- Build: AI generated"
Add-MdLine ""
Add-MdLine "## Feature Map"
Add-MdLine ""

$sortedFeatures = $features.GetEnumerator() | Sort-Object { $_.Value.files.Count } -Descending

foreach ($feat in $sortedFeatures) {
    $featName = $feat.Key
    $featVal = $feat.Value
    $fileCount = $featVal.files.Count
    Add-MdLine "### $featName"
    Add-MdLine "- **Description**: $($featVal.description)"
    Add-MdLine "- **Files**: $fileCount files"
    $topFiles = $featVal.files | Select-Object -First 10
    foreach ($f in $topFiles) {
        Add-MdLine "  - $f"
    }
    if ($fileCount -gt 10) {
        $remaining = $fileCount - 10
        Add-MdLine "  - *... and $remaining more*"
    }
    Add-MdLine ""
}

# Top files by symbol count
$sortedNodesBySymbols = $nodes | Sort-Object { $_.stats.totalSymbols } -Descending | Select-Object -First 15
Add-MdLine "## Top Files by Symbol Count"
Add-MdLine ""
Add-MdLine ('| File | Symbols | Exported | Functions | Classes | Centrality |')
Add-MdLine ('|------|---------|----------|-----------|---------|------------|')
foreach ($n in $sortedNodesBySymbols) {
    Add-MdLine "| $($n.filePath) | $($n.stats.totalSymbols) | $($n.stats.exportedSymbols) | $($n.stats.functions) | $($n.stats.classes) | $($n.centrality.centrality) |"
}
Add-MdLine ""

# Top files by centrality
$sortedNodesByCentrality = $nodes | Sort-Object { $_.centrality.centrality } -Descending | Select-Object -First 15
Add-MdLine "## Top Files by Centrality"
Add-MdLine ""
Add-MdLine ('| File | Centrality | Fan-In | Fan-Out | Degree |')
Add-MdLine ('|------|------------|--------|---------|--------|')
foreach ($n in $sortedNodesByCentrality) {
    Add-MdLine "| $($n.filePath) | $($n.centrality.centrality) | $($n.centrality.fanIn) | $($n.centrality.fanOut) | $($n.centrality.degree) |"
}
Add-MdLine ""

# Architecture Flow
Add-MdLine "## Architecture Flow"
Add-MdLine ""
Add-MdLine "### Backend (NestJS)"
Add-MdLine "The application follows a modular NestJS architecture with layered domain modules:"
Add-MdLine ""
Add-MdLine "1. **Entry Point** (main.ts) bootstraps the NestJS app with global pipes (ValidationPipe), filters (HttpExceptionFilter, AllExceptionFilter), interceptors (LoggingInterceptor, ResponseInterceptor), and security middleware (Helmet, CORS)."
Add-MdLine ""
Add-MdLine "2. **Root Module** (AppModule) imports all domain modules:"
Add-MdLine "   - **Core Infrastructure**: ConfigModule (env validation, app/db/jwt config), DatabaseModule (Prisma), LoggerModule (Winston), AiModule (OpenRouter), MailModule (nodemailer)"
Add-MdLine "   - **Domain Modules**: AssessmentModule, ClassModule, GradeModule, LessonModule, MeetingModule, etc."
Add-MdLine "   - **Utility Modules**: HealthModule, UploadModule, ServeStaticModule"
Add-MdLine "   - **SchedulerModule**: Cron jobs for auto-maintenance tasks"
Add-MdLine ""
Add-MdLine "3. **Each Domain Module** follows the NestJS layered pattern:"
Add-MdLine "   - **Module** -> wires dependencies and controllers"
Add-MdLine "   - **Controller** -> handles HTTP routes with AuthGuard + RolesGuard"
Add-MdLine "   - **Service** -> contains business logic, orchestrates operations"
Add-MdLine "   - **Repository** -> data access via Prisma, scoped by org_id for multi-tenancy"
Add-MdLine ""
Add-MdLine "4. **Auth Pipeline**: JWT tokens issued on login -> Passport JwtStrategy validates -> AuthGuard protects routes -> RolesGuard checks roles -> @CurrentUser() extracts user"
Add-MdLine ""
Add-MdLine "5. **AI Pipeline**: Lesson detail -> AiService.extractConcepts/buildConcepts -> AiClientService calls OpenRouter -> JsonParser.parseJson -> ConceptValidator.validate -> stored for assessment generation"
Add-MdLine ""
Add-MdLine "6. **Grade Computation**:"
Add-MdLine "   - Assessments create submissions -> submissions graded (system/manual/hybrid)"
Add-MdLine "   - GradeCoreService.computeWeightedScore aggregates by scheme categories"
Add-MdLine "   - GradingScaleService.resolveGrade maps percentage to letter grade"
Add-MdLine "   - GradeEducatorService manages publish/unlock/lock workflows"
Add-MdLine ""
Add-MdLine "### Frontend (Next.js)"
Add-MdLine "1. **API Layer** (frontend/src/api/): Axios client with auth interceptor, organized by portal (admin, educator, student, platform)"
Add-MdLine "2. **Data Fetching** (frontend/src/hooks/): TanStack Query hooks wrapping API calls with caching and mutation"
Add-MdLine "3. **State** (frontend/src/store/): Zustand stores for auth, meeting, notifications"
Add-MdLine "4. **UI** (frontend/src/app/): Next.js App Router pages, each portal has its own layout with sidebar navigation"
Add-MdLine "5. **Components** (frontend/src/components/): Portal-specific components and shared shadcn/ui primitives"
Add-MdLine ""
Add-MdLine "### Real-Time Meeting Flow"
Add-MdLine "1. Meeting creation -> Agora RTC channel created -> MeetingGateway (WebSocket) manages room state"
Add-MdLine "2. WebSocket: presence, chat, WebRTC signaling relay, hand raise, reactions, presentation sync"
Add-MdLine "3. Agora: video/audio streams, screen sharing"
Add-MdLine "4. Educator controls: join request approval, participant management, presentation mode"
Add-MdLine ""
Add-MdLine "## Concepts Glossary"
Add-MdLine ""
Add-MdLine ('| Concept | Description | Keywords | Files |')
Add-MdLine ('|---------|-------------|----------|-------|')

foreach ($concept in $concepts.GetEnumerator()) {
    $kw = ($concept.Value.keywords -join ", ")
    $locs = ($concept.Value.locations -join ", ")
    Add-MdLine "| $($concept.Key) | $($concept.Value.description) | $kw | $locs |"
}
Add-MdLine ""

# Edge Type Summary
$edgeTypeCounts = @{}
foreach ($edge in $edges) {
    $t = $edge.type
    if (-not $edgeTypeCounts.ContainsKey($t)) { $edgeTypeCounts[$t] = 0 }
    $edgeTypeCounts[$t]++
}
Add-MdLine "## Edge Type Summary"
Add-MdLine ""
Add-MdLine ('| Type | Count | Description |')
Add-MdLine ('|------|-------|-------------|')
$edgeTypeDescriptions = @{
    "IMPORTS" = "Direct file import dependency"
    "COLLABORATES_WITH" = "Files working together on the same feature"
    "ORCHESTRATES" = "File coordinates or manages other files"
    "DEPENDS_ON" = "Logical dependency between files"
    "PROVIDES_TO" = "File provides data/services to another"
}
foreach ($et in $edgeTypeCounts.GetEnumerator() | Sort-Object Value -Descending) {
    $desc = if ($edgeTypeDescriptions.ContainsKey($et.Key)) { $edgeTypeDescriptions[$et.Key] } else { "Semantic relationship" }
    Add-MdLine "| $($et.Key) | $($et.Value) | $desc |"
}
Add-MdLine ""

Add-MdLine "## Edge Type Distribution"
Add-MdLine ""
foreach ($et in $edgeTypeCounts.GetEnumerator() | Sort-Object Value -Descending) {
    $pct = [Math]::Round($et.Value / $edges.Count * 100, 1)
    Add-MdLine "- **$($et.Key)**: $($et.Value) ($pct%)"
}
Add-MdLine ""

Add-MdLine "## Surprising Connections"
Add-MdLine ""
Add-MdLine "- The **AI module** (backend/src/core/ai/) is used by both the **Lesson module** (concept extraction) and **Assessment module** (question generation), making it a cross-cutting intelligence layer."
Add-MdLine "- **Attendance** auto-triggers from **Submission** completion via AssessmentEducatorService.onSubmissionFinished -> AttendanceService.markPresentFromSubmission."
Add-MdLine "- **Grade Lock** interacts with **Grades**, **Grading Scales**, **Scheduler** (auto-lock), and **Notifications** (unlock request workflow)."
Add-MdLine "- The **Meeting Gateway** (WebSocket) handles real-time events across multiple concerns: chat, WebRTC signaling, presentations, reactions, and screen sharing."
Add-MdLine "- **Orgunit Seeder** spans across **Courses**, **Grading Schemes**, **Grading Scales**, **Levels**, **Sections**, **Programs**, **Strands**, and **Subjects** - touching nearly every domain module."
Add-MdLine ""
Add-MdLine "## Notes"
Add-MdLine ""
Add-MdLine "- The codebase is a **multi-tenant educational management platform** with three portals: Admin, Educator, and Student, plus a Platform super-admin layer."
Add-MdLine "- Architecture follows **Domain-Driven Design** with NestJS modules organizing business capabilities."
Add-MdLine "- **Prisma ORM** provides database access with SQLite/PostgreSQL support."
Add-MdLine "- **AI integration** (OpenRouter) powers automated lesson concept extraction and assessment question generation."
Add-MdLine "- **Real-time features** (video meetings, chat, presentations) use WebSocket (Socket.IO) and WebRTC (Agora)."
Add-MdLine "- The frontend is a **Next.js** application with App Router, TanStack Query for data fetching, Zustand for state management, and shadcn/ui component library."
Add-MdLine "- Grade computation supports **three grading modes**: system (auto-graded), manual (educator-graded), and hybrid (mixed)."
Add-MdLine "- The graph was **AI-generated** by reading source code and analyzing symbol/import relationships."

Write-Host "graph.md written successfully!" -ForegroundColor Green

Write-Host "Done!" -ForegroundColor Green
