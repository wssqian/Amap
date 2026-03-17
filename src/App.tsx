/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Truck, 
  Plane, 
  Warehouse, 
  ThermometerSnowflake, 
  Navigation, 
  ArrowRight,
  Activity,
  Box,
  Globe,
  Maximize,
  Minimize
} from 'lucide-react';

declare global {
  interface Window {
    BMapGL: any;
    initBaiduMap: () => void;
  }
}

// --- Types ---
interface Node {
  id: string;
  name: string;
  type: 'headquarters' | 'base' | 'destination';
  lng: number;
  lat: number;
  details?: string;
}

interface Connection {
  from: string;
  to: string;
  type: 'road' | 'air';
}

// --- Data ---
const NODES: Node[] = [
  { id: 'yinchuan', name: '银川总部', type: 'headquarters', lng: 106.278179, lat: 38.46637, details: '核心枢纽，冷链调度中心' },
  { id: 'zhongwei', name: '中卫基地', type: 'base', lng: 105.189568, lat: 37.514951, details: '农产品集散中心' },
  { id: 'wuzhong', name: '吴忠基地', type: 'base', lng: 106.199409, lat: 37.986165, details: '畜牧产品加工基地' },
  { id: 'guyuan', name: '固原基地', type: 'base', lng: 106.285241, lat: 36.004561, details: '高海拔冷凉蔬菜基地' },
  
  // Destinations
  { id: 'beijing', name: '北京', type: 'destination', lng: 116.407395, lat: 39.904211 },
  { id: 'tianjin', name: '天津', type: 'destination', lng: 117.200983, lat: 39.084158 },
  { id: 'xian', name: '西安', type: 'destination', lng: 108.93984, lat: 34.34127 },
  { id: 'suzhou', name: '苏州', type: 'destination', lng: 120.585315, lat: 31.298886 },
  { id: 'shanghai', name: '上海', type: 'destination', lng: 121.473701, lat: 31.230416 },
  { id: 'chengdu', name: '成都', type: 'destination', lng: 104.066541, lat: 30.572269 },
  { id: 'guangzhou', name: '广州', type: 'destination', lng: 113.264434, lat: 23.129112 },
];

const CONNECTIONS: Connection[] = [
  { from: 'yinchuan', to: 'beijing', type: 'road' },
  { from: 'yinchuan', to: 'tianjin', type: 'road' },
  { from: 'yinchuan', to: 'xian', type: 'road' },
  { from: 'yinchuan', to: 'suzhou', type: 'road' },
  { from: 'yinchuan', to: 'shanghai', type: 'road' },
  { from: 'yinchuan', to: 'chengdu', type: 'road' },
  { from: 'yinchuan', to: 'guangzhou', type: 'air' },
  { from: 'zhongwei', to: 'yinchuan', type: 'road' },
  { from: 'wuzhong', to: 'yinchuan', type: 'road' },
  { from: 'guyuan', to: 'yinchuan', type: 'road' },
];

