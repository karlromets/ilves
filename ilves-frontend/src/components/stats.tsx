import { useEffect, useState } from 'react';
import { SubmissionCount } from '../types';
import { apiService } from '../services/api';
import { toast } from 'sonner';

export function Stats() {
  const [stats, setStats] = useState<SubmissionCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await apiService.getSubmissionCount();
        setStats(data);
        setError('');
      } catch (err) {
        toast.error('Failed to load statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (loading && !stats) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-background shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-bold mb-4 text-text">Submission Statistics</h2>
          <p className="text-text/60 text-center py-4">Loading statistics...</p>
        </div>
      </div>
    );
  }
  
  if (error && !stats) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-background shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-bold mb-4 text-text">Submission Statistics</h2>
          <p className="text-accent text-center py-4">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-md">
      <div className="bg-background shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-bold mb-4 text-text">Submission Statistics</h2>
        
        {stats && (
          <div className="grid md:grid-cols-2 gap-2 md:gap-4">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="bg-secondary py-2 md:py-4 px-4 rounded-lg flex md:flex-col items-end md:items-start gap-1">
                <div className="text-xl md:text-2xl lg:text-3xl font-bold leading-none">{value}</div>
                <div className="text-xs md:text-sm text-text/70">{key}</div>
              </div>
            ))}
          </div>
        )}
        
        {loading && stats && (
          <p className="text-text/60 text-center text-sm mt-4">Refreshing...</p>
        )}
      </div>
    </div>
  );
} 