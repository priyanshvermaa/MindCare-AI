import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const WaterContext = createContext(null);

export const useWater = () => {
  const context = useContext(WaterContext);
  if (!context) {
    throw new Error('useWater must be used within a WaterProvider');
  }
  return context;
};

// Date helper YYYY-MM-DD
const getFormattedLocalDate = (d = new Date()) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const WaterProvider = ({ children }) => {
  const [waterSummary, setWaterSummary] = useState(null);
  const [waterLogs, setWaterLogs] = useState([]);
  const [weeklyChartData, setWeeklyChartData] = useState([]);
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [waterStats, setWaterStats] = useState(null);
  const [waterAiInsights, setWaterAiInsights] = useState(null);
  const [waterLoading, setWaterLoading] = useState(false);

  // Fetch all telemetry data
  const fetchWaterTelemetry = useCallback(async (date = new Date(), showLoading = false) => {
    if (showLoading) setWaterLoading(true);
    const dateStr = getFormattedLocalDate(date);
    try {
      const [todayRes, weeklyRes, monthlyRes, statsRes] = await Promise.all([
        api.get(`/water/today?date=${dateStr}`),
        api.get('/water/weekly'),
        api.get('/water/monthly'),
        api.get('/water/stats')
      ]);

      setWaterSummary(todayRes.data.summary);
      setWaterLogs(todayRes.data.logs);
      setWeeklyChartData(weeklyRes.data.data);
      setMonthlyChartData(monthlyRes.data.data);
      setWaterStats(statsRes.data.stats);
      setWaterAiInsights(statsRes.data.aiInsights);
    } catch (err) {
      console.error('Failed to load water telemetry:', err);
    } finally {
      setWaterLoading(false);
    }
  }, []);

  // Mutator: Add water log
  const addWater = useCallback(async (amount, notes = '', date = new Date()) => {
    const dateStr = getFormattedLocalDate(date);
    try {
      const res = await api.post('/water/add', {
        amount,
        notes,
        date: dateStr
      });
      await fetchWaterTelemetry(date, false);
      return res.data;
    } catch (err) {
      console.error('Failed to add water:', err);
      throw err;
    }
  }, [fetchWaterTelemetry]);

  // Mutator: Update water log
  const updateWater = useCallback(async (id, amount, notes = '', date = new Date()) => {
    try {
      const res = await api.patch(`/water/update/${id}`, {
        amount,
        notes
      });
      await fetchWaterTelemetry(date, false);
      return res.data;
    } catch (err) {
      console.error('Failed to update water log:', err);
      throw err;
    }
  }, [fetchWaterTelemetry]);

  // Mutator: Delete water log
  const deleteWater = useCallback(async (id, date = new Date()) => {
    try {
      const res = await api.delete(`/water/delete/${id}`);
      await fetchWaterTelemetry(date, false);
      return res.data;
    } catch (err) {
      console.error('Failed to delete water log:', err);
      throw err;
    }
  }, [fetchWaterTelemetry]);

  // Mutator: Reset today's intake
  const resetTodayWater = useCallback(async (date = new Date()) => {
    try {
      const res = await api.post('/water/reset');
      await fetchWaterTelemetry(date, false);
      return res.data;
    } catch (err) {
      console.error('Failed to reset water logs:', err);
      throw err;
    }
  }, [fetchWaterTelemetry]);

  // Mutator: Set daily intake goal
  const setDailyGoal = useCallback(async (goal, date = new Date()) => {
    try {
      const res = await api.post('/water/goal', { goal });
      await fetchWaterTelemetry(date, false);
      return res.data;
    } catch (err) {
      console.error('Failed to update water goal:', err);
      throw err;
    }
  }, [fetchWaterTelemetry]);

  // Initial load on mount
  useEffect(() => {
    fetchWaterTelemetry(new Date(), true);
  }, [fetchWaterTelemetry]);

  const value = {
    waterSummary,
    waterLogs,
    weeklyChartData,
    monthlyChartData,
    waterStats,
    waterAiInsights,
    waterLoading,
    fetchWaterTelemetry,
    addWater,
    updateWater,
    deleteWater,
    resetTodayWater,
    setDailyGoal
  };

  return (
    <WaterContext.Provider value={value}>
      {children}
    </WaterContext.Provider>
  );
};
