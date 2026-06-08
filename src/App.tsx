import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import MetricDetail from "@/pages/MetricDetail";
import SearchPage from "@/pages/SearchPage";
import CatalogList from "@/pages/CatalogList";
import CatalogDetail from "@/pages/CatalogDetail";
import TicketList from "@/pages/TicketList";
import TicketDetail from "@/pages/TicketDetail";
import TicketHandle from "@/pages/TicketHandle";
import SubscriptionList from "@/pages/SubscriptionList";
import SubscriptionForm from "@/pages/SubscriptionForm";
import ApprovalList from "@/pages/ApprovalList";
import ApprovalDetail from "@/pages/ApprovalDetail";
import FavoritesPage from "@/pages/FavoritesPage";
import OperationRecords from "@/pages/OperationRecords";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-white">
        <div className="mx-auto max-w-[480px] min-h-screen bg-background relative overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/metric/:id" element={<MetricDetail />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/catalog" element={<CatalogList />} />
            <Route path="/catalog/:id" element={<CatalogDetail />} />
            <Route path="/tickets" element={<TicketList />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/tickets/:id/handle" element={<TicketHandle />} />
            <Route path="/subscriptions" element={<SubscriptionList />} />
            <Route path="/subscriptions/new" element={<SubscriptionForm />} />
            <Route path="/approvals" element={<ApprovalList />} />
            <Route path="/approvals/:id" element={<ApprovalDetail />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/favorites/records" element={<OperationRecords />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
