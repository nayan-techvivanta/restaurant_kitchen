import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Utensils,
  Layers,
  Package,
  RefreshCw,
  Filter,
  AlertCircle,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import axiosInstance from "../../api/axiosInstance";

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("time");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
  });

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/v1/order/all?limit=${pagination.limit}&page=${page}`,
      );

      if (response.data.message === "Orders fetched successfully") {
        console.log("Raw API Response Data:", response.data.data); // Debug log
        const transformedOrders = response.data.data.map((order) => {
          console.log("Processing Order:", order); // Debug log
          return {
            id: order.id,
            token: order.token,
            type: order.combo_items?.length > 0 ? "combo" : "single",
            time: new Date(order.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: new Date(order.created_at).toLocaleDateString(),
            status: order.status.toLowerCase(),
            statusOriginal: order.status,
            comboName: order.combo_items?.[0]?.combo_name || null,
            grand_total: order.grand_total,
            notes: order.notes,
            items: [
              ...order.single_items.map((item) => ({
                id: item.id, // Capture item ID
                name: item.product_name,
                qty: item.quantity,
                price: item.price,
                total: item.total,
                type: "single",
                extras: item.extra,
                product_id: item.product_id,
                status: item.status || "PENDING", // Capture item status
              })),
              ...order.combo_items.map((item) => ({
                id: item.id, // Capture item ID
                name: item.combo_name,
                qty: item.quantity,
                price: item.price,
                total: item.total,
                type: "combo",
                details: item.details,
                extras: item.extra,
                combo_id: item.combo_id,
                status: item.status || "PENDING", // Capture item status
              })),
            ],
            single_items: order.single_items,
            combo_items: order.combo_items,
          };
        });

        setOrders(transformedOrders);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
      } else if (error.response?.data?.message) {
        console.error("API Error:", error.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (orderId, itemId, status) => {
    const formData = {
      order_id: orderId,
      item_id: itemId,
      status: status,
    };
    try {
      const response = await axiosInstance.put(
        `/api/v1/order/status`,
        formData,
      );

      if (response.data.message === "Order item status updated successfully") {
        setOrders((prev) =>
          prev.map((order) => {
            if (order.id === orderId) {
              const updatedItems = order.items.map((item) =>
                item.id === itemId ? { ...item, status: status } : item,
              );
              return { ...order, items: updatedItems };
            }
            return order;
          }),
        );

        toast.success(`Item marked as ${status}`);
        return true;
      }
    } catch (error) {
      console.error("Error updating item status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update item status",
      );
      return false;
    }
  };

  // markAsReady removed

  const loadMore = () => {
    if (pagination.hasNextPage) {
      fetchOrders(pagination.page + 1);
    }
  };

  const refreshOrders = () => {
    fetchOrders(1);
  };

  useEffect(() => {
    fetchOrders();

    const intervalId = setInterval(() => {
      fetchOrders(pagination.page);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const activeOrders = orders.filter((order) => order.status !== "cancelled");

  const filteredAndSortedOrders = activeOrders
    .filter((order) => {
      if (filter === "all") return true;
      if (filter === "placed") return order.status === "placed";
      if (filter === "ready") return order.status === "completed";
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "time") {
        return (
          new Date(b.created_at || b.date + " " + b.time) -
          new Date(a.created_at || a.date + " " + a.time)
        );
      } else if (sortBy === "token") {
        return b.token - a.token;
      } else if (sortBy === "type") {
        return a.type.localeCompare(b.type);
      } else if (sortBy === "status") {
        const statusOrder = {
          placed: 0,
          completed: 1,
        };
        return (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2);
      } else if (sortBy === "amount") {
        return b.grand_total - a.grand_total;
      }
      return 0;
    });

  const placedCount = activeOrders.filter((o) => o.status === "placed").length;
  const readyCount = activeOrders.filter(
    (o) => o.status === "completed",
  ).length;
  const pendingCount = placedCount;

  const getStatusDisplay = (status) => {
    const statusMap = {
      placed: "Placed",
      pending: "Pending",
      cooking: "Cooking",
      ready: "Ready",
      completed: "Completed",
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      placed: { bg: "bg-yellow-100", text: "text-yellow-700" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
      cooking: { bg: "bg-blue-100", text: "text-blue-700" },
      ready: { bg: "bg-green-100", text: "text-green-700" },
      completed: { bg: "bg-green-100", text: "text-green-700" },
    };
    return (
      colorMap[status?.toLowerCase()] || {
        bg: "bg-gray-100",
        text: "text-gray-700",
      }
    );
  };

  const getStatusLineColor = (status) => {
    const colorMap = {
      placed: "bg-linear-to-r from-yellow-400 to-amber-400",
      completed: "bg-linear-to-r from-green-400 to-emerald-400",
    };
    return colorMap[status] || "bg-gray-400";
  };

  const renderExtras = (extras) => {
    if (!extras || extras.length === 0) return null;

    return (
      <div className="ml-6 mt-2 border-l-2 border-amber-300 pl-3">
        <div className="text-xs font-medium text-amber-600 mb-1">Extras:</div>
        {extras.map((extra, idx) => (
          <div
            key={idx}
            className="text-xs text-gray-600 mb-1 flex items-center justify-between"
          >
            <span>
              + {extra.name} (x{extra.quantity})
            </span>
            <span className="font-medium">
              ₹{extra.total_price || extra.unit_price * extra.quantity}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderComboDetails = (details) => {
    if (!details || details.length === 0) return null;

    return (
      <div className="ml-6 mt-2 border-l-2 border-purple-300 pl-3">
        <div className="text-xs font-medium text-purple-600 mb-1">
          Includes:
        </div>
        {details.map((detail, idx) => (
          <div
            key={idx}
            className="text-xs text-gray-600 mb-1 flex items-center justify-between"
          >
            <span>
              • {detail.product_name} (x{detail.quantity})
            </span>
            <span className="text-gray-500 line-through">
              ₹{detail.original_unit_price}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 to-orange-50 p-4 md:p-6">
      {/* Header Section */}
      <ToastContainer />
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-r from-yellow-500 to-yellow-400 shadow-lg">
              <Utensils className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Kitchen Dashboard
              </h1>
              <p className="text-gray-600">
                Manage and track food orders in real-time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {pendingCount}
                </div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {readyCount}
                </div>
                <div className="text-xs text-gray-500">Ready</div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={refreshOrders}
              disabled={loading}
              className="p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              <RefreshCw
                size={20}
                className={`text-amber-600 ${loading ? "animate-spin" : ""}`}
              />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Stats Overview - Only Placed & Ready */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-3xl font-bold text-yellow-500">
            {placedCount}
          </div>
          <div className="text-sm text-gray-500">Placed</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-3xl font-bold text-green-500">{readyCount}</div>
          <div className="text-sm text-gray-500">Ready</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-3xl font-bold text-gray-500">
            {activeOrders.length}
          </div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
      </div>

      {/* Filters Section - No Cancelled Filter */}
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
            onClick={() => setFilter("placed")}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === "placed"
                ? "bg-linear-to-r from-yellow-500 to-yellow-400 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            }`}
          >
            Placed ({placedCount})
          </button>
          <button
            onClick={() => setFilter("ready")}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === "ready"
                ? "bg-green-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            }`}
          >
            Ready ({readyCount})
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
            <option value="token">Sort by Token</option>
            <option value="type">Sort by Type</option>
            <option value="status">Sort by Status</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && activeOrders.length === 0 && (
        <div className="text-center py-16">
          <RefreshCw
            size={48}
            className="text-amber-600 animate-spin mx-auto mb-4"
          />
          <h3 className="text-xl font-bold text-gray-800">Loading orders...</h3>
        </div>
      )}

      {/* Orders Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredAndSortedOrders.map((order) => {
                const statusColor = getStatusColor(order.status);
                const statusLineColor = getStatusLineColor(order.status);

                return (
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
                    <div className={`h-2 w-full ${statusLineColor}`}></div>
                    <div className="p-6 flex flex-col h-full">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="font-bold text-xl text-gray-900">
                              Token No: {order.token}
                            </h2>
                            <span
                              className={`px-2 py-1 text-xs font-bold rounded-full ${statusColor.bg} ${statusColor.text}`}
                            >
                              {getStatusDisplay(order.status)}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            Order ID: {order.id} •{" "}
                            {formatPrice(order.grand_total)}
                          </p>
                          {order.notes && (
                            <p className="text-sm text-gray-500 mt-1 italic">
                              <span className="font-medium">Note:</span>{" "}
                              {order.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 text-amber-600 font-semibold">
                            <Clock size={16} />
                            {order.time}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {order.date}
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
                      {order.comboName && (
                        <div className="mb-4 p-3 bg-linear-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100">
                          <div className="flex items-center gap-2">
                            <Layers className="text-purple-600" size={18} />
                            <span className="font-bold text-purple-700">
                              {order.comboName}
                            </span>
                            {order.combo_items?.[0]?.savings_percentage && (
                              <span className="ml-auto text-sm font-bold text-green-600">
                                Save {order.combo_items[0].savings_percentage}%
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      <div className="grow mb-6">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Utensils size={16} className="text-amber-600" />
                          Order Items ({order.items.length})
                        </h3>
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between items-center p-2 hover:bg-amber-50 rounded-lg transition-colors">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      item.type === "combo"
                                        ? "bg-purple-400"
                                        : "bg-amber-400"
                                    }`}
                                  ></div>
                                  <div className="max-w-[200px]">
                                    <span className="text-gray-800 font-medium">
                                      {item.name}
                                    </span>
                                    <div className="text-xs text-gray-500">
                                      {formatPrice(item.price)} each
                                    </div>
                                    <div
                                      className={`text-xs font-bold mt-1 ${getStatusColor(item.status).text}`}
                                    >
                                      {getStatusDisplay(item.status)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-gray-900 bg-amber-100 px-2 py-1 rounded">
                                    x{item.qty}
                                  </span>
                                  <div className="text-sm font-bold text-gray-800 mt-1">
                                    {formatPrice(item.total)}
                                  </div>
                                </div>
                              </div>

                              {/* Item Status Actions */}
                              <div className="flex justify-end gap-2 px-2 pb-2">
                                {(item.status === "PENDING" ||
                                  item.status === "placed" ||
                                  !item.status) && (
                                  <button
                                    onClick={() =>
                                      updateItemStatus(
                                        order.id,
                                        item.id,
                                        "COOKING",
                                      )
                                    }
                                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full transition-colors"
                                  >
                                    Start Cooking
                                  </button>
                                )}
                                {item.status === "COOKING" && (
                                  <button
                                    onClick={() =>
                                      updateItemStatus(
                                        order.id,
                                        item.id,
                                        "READY",
                                      )
                                    }
                                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full transition-colors"
                                  >
                                    Mark Ready
                                  </button>
                                )}
                              </div>

                              {renderExtras(item.extras)}
                              {renderComboDetails(item.details)}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-auto space-y-2">
                        {/* Old Mark as Ready Button Removed */}
                        {order.status === "completed" && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full bg-linear-to-r from-green-100 to-emerald-100 border border-green-200 text-green-800 py-3 rounded-xl text-center font-bold flex items-center justify-center gap-2"
                          >
                            <Package size={20} />
                            Ready for Pickup
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Load More Button */}
          {pagination.hasNextPage && (
            <div className="mt-8 text-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-3 bg-white border border-amber-300 text-amber-700 rounded-xl font-medium hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More Orders"}
              </motion.button>
            </div>
          )}

          {/* Empty State */}
          {filteredAndSortedOrders.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="inline-flex p-6 rounded-full bg-amber-100 mb-4">
                <AlertCircle size={48} className="text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No orders found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {filter === "all"
                  ? "There are no active orders in the system. New orders will appear here automatically."
                  : `No ${filter} orders at the moment. Try a different filter.`}
              </p>
            </motion.div>
          )}
        </>
      )}

      {/* Footer Note */}
      <div className="mt-10 text-center text-gray-500 text-sm">
        <p>
          Kitchen Dashboard • Auto-refreshes every 30 seconds • Showing{" "}
          {activeOrders.length} active orders
        </p>
        <p className="mt-1">
          Last updated:{" "}
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
