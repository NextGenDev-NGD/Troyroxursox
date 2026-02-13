import React, { useState, useEffect, useMemo } from 'react';
import { Camera, TrendingUp, Calendar, DollarSign, Plus, X, Home, PieChart, List, User, Lock, Mail, LogOut } from 'lucide-react';

const FinanceApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  
  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authError, setAuthError] = useState('');

  const [currentScreen, setCurrentScreen] = useState('home');
  const [transactions, setTransactions] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(36.50);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('bs');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState(null);

  const categories = [
    { id: 'food', name: 'Comida', icon: '🍔', color: 'bg-orange-500' },
    { id: 'transport', name: 'Transporte', icon: '🚗', color: 'bg-blue-500' },
    { id: 'services', name: 'Servicios', icon: '💡', color: 'bg-yellow-500' },
    { id: 'shopping', name: 'Compras', icon: '🛍️', color: 'bg-pink-500' },
    { id: 'health', name: 'Salud', icon: '⚕️', color: 'bg-green-500' },
    { id: 'other', name: 'Otros', icon: '📦', color: 'bg-gray-500' }
  ];

  // Check if user is logged in on mount
  useEffect(() => {
    // Initialize default admin user if not exists
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users['admin@admin.com']) {
      users['admin@admin.com'] = {
        username: 'Admin',
        password: 'admin',
        transactions: []
      };
      localStorage.setItem('users', JSON.stringify(users));
    }

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      loadUserTransactions(user.email);
    } else {
      setShowAuthModal(true);
    }
  }, []);

  const loadUserTransactions = (userEmail) => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '{}');
    if (allUsers[userEmail] && allUsers[userEmail].transactions) {
      setTransactions(allUsers[userEmail].transactions);
    }
  };

  const saveUserTransactions = (userEmail, transactions) => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '{}');
    if (!allUsers[userEmail]) {
      allUsers[userEmail] = {};
    }
    allUsers[userEmail].transactions = transactions;
    localStorage.setItem('users', JSON.stringify(allUsers));
  };

  const handleLogin = () => {
    setAuthError('');
    
    if (!email || !password) {
      setAuthError('Por favor completa todos los campos');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[email] && users[email].password === password) {
      const user = {
        email,
        username: users[email].username
      };
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      loadUserTransactions(email);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      
      setEmail('');
      setPassword('');
      setAuthError('');
    } else {
      setAuthError('Email o contraseña incorrectos');
    }
  };

  const handleRegister = () => {
    setAuthError('');
    
    if (!email || !password || !username) {
      setAuthError('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[email]) {
      setAuthError('Este email ya está registrado');
      return;
    }

    users[email] = {
      username,
      password,
      transactions: []
    };
    
    localStorage.setItem('users', JSON.stringify(users));
    
    const user = { email, username };
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setIsAuthenticated(true);
    setShowAuthModal(false);
    
    setEmail('');
    setPassword('');
    setUsername('');
    setAuthError('');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setTransactions([]);
    localStorage.removeItem('currentUser');
    setShowAuthModal(true);
  };

  const todayTotal = transactions
    .filter(t => {
      const today = new Date().toDateString();
      return new Date(t.date).toDateString() === today;
    })
    .reduce((sum, t) => sum + t.amountUSD, 0);

  const monthTotal = transactions
    .filter(t => {
      const now = new Date();
      const transDate = new Date(t.date);
      return transDate.getMonth() === now.getMonth() && 
             transDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amountUSD, 0);

  const handleAddExpense = () => {
    if (!amount || !category) return;

    const numAmount = parseFloat(amount);
    let amountUSD, amountBS;

    if (currency === 'usd') {
      amountUSD = numAmount;
      amountBS = numAmount * exchangeRate;
    } else {
      amountBS = numAmount;
      amountUSD = numAmount / exchangeRate;
    }

    const newTransaction = {
      id: Date.now(),
      amount: numAmount,
      currency,
      amountUSD: parseFloat(amountUSD.toFixed(2)),
      amountBS: parseFloat(amountBS.toFixed(2)),
      category,
      date: new Date().toISOString(),
      rate: exchangeRate,
      photo
    };

    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    saveUserTransactions(currentUser.email, updatedTransactions);
    
    setAmount('');
    setCategory('');
    setPhoto(null);
    setShowAddExpense(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteTransaction = (id) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    saveUserTransactions(currentUser.email, updatedTransactions);
  };

  const getCategoryInfo = (catId) => {
    return categories.find(c => c.id === catId) || categories[5];
  };

  const categoryTotals = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amountUSD;
    return acc;
  }, {});

  const convertedAmount = useMemo(() => {
    if (!amount) return null;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return null;
    
    if (currency === 'bs') {
      return `$${(numAmount / exchangeRate).toFixed(2)} USD`;
    } else {
      return `Bs ${(numAmount * exchangeRate).toFixed(2)}`;
    }
  }, [amount, currency, exchangeRate]);

  const AuthModal = () => {
    const handleSubmit = (e) => {
      e.preventDefault();
      if (authMode === 'login') {
        handleLogin();
      } else {
        handleRegister();
      }
    };

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center z-50 p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl">
          <div className="text-center">
            <div className="text-6xl mb-4">💰</div>
            <h1 className="text-3xl font-bold text-gray-800">Mis Finanzas</h1>
            <p className="text-gray-500 mt-2">Controla tus gastos en dólares</p>
          </div>

          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                authMode === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError('');
              }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                authMode === 'register'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Registrarse
            </button>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {authError}
            </div>
          )}

          <div className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Tu nombre"
                    autoComplete="username"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>

          {authMode === 'login' && (
            <div className="space-y-2">
              <p className="text-center text-xs text-gray-400">
                ¿Primera vez? Cambia a Registrarse para crear tu cuenta
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-medium text-center">
                  💡 Demo: admin@admin.com / admin
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    );
  };

  const HomeScreen = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm opacity-90">Tasa BCV Hoy</span>
          <TrendingUp className="w-4 h-4" />
        </div>
        <div className="text-4xl font-bold">Bs {exchangeRate.toFixed(2)}</div>
        <div className="text-sm opacity-90 mt-1">por 1 USD</div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Hoy</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-3xl font-bold text-gray-900">
          ${todayTotal.toFixed(2)}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Bs {(todayTotal * exchangeRate).toFixed(2)}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Este Mes</h3>
          <DollarSign className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-3xl font-bold text-gray-900">
          ${monthTotal.toFixed(2)}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {transactions.filter(t => {
            const now = new Date();
            const transDate = new Date(t.date);
            return transDate.getMonth() === now.getMonth();
          }).length} transacciones
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recientes</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No hay gastos registrados</p>
            <p className="text-sm mt-2">Toca el botón + para agregar uno</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map(t => {
              const cat = getCategoryInfo(t.category);
              return (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`${cat.color} w-10 h-10 rounded-full flex items-center justify-center text-white text-xl`}>
                      {cat.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{cat.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(t.date).toLocaleDateString('es-VE')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">${t.amountUSD.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Bs {t.amountBS.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const ReportsScreen = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Gastos por Categoría</h3>
        {Object.keys(categoryTotals).length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Agrega gastos para ver reportes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([catId, total]) => {
                const cat = getCategoryInfo(catId);
                const percentage = (total / monthTotal * 100).toFixed(0);
                return (
                  <div key={catId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="font-medium text-gray-800">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">${total.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${cat.color} h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );

  const TransactionsScreen = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Todas las Transacciones</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No hay transacciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(t => {
              const cat = getCategoryInfo(t.category);
              return (
                <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`${cat.color} w-12 h-12 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800">{cat.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(t.date).toLocaleString('es-VE', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Tasa: Bs {t.rate.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${t.amountUSD.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Bs {t.amountBS.toFixed(2)}</div>
                    </div>
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const AddExpenseModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
        <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4 modal-content">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Agregar Gasto</h2>
            <button
              onClick={() => setShowAddExpense(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="flex-1 text-3xl font-bold border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 bg-white font-medium"
              >
                <option value="bs">Bs</option>
                <option value="usd">USD</option>
              </select>
            </div>
            {convertedAmount && (
              <div className="mt-2 text-sm text-gray-600">
                = {convertedAmount}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <div className="grid grid-cols-3 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    category === cat.id
                      ? `${cat.color} border-transparent text-white`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Factura (Opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 cursor-pointer transition-colors"
            >
              <Camera className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {photo ? 'Foto adjunta ✓' : 'Tomar/Adjuntar foto'}
              </span>
            </label>
          </div>

          <button
            onClick={handleAddExpense}
            disabled={!amount || !category}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Agregar Gasto
          </button>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div className="max-w-lg mx-auto bg-gray-100 min-h-screen pb-20">
      <div className="bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mis Finanzas 💰</h1>
            <p className="text-sm text-gray-500 mt-1">Hola, {currentUser?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Salir</span>
          </button>
        </div>
      </div>

      <div className="p-4">
        {currentScreen === 'home' && <HomeScreen />}
        {currentScreen === 'reports' && <ReportsScreen />}
        {currentScreen === 'transactions' && <TransactionsScreen />}
      </div>

      <button
        onClick={() => setShowAddExpense(true)}
        className="fixed bottom-24 right-6 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="flex justify-around max-w-lg mx-auto">
          <button
            onClick={() => setCurrentScreen('home')}
            className={`flex flex-col items-center gap-1 ${
              currentScreen === 'home' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Inicio</span>
          </button>
          <button
            onClick={() => setCurrentScreen('reports')}
            className={`flex flex-col items-center gap-1 ${
              currentScreen === 'reports' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <PieChart className="w-6 h-6" />
            <span className="text-xs font-medium">Reportes</span>
          </button>
          <button
            onClick={() => setCurrentScreen('transactions')}
            className={`flex flex-col items-center gap-1 ${
              currentScreen === 'transactions' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <List className="w-6 h-6" />
            <span className="text-xs font-medium">Historial</span>
          </button>
        </div>
      </div>

      {showAddExpense && <AddExpenseModal />}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .modal-content {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FinanceApp;