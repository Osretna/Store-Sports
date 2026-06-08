import React, { useState, useEffect } from "react";
import { 
  X, Plus, Trash2, Edit3, Save, LogOut, Printer, Star,
  MessageSquare, Check, Clock, User, Phone, MapPin, 
  Settings, ShoppingBag, Landmark, KeySquare, HelpCircle, RefreshCw
} from "lucide-react";
import { Product, Order, StoreSettings } from "../types";
import { getProducts, saveProduct, deleteProduct, getOrders, updateOrder, deleteOrder, saveStoreSettings, auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

interface AdminPanelProps {
  onClose: () => void;
  language: "ar" | "en";
  isDarkMode: boolean;
  settings: StoreSettings;
  onSettingsUpdate: (settings: StoreSettings) => void;
  onProductsUpdate: () => void;
  ratings?: { id?: string; name: string; score: number; comment: string; date: string }[];
  onRatingsUpdate?: (updated: { id?: string; name: string; score: number; comment: string; date: string }[]) => void;
}

export default function AdminPanel({
  onClose,
  language,
  isDarkMode,
  settings,
  onSettingsUpdate,
  onProductsUpdate,
  ratings = [],
  onRatingsUpdate = () => {}
}: AdminPanelProps) {
  const isAr = language === "ar";
  
  // Tab control: 'products' | 'orders' | 'settings' | 'reviews'
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "settings" | "reviews">(() => {
    return (localStorage.getItem("store_admin_active_tab") as "products" | "orders" | "settings" | "reviews") || "products";
  });
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("store_admin_authenticated") === "true";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    localStorage.setItem("store_admin_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("store_admin_authenticated", String(isAuthenticated));
  }, [isAuthenticated]);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [prodForm, setProdForm] = useState({
    nameAr: "",
    nameEn: "",
    price: 0,
    descriptionAr: "",
    descriptionEn: "",
    image: "",
    imagesStr: "",
    categoryAr: "",
    categoryEn: ""
  });

  // Client Feedbacks tab states
  const [selectedReviewIdx, setSelectedReviewIdx] = useState<number | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewEditForm, setReviewEditForm] = useState({
    name: "",
    score: 5,
    comment: ""
  });

  // Client Orders editing status
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [orderEditForm, setOrderEditForm] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    totalPrice: 0
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem("store_admin_selected_order");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (selectedOrder) {
      localStorage.setItem("store_admin_selected_order", JSON.stringify(selectedOrder));
    } else {
      localStorage.removeItem("store_admin_selected_order");
    }
  }, [selectedOrder]);

  // Settings state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });

  // Translations
  const t = {
    ar: {
      title: "لوحة تحكم الأدمن",
      loginTitle: "تسجيل الدخول للإشراف",
      userPlaceholder: "اسم المستخدم",
      passPlaceholder: "الرمز السري",
      loginBtn: "تأكيد الدخول",
      loginFail: "اسم المستخدم أو كلمة المرور غير صحيحة",
      logout: "خروج",
      tabs: {
        products: "المنتجات والألعاب",
        orders: "الطلبات والفواتير",
        settings: "إعدادات المتجر"
      },
      products: {
        addBtn: "إضافة منتج رياضي جديد",
        editTitle: "تعديل المنتج",
        addTitle: "إضافة منتج",
        tblName: "اسم المنتج",
        tblPrice: "السعر",
        tblCategory: "التصنيف",
        actions: "إجراءات",
        delConfirm: "هل أنت متأكد من حذف هذا المنتج؟",
        fields: {
          nameAr: "الاسم بالعربية",
          nameEn: "الاسم بالإنجليزية",
          price: "السعر (ج.م)",
          descAr: "الوصف بالعربية",
          descEn: "الوصف بالإنجليزية",
          image: "رابط الصورة الرياضية",
          catAr: "القسم بالعربية",
          catEn: "القسم بالإنجليزية",
          btnSave: "حفظ البيانات",
          btnCancel: "إلغاء الأمر"
        }
      },
      orders: {
        custName: "العميل",
        phone: "الهاتف",
        total: "المجموع",
        status: "الحالة",
        date: "التاريخ",
        pending: "قيد الانتظار",
        completed: "مكتمل",
        setCompleted: "تأشير كمكتمل",
        setPending: "قيد المراجعة",
        custAddr: "العنوان المحدد",
        itemsOrdered: "المنتجات المطلوبة",
        cantFind: "لا توجد طلبات جارية حالياً",
        print: "طباعة الفاتورة",
        sendWhatsapp: "إرسال الفاتورة للعميل",
        viewMap: "موقع التسليم على الخريطة",
        noMap: "العنوان غير محدد بإحداثيات"
      },
      settings: {
        titleAr: "اسم المتجر بالعربية",
        titleEn: "اسم المتجر بالإنجليزية",
        logoUrl: "رابط شعار المتجر (شعار جيم/سوبر)",
        whatsPhone: "رقم تطبيق واتساب الإداري (بدون +)",
        whatsPhoneHelper: "مثال لدولة السعودية: 966500000000 أو مصر: 201012345678",
        savedSuccess: "تم حفظ الإعدادات الرياضية وتحديث المتجر بنجاح!"
      }
    },
    en: {
      title: "Admin Dashboard Control",
      loginTitle: "Authorized Admin Log In",
      userPlaceholder: "Username",
      passPlaceholder: "Password",
      loginBtn: "Authorize",
      loginFail: "Invalid admin credentials check",
      logout: "Logout",
      tabs: {
        products: "Products",
        orders: "Invoices & Orders",
        settings: "Store Settings"
      },
      products: {
        addBtn: "Add New Product",
        editTitle: "Edit Product Information",
        addTitle: "Add New Item",
        tblName: "Product Name",
        tblPrice: "Price",
        tblCategory: "Category",
        actions: "Actions",
        delConfirm: "Are you sure you want to delete this product?",
        fields: {
          nameAr: "Name in Arabic",
          nameEn: "Name in English",
          price: "Price (EGP)",
          descAr: "Description in Arabic",
          descEn: "Description in English",
          image: "Sport Image URL",
          catAr: "Category in Arabic",
          catEn: "Category in English",
          btnSave: "Save Product",
          btnCancel: "Discard"
        }
      },
      orders: {
        custName: "Customer",
        phone: "Phone",
        total: "Total",
        status: "Status",
        date: "Date",
        pending: "Pending",
        completed: "Completed",
        setCompleted: "Mark Completed",
        setPending: "Mark Pending",
        custAddr: "Delivery Address",
        itemsOrdered: "Items Ordered",
        cantFind: "No custom orders placed yet",
        print: "Print Invoice Receipt",
        sendWhatsapp: "Send WhatsApp Receipt",
        viewMap: "Delivery Coordinates on Map",
        noMap: "No geolocation markers set"
      },
      settings: {
        titleAr: "Store Name (Arabic)",
        titleEn: "Store Name (English)",
        logoUrl: "Store Brand Logo URL",
        whatsPhone: "Store Manager WhatsApp Contact (No +)",
        whatsPhoneHelper: "Example: Saudi: 966500000000, Egypt: 201012345678",
        savedSuccess: "Store configuration saved successfully!"
      }
    }
  }[language];

  // Fetch admin products + orders
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoadingOrders(true);
    try {
      const prodList = await getProducts();
      setProducts(prodList);
      
      const orderList = await getOrders();
      setOrders(orderList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Form submission authentication check
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    // 1. Bypass check - standard offline admin account credentials (supports fixing the typo as well!)
    if (trimmedUser === "admin" && (trimmedPass === "admin1234" || trimmedPass === "adin1234" || trimmedPass === "admin")) {
      setIsAuthenticated(true);
      setLoginError("");
      return;
    }

    // 2. Direct online Firebase Authentication Check
    if (auth) {
      try {
        await signInWithEmailAndPassword(auth, trimmedUser, trimmedPass);
        setIsAuthenticated(true);
        setLoginError("");
        return;
      } catch (err: any) {
        console.error("Firebase Authentication error details:", err);
        let errMsg = t.loginFail;

        // Custom friendly Arab/En error messages for typical auth failure paths
        const code = err?.code || "";
        if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
          errMsg = isAr 
            ? "رمز المرور غير صحيح أو بيانات الدخول خاطئة." 
            : "The password or login credentials you entered are incorrect.";
        } else if (code === "auth/user-not-found") {
          errMsg = isAr 
            ? "اسم المستخدم أو البريد هذا غير مسجل على لوحة التحكم." 
            : "Username or email is not registered in the Admin Panel database.";
        } else if (code === "auth/invalid-email") {
          errMsg = isAr 
            ? "البريد الإلكتروني المدخل غير صالح. يرجى إدخال بريد صحيح مثل (name@example.com) أو استخدام حساب الأدمن الافتراضي." 
            : "The email address is invalid. Please supply a valid email (e.g. name@example.com) or use the default admin credentials.";
        } else if (err?.message) {
          errMsg = err.message;
        }

        setLoginError(errMsg);
      }
    } else {
      setLoginError(isAr ? "محرك المصادقة مع الفايربيز غير نشط في الوقت الحالي." : "Firebase authentication service is currently inactive.");
    }
  };

  // Delete product action
  const handleDelete = async (id: string) => {
    if (window.confirm(t.products.delConfirm)) {
      await deleteProduct(id);
      loadData();
      onProductsUpdate();
    }
  };

  // Select product for editing
  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setProdForm({
      nameAr: p.nameAr || "",
      nameEn: p.nameEn || "",
      price: p.price || 0,
      descriptionAr: p.descriptionAr || "",
      descriptionEn: p.descriptionEn || "",
      image: p.image || "",
      imagesStr: p.images && p.images.length > 0 ? p.images.join(", ") : "",
      categoryAr: p.categoryAr || "",
      categoryEn: p.categoryEn || ""
    });
    setIsAddingNew(false);
  };

  // Start adding a new product
  const startAdd = () => {
    setEditingProduct(null);
    setProdForm({
      nameAr: "",
      nameEn: "",
      price: 0,
      descriptionAr: "",
      descriptionEn: "",
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop", // placeholder sports gym image
      imagesStr: "",
      categoryAr: "العاب اللياقة",
      categoryEn: "Cardio Tools"
    });
    setIsAddingNew(true);
  };

  // Handle saving product (New or Edited)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingProduct ? editingProduct.id : "prod-" + Date.now();
    
    // Parse the comma-separated images string to an array, filtering out empty items or spaces
    const imagesArray = prodForm.imagesStr
      ? prodForm.imagesStr.split(/[;,]/).map((s) => s.trim()).filter((s) => s.length > 0)
      : [];
      
    const productPayload: Product = {
      id,
      nameAr: prodForm.nameAr,
      nameEn: prodForm.nameEn,
      price: prodForm.price,
      descriptionAr: prodForm.descriptionAr,
      descriptionEn: prodForm.descriptionEn,
      image: prodForm.image || (imagesArray.length > 0 ? imagesArray[0] : ""),
      images: imagesArray,
      categoryAr: prodForm.categoryAr,
      categoryEn: prodForm.categoryEn
    };

    await saveProduct(productPayload);
    loadData();
    onProductsUpdate();
    
    // Close form options
    setIsAddingNew(false);
    setEditingProduct(null);
  };

  // Export CSV template filled with current products details
  const handleExportProducts = () => {
    const headers = ["ID", "NameAr", "NameEn", "Price", "CategoryAr", "CategoryEn", "DescriptionAr", "DescriptionEn", "Images"];
    
    const rows = products.map((p) => [
      p.id,
      p.nameAr,
      p.nameEn,
      p.price.toString(),
      p.categoryAr,
      p.categoryEn,
      p.descriptionAr.replace(/\r?\n/g, " "), // strip lines so CSV remains safe
      p.descriptionEn.replace(/\r?\n/g, " "),
      p.images && p.images.length > 0 ? p.images.join(";") : p.image // using semicolon as separator in CSV row field
    ]);

    // Escape fields for double quotes if necessary
    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `fitness_pro_products_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload and parse filled products CSV template
  const handleImportProducts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length <= 1) {
          alert(isAr ? "الملف فارغ أو غير صحيح!" : "Selected CSV file is empty or invalid!");
          return;
        }

        const parseCSVLine = (line: string) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result.map(val => {
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1);
            }
            return val.replace(/""/g, '"');
          });
        };

        const headers = parseCSVLine(lines[0]);
        const colIndex = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

        const idxId = colIndex("ID");
        const idxNameAr = colIndex("NameAr");
        const idxNameEn = colIndex("NameEn");
        const idxPrice = colIndex("Price");
        const idxCategoryAr = colIndex("CategoryAr");
        const idxCategoryEn = colIndex("CategoryEn");
        const idxDescAr = colIndex("DescriptionAr");
        const idxDescEn = colIndex("DescriptionEn");
        const idxImages = colIndex("Images");

        if (idxNameAr === -1 || idxPrice === -1) {
          alert(isAr 
            ? "تنسيق القوالب غير صحيح. يرجى استخدام القالب المصدر." 
            : "CSV format unrecognized. Please use the exported template format.");
          return;
        }

        let addedCount = 0;
        let updatedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const fields = parseCSVLine(line);
          if (fields.length < 2) continue;

          const id = fields[idxId] || "prod-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
          const nameAr = fields[idxNameAr] || "";
          const nameEn = fields[idxNameEn] || "";
          const price = parseFloat(fields[idxPrice]) || 0;
          const categoryAr = fields[idxCategoryAr] || "العاب اللياقة";
          const categoryEn = fields[idxCategoryEn] || "Cardio Tools";
          const descriptionAr = fields[idxDescAr] || "";
          const descriptionEn = fields[idxDescEn] || "";
          
          const imgStr = fields[idxImages] || "";
          const rawImages = imgStr.split(/[;,]/).map(s => s.trim()).filter(s => s.length > 0);
          const images = rawImages;
          const image = rawImages[0] || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop";

          const isExisting = products.some(p => p.id === id);
          if (isExisting) {
            updatedCount++;
          } else {
            addedCount++;
          }

          const productPayload: Product = {
            id,
            nameAr,
            nameEn,
            price,
            categoryAr,
            categoryEn,
            descriptionAr,
            descriptionEn,
            image,
            images
          };

          await saveProduct(productPayload);
        }

        alert(isAr 
          ? `🎉 تم الاستيراد بنجاح! تم إضافة ${addedCount} منتج وتحديث ${updatedCount} منتج.` 
          : `🎉 Imported successfully! Added ${addedCount} and updated ${updatedCount} products.`);
        
        loadData();
        onProductsUpdate();
      } catch (err) {
        console.error("Error reading CSV file:", err);
        alert(isAr ? "حدث خطأ أثناء قراءة ملف CSV!" : "An error occurred while reading the CSV!");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  // Toggle order status in database
  const toggleOrderStatus = async (order: Order) => {
    const nextStatus = order.status === "pending" ? "completed" : "pending";
    const updated = { ...order, status: nextStatus };
    await updateOrder(updated);
    
    // Update active visual list
    setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
    if (selectedOrder && selectedOrder.id === order.id) {
      setSelectedOrder(updated);
    }
  };

  // Trigger Save Store settings
  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveStoreSettings(settingsForm);
    onSettingsUpdate(settingsForm);
    alert(t.settings.savedSuccess);
  };

  // Standard POS receipt print function
  const printInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const receiptHtml = `
      <html>
        <head>
          <title>Invoice #${order.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 20px; direction: ${isAr ? "rtl" : "ltr"}; text-align: ${isAr ? "right" : "left"}; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2.5px solid #10b981; padding-bottom: 15px; }
            .logo { max-width: 65px; border-radius: 9px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f4f4f5; text-align: ${isAr ? "right" : "left"}; padding: 12px; }
            td { padding: 12px; border-bottom: 1px solid #e4e4e7; }
            .total { text-align: ${isAr ? "left" : "right"}; font-size: 19px; font-weight: bold; margin-top: 20px; color: #059669; }
            .footer { text-align: center; font-size: 12px; color: #71717a; margin-top: 50px; border-top: 1px dashed #cccccc; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${settings.storeLogo ? `<img src="${settings.storeLogo}" class="logo" />` : ""}
            <h2>${isAr ? settings.storeNameAr : settings.storeNameEn}</h2>
            <p>${isAr ? "فاتورة مبيعات العميل" : "E-Commerce Athlete Invoice Card"}</p>
          </div>
          <div class="meta">
            <div>
              <strong>${isAr ? "اسم العميل" : "Customer Name"}:</strong> ${order.customerName}<br/>
              <strong>${isAr ? "رقم الهاتف" : "Phone"}:</strong> ${order.customerPhone}<br/>
              <strong>${isAr ? "العنوان" : "Delivery Address"}:</strong> ${order.customerAddress}
            </div>
            <div>
              <strong>${isAr ? "رقم الفاتورة" : "Invoice No."}:</strong> #${order.id}<br/>
              <strong>${isAr ? "التاريخ" : "Date"}:</strong> ${new Date(order.createdAt).toLocaleString(isAr ? "ar-EG" : "en-US")}<br/>
              <strong>${isAr ? "حالة الدفع والتوصيل" : "Payment & delivery"}:</strong> ${order.status === "completed" ? (isAr ? "مكتمل" : "Completed") : (isAr ? "قيد الانتظار" : "On Delivery")}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>${isAr ? "المنتج الرياضي" : "Item"}</th>
                <th>${isAr ? "الكمية" : "Qty"}</th>
                <th>${isAr ? "سعر القطعة" : "Price"}</th>
                <th>${isAr ? "المجموع" : "Total"}</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item: any) => {
                const name = isAr 
                  ? (item.productNameAr || (item.product && item.product.nameAr) || "") 
                  : (item.productNameEn || (item.product && item.product.nameEn) || "");
                const price = item.price != null ? item.price : (item.product && item.product.price) || 0;
                return `
                  <tr>
                    <td>${name}</td>
                    <td>${item.quantity}</td>
                    <td>${price} ${isAr ? "ج.م" : "EGP"}</td>
                    <td>${price * item.quantity} ${isAr ? "ج.م" : "EGP"}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
          <div class="total">
            ${isAr ? "إجمالي المبلغ المطلوب" : "Total Price"}: ${order.totalPrice} ${isAr ? "ج.م" : "EGP"}
          </div>
          <div class="footer">
            <p>${isAr ? "شكراً لتعاملكم معنا ونتمنى لكم صحة جيدة!" : "Thank you for shopping at our arena, stay strong!"}</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  // Send WhatsApp Invoice automatically to customer or admin
  const sendWhatsAppInvoice = (order: Order) => {
    const isAr = language === "ar";
    
    // Construct text receipt
    let text = `*📄 ${isAr ? "فاتورة مبيعات جديدة" : "New Gym Store Receipt"} #${order.id}*\n`;
    text += `=========================\n`;
    text += `👤 *${isAr ? "العميل" : "Buyer"}:* ${order.customerName}\n`;
    text += `📞 *${isAr ? "الهاتف" : "Phone"}:* ${order.customerPhone}\n`;
    text += `📍 *${isAr ? "العنوان" : "Location"}:* ${order.customerAddress}\n`;
    
    if (order.customerCoords) {
      text += `🗺️ *${isAr ? "الموقع على الخريطة" : "GPS Coordinates"}:* https://www.google.com/maps?q=${order.customerCoords.lat},${order.customerCoords.lng}\n`;
    }
    
    text += `=========================\n`;
    text += `📋 *${isAr ? "الأدوات المطلوبة" : "Equipment Ordered"}:*\n`;
    
    order.items.forEach(item => {
      const name = isAr ? item.productNameAr : item.productNameEn;
      text += `- ${name} (x${item.quantity}) - ${item.price} ${isAr ? "ج.م" : "EGP"}\n`;
    });
    
    text += `=========================\n`;
    text += `💰 *${isAr ? "إجمالي الفاتورة" : "Grand Total"}:* ${order.totalPrice} ${isAr ? "ج.م" : "EGP"}\n`;
    text += `⚡ *${isAr ? "حالة التوصيل" : "Delivery Status"}:* ${order.status === "completed" ? (isAr ? "مكتملة ومسلمة" : "Completed & Dispatched") : (isAr ? "جاري التجهيز للتوصيل" : "Under dispatch/Pending")}\n\n`;
    text += `${isAr ? "شكراً لكم لممارسة الرياضة معنا!" : "Keep training hard!"}`;

    const encoded = encodeURIComponent(text);
    // WhatsApp format: send directly to customer's phone
    const cleanPhone = order.customerPhone.replace(/[\s\-\+]/g, "");
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-5xl bg-zinc-50 dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row h-[90vh] md:h-[80vh] transition-colors duration-300"
        id="admin-dashboard-container"
      >
        
        {/* Sidebar Controls Area */}
        <div className="w-full md:w-64 bg-white dark:bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-extrabold text-lg text-zinc-900 dark:text-white">
                  {t.title}
                </h2>
              </div>
              <button onClick={onClose} className="p-1 md:hidden rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAuthenticated ? (
              <div className="flex flex-col gap-1.5">
                {/* Tabs selection buttons */}
                <button
                  onClick={() => { setActiveTab("products"); setIsAddingNew(false); setEditingProduct(null); }}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "products"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t.tabs.products}</span>
                </button>

                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "orders"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>{t.tabs.orders}</span>
                </button>

                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "reviews"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>{isAr ? "آراء العملاء والتقييمات ⭐" : "Feedbacks & Reviews ⭐"}</span>
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "settings"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>{t.tabs.settings}</span>
                </button>

                <button
                  onClick={loadData}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-zinc-800 transition-all mt-4"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>{isAr ? "تحديث سريع للبيانات" : "Refresh Data Docs"}</span>
                </button>
              </div>
            ) : (
              <div className="text-zinc-400 text-xs text-left leading-relaxed">
                <p className="flex items-center gap-1.5 font-semibold text-zinc-500 mb-1">
                  <KeySquare className="w-4 h-4 text-emerald-500" />
                  {isAr ? "بوابة آمنة مشفرة" : "Secure Node Port"}
                </p>
                {isAr 
                  ? "الرجاء تسجيل الدخول باستخدام الحساب المصرح به لإدارة منتجات الصالة الرياضية، الأسعار والطلبيات الجارية للعملاء." 
                  : "Please sign in using administrator authorization to manage e-commerce sporting store documents, price tags, and buyer routes."
                }
              </div>
            )}
          </div>

          {isAuthenticated && (
            <button
              onClick={() => setIsAuthenticated(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-4 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-950 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          )}
        </div>

        {/* Content Panel Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between">
          
          {/* SECURE LOGIN CARD (Unauthenticated) */}
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto w-full my-auto bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white">
                  {t.loginTitle}
                </h3>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/50">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    {isAr ? "اسم المستخدم للأدمن" : "Admin Username"}
                  </label>
                  {/* DO NOT hardcode values inside inputs. Keep them completely empty for placeholder typing as requested */}
                  <input
                    type="text"
                    required
                    placeholder={t.userPlaceholder}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    {isAr ? "الرمز السري الخاص بالمدير" : "Admin Password"}
                  </label>
                  {/* DO NOT hardcode values inside inputs. Keep them completely empty for placeholder typing as requested */}
                  <input
                    type="password"
                    required
                    placeholder={t.passPlaceholder}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl cursor-pointer transition shadow-md active:scale-95"
                >
                  {t.loginBtn}
                </button>
              </form>

              {/* Secure Tips Info */}
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-start gap-2.5 text-[11px] text-zinc-400">
                <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  {isAr 
                    ? "ملاحظة المطور: الرمز السري واسم المستخدم غير مسجلين مسبقاً بقيم واضحة في الحقول لأسباب أمنية. الرجاء إدخال الحساب admin متبوعاً بـ الرمز السري الصحيح لدخول الإدارة."
                    : "Developer Tip: Admin Username and Password credentials fields are not hardcoded inside inputs for standard presentation security issues. Please supply them manually."
                  }
                </p>
              </div>
            </div>
          ) : (
            
            // AUTHENTICATED WORKBENCH
            <div className="flex flex-col h-full justify-between">
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded text-emerald-800 dark:text-emerald-400">
                      SECURE DB MODE
                    </span>
                  </div>
                  <button 
                    onClick={onClose} 
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* TAB 1: PRODUCT LISTING MANAGER */}
                {activeTab === "products" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-100">
                        {isAr ? "إدارة التشكيلة والمعروضات" : "Current Arena Inventory"}
                      </h3>
                      {!isAddingNew && !editingProduct && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={startAdd}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-transform duration-300 active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{t.products.addBtn}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleExportProducts}
                            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer transition shadow-sm"
                            title={isAr ? "تحميل ملف قالب إكسل" : "Download Excel CSV template"}
                          >
                            <span className="text-emerald-500">📥</span>
                            <span>{isAr ? "تصدير قالب إكسل" : "Export Excel Template"}</span>
                          </button>

                          <label className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer transition shadow-sm">
                            <span className="text-emerald-500">📤</span>
                            <span>{isAr ? "رفع ملف إكسل" : "Import Excel File"}</span>
                            <input
                              type="file"
                              accept=".csv"
                              onChange={handleImportProducts}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* ADD OR EDIT PRODUCT MODAL FORM */}
                    {(isAddingNew || editingProduct) && (
                      <form onSubmit={handleSaveProduct} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-2xl space-y-4">
                        <h4 className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 mb-2">
                          {editingProduct ? t.products.editTitle : t.products.addTitle}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.nameAr}</label>
                            <input
                              type="text"
                              required
                              value={prodForm.nameAr}
                              onChange={(e) => setProdForm({ ...prodForm, nameAr: e.target.value })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.nameEn}</label>
                            <input
                              type="text"
                              required
                              value={prodForm.nameEn}
                              onChange={(e) => setProdForm({ ...prodForm, nameEn: e.target.value })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.price}</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={prodForm.price === 0 ? "" : prodForm.price}
                              onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.image}</label>
                            <input
                              type="text"
                              required
                              value={prodForm.image}
                              onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1 font-sans">
                              {isAr ? "روابط صور إضافية للمنتج (مفصولة بفاصلة ,)" : "Additional Product Image URLs (comma separated)"}
                            </label>
                            <textarea
                              rows={1}
                              value={prodForm.imagesStr || ""}
                              placeholder={isAr ? "رابط1.jpg, رابط2.jpg, رابط3.jpg" : "link1.jpg, link2.jpg, link3.jpg"}
                              onChange={(e) => setProdForm({ ...prodForm, imagesStr: e.target.value })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.catAr}</label>
                            <input
                              type="text"
                              required
                              value={prodForm.categoryAr}
                              onChange={(e) => setProdForm({ ...prodForm, categoryAr: e.target.value })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.catEn}</label>
                            <input
                              type="text"
                              required
                              value={prodForm.categoryEn}
                              onChange={(e) => setProdForm({ ...prodForm, categoryEn: e.target.value })}
                              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.descAr}</label>
                          <textarea
                            required
                            value={prodForm.descriptionAr}
                            onChange={(e) => setProdForm({ ...prodForm, descriptionAr: e.target.value })}
                            rows={2}
                            className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 mb-1">{t.products.fields.descEn}</label>
                          <textarea
                            required
                            value={prodForm.descriptionEn}
                            onChange={(e) => setProdForm({ ...prodForm, descriptionEn: e.target.value })}
                            rows={2}
                            className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => { setIsAddingNew(false); setEditingProduct(null); }}
                            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold"
                          >
                            {t.products.fields.btnCancel}
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                          >
                            <Save className="w-4 h-4" />
                            <span>{t.products.fields.btnSave}</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Table Listings of current assets */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-medium border-collapse">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800 text-xs font-black text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-700">
                              <th className="py-3 px-4 text-left">{t.products.tblName}</th>
                              <th className="py-3 px-4 text-center">{t.products.tblPrice}</th>
                              <th className="py-3 px-4 text-center">{t.products.tblCategory}</th>
                              <th className="py-3 px-4 text-center">{t.products.actions}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                            {products.map((p) => (
                              <tr key={p.id} className="hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40 transition-colors">
                                <td className="py-3 px-4 flex items-center gap-2">
                                  <img
                                    src={p.image}
                                    alt={p.nameEn}
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
                                  />
                                  <div>
                                    <div className="font-bold text-zinc-900 dark:text-white">{isAr ? p.nameAr : p.nameEn}</div>
                                    <div className="text-[10px] text-zinc-400 line-clamp-1">{isAr ? p.descriptionAr : p.descriptionEn}</div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                  {p.price} {isAr ? "ج.م" : "EGP"}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-950 rounded text-[10px] font-semibold text-zinc-500">
                                    {isAr ? p.categoryAr : p.categoryEn}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => startEdit(p)}
                                      className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
                                      title={isAr ? "تعديل المنتج" : "Edit product"}
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(p.id)}
                                      className="p-1.5 rounded bg-red-50 dark:bg-red-950/20 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
                                      title={isAr ? "حذف المنتج" : "Delete product"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: GENERAL ORDERS & SALES LISTINGS */}
                {activeTab === "orders" && (
                  <div className="space-y-6">
                    <h3 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-100">
                      {isAr ? "سجل طلبات التوصيل للعملاء والفواتير" : "Customer Purchase Orders"}
                    </h3>

                    {/* Standard List of Orders */}
                    {loadingOrders ? (
                      <div className="text-center py-8 text-zinc-400 text-sm">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        <span>Loading Orders DB...</span>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12 text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <ShoppingBag className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                        <p className="text-sm font-semibold">{t.orders.cantFind}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Orders List left panel */}
                        <div className="lg:col-span-1 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                          {orders.map((o) => (
                            <div
                              key={o.id}
                              onClick={() => setSelectedOrder(o)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                                selectedOrder?.id === o.id
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-sm"
                                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                  #{o.id.substring(0, 8)}...
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  o.status === "completed"
                                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400"
                                    : "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400"
                                }`}>
                                  {o.status === "completed" ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      {t.orders.completed}
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      {t.orders.pending}
                                    </>
                                  )}
                                </span>
                              </div>

                              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate mb-0.5">
                                {o.customerName}
                              </div>
                              <div className="text-xs text-zinc-400 mb-2 truncate">
                                {new Date(o.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                              </div>

                              <div className="flex items-center justify-between font-extrabold text-[13px] text-zinc-500">
                                <span>{o.items.length} {isAr ? "أغراض" : "items"}</span>
                                <span className="text-emerald-600 dark:text-emerald-400">{o.totalPrice} {isAr ? "ج.م" : "EGP"}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Invoice/GPS detail right panel */}
                        <div className="lg:col-span-2">
                          {selectedOrder ? (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl space-y-5 text-left">
                              
                              {isEditingOrder ? (
                                <div className="space-y-4 border-t border-b border-zinc-150 dark:border-zinc-800 py-4 text-xs text-start">
                                  <h4 className="font-extrabold text-sm text-emerald-600 flex items-center gap-1.5 mb-2.5">
                                    <Edit3 className="w-4 h-4" />
                                    <span>{isAr ? "تعديل معلومات وتفاصيل الطلبية ✏️" : "Edit Order Attributes ✏️"}</span>
                                  </h4>
                                  
                                  <div className="space-y-3.5">
                                    <div>
                                      <label className="block font-bold text-zinc-400 mb-1">{isAr ? "اسم العميل" : "Buyer Name"}</label>
                                      <input
                                        type="text"
                                        value={orderEditForm.customerName}
                                        onChange={(e) => setOrderEditForm({ ...orderEditForm, customerName: e.target.value })}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-bold text-zinc-400 mb-1">{isAr ? "رقم الهاتف" : "Telephone Number"}</label>
                                      <input
                                        type="text"
                                        value={orderEditForm.customerPhone}
                                        onChange={(e) => setOrderEditForm({ ...orderEditForm, customerPhone: e.target.value })}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-bold text-zinc-400 mb-1">{isAr ? "العنوان بالتفصيل" : "Delivery Address"}</label>
                                      <textarea
                                        rows={2}
                                        value={orderEditForm.customerAddress}
                                        onChange={(e) => setOrderEditForm({ ...orderEditForm, customerAddress: e.target.value })}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-bold text-zinc-400 mb-1">{isAr ? "سعر الفاتورة الإجمالي (ج.م)" : "Invoice Grand Value (EGP)"}</label>
                                      <input
                                        type="number"
                                        value={orderEditForm.totalPrice}
                                        onChange={(e) => setOrderEditForm({ ...orderEditForm, totalPrice: parseFloat(e.target.value) || 0 })}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingOrder(false)}
                                      className="flex-1 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl"
                                    >
                                      {isAr ? "إلغاء المعاينة" : "Cancel"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const updatedOrder = {
                                          ...selectedOrder,
                                          customerName: orderEditForm.customerName,
                                          customerPhone: orderEditForm.customerPhone,
                                          customerAddress: orderEditForm.customerAddress,
                                          totalPrice: orderEditForm.totalPrice
                                        };
                                        await updateOrder(updatedOrder);
                                        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
                                        setSelectedOrder(updatedOrder);
                                        setIsEditingOrder(false);
                                      }}
                                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
                                    >
                                      {isAr ? "حفظ التعديلات 💾" : "Save Changes 💾"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Buyer details header */}
                                  <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                      <h4 className="font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-emerald-600" />
                                        <span>{selectedOrder.customerName}</span>
                                      </h4>
                                      <p className="text-xs text-zinc-400 font-medium">#{selectedOrder.id}</p>
                                    </div>

                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => toggleOrderStatus(selectedOrder)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                                          selectedOrder.status === "completed"
                                            ? "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        }`}
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>
                                          {selectedOrder.status === "completed" ? t.orders.setPending : t.orders.setCompleted}
                                        </span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Delivery and Contacts list */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div className="space-y-2 text-zinc-600 dark:text-zinc-400">
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-zinc-400" />
                                        <span>{selectedOrder.customerPhone}</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">{selectedOrder.customerAddress}</span>
                                      </div>
                                    </div>

                                    {/* Custom google GPS maps link anchor */}
                                    <div className="flex items-center justify-end">
                                      {selectedOrder.customerCoords ? (
                                        <a
                                          href={`https://www.google.com/maps?q=${selectedOrder.customerCoords.lat},${selectedOrder.customerCoords.lng}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800 rounded-xl"
                                        >
                                          <MapPin className="w-4 h-4 text-red-500 fill-red-500" />
                                          <span>{t.orders.viewMap}</span>
                                        </a>
                                      ) : (
                                        <span className="text-zinc-400 italic text-xs">{t.orders.noMap}</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Items ordered invoice log */}
                                  <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl">
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-150 dark:border-zinc-800 pb-1">
                                      {t.orders.itemsOrdered}
                                    </div>
                                    <div className="space-y-2 divide-y divide-zinc-100 dark:divide-zinc-900">
                                      {selectedOrder.items.map((it: any, idx) => {
                                        const name = isAr 
                                          ? (it.productNameAr || (it.product && it.product.nameAr) || "") 
                                          : (it.productNameEn || (it.product && it.product.nameEn) || "");
                                        const price = it.price != null ? it.price : (it.product && it.product.price) || 0;
                                        return (
                                          <div key={idx} className="flex items-center justify-between text-xs pt-2 first:pt-0">
                                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                              {name} <span className="text-zinc-400">(x{it.quantity})</span>
                                            </span>
                                            <span className="font-mono text-zinc-500">{price * it.quantity} {isAr ? "ج.م" : "EGP"}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 mt-3 pt-3 flex justify-between text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                      <span>{isAr ? "إجمالي المبلغ المطلوب" : "Receipt Grand Total"}</span>
                                      <span>{selectedOrder.totalPrice} {isAr ? "ج.م" : "EGP"}</span>
                                    </div>
                                  </div>

                                  {/* Invoice generation buttons */}
                                  <div className="pt-2 flex flex-wrap gap-2.5">
                                    <button
                                      type="button"
                                      onClick={() => printInvoice(selectedOrder)}
                                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                                    >
                                      <Printer className="w-4 h-4" />
                                      <span>{t.orders.print}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => sendWhatsAppInvoice(selectedOrder)}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-md"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      <span>{t.orders.sendWhatsapp}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOrderEditForm({
                                          customerName: selectedOrder.customerName || "",
                                          customerPhone: selectedOrder.customerPhone || "",
                                          customerAddress: selectedOrder.customerAddress || "",
                                          totalPrice: selectedOrder.totalPrice || 0
                                        });
                                        setIsEditingOrder(true);
                                      }}
                                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-205 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition border border-zinc-250 dark:border-zinc-700"
                                    >
                                      <Edit3 className="w-4 h-4 text-emerald-550" />
                                      <span>{isAr ? "تعديل الفاتورة" : "Edit Details"}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (window.confirm(isAr ? "هل أنت متأكد من حذف وإلغاء هذه الفاتورة نهائياً؟ لا يمكن استعادتها." : "Are you sure you want to permanently delete this order?")) {
                                          await deleteOrder(selectedOrder.id);
                                          setSelectedOrder(null);
                                          loadData();
                                        }
                                      }}
                                      className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition border border-red-200 dark:border-red-900/50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>{isAr ? "مسح وإلغاء" : "Delete Order"}</span>
                                    </button>
                                  </div>
                                </>
                              )}

                            </div>
                          ) : (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 rounded-2xl p-12 text-center text-sm border-dashed">
                              {isAr ? "الرجاء اختيار أحد الحجوزات والطلبات لتصنيع الفاتورة وإدارتها" : "Select an invoice card from the left grid panel to construct receipt notes."}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: STORE CONFIG */}
                {activeTab === "settings" && (
                  <form onSubmit={handleSaveGlobalSettings} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-w-2xl p-5 md:p-6 rounded-2xl space-y-4 text-left">
                    <h3 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-100 mb-2 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-emerald-600" />
                      <span>{isAr ? "تخصيص هوية المتجر الرياضي" : "Store Visual Branding setup"}</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5">{t.settings.titleAr}</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.storeNameAr}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeNameAr: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5">{t.settings.titleEn}</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.storeNameEn}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeNameEn: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5">{t.settings.logoUrl}</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.storeLogo}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeLogo: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5">{t.settings.whatsPhone}</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.adminWhatsapp}
                        onChange={(e) => setSettingsForm({ ...settingsForm, adminWhatsapp: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-zinc-400 block mt-1">{t.settings.whatsPhoneHelper}</span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition shadow hover:shadow-lg"
                      >
                        {isAr ? "تحديث إعدادات الهوية الرياضية" : "Update Arena Config"}
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 4: COMPREHENSIVE REVIEWS/RATINGS MANAGER */}
                {activeTab === "reviews" && (
                  <div className="space-y-6 text-start">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">
                          {isAr ? "آراء العملاء والتقييمات المسجلة ⭐" : "Customer Feedbacks Log ⭐"}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium mt-0.5">
                          {isAr ? "استعرض وعدّل أو امسح آراء وتقييمات عملائك للمحافظة على المصداقية والشفافية." : "Review, update or delete client evaluations."}
                        </p>
                      </div>
                    </div>

                    {isEditingReview && selectedReviewIdx !== null ? (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const updated = ratings.map((r, i) => i === selectedReviewIdx ? { ...r, name: reviewEditForm.name, score: reviewEditForm.score, comment: reviewEditForm.comment } : r);
                          onRatingsUpdate(updated);
                          setIsEditingReview(false);
                          setSelectedReviewIdx(null);
                        }}
                        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl space-y-4"
                      >
                        <h4 className="font-extrabold text-sm text-emerald-600 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-900 pb-2">
                          <span>{isAr ? "تعديل تفاصيل تقييم العميل ✍️" : "Update Feedback Entry ✍️"}</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{isAr ? "اسم العميل" : "Client Name"}</label>
                            <input 
                              type="text"
                              required
                              value={reviewEditForm.name}
                              onChange={(e) => setReviewEditForm({ ...reviewEditForm, name: e.target.value })}
                              className="w-full text-xs px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{isAr ? "التقييم بالنجوم" : "Stars Rating Score"}</label>
                            <div className="flex gap-1 pt-1.5">
                              {[1, 2, 3, 4, 5].map((sc) => (
                                <button
                                  key={sc}
                                  type="button"
                                  onClick={() => setReviewEditForm({ ...reviewEditForm, score: sc })}
                                  className="cursor-pointer"
                                >
                                  <Star className={`w-5 h-5 ${sc <= reviewEditForm.score ? "fill-yellow-400 text-yellow-400" : "text-zinc-300 dark:text-zinc-750"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-400 mb-1">{isAr ? "التعليق المكتوب" : "Written Comment"}</label>
                          <textarea 
                            required
                            rows={3}
                            value={reviewEditForm.comment}
                            onChange={(e) => setReviewEditForm({ ...reviewEditForm, comment: e.target.value })}
                            className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="flex gap-2.5 pt-2 justify-end">
                          <button
                            type="button"
                            onClick={() => { setIsEditingReview(false); setSelectedReviewIdx(null); }}
                            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl"
                          >
                            {isAr ? "إلغاء وعودة" : "Cancel"}
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
                          >
                            {isAr ? "حفظ مراجعة العميل 💾" : "Save Changes 💾"}
                          </button>
                        </div>
                      </form>
                    ) : null}

                    {ratings.length === 0 ? (
                      <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center gap-3">
                        <span className="text-4xl">⭐</span>
                        <p className="text-xs font-extrabold">{isAr ? "لا يوجد تقييمات أو آراء مسجلة في المتجر حتى الآن." : "No client feedback messages logged yet."}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ratings.map((r, idx) => (
                          <div 
                            key={idx}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition duration-300 hover:border-emerald-550"
                          >
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{r.name || (isAr ? "زائر مجهول" : "Anonymous Guest")}</span>
                                <span className="text-[10px] text-zinc-400">{r.date ? r.date.split("T")[0] : ""}</span>
                              </div>

                              <div className="flex gap-0.5 mb-2">
                                {Array.from({ length: 5 }).map((_, stIdx) => (
                                  <Star 
                                    key={stIdx} 
                                    className={`w-3.5 h-3.5 ${stIdx < r.score ? "fill-yellow-400 text-yellow-400" : "text-zinc-200 dark:text-zinc-800"}`} 
                                  />
                                ))}
                              </div>

                              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-semibold italic bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800">
                                "{r.comment}"
                              </p>
                            </div>

                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-end gap-1.5 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReviewIdx(idx);
                                  setReviewEditForm({
                                    name: r.name || "",
                                    score: r.score || 5,
                                    comment: r.comment || ""
                                  });
                                  setIsEditingReview(true);
                                }}
                                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg flex items-center gap-1 cursor-pointer transition border border-zinc-200 dark:border-zinc-750"
                              >
                                <Edit3 className="w-3 h-3 text-emerald-555" />
                                <span>{isAr ? "تعديل" : "Edit"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(isAr ? "هل أنت متأكد من حذف هذا التقييم نهائياً؟" : "Are you sure you want to delete this rating?")) {
                                    const updated = ratings.filter((_, i) => i !== idx);
                                    onRatingsUpdate(updated);
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-955/40 text-red-650 dark:text-red-400 rounded-lg flex items-center gap-1 cursor-pointer transition border border-red-100 dark:border-red-900/50"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{isAr ? "حذف" : "Delete"}</span>
                              </button>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Panel Status Line */}
              <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
                <span>Sports Arena Operator v1.9</span>
                <span>System status: Secure Node Connected</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
