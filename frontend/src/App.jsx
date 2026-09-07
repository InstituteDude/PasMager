import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import AuthView from './components/AuthView';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import VaultList from './components/VaultList';
import VaultModal from './components/VaultModal';
import PasswordGeneratorModal from './components/PasswordGeneratorModal';
import SecurityAuditModal from './components/SecurityAuditModal';
import FinancialRecapView from './components/FinancialRecapView';
import FinancialAdvisoryView from './components/FinancialAdvisoryView';
import FloatingAIAssistant from './components/FloatingAIAssistant';
import Toast from './components/Toast';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [vaultItems, setVaultItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Check auth session on load
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('vault_token');
      if (!token) {
        setLoadingAuth(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          loadVaultItems();
        } else {
          localStorage.removeItem('vault_token');
        }
      } catch {
        localStorage.removeItem('vault_token');
      } finally {
        setLoadingAuth(false);
      }
    };
    checkSession();
  }, []);

  const loadVaultItems = async () => {
    try {
      const res = await api.getVaultItems();
      if (res.success) {
        setVaultItems(res.items || []);
      }
    } catch (err) {
      showToast('Gagal memuat item vault.', 'error');
    }
  };

  const handleLockVault = () => {
    localStorage.removeItem('vault_token');
    setUser(null);
    setVaultItems([]);
    showToast('Vault terkunci kembali.', 'info');
  };

  const handleSaveVaultItem = async (itemData) => {
    try {
      if (itemData.id) {
        // Edit existing
        const res = await api.updateVaultItem(itemData.id, itemData);
        if (res.success) {
          showToast('Item vault berhasil diperbarui!', 'success');
          loadVaultItems();
          setIsAddModalOpen(false);
          setEditingItem(null);
        } else {
          showToast(res.message || 'Gagal memperbarui item.', 'error');
        }
      } else {
        // Create new
        const res = await api.createVaultItem(itemData);
        if (res.success) {
          showToast('Item berhasil disimpan terenkripsi!', 'success');
          loadVaultItems();
          setIsAddModalOpen(false);
        } else {
          showToast(res.message || 'Gagal menyimpan item.', 'error');
        }
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat menyimpan item.', 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Yakin ingin menghapus item ini dari vault?')) return;
    try {
      const res = await api.deleteVaultItem(id);
      if (res.success) {
        showToast('Item berhasil dihapus dari vault.', 'success');
        setVaultItems(prev => prev.filter(i => i.id !== id));
      } else {
        showToast(res.message || 'Gagal menghapus item.', 'error');
      }
    } catch (err) {
      showToast('Gagal menghapus item vault.', 'error');
    }
  };

  const handleToggleFavorite = async (item) => {
    try {
      const res = await api.updateVaultItem(item.id, { isFavorite: !item.isFavorite });
      if (res.success) {
        setVaultItems(prev => prev.map(i => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i));
        showToast(item.isFavorite ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} berhasil disalin ke clipboard!`, 'success');
  };

  // Count items per category
  const itemCountMap = {
    ALL: vaultItems.length,
    BANK_ACCOUNT: vaultItems.filter(i => i.type === 'BANK_ACCOUNT').length,
    CARD: vaultItems.filter(i => i.type === 'CARD').length,
    PASSWORD: vaultItems.filter(i => i.type === 'PASSWORD').length,
    NOTE: vaultItems.filter(i => i.type === 'NOTE').length,
    FAVORITE: vaultItems.filter(i => i.isFavorite).length
  };

  if (loadingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6366f1',
        fontWeight: 600
      }}>
        Inisialisasi CyberVault Safe Engine...
      </div>
    );
  }

  // If not logged in / vault locked
  if (!user) {
    return (
      <>
        <AuthView onAuthSuccess={(userData) => { setUser(userData); loadVaultItems(); }} showToast={showToast} />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenAddModal={() => { setEditingItem(null); setIsAddModalOpen(true); }}
        onOpenGeneratorModal={() => setIsGeneratorModalOpen(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onLockVault={handleLockVault}
        user={user}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          itemCountMap={itemCountMap}
        />

        <main style={{ flex: 1, backgroundColor: 'rgba(7, 9, 14, 0.4)', overflowY: 'auto' }}>
          {activeCategory === 'FINANCIAL_RECAP' ? (
            <FinancialRecapView onCopy={handleCopyText} showToast={showToast} />
          ) : activeCategory === 'FINANCIAL_ADVISORY' ? (
            <FinancialAdvisoryView showToast={showToast} />
          ) : (
            <VaultList
              items={vaultItems}
              activeCategory={activeCategory}
              searchTerm={searchTerm}
              onEdit={(item) => { setEditingItem(item); setIsAddModalOpen(true); }}
              onDelete={handleDeleteItem}
              onToggleFavorite={handleToggleFavorite}
              onCopy={handleCopyText}
            />
          )}
        </main>
      </div>

      {/* Floating Draggable AI Assistant Widget */}
      <FloatingAIAssistant showToast={showToast} />

      {/* Modals */}
      <VaultModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingItem(null); }}
        onSave={handleSaveVaultItem}
        editingItem={editingItem}
      />

      <PasswordGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
        onCopy={handleCopyText}
      />

      <SecurityAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