export default function App() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = () => {
      if (!isMounted || typeof window.BMapGL === 'undefined') return;

      try {
        // Initialize map
        const map = new window.BMapGL.Map('baidu-map-container');
        mapRef.current = map;
        
        // Center on China and set zoom level
        map.centerAndZoom(new window.BMapGL.Point(108.0, 35.0), 5);
        map.enableScrollWheelZoom(true);

        // Add nodes (markers)
        NODES.forEach(node => {
          const point = new window.BMapGL.Point(node.lng, node.lat);
          const marker = new window.BMapGL.Marker(point);
          map.addOverlay(marker);
          
          marker.addEventListener('click', () => {
            setSelectedNode(node);
            map.panTo(point);
          });

          const label = new window.BMapGL.Label(node.name, {
            position: point,
            offset: new window.BMapGL.Size(15, -25)
          });
          
          label.setStyle({
            color: node.type === 'headquarters' ? '#4f46e5' : '#333',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '1px solid #e2e8f0',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '4px 8px',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          });
          
          label.addEventListener('click', () => {
            setSelectedNode(node);
            map.panTo(point);
          });
          
          map.addOverlay(label);
        });

        // Add connections (polylines)
        CONNECTIONS.forEach(conn => {
          const from = NODES.find(n => n.id === conn.from);
          const to = NODES.find(n => n.id === conn.to);
          if (from && to) {
            const polyline = new window.BMapGL.Polyline([
              new window.BMapGL.Point(from.lng, from.lat),
              new window.BMapGL.Point(to.lng, to.lat)
            ], {
              strokeColor: conn.type === 'air' ? '#6366f1' : '#64748b',
              strokeWeight: conn.type === 'air' ? 3 : 2,
              strokeOpacity: 0.8,
              strokeStyle: conn.type === 'air' ? 'dashed' : 'solid'
            });
            map.addOverlay(polyline);
          }
        });
      } catch (error) {
        console.error("Error initializing Baidu Map:", error);
      }
    };

    // Check if Baidu Map API is already loaded
    if (typeof window.BMapGL !== 'undefined') {
      initMap();
    } else {
      // Define global callback
      window.initBaiduMap = () => {
        initMap();
      };

      // Create script tag
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=1XjLLEhZhQNUzd93EjU5nOGQ&callback=initBaiduMap`;
      script.async = true;
      script.onerror = () => {
        console.error("Failed to load Baidu Map script.");
      };
      
      // Only append if it doesn't exist
      if (!document.querySelector('script[src*="api.map.baidu.com"]')) {
        document.head.appendChild(script);
      }
    }

    return () => {
      isMounted = false;
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
        } catch (e) {
          console.error("Error destroying map:", e);
        }
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <ThermometerSnowflake className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                宁夏A生鲜产品公司冷链
              </h1>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3" /> Cold Chain Network Map
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">System Status</p>
              <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                运营中 (Active)
              </p>
            </div>
            <div className="h-10 w-[1px] bg-slate-200" />
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Last Update</p>
              <p className="text-sm font-mono font-medium text-slate-600">2026-03-17 01:12</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Map Section */}
        <section className={`bg-white shadow-xl overflow-hidden relative transition-all duration-300 ${
          isFullscreen 
            ? 'fixed inset-0 z-[100] rounded-none border-0' 
            : 'lg:col-span-8 rounded-3xl border border-slate-200 min-h-[600px]'
        }`}>
          <div className="absolute top-6 left-6 z-10 pointer-events-none">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
              <Navigation className="w-5 h-5 text-indigo-500" />
              冷链地理网络示意图
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm inline-block">
              Geographic Distribution Network (Baidu Maps)
            </p>
          </div>

          <div className="absolute top-6 right-6 z-10 pointer-events-auto">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-sm text-slate-600 hover:text-indigo-600 hover:bg-white transition-colors flex items-center justify-center"
              title={isFullscreen ? "退出全屏" : "全屏显示"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>

          {/* Baidu Map Container */}
          <div className="w-full h-full bg-slate-50/50 relative">
            <div id="baidu-map-container" className="w-full h-full absolute inset-0"></div>

            {/* Floating Info Card */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md border border-slate-200 p-6 rounded-2xl shadow-2xl z-20"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        selectedNode.type === 'headquarters' ? 'bg-indigo-100 text-indigo-700' :
                        selectedNode.type === 'base' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {selectedNode.type}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-2">{selectedNode.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{selectedNode.details || '物流节点'}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedNode(null)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      关闭
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Temperature</p>
                      <p className="text-lg font-mono font-bold text-indigo-600">-18.4°C</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Humidity</p>
                      <p className="text-lg font-mono font-bold text-sky-600">85%</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Capacity</p>
                      <p className="text-lg font-mono font-bold text-slate-800">92%</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Sidebar Section */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Regional Network Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-indigo-500" />
              宁夏区域配送网络
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                  <Truck className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">冷链运输车队</p>
                  <p className="text-xs text-slate-500">24小时全区覆盖配送</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-indigo-600">128 辆</p>
                  <p className="text-[10px] text-emerald-500 font-bold">在线</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-sky-50 transition-colors">
                  <Plane className="w-6 h-6 text-slate-600 group-hover:text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">航空货运</p>
                  <p className="text-xs text-slate-500">跨省生鲜极速达</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-sky-600">12 航线</p>
                  <p className="text-[10px] text-emerald-500 font-bold">正常</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                  <Warehouse className="w-6 h-6 text-slate-600 group-hover:text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">冷库仓储</p>
                  <p className="text-xs text-slate-500">多温区智能温控</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-emerald-600">4.5万 m³</p>
                  <p className="text-[10px] text-slate-400 font-bold">容量</p>
                </div>
              </div>
            </div>

            <button className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
              查看详细报告 <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Legend Card */}
          <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-6">Legend / 图例</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-indigo-400 rounded-full" />
                <span className="text-xs font-medium">银川总部</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-sky-400 rounded-full" />
                <span className="text-xs font-medium">生产基地</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-slate-400 rounded-full" />
                <span className="text-xs font-medium">目标城市</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-0.5 bg-indigo-400/50" />
                <span className="text-xs font-medium">物流路径</span>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Box className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <p className="text-xs font-bold">宝运服务</p>
                  <p className="text-[10px] opacity-60">全程温控保障</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-medium text-slate-400">
            © 2026 宁夏A生鲜产品公司. 版权所有.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">隐私政策</a>
            <a href="#" className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">服务条款</a>
            <a href="#" className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">联系我们</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
