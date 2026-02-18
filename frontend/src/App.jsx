import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Register from './pages/Register.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import theme from './theme';

// Páginas
import Login from './pages/Login.jsx';

// Provider
import ProviderDashboard from './pages/provider/ProviderDashboard.jsx';
import ProviderAccessRequests from './pages/provider/ProviderAccessRequests.jsx';
import ProviderContracts from './pages/provider/ProviderContracts.jsx';
import ProviderAudit from './pages/provider/ProviderAudit.jsx';
import ProviderDatasetsEdit from './pages/provider/ProviderDatasetsEdit.jsx';

// Consumer
import ConsumerDashboard from './pages/consumer/ConsumerDashboard.jsx';
import ConsumerCatalog from './pages/consumer/ConsumerCatalog.jsx';
import ConsumerAccessRequests from './pages/consumer/ConsumerAccessRequests.jsx';
import ConsumerContracts from './pages/consumer/ConsumerContracts.jsx';
import ConsumerLocalCatalog from './pages/consumer/ConsumerLocalCatalog.jsx';
import ConsumerOpenMetadata from './pages/consumer/ConsumerOpenMetadata.jsx';

// Operator
import OperatorDashboard from './pages/operator/OperatorDashboard.jsx';
import OperatorUsers from './pages/operator/OperatorUsers.jsx';
import OperatorNegotiationTypes from './pages/operator/OperatorNegotiationTypes.jsx';
import OperatorAudit from './pages/operator/OperatorAudit.jsx';
import OperatorDatasets from './pages/operator/OperatorDatasets.jsx';

import CatalogSelector from './pages/catalog/CatalogSelector.jsx';
import LocalCatalogPage from './pages/catalog/LocalCatalogPage.jsx';
import Navbar from './components/Navbar.jsx';

import SupportMyConversations from './pages/support/SupportMyConversations.jsx';
import SupportConversationView from './pages/support/SupportConversationView.jsx';
import SupportAllConversations from './pages/support/SupportAllConversations.jsx';
import SupportFab from './components/SupportFab.jsx';
import ContractDetails from './pages/contracts/ContractDetails.jsx';

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Estas funciones y arrays ya no se usan por el Navbar nuevo,
  // pero las dejo intactas por si las necesitas en otro sitio.
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavigate = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const consumerItems = [
    { label: 'Dashboard', path: '/consumer' },
    { label: 'Catálogo', path: '/consumer/catalog' },
    { label: 'Solicitudes', path: '/consumer/access-requests' },
    { label: 'Contratos', path: '/consumer/contracts' },
  ];

  const providerItems = [
    { label: 'Dashboard', path: '/provider' },
    { label: 'Mis datasets', path: '/provider/datasets' },
    { label: 'Solicitudes de acceso', path: '/provider/access-requests' },
    { label: 'Mis contratos', path: '/provider/contracts' },
    { label: 'Auditoría de accesos', path: '/provider/audit' },
  ];

  const operatorItems = [
    { label: 'Dashboard', path: '/operator' },
    { label: 'Usuarios', path: '/operator/users' },
    { label: 'Tipos de negociación', path: '/operator/negotiation-types' },
    { label: 'Auditoría', path: '/operator/audit' },
  ];

  const getMenuItems = () => {
    if (!user) return [];
    if (user.role === 'CONSUMER') return consumerItems;
    if (user.role === 'PROVIDER') return providerItems;
    if (user.role === 'OPERATOR') return operatorItems;
    return [];
  };

  const menuItems = getMenuItems();

  const roleLabel =
    user?.role === 'PROVIDER'
      ? 'Provider'
      : user?.role === 'CONSUMER'
      ? 'Consumer'
      : user?.role === 'OPERATOR'
      ? 'Operator'
      : '';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        {/* NAVBAR NUEVO, COMPARTIDO POR TODOS LOS ROLES */}
        <Navbar />

        {/* CONTENIDO: margen superior para no quedar debajo del AppBar */}
        <Box sx={{ mt: 8, p: 2 }}>
          <Routes>
            {/* Auth */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* PROVIDER */}
            <Route path="/provider" element={<ProviderDashboard />} />
            <Route path="/provider/datasets" element={<ProviderDatasetsEdit />} />
            <Route
              path="/provider/access-requests"
              element={<ProviderAccessRequests />}
            />
            <Route path="/provider/contracts" element={<ProviderContracts />} />
            <Route path="/provider/audit" element={<ProviderAudit />} />

            {/* CONSUMER */}
            <Route path="/consumer" element={<ConsumerDashboard />} />
            <Route path="/consumer/catalog" element={<ConsumerCatalog />} />
            <Route
              path="/consumer/access-requests"
              element={<ConsumerAccessRequests />}
            />
            <Route path="/consumer/contracts" element={<ConsumerContracts />} />
            <Route
              path="/consumer/catalog/local"
              element={<ConsumerLocalCatalog />}
            />
            <Route
              path="/consumer/catalog/open-metadata"
              element={<ConsumerOpenMetadata />}
            />

            {/* OPERATOR */}
            <Route path="/operator" element={<OperatorDashboard />} />
            <Route path="/operator/users" element={<OperatorUsers />} />
            <Route
              path="/operator/negotiation-types"
              element={<OperatorNegotiationTypes />}
            />
            <Route path="/operator/audit" element={<OperatorAudit />} />
            <Route path="/operator/datasets" element={<OperatorDatasets />} />

            {/* Catálogo genérico */}
            <Route path="/catalog" element={<CatalogSelector />} />
            <Route path="/catalog/local" element={<LocalCatalogPage />} />

            {/* Soporte para CONSUMER / PROVIDER */}
            <Route path="/support/my" element={<SupportMyConversations />} />

            {/* Panel de soporte para OPERATOR */}
            <Route path="/support/operator" element={<SupportAllConversations />} />

            {/* Vista de conversación (compartida) */}
            <Route
                path="/support/conversations/:id"
                element={<SupportConversationView />}
            />
            <Route path="/contracts/:id" element={<ContractDetails />} />   
          </Routes>
        </Box>
        <SupportFab />
      </Box>
    </ThemeProvider>
  );
}

export default App;