'use client';

/**
 * Прямые импорты Recharts компонентов
 * Recharts поддерживает SSR, поэтому используем прямые импорты
 * для избежания проблем с Webpack module resolution
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

// Экспортируем компоненты напрямую (без dynamic import)
// Это работает, потому что Recharts правильно обрабатывает SSR
export const LazyPieChart = PieChart;
export const LazyPie = Pie;
export const LazyCell = Cell;
export const LazyTooltip = Tooltip;
export const LazyResponsiveContainer = ResponsiveContainer;
export const LazyBarChart = BarChart;
export const LazyBar = Bar;
export const LazyXAxis = XAxis;
export const LazyYAxis = YAxis;
export const LazyCartesianGrid = CartesianGrid;
export const LazyLegend = Legend;
