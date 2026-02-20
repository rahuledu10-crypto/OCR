import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  FileText, 
  Key, 
  TrendingUp, 
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardOverview = () => {
  const { getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentExtractions, setRecentExtractions] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes, keysRes] = await Promise.all([
          axios.get(`${API}/analytics/usage`, { headers: getAuthHeaders() }),
          axios.get(`${API}/analytics/recent?limit=5`, { headers: getAuthHeaders() }),
          axios.get(`${API}/keys`, { headers: getAuthHeaders() })
        ]);
        setStats(statsRes.data);
        setRecentExtractions(recentRes.data);
        setApiKeys(keysRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getAuthHeaders]);

  const statCards = [
    {
      title: 'Total Extractions',
      value: stats?.total_requests || 0,
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'Success Rate',
      value: stats?.total_requests 
        ? `${((stats.successful_requests / stats.total_requests) * 100).toFixed(1)}%` 
        : '0%',
      icon: TrendingUp,
      color: 'text-accent'
    },
    {
      title: 'Active API Keys',
      value: apiKeys.filter(k => k.is_active).length,
      icon: Key,
      color: 'text-yellow-500'
    }
  ];

  const getDocTypeLabel = (type) => {
    const labels = {
      'aadhaar': 'Aadhaar',
      'pan': 'PAN',
      'dl': 'Driving License',
      'unknown': 'Unknown'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-overview" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your OCR API usage and performance</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/keys">
            <Button variant="outline" data-testid="overview-keys-btn">
              <Key className="w-4 h-4 mr-2" />
              Manage Keys
            </Button>
          </Link>
          <Link to="/dashboard/playground">
            <Button data-testid="overview-playground-btn" className="bg-primary hover:bg-primary/90">
              Try Playground
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Document Breakdown & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Document Breakdown */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Document Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.document_breakdown && Object.keys(stats.document_breakdown).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(stats.document_breakdown).map(([type, count]) => {
                  const percentage = (count / stats.total_requests) * 100;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{getDocTypeLabel(type)}</span>
                        <span className="text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No extractions yet</p>
                <Link to="/dashboard/playground">
                  <Button variant="link" className="mt-2">Try the Playground</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Recent Extractions</CardTitle>
            <Link to="/dashboard/analytics">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentExtractions.length > 0 ? (
              <div className="space-y-3">
                {recentExtractions.map((extraction) => (
                  <div 
                    key={extraction.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {extraction.success ? (
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getDocTypeLabel(extraction.document_type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {extraction.processing_time_ms}ms
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(extraction.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      {apiKeys.length === 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold mb-1">Create your first API key</h3>
                <p className="text-sm text-muted-foreground">
                  Generate an API key to start integrating OCR extraction into your application.
                </p>
              </div>
              <Link to="/dashboard/keys">
                <Button data-testid="create-first-key-btn" className="bg-primary hover:bg-primary/90 shrink-0">
                  Create API Key
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardOverview;
