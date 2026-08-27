'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  CheckCircle2,
  Database,
  Layers,
  MapPin,
  Radio,
  Server,
  Truck,
  Zap,
} from 'lucide-react';
import { orderService } from '@/services/orderService';
import { useSocket } from '@/hooks/useSocket';

export default function DashboardPage() {
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { isConnected: socketConnected } = useSocket();

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await orderService.getHealth();
        if (res && res.success) {
          setHealthStatus(res.message);
          setIsBackendHealthy(true);
          setErrorMsg(null);
        } else {
          setHealthStatus('Degraded response');
        }
      } catch (err: any) {
        setHealthStatus('Backend Offline');
        setIsBackendHealthy(false);
        setErrorMsg(err?.message || 'Failed to connect to API server');
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Navbar backendConnected={isBackendHealthy} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero / System Status Header */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Zap className="h-3.5 w-3.5" /> Monorepo Environment Initialized
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Logistics Management Platform
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
                Real-time delivery orchestration, fleet dispatching, GPS telemetry, and driver mobile interface.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="default"
                onClick={() => window.location.reload()}
                className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
              >
                <Activity className="h-4 w-4" /> Re-Check Services
              </Button>
            </div>
          </div>
        </div>

        {/* Live Service Verification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Frontend Status */}
          <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Frontend Client
              </CardTitle>
              <Layers className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-white">Next.js 14+</div>
                <Badge variant="success">Active (Port 3000)</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> App Router & Tailwind CSS OK
              </p>
            </CardContent>
          </Card>

          {/* Backend Status */}
          <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Backend API Server
              </CardTitle>
              <Server className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-white">Express / TS</div>
                {isBackendHealthy ? (
                  <Badge variant="success">Online (Port 5000)</Badge>
                ) : (
                  <Badge variant="destructive">Offline</Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Status: <span className="font-mono text-slate-200">{healthStatus}</span>
              </p>
            </CardContent>
          </Card>

          {/* Real-time Socket & DB */}
          <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Real-Time & Storage
              </CardTitle>
              <Radio className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-white">Socket.IO</div>
                {socketConnected ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="secondary">Standby</Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-blue-400" /> Prisma PostgreSQL Ready
              </p>
            </CardContent>
          </Card>
        </div>

        {/* API Modular Endpoints Ready */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-800 bg-slate-900/40">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-400" /> Modular API Routes
              </CardTitle>
              <CardDescription>
                REST endpoints configured with thin controllers and dedicated services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-800 text-sm">
                <li className="py-2.5 flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-300">GET /api/health</span>
                  <Badge variant="outline">System Status</Badge>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-300">POST /api/auth/login</span>
                  <Badge variant="outline">Authentication</Badge>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-300">GET /api/orders</span>
                  <Badge variant="outline">Shipment Dispatch</Badge>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-300">GET /api/drivers</span>
                  <Badge variant="outline">Fleet Drivers</Badge>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-300">GET /api/vehicles</span>
                  <Badge variant="outline">Fleet Inventory</Badge>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-300">GET /api/tracking/:orderId</span>
                  <Badge variant="outline">GPS Telemetry</Badge>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/40">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-400" /> Database & Core Models
              </CardTitle>
              <CardDescription>
                Clean relational schema configured in Prisma with PostgreSQL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="font-bold text-slate-200 block">User</span>
                  <span className="text-slate-400">Roles: Admin, Dispatcher, Driver, Customer</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="font-bold text-slate-200 block">Driver</span>
                  <span className="text-slate-400">License, availability, vehicle pairing</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="font-bold text-slate-200 block">Vehicle</span>
                  <span className="text-slate-400">Plate, capacity (kg), status, type</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="font-bold text-slate-200 block">Order & Tracking</span>
                  <span className="text-slate-400">Status lifecycle, live GPS breadcrumbs</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" /> Maps integration prepared for Mapbox / Google Maps API.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
