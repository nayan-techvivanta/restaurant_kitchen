import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Minus,
  X,
  Printer,
  ChefHat,
  Clock,
  AlertCircle,
  CheckCircle2,
  Leaf,
  Flame,
  Star,
} from "lucide-react";
import { FaUtensils } from "react-icons/fa";
import axiosInstance from "../../api/axiosInstance";

export default function CreateOrder() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [foodItems, setFoodItems] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [filteredFoodItems, setFilteredFoodItems] = useState([]);
  const [loadingFood, setLoadingFood] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [orderNotes, setOrderNotes] = useState("");

  const primaryColor = "#F5C857";
  const primaryLight = "#FEF6E6";
  const primaryDark = "#D4A63A";

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch food items on component mount
  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axiosInstance.get(
        "/api/v1/category/all?limit=10&page=1&status=ACTIVE&search="
      );
      if (response.data && response.data.data) {
        const mappedCategories = response.data.data.map((cat) => ({
          id: cat.id,
          name: cat.name,
          icon: FaUtensils,
          color: "from-green-500 to-emerald-600",
        }));
        setCategories([
          {
            id: "all",
            name: "All Items",
            icon: FaUtensils,
            color: "from-green-500 to-emerald-600",
          },
          ...mappedCategories,
        ]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchFoodItems = async (query = "") => {
    try {
      setLoadingFood(true);
      const response = await axiosInstance.get(
        `/api/v1/product/all?limit=100&page=1&search=${query}`
      );

      if (response.data && response.data.data) {
        const vegItems = response.data.data.filter(
          (item) => item.type === "VEG"
        );
        setFoodItems(vegItems);
        setFilteredFoodItems(vegItems);
      }
    } catch (error) {
      console.error("Error fetching food items:", error);
    } finally {
      setLoadingFood(false);
    }
  };

  const addToOrder = (item) => {
    setOrderItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [
          ...prev,
          {
            ...item,
            quantity: 1,
            itemId: item.id, 
            itemNotes: item.itemNotes || "",
          },
        ];
      }
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    const filtered = foodItems.filter((item) =>
      item.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredFoodItems(filtered);
  };

  const updateQuantity = (itemId, change) => {
    setOrderItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId || item.itemId === itemId) {
            const newQuantity = item.quantity + change;
            if (newQuantity < 1) {
              return null;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromOrder = (itemId) => {
    setOrderItems((prev) =>
      prev.filter((item) => item.id !== itemId && item.itemId !== itemId)
    );
  };

  const updateItemNotes = (itemId, notes) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.id === itemId || item.itemId === itemId
          ? { ...item, itemNotes: notes }
          : item
      )
    );
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return orderItems.reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 1),
      0
    );
  };

  // const calculateTax = () => {
  //   return calculateSubtotal() * 0.05;
  // };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const confirmOrder = async () => {
    if (orderItems.length === 0) {
      alert("Please add items to your order");
      return;
    }

    try {
      setPlacingOrder(true);

      // Build API payload
      const payload = {
        grand_total: calculateTotal(),
        items: orderItems.map((item) => ({
          product_id: item.id || item.itemId,
          quantity: item.quantity || 1,
        })),
      };

      const response = await axiosInstance.post("/api/v1/order/add", payload);

      if (response.data) {
        // Generate token locally for UI/print
        const token = Math.floor(1000 + Math.random() * 9000);
        setGeneratedToken(token);
        setShowOrderSuccess(true);

        const orderData = {
          token,
          items: orderItems.map((item) => ({
            ...item,
            price: item.price || 0,
            quantity: item.quantity || 1,
          })),
          subtotal: calculateSubtotal(),
          total: calculateTotal(),
          notes: orderNotes,
          timestamp: new Date().toLocaleString(),
        };

        printOrder(orderData);
        sendToKitchen(token);

        // Clear order after success
        setTimeout(() => {
          setOrderItems([]);
          setOrderNotes("");
          setShowOrderSuccess(false);
        }, 5000);
      }
    } catch (error) {
      console.error("Order API Failed:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  // Print order
  const printOrder = (orderData) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${orderData.token}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; background: #fff; }
            .header { text-align: center; border-bottom: 3px solid #F5C857; padding-bottom: 20px; margin-bottom: 20px; }
            .restaurant-name { font-size: 24px; font-weight: bold; color: #2D3748; margin-bottom: 5px; }
            .tagline { color: #4A5568; font-size: 14px; margin-bottom: 10px; }
            .leaf { color: #48BB78; font-size: 20px; margin: 0 5px; }
            .token { font-size: 32px; font-weight: bold; color: #F5C857; margin: 10px 0; padding: 10px; background: #FEF6E6; border-radius: 10px; }
            .time { color: #718096; margin: 5px 0; }
            .item { margin: 15px 0; padding-bottom: 10px; border-bottom: 1px solid #E2E8F0; }
            .item-header { display: flex; justify-content: space-between; align-items: center; }
            .item-name { font-weight: bold; color: #2D3748; }
            .item-quantity { color: #718096; font-size: 14px; }
            .item-notes { font-size: 12px; color: #718096; margin-top: 5px; font-style: italic; background: #F7FAFC; padding: 5px; border-radius: 4px; }
            .totals { margin-top: 25px; padding-top: 20px; border-top: 2px dashed #CBD5E0; }
            .total-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; }
            .grand-total { font-size: 20px; font-weight: bold; background: #FEF6E6; padding: 10px; border-radius: 8px; margin-top: 10px; }
            .order-notes { margin-top: 20px; padding: 15px; background: #EDF2F7; border-radius: 8px; color: #4A5568; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0; color: #718096; font-size: 12px; }
            @media print { 
              body { padding: 10px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">Hotel Vivanta Pure Veg Restaurant</div>
            <div class="tagline">100% Vegetarian <span class="leaf">🍃</span> Farm Fresh Ingredients</div>
            <div class="token">Token: #${orderData.token}</div>
            <div class="time">${orderData.timestamp}</div>
          </div>
          <div class="items">
            ${orderData.items
              .map(
                (item) => `
              <div class="item">
                <div class="item-header">
                  <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-quantity">${item.quantity} × ₹${
                  item.price
                }</div>
                  </div>
                  <div style="font-weight: bold;">₹${
                    (item.quantity || 1) * (item.price || 0)
                  }</div>
                </div>
                ${
                  item.itemNotes
                    ? `<div class="item-notes">Note: ${item.itemNotes}</div>`
                    : ""
                }
              </div>
            `
              )
              .join("")}
          </div>
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${orderData.subtotal.toFixed(2)}</span>
            </div>
            
            <div class="total-row grand-total">
              <span>Total Amount:</span>
              <span>₹${orderData.total.toFixed(2)}</span>
            </div>
          </div>
          ${
            orderData.notes
              ? `
            <div class="order-notes">
              <strong>Special Instructions:</strong><br>
              ${orderData.notes}
            </div>
          `
              : ""
          }
          <div class="footer">
            Thank you for dining with us! Your token number will be called when ready.<br>
            <span style="color: #48BB78;">🍃 Pure Vegetarian • 🌱 Fresh Ingredients • ❤️ Made with Love</span>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #F5C857; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.3s;">
              🖨️ Print Receipt
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const sendToKitchen = (token) => {
    console.log(`Order #${token} sent to kitchen`);
  };

  const clearOrder = () => {
    setOrderItems([]);
    setOrderNotes("");
  };

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredFoodItems(foodItems);
    } else {
      const filtered = foodItems.filter(
        (item) => item.category === selectedCategory
      );
      setFilteredFoodItems(filtered);
    }
  }, [selectedCategory, foodItems]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-8 ">
      {/* Success Toast */}
      <AnimatePresence>
        {showOrderSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-linear-to-r from-green-500 to-emerald-600 rounded-xl shadow-2xl p-6 text-white">
              <div className="flex items-center">
                <div className="shrink-0 bg-white/20 p-3 rounded-full">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-bold text-lg">
                    Order Confirmed Successfully!
                  </h3>
                  <p className="text-sm opacity-90">
                    Token{" "}
                    <span className="font-bold text-yellow-300">
                      #{generatedToken}
                    </span>{" "}
                    sent to kitchen
                  </p>
                  <p className="text-xs mt-1 opacity-80">
                    Preparing your delicious veg meal...
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderSuccess(false)}
                  className="text-white hover:text-yellow-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl border border-amber-100 p-4 md:p-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-400 w-6 h-6" />
              <input
                type="text"
                placeholder="Search vegetarian delights... (Paneer, Biryani, Desserts)"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-14 pr-4 py-4 border-2 border-amber-100 rounded-xl focus:ring-2 focus:ring-[#F5C857] focus:border-[#F5C857] outline-none transition-all bg-amber-50/50 placeholder-gray-400"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                {filteredFoodItems.length} items
              </div>
            </div>
          </motion.div>
          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, rotate: -2 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Food Categories
              </h2>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDrawerOpen(true)}
                className="text-sm font-medium text-yellow-400 hover:text-amber-500"
              >
                View Order ({orderItems.length})
              </motion.button>
            </div>

            {loadingCategories ? (
              <div className="text-center py-4 text-gray-500">
                Loading categories...
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold border ${
                      selectedCategory === category.id
                        ? "bg-yellow-500/10 text-[#F5C857] border-[#F5C857]"
                        : "bg-white text-gray-700 border-gray-200 cursor-pointer hover:border-yellow-500 hover:text-yellow-500"
                    }`}
                  >
                    {category.name}
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        selectedCategory === category.id
                          ? "bg-yellow-500/10 text-amber-400"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {
                        foodItems.filter(
                          (item) =>
                            selectedCategory === "all" ||
                            item.category === category.id
                        ).length
                      }
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Food Items Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl border border-amber-100 p-4 md:p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Vegetarian Menu
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-gray-600 text-sm">
                  {filteredFoodItems.length} delicious items
                </span>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-500">Pure Veg</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Flame className="w-3 h-3 text-red-500" />
                    <span className="text-gray-500">Spicy</span>
                  </div>
                </div>
              </div>
            </div>

            {loadingFood ? (
              <div className="text-center py-10">Loading menu items...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFoodItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="group relative bg-linear-to-b from-white to-amber-50 border-2 border-amber-100 rounded-2xl p-5 hover:shadow-2xl hover:border-[#F5C857] transition-all duration-300"
                  >
                    {/* Popular Badge */}
                    {item.popular && (
                      <div className="absolute -top-2 -right-2 bg-linear-to-r from-[#F5C857] to-[#F8D775] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        BESTSELLER
                      </div>
                    )}

                    {/* Veg Icon */}
                    <div className="absolute -top-2 -left-2 bg-linear-to-r from-green-500 to-emerald-600 text-white p-2 rounded-full shadow-lg">
                      <Leaf className="w-4 h-4" />
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#D4A63A] transition-colors">
                          {item.name}
                        </h3>
                        {item.spicy && (
                          <Flame className="w-5 h-5 text-red-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-[#F5C857]">
                          ₹{item.price}
                        </div>
                        {item.rating && (
                          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 text-amber-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {item.rating}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => addToOrder(item)}
                        className="px-5 py-3 bg-linear-to-r from-[#F5C857] to-[#F8D775] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="sticky top-24 bg-linear-to-b from-white to-amber-50 rounded-2xl shadow-2xl border-2 border-amber-100 overflow-hidden"
          >
            {/* Order Header */}
            <div className="bg-linear-to-r from-[#F5C857] via-[#F8D775] to-[#F5C857] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="flex justify-between items-center text-white mb-2">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <ChefHat className="w-6 h-6" />
                    </div>
                    Your Order
                  </h2>
                  <Clock className="w-6 h-6" />
                </div>
                <div className="text-amber-100">
                  {orderItems.length === 0
                    ? "Add delicious vegetarian items to begin"
                    : `${orderItems.length} items • ₹${calculateTotal().toFixed(
                        2
                      )}`}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent">
              {orderItems.length === 0 ? (
                <div className="text-center py-10">
                  <div className="relative">
                    <div className="w-20 h-20 bg-linear-to-r from-amber-100 to-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-amber-400" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Leaf className="w-8 h-8 text-green-400" />
                    </div>
                  </div>
                  <p className="text-gray-500 font-medium">
                    Your order is empty
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Explore our vegetarian menu above
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {orderItems.map((item) => (
                    <motion.div
                      key={item.id || item.itemId}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="bg-white border border-amber-100 rounded-xl p-4 mb-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900">
                              {item.name}
                            </h4>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Pure Veg
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            ₹{item.price} each
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            removeFromOrder(item.id || item.itemId)
                          }
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              updateQuantity(item.id || item.itemId, -1)
                            }
                            className="w-10 h-10 rounded-full bg-linear-to-r from-amber-50 to-yellow-50 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
                          >
                            <Minus className="w-5 h-5 text-amber-600" />
                          </button>
                          <span className="w-12 text-center font-bold text-xl text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id || item.itemId, 1)
                            }
                            className="w-10 h-10 rounded-full bg-linear-to-r from-amber-50 to-yellow-50 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
                          >
                            <Plus className="w-5 h-5 text-amber-600" />
                          </button>
                        </div>
                        <div className="font-bold text-2xl text-[#F5C857]">
                          ₹{(item.price || 0) * (item.quantity || 1)}
                        </div>
                      </div>

                      {/* Item Notes */}
                      <input
                        type="text"
                        placeholder="Customize (e.g., less spicy, extra butter)"
                        value={item.itemNotes || ""}
                        onChange={(e) =>
                          updateItemNotes(
                            item.id || item.itemId,
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 text-sm border-2 border-amber-100 rounded-xl focus:ring-2 focus:ring-[#F5C857] focus:border-[#F5C857] outline-none bg-amber-50/50 placeholder-gray-400 transition-all"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Order Notes */}
            {/* {orderItems.length > 0 && (
              <div className="p-6 border-t border-amber-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📝</span> Special Instructions
                </h3>
                <textarea
                  placeholder="Any special requests for your order? (e.g., no onion garlic, less oil, extra spicy)"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-amber-100 rounded-xl focus:ring-2 focus:ring-[#F5C857] focus:border-[#F5C857] outline-none bg-amber-50/50 placeholder-gray-400 resize-none transition-all"
                  rows="3"
                />
              </div>
            )} */}

            {/* Order Summary */}
            {orderItems.length > 0 && (
              <div className="p-6 bg-linear-to-b from-amber-50/50 to-transparent border-t border-amber-100">
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center py-2 border-b border-amber-100">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-bold text-gray-900">
                      ₹{calculateSubtotal().toFixed(2)}
                    </span>
                  </div>
                  {/* <div className="flex justify-between items-center py-2 border-b border-amber-100">
                    <span className="text-gray-600">Tax (5%)</span>
                    <span className="font-bold text-gray-900">
                      ₹{calculateTax().toFixed(2)}
                    </span>
                  </div> */}
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-xl font-bold text-gray-900">
                      Total Amount
                    </span>
                    <span className="text-3xl font-bold text-[#F5C857]">
                      ₹{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4">
                  <button
                    onClick={confirmOrder}
                    disabled={placingOrder}
                    className={`w-full px-6 py-4 font-bold rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${
                      placingOrder
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-linear-to-r from-[#F5C857] to-[#F8D775] text-white hover:shadow-xl hover:scale-[1.02]"
                    }`}
                  >
                    <Printer className="w-6 h-6" />
                   {placingOrder ? "Placing Order..." : "CONFIRM ORDER & PRINT"}

                  </button>
                  <button
                    onClick={clearOrder}
                    className="w-full px-6 py-4 bg-linear-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold rounded-xl hover:shadow-lg hover:bg-gray-300 transition-all duration-300"
                  >
                    Clear Order
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 pt-6 border-t border-amber-200"
      >
        <div className="text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-3">
            <div className="flex items-center gap-2 text-green-700 font-medium">
              <Leaf className="w-5 h-5" />
              100% Pure Vegetarian Restaurant
            </div>
            <div className="text-amber-600">•</div>
            <div className="flex items-center gap-2 text-amber-700 font-medium">
              <Star className="w-5 h-5" />
              Certified Fresh Ingredients
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Need assistance? Contact kitchen manager at extension 101 • All
            orders are tracked in real-time
          </p>
          <div className="mt-4 text-xs text-gray-500">
            © {new Date().getFullYear()} Restaurant Vivanta • Made with ❤️ for
            vegetarian food lovers
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
