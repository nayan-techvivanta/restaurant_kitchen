import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrash2,
  FiEdit2,
  FiPlus,
  FiDollarSign,
  FiStar,
  FiImage,
  FiPackage,
  FiSave,
  FiX,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { Switch, FormControlLabel, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import { MdCategory, MdFastfood, MdFoodBank } from "react-icons/md";
import axiosInstance from "../../api/axiosInstance";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const initialData = {
  categories: [],
  menuItems: [],
  combos: [],
};

const YellowSwitch = styled(Switch)(({ theme }) => ({
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: "#facc15",
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "#facc15",
  },
}));

export default function MenuManagement() {
  // State for all data
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [combos, setCombos] = useState([]);

  const [categoryName, setCategoryName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [statusLoading, setStatusLoading] = useState({});

  // Menu item form
  const [menuItemForm, setMenuItemForm] = useState({
    name: "",
    description: "",
    price: "",
    sku: "",
    categoryId: "",
    isVegetarian: true,
    isAvailable: true,
  });
  const [editMenuItemId, setEditMenuItemId] = useState(null);

  const [menuLoading, setMenuLoading] = useState(false);
  const [menuPage, setMenuPage] = useState(1);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuPagination, setMenuPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 10,
  });

  // Combo form
  const [comboForm, setComboForm] = useState({
    name: "",
    description: "",
    price: "",
    items: [],
    image: "",
    discount: 0,
  });

  // const [activeTab, setActiveTab] = useState("categories");
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("menu_active_tab") || "categories";
  });

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedCombo, setExpandedCombo] = useState(null);

  const isFetched = useRef(false);
  useEffect(() => {
    const savedData =
      JSON.parse(localStorage.getItem("menuData")) || initialData;
    setCategories(savedData.categories);
    setMenuItems(savedData.menuItems);
    setCombos(savedData.combos);
  }, []);
  useEffect(() => {
    if (isFetched.current) return;
    isFetched.current = true;

    fetchCategories();
  }, []);
  const getCategoryNameById = (id) => {
    const cat = categories.find((c) => Number(c.id) === Number(id));
    return cat ? cat.name : "";
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("/api/v1/category/all");

      if (response.data?.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Fetch categories error:", error);
      alert("Failed to load categories");
    }
  };
  useEffect(() => {
    if (activeTab === "menu-items") {
      fetchMenuItems(menuPage, menuSearch);
    }
  }, [activeTab, menuPage, menuSearch]);
  useEffect(() => {
    localStorage.setItem("menu_active_tab", activeTab);
  }, [activeTab]);

  const menuFetched = useRef(false);

  const fetchMenuItems = async (page = 1, search = "") => {
    // ✅ Prevent double API call in React StrictMode
    if (menuFetched.current) return;
    menuFetched.current = true;

    try {
      setMenuLoading(true);

      const response = await axiosInstance.get(
        `/api/v1/product/all?limit=10&page=${page}&search=${search}`
      );

      if (response.data?.data) {
        const apiItems = response.data.data;

        const formattedItems = apiItems.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: Number(item.price),
          sku: item.sku,
          categoryId: item.category_id,
          isVegetarian: item.type === "VEG",
          isAvailable: item.status === "ACTIVE",
          image: item.image || "",
          rating: 4.5,
        }));

        setMenuItems(formattedItems);

        if (response.data?.pagination) {
          setMenuPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error("Fetch menu items error:", error);
      toast.error("Failed to load menu items");
    } finally {
      setMenuLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      const payload = {
        name: categoryName.trim(),
      };

      if (editCategoryId !== null) {
        await axiosInstance.put(
          `/api/v1/category/${Number(editCategoryId)}`,
          payload
        );
        toast.success("Category updated successfully!");
      } else {
        const response = await axiosInstance.post(
          "/api/v1/category/add",
          payload
        );

        const newCategoryId = response.data?.data?.id;

        setEditCategoryId(newCategoryId);

        toast.success("Category added successfully!");
      }

      setCategoryName("");
      setEditCategoryId(null);
      fetchCategories();
    } catch (error) {
      console.error("Category API error:", error);

      if (error.response) {
        toast.error(error.response.data?.message || "Something went wrong");
      } else {
        toast.error("Network error");
      }
    }
  };

  const handleEditCategory = (category) => {
    setCategoryName(category.name);
    setEditCategoryId(category.id);
  };
  const handleToggleCategoryStatus = async (id, isActive) => {
    const status = isActive ? "ACTIVE" : "INACTIVE";

    try {
      setStatusLoading((prev) => ({ ...prev, [id]: true }));

      await axiosInstance.put(`/api/v1/category/status/${id}`, {
        status,
      });

      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, status } : cat))
      );

      toast.success(`Category ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error("Status API error:", error);
      toast.error("Failed to update category status");
    } finally {
      // stop loader
      setStatusLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteCategory = (id) => {
    if (
      window.confirm(
        "Delete this category? Menu items in this category will become uncategorized."
      )
    ) {
      setMenuItems(
        menuItems.map((item) =>
          item.categoryId === id ? { ...item, categoryId: "" } : item
        )
      );
      setCategories(categories.filter((cat) => cat.id !== id));
    }
  };

  const handleAddMenuItem = async () => {
    if (
      !menuItemForm.name.trim() ||
      !menuItemForm.price ||
      !menuItemForm.sku ||
      !menuItemForm.categoryId
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      let payload = {
        name: menuItemForm.name.trim(),
        type: menuItemForm.isVegetarian ? "VEG" : "NONVEG",
        price: Number(menuItemForm.price),
        sku: Number(menuItemForm.sku),
        category_id: Number(menuItemForm.categoryId),
        description: menuItemForm.description || "",
      };

      if (editMenuItemId) {
        payload = {
          ...payload,
          id: editMenuItemId,
        };

        await axiosInstance.put("/api/v1/product/update", payload);

        setMenuItems((prev) =>
          prev.map((item) =>
            item.id === editMenuItemId
              ? {
                  ...item,
                  ...payload,
                  categoryId: payload.category_id,
                  categoryName:
                    categories.find(
                      (c) => Number(c.id) === Number(payload.category_id)
                    )?.name || "",
                  isVegetarian: menuItemForm.isVegetarian,
                  isAvailable: menuItemForm.isAvailable,
                }
              : item
          )
        );

        toast.success("Menu item updated successfully!");
      } else {
        const response = await axiosInstance.post(
          "/api/v1/product/add",
          payload
        );

        if (response.data?.data) {
          const newItem = {
            id: response.data.data.id,
            ...payload,
            categoryId: payload.category_id,
            categoryName:
              categories.find(
                (c) => Number(c.id) === Number(payload.category_id)
              )?.name || "",
            isVegetarian: menuItemForm.isVegetarian,
            isAvailable: menuItemForm.isAvailable,
            createdAt: new Date().toISOString(),
            rating: 4.5,
          };

          setMenuItems((prev) => [...prev, newItem]);
          toast.success("Menu item added successfully!");
        }
      }

      resetMenuItemForm();
      setEditMenuItemId(null);
    } catch (error) {
      console.error("Product API error:", error);
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEditMenuItem = (item) => {
    setEditMenuItemId(item.id);

    setMenuItemForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      sku: item.sku?.toString() || "",
      categoryId: item.categoryId || "",
      isVegetarian: item.isVegetarian,
      isAvailable: item.isAvailable,
    });

    document
      .getElementById("menu-item-form")
      .scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteMenuItem = (id) => {
    if (window.confirm("Delete this menu item?")) {
      setMenuItems(menuItems.filter((item) => item.id !== id));
    }
  };

  const resetMenuItemForm = () => {
    setMenuItemForm({
      name: "",
      description: "",
      price: "",
      sku: "",
      categoryId: "",
      isVegetarian: true,
      isAvailable: true,
    });

    setEditMenuItemId(null); // ✅ clear edit mode
  };

  
  const handleAddCombo = () => {
    if (
      !comboForm.name.trim() ||
      !comboForm.price ||
      comboForm.items.length === 0
    ) {
      alert("Please fill in all required fields and add at least one item!");
      return;
    }

    const newCombo = {
      id: Date.now(),
      ...comboForm,
      price: parseFloat(comboForm.price),
      createdAt: new Date().toISOString(),
      items: [...comboForm.items],
    };

    setCombos([...combos, newCombo]);
    resetComboForm();
  };

  const handleEditCombo = (combo) => {
    setComboForm({
      name: combo.name,
      description: combo.description,
      price: combo.price.toString(),
      items: combo.items,
      image: combo.image || "",
      discount: combo.discount || 0,
    });

    // Scroll to form
    document
      .getElementById("combo-form")
      .scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteCombo = (id) => {
    if (window.confirm("Delete this combo?")) {
      setCombos(combos.filter((combo) => combo.id !== id));
    }
  };

  const resetComboForm = () => {
    setComboForm({
      name: "",
      description: "",
      price: "",
      items: [],
      image: "",
      discount: 0,
    });
  };

  const addItemToCombo = (item) => {
    if (!comboForm.items.find((i) => i.id === item.id)) {
      setComboForm({
        ...comboForm,
        items: [...comboForm.items, { ...item, quantity: 1 }],
      });
    }
  };

  const removeItemFromCombo = (itemId) => {
    setComboForm({
      ...comboForm,
      items: comboForm.items.filter((item) => item.id !== itemId),
    });
  };

  const updateComboItemQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeItemFromCombo(itemId);
      return;
    }

    setComboForm({
      ...comboForm,
      items: comboForm.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      ),
    });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const filteredMenuItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.categoryId === selectedCategory);

  const calculateComboValue = (combo) => {
    const totalValue = combo.items.reduce((sum, item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.id);
      return sum + (menuItem?.price || 0) * item.quantity;
    }, 0);
    return totalValue.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <ToastContainer />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              🍽️ Menu Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage categories, menu items, and combo meals
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4 md:mt-0">
            <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiPackage className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-xl font-bold text-gray-800">
                    {categories.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MdFastfood className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Menu Items</p>
                  <p className="text-xl font-bold text-gray-800">
                    {menuItems.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiStar className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Combos</p>
                  <p className="text-xl font-bold text-gray-800">
                    {combos.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto mb-8 pb-2">
          {["categories", "menu-items", "combos"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium rounded-t-lg transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab === "categories" && "📁 Categories"}
              {tab === "menu-items" && "🍔 Menu Items"}
              {tab === "combos" && "🎯 Combos"}
            </button>
          ))}
        </div>

        {/* Categories Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "categories" && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Add/Edit Category Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FiPlus className="text-yellow-400" />
                  {editCategoryId ? "Edit Category" : "Add New Category"}
                </h2>

                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Enter category name (e.g., Snacks, Main Course)"
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={handleAddCategory}
                      className="bg-yellow-400 text-white px-6 py-3 rounded-xl hover:bg-yellow-500 transition flex items-center gap-2 font-medium"
                    >
                      <FiSave />
                      {editCategoryId ? "Update" : "Add Category"}
                    </button>

                    {editCategoryId && (
                      <button
                        onClick={() => {
                          setEditCategoryId(null);
                          setCategoryName("");
                        }}
                        className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 transition flex items-center gap-2 font-medium"
                      >
                        <FiX />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Food Categories ({categories.length})
                </h2>

                {categories.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <FiPackage size={64} className="mx-auto" />
                    </div>
                    <p className="text-gray-500 text-lg">
                      No categories added yet.
                    </p>
                    <p className="text-gray-400">
                      Add your first category to get started!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat) => (
                      <motion.div
                        key={cat.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition relative p-5"
                      >
                        {/* Icon + Name */}
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-50 rounded-full shadow flex items-center justify-center">
                            <MdFoodBank size={28} className="text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-800">
                              {cat.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {
                                menuItems.filter(
                                  (item) => item.categoryId === cat.id
                                ).length
                              }{" "}
                              items
                            </p>
                          </div>
                        </div>

                        {/* Status Switch + Loader */}
                        <div className="mt-4 flex items-center justify-between">
                          {statusLoading[cat.id] ? (
                            <CircularProgress size={20} />
                          ) : (
                            <FormControlLabel
                              control={
                                <YellowSwitch
                                  checked={cat.status === "ACTIVE"}
                                  onChange={(e) =>
                                    handleToggleCategoryStatus(
                                      cat.id,
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label={
                                <span
                                  className={`text-sm font-medium ${
                                    cat.status === "ACTIVE"
                                      ? "text-yellow-500"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {cat.status === "ACTIVE"
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              }
                            />
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCategory(cat)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Menu Items Tab */}
          {activeTab === "menu-items" && (
            <motion.div
              key="menu-items"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Add/Edit Menu Item Form */}
              <div
                id="menu-item-form"
                className="bg-white rounded-2xl shadow-lg p-6  mx-auto"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <MdFastfood size={30} className="text-yellow-400" />
                  Add New Menu Item
                </h2>
                {/* <input
                  type="text"
                  placeholder="Search items..."
                  value={menuSearch}
                  onChange={(e) => {
                    setMenuSearch(e.target.value);
                    setMenuPage(1);
                  }}
                  className="border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                /> */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        value={menuItemForm.name}
                        onChange={(e) =>
                          setMenuItemForm({
                            ...menuItemForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g., Margherita Pizza"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={menuItemForm.description}
                        onChange={(e) =>
                          setMenuItemForm({
                            ...menuItemForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your menu item..."
                        rows="3"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU (Custom Number) *
                      </label>
                      <input
                        type="number"
                        value={menuItemForm.sku}
                        onChange={(e) =>
                          setMenuItemForm({
                            ...menuItemForm,
                            sku: e.target.value,
                          })
                        }
                        placeholder="e.g., 1001"
                        min="1"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={menuItemForm.price}
                          onChange={(e) =>
                            setMenuItemForm({
                              ...menuItemForm,
                              price: e.target.value,
                            })
                          }
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Right Column */}
                  <div className="space-y-5 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={menuItemForm.categoryId}
                        onChange={(e) =>
                          setMenuItemForm({
                            ...menuItemForm,
                            categoryId: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* VEG / NON-VEG Switch */}
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-300 bg-white">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">
                          Food Type
                        </span>

                        <span
                          className={`text-xs font-semibold mt-1 ${
                            menuItemForm.isVegetarian
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {menuItemForm.isVegetarian
                            ? "Vegetarian"
                            : "Non-Vegetarian"}
                        </span>
                      </div>

                      <Switch
                        checked={menuItemForm.isVegetarian} // ✅ ON = VEG
                        onChange={(e) =>
                          setMenuItemForm({
                            ...menuItemForm,
                            isVegetarian: e.target.checked,
                          })
                        }
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#22c55e",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                            {
                              backgroundColor: "#22c55e",
                            },
                        }}
                      />
                    </div>

                    {/* ACTIVE / INACTIVE Switch */}
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-300 bg-white mt-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">
                          Status
                        </span>

                        <span
                          className={`text-xs font-semibold mt-1 ${
                            menuItemForm.isAvailable
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {menuItemForm.isAvailable ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <YellowSwitch
                        checked={menuItemForm.isAvailable}
                        onChange={(e) =>
                          setMenuItemForm({
                            ...menuItemForm,
                            isAvailable: e.target.checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-8 justify-end">
                  <button
                    onClick={handleAddMenuItem}
                    className="bg-yellow-400 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition flex items-center gap-2 font-medium"
                  >
                    <FiSave size={25} />
                    {editMenuItemId ? "Update Menu Item" : "Add Menu Item"}
                  </button>

                  <button
                    onClick={resetMenuItemForm}
                    className="bg-gray-200 text-gray-800 px-8 py-3 rounded-xl hover:bg-gray-300 transition flex items-center gap-2 font-medium"
                  >
                    <IoIosCloseCircleOutline size={25} />
                    Clear Form
                  </button>
                </div>
              </div>

              {/* Menu Items List */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Menu Items ({menuItems.length})
                  </h2>

                  <div className="flex gap-4 mt-4 md:mt-0">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {menuItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <MdFastfood size={64} className="mx-auto" />
                    </div>
                    <p className="text-gray-500 text-lg">
                      No menu items added yet.
                    </p>
                    <p className="text-gray-400">
                      Add your first menu item to get started!
                    </p>
                  </div>
                ) : filteredMenuItems.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      No items found in this category.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {filteredMenuItems.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group"
                        >
                          {/* Item Image */}
                          <div className="h-48 bg-linear-to-br from-gray-200 to-gray-300 relative overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className={`${
                                item.image ? "hidden" : "flex"
                              } w-full h-full items-center justify-center text-gray-400`}
                            >
                              <MdFastfood size={64} />
                            </div>

                            {/* Badges */}
                            <div className="absolute top-4 right-4 flex gap-2">
                              {item.isVegetarian && (
                                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                  Veg
                                </span>
                              )}
                              {!item.isAvailable && (
                                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                  Sold Out
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Item Details */}
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-bold text-xl text-gray-800">
                                  {item.name}
                                </h3>
                                <p className="text-gray-600 text-sm mt-1">
                                  {getCategoryName(item.categoryId)}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="font-bold text-2xl text-gray-800">
                                  ${item.price.toFixed(2)}
                                </p>
                                <div className="flex items-center gap-1 text-yellow-500">
                                  <FiStar />
                                  <span className="text-sm font-medium">
                                    {item.rating || 4.5}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-600 mb-4 line-clamp-2">
                              {item.description}
                            </p>

                            {/* Actions */}
                            <div className="flex justify-between items-center">
                              <button
                                onClick={() => handleEditMenuItem(item)}
                                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                              >
                                <FiEdit2 />
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteMenuItem(item.id)}
                                className="text-red-600 hover:text-red-800 font-medium flex items-center gap-2"
                              >
                                <FiTrash2 />
                                Delete
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Combos Tab */}
          {activeTab === "combos" && (
            <motion.div
              key="combos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Add/Edit Combo Form */}
              <div
                id="combo-form"
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FiStar className="text-purple-600" />
                  Add New Combo/Meal
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Combo Details */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Combo Name *
                        </label>
                        <input
                          type="text"
                          value={comboForm.name}
                          onChange={(e) =>
                            setComboForm({ ...comboForm, name: e.target.value })
                          }
                          placeholder="e.g., Family Feast Combo"
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Combo Price ($) *
                        </label>
                        <div className="relative">
                          <FiDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="number"
                            value={comboForm.price}
                            onChange={(e) =>
                              setComboForm({
                                ...comboForm,
                                price: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={comboForm.description}
                        onChange={(e) =>
                          setComboForm({
                            ...comboForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your combo meal..."
                        rows="3"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image URL (optional)
                      </label>
                      <div className="relative">
                        <FiImage className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={comboForm.image}
                          onChange={(e) =>
                            setComboForm({
                              ...comboForm,
                              image: e.target.value,
                            })
                          }
                          placeholder="https://example.com/combo-image.jpg"
                          className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount (%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={comboForm.discount}
                        onChange={(e) =>
                          setComboForm({
                            ...comboForm,
                            discount: parseInt(e.target.value),
                          })
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-sm text-gray-600 mt-2">
                        <span>0%</span>
                        <span className="font-bold text-blue-600">
                          {comboForm.discount}% Off
                        </span>
                        <span>50%</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Available Items */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-4">
                        Available Items
                      </h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {menuItems
                          .filter((item) => item.isAvailable)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                              <div>
                                <p className="font-medium text-gray-800">
                                  {item.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  ${item.price.toFixed(2)}
                                </p>
                              </div>
                              <button
                                onClick={() => addItemToCombo(item)}
                                disabled={comboForm.items.find(
                                  (i) => i.id === item.id
                                )}
                                className={`px-4 py-2 rounded-lg transition ${
                                  comboForm.items.find((i) => i.id === item.id)
                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                }`}
                              >
                                {comboForm.items.find((i) => i.id === item.id)
                                  ? "Added"
                                  : "Add"}
                              </button>
                            </div>
                          ))}

                        {menuItems.filter((item) => item.isAvailable).length ===
                          0 && (
                          <p className="text-gray-500 text-center py-4">
                            No available items to add
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Selected Items Preview */}
                    {comboForm.items.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 mb-4">
                          Selected Items ({comboForm.items.length})
                        </h3>
                        <div className="space-y-3">
                          {comboForm.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">
                                  {item.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  ${item.price?.toFixed(2)} × {item.quantity}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    updateComboItemQuantity(
                                      item.id,
                                      item.quantity - 1
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateComboItemQuantity(
                                      item.id,
                                      item.quantity + 1
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => removeItemFromCombo(item.id)}
                                  className="ml-2 text-red-600 hover:text-red-800"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </div>
                          ))}

                          {comboForm.price && comboForm.items.length > 0 && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Total Value:
                                </span>
                                <span className="font-bold text-gray-800">
                                  ${calculateComboValue(comboForm)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-600">
                                  Your Price:
                                </span>
                                <span className="font-bold text-green-600">
                                  ${comboForm.price}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-600">You Save:</span>
                                <span className="font-bold text-red-600">
                                  $
                                  {(
                                    calculateComboValue(comboForm) -
                                    comboForm.price
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handleAddCombo}
                    disabled={comboForm.items.length === 0}
                    className={`px-8 py-3 rounded-xl transition flex items-center gap-2 font-medium ${
                      comboForm.items.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    <FiSave />
                    Save Combo
                  </button>

                  <button
                    onClick={resetComboForm}
                    className="bg-gray-200 text-gray-800 px-8 py-3 rounded-xl hover:bg-gray-300 transition flex items-center gap-2 font-medium"
                  >
                    <FiX />
                    Clear Form
                  </button>
                </div>
              </div>

              {/* Combos List */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Combo Meals ({combos.length})
                </h2>

                {combos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <FiStar size={64} className="mx-auto" />
                    </div>
                    <p className="text-gray-500 text-lg">
                      No combos added yet.
                    </p>
                    <p className="text-gray-400">
                      Create your first combo meal to attract customers!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {combos.map((combo) => (
                      <motion.div
                        key={combo.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:border-purple-300 transition"
                      >
                        {/* Combo Header */}
                        <div
                          className="p-5 cursor-pointer hover:bg-gray-100 transition"
                          onClick={() =>
                            setExpandedCombo(
                              expandedCombo === combo.id ? null : combo.id
                            )
                          }
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-linear-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                                {combo.image ? (
                                  <img
                                    src={combo.image}
                                    alt={combo.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <FiStar
                                    size={32}
                                    className="text-purple-600"
                                  />
                                )}
                              </div>

                              <div>
                                <h3 className="font-bold text-xl text-gray-800">
                                  {combo.name}
                                </h3>
                                <p className="text-gray-600 mt-1">
                                  {combo.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="font-bold text-2xl text-purple-600">
                                    ${combo.price.toFixed(2)}
                                  </span>
                                  {combo.discount > 0 && (
                                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                                      {combo.discount}% OFF
                                    </span>
                                  )}
                                  <span className="text-gray-500">
                                    {combo.items.length} items
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCombo(combo);
                                }}
                                className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                              >
                                <FiEdit2 />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCombo(combo.id);
                                }}
                                className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                              >
                                <FiTrash2 />
                              </button>

                              {expandedCombo === combo.id ? (
                                <FiChevronUp
                                  className="text-gray-400"
                                  size={24}
                                />
                              ) : (
                                <FiChevronDown
                                  className="text-gray-400"
                                  size={24}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {expandedCombo === combo.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-gray-200 p-5">
                                <h4 className="font-bold text-lg text-gray-800 mb-4">
                                  Combo Contents
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {combo.items.map((item) => {
                                    const menuItem = menuItems.find(
                                      (mi) => mi.id === item.id
                                    );
                                    return menuItem ? (
                                      <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                                      >
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                          {menuItem.image ? (
                                            <img
                                              src={menuItem.image}
                                              alt={menuItem.name}
                                              className="w-full h-full object-cover rounded-lg"
                                            />
                                          ) : (
                                            <MdFastfood className="text-gray-400" />
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-800">
                                            {menuItem.name}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            ${menuItem.price.toFixed(2)} ×{" "}
                                            {item.quantity}
                                          </p>
                                        </div>
                                        <div className="font-bold text-gray-800">
                                          $
                                          {(
                                            menuItem.price * item.quantity
                                          ).toFixed(2)}
                                        </div>
                                      </div>
                                    ) : null;
                                  })}
                                </div>

                                {/* Combo Summary */}
                                <div className="mt-6 p-4 bg-linear-to-r from-purple-50 to-blue-50 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="text-gray-600">
                                        Total Value:
                                      </p>
                                      <p className="text-2xl font-bold text-gray-800">
                                        ${calculateComboValue(combo)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-gray-600">You Save:</p>
                                      <p className="text-2xl font-bold text-green-600">
                                        $
                                        {(
                                          calculateComboValue(combo) -
                                          combo.price
                                        ).toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
