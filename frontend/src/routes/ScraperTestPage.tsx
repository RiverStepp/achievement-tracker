import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';

export const ScraperTestPage: React.FC = () => {
    const [steamIdOrUsername, setSteamIdOrUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!steamIdOrUsername.trim()) {
            setError('Please enter a Steam ID or username');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Use proxy path - Vite will proxy to backend (HTTP)
            const response = await axios.post('/api/scraper/scrape', {
                steamIdOrUsername: steamIdOrUsername.trim()
            });

            console.log('Scraper response:', response.data);

            // Check if the response indicates success
            if (response.data.success) {
                const steamId = response.data.steamId || steamIdOrUsername.trim();
                const username = response.data.username || steamIdOrUsername.trim();
                setSuccess(`Successfully scraped ${username} (${steamId})! Redirecting...`);
                setLoading(false);

                // After successful scraping, navigate to the profile page
                setTimeout(() => {
                    navigate(`/u/${steamId}`);
                }, 1500);
            } else {
                // Handle error response from backend
                const errorMsg = response.data.error || response.data.message || 'Failed to scrape user. Please try again.';
                console.error('Backend returned error:', response.data);
                setError(errorMsg);
                setLoading(false);
            }
        } catch (err: any) {
            console.error('Scraping error:', err);
            console.error('Error response:', err?.response?.data);

            // Extract error message from axios error response
            const errorMessage = err?.response?.data?.error
                || err?.response?.data?.message
                || err?.message
                || 'Failed to scrape user. Please try again.';

            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 p-8 text-slate-100">
            <div className="mx-auto max-w-2xl">
                <Card className="p-6">
                    <h1 className="mb-6 text-2xl font-bold text-blue-100">Steam Scraper Test</h1>

                    <div className="space-y-6">
                        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                            <h2 className="mb-4 text-lg font-semibold text-slate-300">Scrape a User</h2>

                            <form onSubmit={handleScrape} className="space-y-4">
                                <div>
                                    <label htmlFor="steamId" className="mb-2 block text-sm font-medium text-slate-300">
                                        Steam ID or Username
                                    </label>
                                    <Input
                                        id="steamId"
                                        type="text"
                                        placeholder="Enter Steam ID (e.g., 76561198046029799) or username"
                                        value={steamIdOrUsername}
                                        onChange={(e) => setSteamIdOrUsername(e.target.value)}
                                        disabled={loading}
                                        className="w-full"
                                    />
                                    <p className="mt-1 text-xs text-slate-400">
                                        You can enter either a Steam ID (numeric) or a Steam username
                                    </p>
                                </div>

                                {success && (
                                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                                        <p className="text-sm text-green-300">{success}</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                                        <p className="text-sm text-red-300">{error}</p>
                                    </div>
                                )}

                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? 'Scraping...' : 'Scrape User'}
                                </Button>
                            </form>
                        </div>

                        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                            <h3 className="mb-2 text-sm font-semibold text-slate-300">What the Scraper Does</h3>
                            <ul className="list-disc list-inside space-y-2 text-sm text-slate-400">
                                <li>Fetches user profile data from Steam API</li>
                                <li>Retrieves all games owned by the user</li>
                                <li>Collects achievement data for each game</li>
                                <li>Saves user and achievement data to the database</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </main>
    );
};

export default ScraperTestPage;
