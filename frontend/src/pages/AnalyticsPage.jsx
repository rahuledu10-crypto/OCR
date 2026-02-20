import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  FileText,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CHART_COLORS = ['hsl(239, 84%, 67%)', 'hsl(160, 84%, 39%)', 'hsl(43, 74%, 66%)', 'hsl(12, 76%, 61%)'];

const AnalyticsPage = () => {
  const { getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentExtractions, setRecentExtractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          axios.get(`${API}/analytics/usage`, { headers: getAuthHeaders() }),
          axios.get(`${API}/analytics/recent?limit=20`, { headers: getAuthHeaders() })
        ]);
        setStats(statsRes.data);
        setRecentExtractions(recentRes.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getAuthHeaders]);

  const getDocTypeLabel = (type) => {
    const labels = {
      'aadhaar': 'Aadhaar',
      'pan': 'PAN',
      'dl': 'Driving License',
      'unknown': 'Unknown',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const pieData = stats?.document_breakdown 
    ? Object.entries(stats.document_breakdown).map(([name, value]) => ({
        name: getDocTypeLabel(name),
        value
      }))
    : [];

  const chartData = stats?.daily_usage || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const successRate = stats?.total_requests 
    ? ((stats.successful_requests / stats.total_requests) * 100).toFixed(1)
    : 0;

  const avgProcessingTime = recentExtractions.length > 0
    ? (recentExtractions.reduce((acc, e) => acc + (e.processing_time_ms || 0), 0) / recentExtractions.length).toFixed(0)
    : 0;

  return (
    <div data-testid="analytics-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Monitor your API usage and performance metrics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]" data-testid="time-range-select">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-3xl font-bold mt-1">{stats?.total_requests || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-3xl font-bold">{successRate}%</p>
                    {parseFloat(successRate) >= 95 && <TrendingUp className="w-4 h-4 text-accent" />}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed Requests</p>
                  <p className="text-3xl font-bold mt-1">{stats?.failed_requests || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                  <p className="text-3xl font-bold mt-1">{avgProcessingTime}ms</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Usage Over Time */}
        <Card className="bg-card/50 backdrop-blur border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(215, 20%, 65%)"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(222, 47%, 7%)', 
                      border: '1px solid hsl(217, 33%, 17%)',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(239, 84%, 67%)" 
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                    name="Total"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="successful" 
                    stroke="hsl(160, 84%, 39%)" 
                    fillOpacity={1} 
                    fill="url(#colorSuccess)"
                    name="Successful"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No usage data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Types Distribution */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Document Types</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(222, 47%, 7%)', 
                      border: '1px solid hsl(217, 33%, 17%)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No document data
              </div>
            )}
            {pieData.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Recent Extractions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentExtractions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Document Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Confidence</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Response Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExtractions.map((extraction) => (
                    <tr key={extraction.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-3 px-4">
                        {extraction.success ? (
                          <span className="flex items-center gap-1.5 text-accent">
                            <CheckCircle2 className="w-4 h-4" />
                            Success
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-destructive">
                            <XCircle className="w-4 h-4" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {getDocTypeLabel(extraction.document_type)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {extraction.confidence ? `${(extraction.confidence * 100).toFixed(0)}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">
                        {extraction.processing_time_ms ? `${extraction.processing_time_ms}ms` : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(extraction.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No extraction history yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
