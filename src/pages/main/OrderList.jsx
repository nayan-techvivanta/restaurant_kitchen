import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Utensils,
  Layers,
  ChefHat,
  Flame,
  Package,
  RefreshCw,
  Filter,
  AlertCircle,
} from "lucide-react";

const mockOrders = [
  {
    id: 201,
    type: "single",
    time: "11:10 AM",
    status: "pending",
    items: [
      { name: "Cheese Pizza", qty: 1 },
      { name: "Cold Coffee", qty: 2 },
    ],
  },
  {
    id: 202,
    type: "combo",
    time: "11:15 AM",
    status: "pending",
    comboName: "Family Combo",
    items: [
      { name: "Paneer Butter Masala", qty: 1 },
      { name: "Butter Naan", qty: 4 },
      { name: "Jeera Rice", qty: 1 },
    ],
  },
  {
    id: 203,
    type: "single",
    table: "Takeaway #12",
    time: "11:25 AM",
    status: "ready",
    items: [
      { name: "Veg Burger", qty: 2 },
      { name: "French Fries", qty: 1 },
      { name: "Coke", qty: 2 },
    ],
  },
  {
    id: 204,
    type: "combo",
    time: "11:30 AM",
    status: "pending",
    comboName: "Lunch Special",
    items: [
      { name: "Veg Biryani", qty: 1 },
      { name: "Raita", qty: 1 },
      { name: "Salad", qty: 1 },
    ],
  },
  {
    id: 205,
    type: "single",
    time: "11:35 AM",
    status: "pending",
    items: [
      { name: "Chocolate Cake", qty: 1 },
      { name: "Cappuccino", qty: 1 },
    ],
  },
  {
    id: 206,
    type: "combo",
    time: "11:40 AM",
    status: "pending",
    comboName: "Party Pack",
    items: [
      { name: "veg Paneer kadai", qty: 20 },
      { name: "Garlic Bread", qty: 2 },
      { name: "Soft Drinks", qty: 4 },
    ],
  },
];

export default function OrderList() {
  const [orders, setOrders] = useState(mockOrders);
  const [filter, setFilter] = useState("all"); 
  const [sortBy, setSortBy] = useState("time"); 

  const markAsReady = (id) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: "ready" } : o
      )
    );
  };

  const refreshOrders = () => {
    // Simulate getting new orders
    const newOrder = {
      id: Math.floor(Math.random() * 300) + 207,
      type: Math.random() > 0.5 ? "single" : "combo",
      table: Math.random() > 0.5 ? `Table ${Math.floor(Math.random() * 10) + 1}` : `Takeaway #${Math.floor(Math.random() * 20) + 1}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "pending",
      comboName: Math.random() > 0.5 ? "Family Combo" : "Lunch Special",
      items: [
        { name: "Sample Item", qty: 1 },
        { name: "Drink", qty: 2 },
      ],
    };
    
    setOrders(prev => [newOrder, ...prev]);
  };

  const filteredAndSortedOrders = orders
    .filter(order => {
      if (filter === "all") return true;
      return order.status === filter;
    })
    .sort((a, b) => {
      if (sortBy === "time") {
        return new Date(`1970/01/01 ${a.time}`) - new Date(`1970/01/01 ${b.time}`);
      } else if (sortBy === "table") {
        return a.table.localeCompare(b.table);
      } else {
        return a.type.localeCompare(b.type);
      }
    });

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const readyCount = orders.filter(o => o.status === "ready").length;

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 to-orange-50 p-4 md:p-6">
      {/* Header Section */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-r from-yellow-500 to-yellow-400 shadow-lg">
              <Utensils className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
              <p className="text-gray-600">Manage and track food orders in real-time</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{readyCount}</div>
                <div className="text-xs text-gray-500">Ready</div>
              </div>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={refreshOrders}
              className="p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow"
            >
              <RefreshCw size={20} className="text-amber-600" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Stats & Controls Section */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-linear-to-r from-yellow-500 to-yellow-400 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active Orders</h3>
              <p className="text-3xl font-bold mt-2">{orders.length}</p>
            </div>
            <Flame size={32} className="opacity-80" />
          </div>
          <p className="text-sm opacity-90 mt-2">Currently being prepared</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Chef's Station</h3>
              <p className="text-2xl font-bold mt-2 text-gray-900">{pendingCount}</p>
            </div>
            <ChefHat size={32} className="text-amber-600" />
          </div>
          <p className="text-sm text-gray-600 mt-2">Orders in progress</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Ready for Pickup</h3>
              <p className="text-2xl font-bold mt-2 text-green-600">{readyCount}</p>
            </div>
            <Package size={32} className="text-green-500" />
          </div>
          <p className="text-sm text-gray-600 mt-2">Awaiting delivery</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === "all"
                ? "bg-linear-to-r from-yellow-500 to-yellow-400 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === "pending"
                ? "bg-linear-to-r from-yellow-500 to-yellow-400 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("ready")}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === "ready"
                ? "bg-green-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            }`}
          >
            Ready
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm">
          <Filter size={18} className="text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-gray-700"
          >
            <option value="time">Sort by Time</option>
            <option value="table">Sort by Table</option>
            <option value="type">Sort by Type</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAndSortedOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
            >
              {/* Order Status Header */}
              <div
                className={`h-2 w-full ${
                  order.status === "pending"
                    ? "bg-linear-to-r from-amber-400 to-yellow-400"
                    : "bg-linear-to-r from-green-400 to-emerald-400"
                }`}
              ></div>

              <div className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-bold text-xl text-gray-900">
                        Token No : {order.id}
                      </h2>
                      {order.status === "pending" ? (
                        <span className="px-2 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">
                          Preparing
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full">
                          Ready
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 font-medium">{order.table}</p>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-amber-600 font-semibold">
                      <Clock size={16} />
                      {order.time}
                    </div>
                    {order.type === "combo" && (
                      <div className="mt-2 text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        <Layers size={12} className="inline mr-1" />
                        Combo
                      </div>
                    )}
                  </div>
                </div>

                {/* Combo Name */}
                {order.type === "combo" && (
                  <div className="mb-4 p-3 bg-linear-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2">
                      <Layers className="text-purple-600" size={18} />
                      <span className="font-bold text-purple-700">{order.comboName}</span>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="grow mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Utensils size={16} className="text-amber-600" />
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                          <span className="text-gray-800">{item.name}</span>
                        </div>
                        <span className="font-bold text-gray-900 bg-amber-100 px-2 py-1 rounded">
                          x{item.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-auto">
                  {order.status === "pending" ? (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => markAsReady(order.id)}
                      className="w-full bg-linear-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-white py-3 cursor-pointer rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                    >
                      <CheckCircle size={20} />
                      Mark as Ready
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full bg-linear-to-r from-green-100 to-emerald-100 border border-green-200 text-green-800 py-3 rounded-xl text-center font-bold flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      Ready for Pickup
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredAndSortedOrders.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="inline-flex p-6 rounded-full bg-amber-100 mb-4">
            <AlertCircle size={48} className="text-amber-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No orders found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {filter === "all"
              ? "There are no orders in the system. New orders will appear here automatically."
              : `No ${filter} orders at the moment. Try a different filter.`}
          </p>
        </motion.div>
      )}

      {/* Footer Note */}
      <div className="mt-10 text-center text-gray-500 text-sm">
        <p>Kitchen Dashboard • All orders update in real-time • Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
}