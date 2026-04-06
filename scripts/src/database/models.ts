// TypeScript interfaces for database models

// Lookup table interfaces
export interface Platform {
    id?: number;
    name: string;
}

export interface Genre {
    id?: number;
    name: string;
}

export interface Category {
    id?: number;
    name: string;
}

export interface Tag {
    id?: number;
    name: string;
}

export interface Language {
    id?: number;
    code: string; // ISO language code (e.g., 'en', 'fr', 'de')
    name: string; // Full language name (e.g., 'English', 'French', 'German')
}

export interface Developer {
    id?: number;
    name: string;
}

export interface Publisher {
    id?: number;
    name: string;
}

// Game language support interface
export interface GameLanguageSupport {
    code?: string; // ISO language code (e.g., 'en', 'fr', 'de')
    language_id?: number; // Alternative: direct language ID reference
    has_interface?: boolean;
    has_full_audio?: boolean;
    has_subtitles?: boolean;
}

// Main Game interface (refactored - removed JSON columns)
export interface Game {
    id?: number;
    steam_appid: number;
    name: string;
    release_date?: Date;
    developers?: string[]; // Array of developer names
    publishers?: string[]; // Array of publisher names
    header_image_url?: string;
    created_at?: Date;
    updated_at?: Date;
    price?: string;
    original_price?: string;
    discount_percent?: number;
    currency?: string;
    short_description?: string;
    metacritic_score?: number;
    recommendations?: number;
    is_unlisted?: boolean;
    is_removed?: boolean;
    main_story_hours?: number;
    main_sides_hours?: number;
    completionist_hours?: number;
    all_styles_hours?: number;
    alias?: string;
    score_rank?: number;
    min_owners?: number; // Minimum owner count
    max_owners?: number | null; // Maximum owner count (NULL if exact number)
    peak_ccu?: number;
    // Relationships (arrays of names/codes, will be resolved to IDs)
    platforms?: string[]; // Array of platform names
    genres?: string[]; // Array of genre names
    categories?: string[]; // Array of category names
    tags?: string[]; // Array of tag names
    languages?: GameLanguageSupport[] | string[]; // Array of language codes or objects with support info
}

export interface Achievement {
    id?: number;
    game_id: number;
    steam_apiname: string;
    name: string;
    description?: string;
    icon_url?: string;
    points?: number;
    is_hidden?: boolean;
    created_at?: Date;
    description_source?: string;
    last_updated?: Date;
}

export interface User {
    id?: number;
    steam_id: bigint;
    username: string;
    profile_url?: string;
    avatar_url?: string;
    is_active?: boolean;
    created_at?: Date;
}

export interface UserAchievement {
    id?: number;
    steam_id: bigint;
    achievement_id: number;
    unlocked_at?: Date;
    created_at?: Date;
}

export interface UserGame {
    id?: number;
    steam_id: bigint;
    game_id: number;
    playtime_forever: number; // in minutes
    last_played_at?: Date;
}

export interface AchievementStats {
    achievement_id: number;
    global_percentage: number;
    updated_at?: Date;
}

// Return type interfaces for query results
export interface GameWithAchievementsResult {
    // Game fields
    id: number;
    steam_appid: number;
    name: string;
    release_date?: Date;
    header_image_url?: string;
    created_at?: Date;
    updated_at?: Date;
    price?: string;
    original_price?: string;
    discount_percent?: number;
    currency?: string;
    short_description?: string;
    metacritic_score?: number;
    recommendations?: number;
    is_unlisted?: boolean;
    is_removed?: boolean;
    main_story_hours?: number;
    main_sides_hours?: number;
    completionist_hours?: number;
    all_styles_hours?: number;
    alias?: string;
    score_rank?: number;
    min_owners?: number;
    max_owners?: number | null;
    peak_ccu?: number;
    // Achievement fields (nullable when LEFT JOIN returns no achievement)
    achievement_id?: number;
    steam_apiname?: string;
    achievement_name?: string;
    achievement_description?: string;
    achievement_icon?: string;
    points?: number;
    is_hidden?: boolean;
}

export interface UserGameAchievementResult {
    // Achievement fields
    id: number;
    game_id: number;
    steam_apiname: string;
    name: string;
    description?: string;
    icon_url?: string;
    points?: number;
    is_hidden?: boolean;
    created_at?: Date;
    description_source?: string;
    last_updated?: Date;
    // User achievement fields
    unlocked_at?: Date;
    is_unlocked: boolean; // BIT type
}

export interface GameAchievementResult {
    // Achievement fields only (no redundant game data)
    id: number;
    game_id: number;
    steam_apiname: string;
    name: string;
    description?: string;
    icon_url?: string;
    points?: number;
    is_hidden?: boolean;
    created_at?: Date;
    description_source?: string;
    last_updated?: Date;
}

export interface GameAchievementsResponse {
    gameExists: boolean;
    achievements: GameAchievementResult[];
}
