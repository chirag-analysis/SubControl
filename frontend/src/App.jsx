import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SubscriptionModal from './components/SubscriptionModal';
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
import SubscriptionDetail from './pages/SubscriptionDetail';
import Renewals from './pages/Renewals';
import Savings from './pages/Savings';
import Reviews from './pages/Reviews';
import Activity from './pages/Activity';
import { getCategories, detectSavings } from './api/client';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSubscriptionData, setEditSubscriptionData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Toast / notification state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreateModal = () => {
    setEditSubscriptionData(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub) => {
    setEditSubscriptionData(sub);
    setIsModalOpen(true);
  };

  const handleSelectSubscription = (id) => {
    setSelectedSubId(id);
    setCurrentTab('subscription-detail');
  };

  const handleSaveSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    loadCategories();
    showToast(editSubscriptionData ? 'Subscription updated successfully' : 'New subscription created successfully');
  };

  const handleRunSavingsDetection = async () => {
    try {
      showToast('Running deterministic savings analysis...');
      await detectSavings();
      setRefreshTrigger((prev) => prev + 1);
      showToast('Savings detection completed! Found new opportunities.');
    } catch (err) {
      alert('Error running detection: ' + err.message);
    }
  };

  const pageHeaders = {
    dashboard: {
      title: 'Spend Intelligence & Recurring Overview',
      subtitle: 'Portfolio-level visibility into company SaaS contracts, cashflow, and license efficiency',
    },
    subscriptions: {
      title: 'SaaS Subscription Portfolio',
      subtitle: 'Manage all corporate tools, licensing capacity, owners, and active billing terms',
    },
    'subscription-detail': {
      title: 'Subscription Intelligence & History',
      subtitle: 'Granular view into spend metrics, utilization alerts, invoices, and review history',
    },
    renewals: {
      title: 'Upcoming Renewal Pipeline',
      subtitle: 'Prioritized urgency tiers to eliminate unexpected auto-renew commitments',
    },
    savings: {
      title: 'Deterministic Savings Opportunities',
      subtitle: 'Rule-based license optimization, redundancy elimination, and annual billing arbitrage',
    },
    reviews: {
      title: 'Renewal Review Governance',
      subtitle: 'Formal approvals, downsizing, cancellations, and vendor renegotiations',
    },
    activity: {
      title: 'Activity & Audit Log',
      subtitle: 'Immutable record of modifications made via Web UI and external Claude MCP connections',
    },
  };

  const currentHeader = pageHeaders[currentTab] || pageHeaders.dashboard;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">
      {/* Dark Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          title={currentHeader.title}
          subtitle={currentHeader.subtitle}
          onNewSubscription={handleOpenCreateModal}
          onRunDetection={currentTab === 'savings' || currentTab === 'dashboard' ? handleRunSavingsDetection : null}
        />

        {/* Dynamic Page Router */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard 
              setCurrentTab={setCurrentTab} 
              onSelectSubscription={handleSelectSubscription} 
            />
          )}

          {currentTab === 'subscriptions' && (
            <Subscriptions
              categories={categories}
              onSelectSubscription={handleSelectSubscription}
              onEditSubscription={handleOpenEditModal}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentTab === 'subscription-detail' && (
            <SubscriptionDetail
              subscriptionId={selectedSubId}
              onBack={() => setCurrentTab('subscriptions')}
              onEdit={handleOpenEditModal}
              onRecordReview={() => setCurrentTab('reviews')}
            />
          )}

          {currentTab === 'renewals' && (
            <Renewals
              onSelectSubscription={handleSelectSubscription}
              onRecordReview={() => setCurrentTab('reviews')}
            />
          )}

          {currentTab === 'savings' && (
            <Savings onSelectSubscription={handleSelectSubscription} />
          )}

          {currentTab === 'reviews' && (
            <Reviews onSelectSubscription={handleSelectSubscription} />
          )}

          {currentTab === 'activity' && (
            <Activity onSelectSubscription={handleSelectSubscription} />
          )}
        </main>
      </div>

      {/* Subscription Modal (Create / Edit) */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editSubscriptionData}
        categories={categories}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
